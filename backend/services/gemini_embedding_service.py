"""
Gemini Embedding Service — Vector embeddings for RAG pipeline.
Uses Google's text-embedding-004 model via API (no local model loading).
Drop-in replacement for Bge_M3_Service.
"""

from google import genai
from backend.config import Settings


class GeminiEmbeddingService:
    """
    Gemini-based embedding service.
    Generates 768-dimensional dense vectors for document chunks and queries.
    Uses the text-embedding-004 model via API — zero local RAM usage.
    """

    EMBEDDING_MODEL = "text-embedding-004"

    def __init__(self, settings: Settings):
        self._settings = settings
        self._client = genai.Client(api_key=settings.gemini_api_key)
        self._dimension = 768  # text-embedding-004 outputs 768-dim vectors

    @property
    def dimension(self) -> int:
        return self._dimension

    def encode(self, texts: list[str], batch_size: int = 100) -> list[list[float]]:
        """
        Encode a list of texts into dense embedding vectors.

        Args:
            texts: List of text strings to embed.
            batch_size: Batch size for API calls (max 100 per request).

        Returns:
            List of embedding vectors (each 768-dimensional).
        """
        if not texts:
            return []

        all_embeddings = []

        # Process in batches (Gemini API supports up to 100 texts per call)
        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            result = self._client.models.embed_content(
                model=self.EMBEDDING_MODEL,
                contents=batch,
            )
            for embedding in result.embeddings:
                all_embeddings.append(embedding.values)

        return all_embeddings

    def encode_query(self, query: str) -> list[float]:
        """Encode a single query string into an embedding vector."""
        results = self.encode([query])
        return results[0] if results else []
