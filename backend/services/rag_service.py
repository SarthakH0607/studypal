"""
RAG Service — Full Retrieval-Augmented Generation pipeline.
Document ingestion → chunking → embedding → vector storage → retrieval → Gemini grounded answer.
"""

import re
from PyPDF2 import PdfReader
from io import BytesIO

from backend.config import Settings
from backend.services.bge_m3_service import Bge_M3_Service
from backend.services.gemini_service import GeminiService
from backend.services.supabase_service import SupabaseService


class RAGService:
    """Orchestrates the entire RAG pipeline: ingest, embed, retrieve, answer."""

    def __init__(
        self,
        settings: Settings,
        bge_m3: Bge_M3_Service,
        gemini: GeminiService,
        supabase: SupabaseService,
    ):
        self._settings = settings
        self._bge_m3 = bge_m3
        self._gemini = gemini
        self._supabase = supabase
        self._chunk_size = settings.chunk_size
        self._chunk_overlap = settings.chunk_overlap

    # ------------------------------------------------------------------
    # Document Ingestion
    # ------------------------------------------------------------------
    async def ingest_document(
        self,
        file_bytes: bytes,
        filename: str,
        user_id: str,
        file_type: str = "pdf",
    ) -> dict:
        """
        Ingest a document: extract text → chunk → embed → store in Supabase.

        Returns:
            dict with document_id, total_chunks, and status.
        """
        try:
            # 1. Extract text
            if file_type == "pdf":
                text = self._extract_pdf(file_bytes)
            else:
                text = file_bytes.decode("utf-8", errors="ignore")

            if not text.strip():
                return {"error": "Could not extract text from document"}

            # 2. Create document record
            doc_result = self._supabase.insert("documents", {
                "user_id": user_id,
                "filename": filename,
                "file_type": file_type,
                "file_size": len(file_bytes),
                "status": "processing",
            })
            document_id = doc_result.data[0]["id"]

            # 3. Chunk text
            chunks = self._chunk_text(text)

            # 4. Generate embeddings for all chunks
            embeddings = self._bge_m3.encode(chunks)

            # 5. Store chunks with embeddings in Supabase
            chunk_records = []
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                chunk_records.append({
                    "document_id": document_id,
                    "user_id": user_id,
                    "content": chunk,
                    "chunk_index": i,
                    "embedding": embedding,
                    "metadata": {"filename": filename, "chunk_index": i},
                })

            # Insert in batches of 50
            for batch_start in range(0, len(chunk_records), 50):
                batch = chunk_records[batch_start : batch_start + 50]
                self._supabase.insert("document_chunks", batch)

            # 6. Update document status
            self._supabase.update(
                "documents",
                {"status": "ready", "total_chunks": len(chunks)},
                {"id": document_id},
            )

            return {
                "document_id": document_id,
                "total_chunks": len(chunks),
                "status": "ready",
            }
        except Exception as e:
            return {"error": str(e)}

    # ------------------------------------------------------------------
    # Query (Retrieval + Generation)
    # ------------------------------------------------------------------
    async def query(self, question: str, user_id: str) -> dict:
        """
        Answer a question using RAG: embed query → retrieve → generate.

        Returns:
            dict with answer text and source chunks.
        """
        try:
            # 1. Embed the query
            query_embedding = self._bge_m3.encode_query(question)

            if not query_embedding:
                return {"answer": "Failed to process your question.", "sources": []}

            # 2. Vector search in Supabase
            results = self._supabase.match_document_chunks(
                query_embedding=query_embedding,
                user_id=user_id,
                match_count=self._settings.similarity_top_k,
            )

            chunks_data = results.data if results.data else []

            if not chunks_data:
                return {
                    "answer": "I couldn't find relevant information in your documents. Try uploading more materials or rephrasing your question.",
                    "sources": [],
                }

            # 3. Extract chunk texts for context
            context_chunks = [chunk["content"] for chunk in chunks_data]
            sources = [
                {
                    "content": chunk["content"][:200] + "...",
                    "similarity": round(chunk["similarity"], 3),
                    "chunk_index": chunk["chunk_index"],
                    "document_id": chunk["document_id"],
                }
                for chunk in chunks_data
            ]

            # 4. Generate grounded answer with Gemini
            answer = await self._gemini.generate_rag_answer(question, context_chunks)

            return {"answer": answer, "sources": sources}
        except Exception as e:
            return {"answer": f"Error: {str(e)}", "sources": []}

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _extract_pdf(file_bytes: bytes) -> str:
        """Extract text from a PDF file."""
        reader = PdfReader(BytesIO(file_bytes))
        text_parts = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
        return "\n\n".join(text_parts)

    def _chunk_text(self, text: str) -> list[str]:
        """
        Split text into overlapping chunks of ~chunk_size words.
        Uses word-level splitting with overlap for context continuity.
        """
        # Clean up whitespace
        text = re.sub(r"\s+", " ", text).strip()
        words = text.split()

        if len(words) <= self._chunk_size:
            return [text]

        chunks = []
        start = 0
        while start < len(words):
            end = start + self._chunk_size
            chunk = " ".join(words[start:end])
            chunks.append(chunk)
            start = end - self._chunk_overlap

        return chunks
