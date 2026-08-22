"""
Document Routes — Upload, process, and query documents via RAG.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from pydantic import BaseModel

from backend.config import get_settings
from backend.middleware.auth import get_current_user
from backend.services.gemini_service import GeminiService
from backend.services.supabase_service import SupabaseService
from backend.services.rag_service import RAGService

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class QueryRequest(BaseModel):
    question: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _get_rag(request: Request) -> RAGService:
    settings = get_settings()
    bge_m3 = request.app.state.bge_m3
    return RAGService(
        settings=settings,
        bge_m3=bge_m3,
        gemini=GeminiService(settings),
        supabase=SupabaseService(settings),
    )


def _get_supa() -> SupabaseService:
    return SupabaseService(get_settings())


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@router.post("/upload")
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    """Upload and process a document for RAG (PDF or text)."""
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Empty file")

    # Determine file type
    filename = file.filename or "document.pdf"
    file_type = "pdf" if filename.lower().endswith(".pdf") else "text"

    rag = _get_rag(request)
    result = await rag.ingest_document(
        file_bytes=file_bytes,
        filename=filename,
        user_id=user["id"],
        file_type=file_type,
    )

    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])

    return result


@router.post("/query")
async def query_documents(
    request: Request,
    body: QueryRequest,
    user: dict = Depends(get_current_user),
):
    """Ask a question against uploaded documents using RAG."""
    rag = _get_rag(request)
    result = await rag.query(body.question, user["id"])
    return result


@router.get("/list")
async def list_documents(user: dict = Depends(get_current_user)):
    """List all documents uploaded by the current user."""
    supa = _get_supa()
    result = supa.select("documents", "*", {"user_id": user["id"]})
    docs = sorted(result.data, key=lambda d: d.get("created_at", ""), reverse=True)
    return {"documents": docs}


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    user: dict = Depends(get_current_user),
):
    """Delete a document and all its chunks/embeddings."""
    supa = _get_supa()

    # Verify ownership
    doc = supa.select("documents", "*", {"id": document_id, "user_id": user["id"]})
    if not doc.data:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete chunks first (cascade should handle this, but be explicit)
    supa.delete("document_chunks", {"document_id": document_id})
    supa.delete("documents", {"id": document_id})

    return {"message": "Document deleted"}
