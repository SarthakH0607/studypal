"""
Learning Path Routes — Generate, view, and track learning paths.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from backend.config import get_settings
from backend.middleware.auth import get_current_user
from backend.services.gemini_service import GeminiService
from backend.services.supabase_service import SupabaseService

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class CreatePathRequest(BaseModel):
    subject: str
    grade_level: str


class UpdateProgressRequest(BaseModel):
    topic_id: str
    mastery_level: str  # not_started | in_progress | practiced | mastered


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _get_services():
    settings = get_settings()
    return GeminiService(settings), SupabaseService(settings)


AVAILABLE_SUBJECTS = [
    {"id": "mathematics", "name": "Mathematics", "icon": "📐"},
    {"id": "physics", "name": "Physics", "icon": "⚡"},
    {"id": "chemistry", "name": "Chemistry", "icon": "🧪"},
    {"id": "biology", "name": "Biology", "icon": "🧬"},
    {"id": "english", "name": "English", "icon": "📖"},
    {"id": "history", "name": "History", "icon": "🏛️"},
    {"id": "computer_science", "name": "Computer Science", "icon": "💻"},
    {"id": "geography", "name": "Geography", "icon": "🌍"},
]


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@router.get("/subjects")
async def list_subjects():
    """List available subjects."""
    return {"subjects": AVAILABLE_SUBJECTS}


@router.post("/path")
async def create_learning_path(
    body: CreatePathRequest,
    user: dict = Depends(get_current_user),
):
    """Generate a new learning path for a subject + grade level."""
    gemini, supa = _get_services()

    # Generate path with Gemini
    path_data = await gemini.generate_learning_path(body.subject, body.grade_level)

    # Save learning path
    path_result = supa.insert("learning_paths", {
        "user_id": user["id"],
        "subject": body.subject,
        "grade_level": body.grade_level,
        "title": path_data.get("title", f"{body.subject} Path"),
        "description": path_data.get("description", ""),
        "total_topics": len(path_data.get("topics", [])),
    })
    path_id = path_result.data[0]["id"]

    # Save topics
    topics = path_data.get("topics", [])
    for i, topic in enumerate(topics):
        supa.insert("learning_topics", {
            "path_id": path_id,
            "user_id": user["id"],
            "title": topic.get("title", f"Topic {i + 1}"),
            "description": topic.get("description", ""),
            "order_index": topic.get("order_index", i),
            "mastery_level": "not_started",
        })

    return {"path_id": path_id, "path": path_data}


@router.get("/paths")
async def list_user_paths(user: dict = Depends(get_current_user)):
    """List all learning paths for the current user."""
    _, supa = _get_services()
    result = supa.select("learning_paths", "*", {"user_id": user["id"]})
    return {"paths": result.data}


@router.get("/path/{path_id}")
async def get_learning_path(
    path_id: str,
    user: dict = Depends(get_current_user),
):
    """Get a specific learning path with its topics."""
    _, supa = _get_services()
    path_result = supa.select("learning_paths", "*", {"id": path_id, "user_id": user["id"]})
    if not path_result.data:
        raise HTTPException(status_code=404, detail="Learning path not found")

    topics_result = supa.select("learning_topics", "*", {"path_id": path_id})
    topics = sorted(topics_result.data, key=lambda t: t.get("order_index", 0))

    return {"path": path_result.data[0], "topics": topics}


@router.put("/path/{path_id}/progress")
async def update_topic_progress(
    path_id: str,
    body: UpdateProgressRequest,
    user: dict = Depends(get_current_user),
):
    """Update mastery level for a topic."""
    _, supa = _get_services()
    supa.update(
        "learning_topics",
        {"mastery_level": body.mastery_level},
        {"id": body.topic_id, "user_id": user["id"]},
    )

    # Update completed count on path
    topics = supa.select("learning_topics", "*", {"path_id": path_id})
    completed = sum(
        1 for t in topics.data if t.get("mastery_level") == "mastered"
    )
    supa.update("learning_paths", {"completed_topics": completed}, {"id": path_id})

    return {"message": "Progress updated", "completed_topics": completed}
