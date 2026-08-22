"""
Dashboard Routes — Progress overview, stats, and AI recommendations.
"""

from fastapi import APIRouter, Depends
from backend.config import get_settings
from backend.middleware.auth import get_current_user
from backend.services.gemini_service import GeminiService
from backend.services.supabase_service import SupabaseService

router = APIRouter()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _get_services():
    settings = get_settings()
    return GeminiService(settings), SupabaseService(settings)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@router.get("/overview")
async def dashboard_overview(user: dict = Depends(get_current_user)):
    """Get aggregated progress stats for the dashboard."""
    _, supa = _get_services()
    user_id = user["id"]

    try:
        paths_res = supa.select("learning_paths", "*", {"user_id": user_id})
        paths_data = paths_res.data or []
    except Exception:
        paths_data = []

    total_paths = len(paths_data)
    total_topics = sum((p.get("total_topics") or 0) for p in paths_data)
    completed_topics = sum((p.get("completed_topics") or 0) for p in paths_data)

    try:
        exams_res = supa.select("exams", "*", {"user_id": user_id})
        exams_data = exams_res.data or []
    except Exception:
        exams_data = []

    completed_exams = [e for e in exams_data if e.get("status") == "completed"]
    total_exams = len(completed_exams)
    avg_score = 0
    if completed_exams:
        scores = []
        for e in completed_exams:
            max_s = e.get("max_score") or 0
            if max_s > 0:
                scores.append(((e.get("score") or 0) / max_s) * 100)
        avg_score = round(sum(scores) / len(scores), 1) if scores else 0

    try:
        docs_res = supa.select("documents", "*", {"user_id": user_id})
        total_documents = len(docs_res.data or [])
    except Exception:
        total_documents = 0

    try:
        sessions_res = supa.select("chat_sessions", "*", {"user_id": user_id})
        total_sessions = len(sessions_res.data or [])
    except Exception:
        total_sessions = 0

    return {
        "stats": {
            "total_paths": total_paths,
            "total_topics": total_topics,
            "completed_topics": completed_topics,
            "mastery_percentage": round(
                (completed_topics / total_topics * 100) if total_topics > 0 else 0, 1
            ),
            "total_exams": total_exams,
            "average_score": avg_score,
            "total_documents": total_documents,
            "total_sessions": total_sessions,
        },
        "recent_paths": sorted(
            paths_data, key=lambda p: (p.get("updated_at") or ""), reverse=True
        )[:5],
        "recent_exams": sorted(
            completed_exams, key=lambda e: (e.get("completed_at") or ""), reverse=True
        )[:5],
    }


@router.get("/progress/{subject}")
async def subject_progress(
    subject: str,
    user: dict = Depends(get_current_user),
):
    """Get detailed progress for a specific subject."""
    _, supa = _get_services()

    # Get paths for this subject
    paths = supa.select("learning_paths", "*", {"user_id": user["id"], "subject": subject})
    if not paths.data:
        return {"subject": subject, "paths": [], "topics": []}

    # Get all topics across paths
    all_topics = []
    for path in paths.data:
        topics = supa.select("learning_topics", "*", {"path_id": path["id"]})
        all_topics.extend(topics.data)

    # Get exams for this subject
    exams = supa.select("exams", "*", {"user_id": user["id"], "subject": subject})

    # Mastery breakdown
    mastery_counts = {"not_started": 0, "in_progress": 0, "practiced": 0, "mastered": 0}
    for t in all_topics:
        level = t.get("mastery_level", "not_started")
        mastery_counts[level] = mastery_counts.get(level, 0) + 1

    return {
        "subject": subject,
        "paths": paths.data,
        "topics": sorted(all_topics, key=lambda t: t.get("order_index", 0)),
        "mastery_breakdown": mastery_counts,
        "exams": sorted(exams.data, key=lambda e: e.get("created_at", ""), reverse=True),
    }


@router.get("/recommendations")
async def get_recommendations(user: dict = Depends(get_current_user)):
    """Get AI-powered learning recommendations based on progress."""
    gemini, supa = _get_services()

    # Gather progress data
    paths = supa.select("learning_paths", "*", {"user_id": user["id"]})
    exams = supa.select("exams", "*", {"user_id": user["id"]})

    completed_exams = [e for e in exams.data if e.get("status") == "completed"]

    progress_data = {
        "learning_paths": [
            {
                "subject": p.get("subject"),
                "title": p.get("title"),
                "completed": p.get("completed_topics", 0),
                "total": p.get("total_topics", 0),
            }
            for p in paths.data
        ],
        "recent_exams": [
            {
                "subject": e.get("subject"),
                "topic": e.get("topic_title"),
                "score": e.get("score", 0),
                "max_score": e.get("max_score", 0),
            }
            for e in completed_exams[-10:]
        ],
    }

    recommendations = await gemini.generate_recommendations(progress_data)
    return {"recommendations": recommendations}
