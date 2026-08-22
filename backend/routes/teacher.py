"""
Teacher Routes & Active Flagging Endpoints.
Provides class roster insights, student alert flags, and teacher authentication.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from backend.middleware.auth import get_current_user
from backend.services.flagging_service import flagging_service
from backend.services.mastery_map_service import mastery_map_service

router = APIRouter()


class TeacherLoginRequest(BaseModel):
    teacher_id: str
    class_id: str
    school_code: str = ""


@router.post("/login")
async def teacher_login(body: TeacherLoginRequest):
    """
    Teacher authentication endpoint (Stubbed for hackathon scaffolding).
    Accepts (teacher_id, class_id) and returns a teacher-scoped session.
    """
    if not body.teacher_id.strip() or not body.class_id.strip():
        raise HTTPException(status_code=400, detail="Teacher ID and Class ID are required")

    return {
        "teacher_id": body.teacher_id.strip(),
        "class_id": body.class_id.strip(),
        "access_token": f"teacher_token_{body.teacher_id.strip()}",
        "teacher": {
            "name": f"Instructor ({body.teacher_id.strip()})",
            "class_name": f"Class {body.class_id.strip()} — Grade 9 Science & Math",
            "role": "teacher",
        },
    }


@router.get("/roster")
async def get_class_roster():
    """
    Get the full class roster with student status and proactive flags sorted by urgency.
    """
    roster = flagging_service.get_teacher_roster()
    return {
        "class_name": "Grade 9 — STEM Cohort Alpha",
        "total_students": len(roster),
        "students": roster,
    }


@router.get("/flags")
async def get_student_flags(user: dict = Depends(get_current_user)):
    """
    Get active alerts and proactive flags for the current student.
    """
    flags = flagging_service.evaluate_student_flags(user["id"])
    return {"flags": flags}
