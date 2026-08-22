"""
Exam Routes — Generate exams, submit answers, get scores & reports.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from backend.config import get_settings
from backend.middleware.auth import get_current_user
from backend.services.gemini_service import GeminiService
from backend.services.supabase_service import SupabaseService

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class GenerateExamRequest(BaseModel):
    subject: str = ""
    topic_title: str
    topic_id: str | None = None
    num_mcq: int = 5
    num_short: int = 2
    num_long: int = 1


class SubmitAnswer(BaseModel):
    question_id: str
    answer: str


class SubmitExamRequest(BaseModel):
    exam_id: str
    answers: list[SubmitAnswer]


from backend.services.mastery_map_service import mastery_map_service
from backend.services.knowledge_base_service import knowledge_base

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _get_services():
    settings = get_settings()
    return GeminiService(settings), SupabaseService(settings)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@router.get("/mastery-map")
async def get_mastery_map(
    subject: str = "",
    user: dict = Depends(get_current_user),
):
    """Get the running concept-level mastery map for the current student."""
    user_id = user["id"]
    mastery_data = mastery_map_service.get_student_mastery_map(user_id, subject=subject)
    return {"mastery_map": mastery_data}


@router.post("/adaptive")
async def generate_adaptive_practice(
    user: dict = Depends(get_current_user),
):
    """
    Generate an adaptive practice quiz targeted specifically at the student's
    lowest-mastery concept tags.
    """
    gemini, supa = _get_services()
    user_id = user["id"]

    # 1. Identify the student's 2 weakest concept tags
    weakest = mastery_map_service.get_weakest_concepts(user_id, limit=2)
    target_concepts = [w["concept_tag"] for w in weakest]
    target_subject = weakest[0]["subject"] if weakest else "Biology"
    target_title = weakest[0]["title"] if weakest else "Photosynthesis & Respiration"

    # 2. Retrieve grounded curriculum chunks for these weak concepts
    context_chunks = []
    for w in weakest:
        matched = knowledge_base.retrieve(f"{w['subject']} {w['title']}", top_k=1)
        if matched:
            context_chunks.append(f"CONCEPT: {w['concept_tag']}\nTEXTBOOK: {matched[0]['excerpt']}")

    grounded_context = "\n\n---\n\n".join(context_chunks)

    # 3. Generate adaptive scaffolded questions
    exam_data = await gemini.generate_exam(
        subject=target_subject,
        topic=f"Adaptive Gap-Targeting: {target_title}",
        num_mcq=4,
        num_short=1,
        num_long=0,
    )

    questions = exam_data.get("questions", [])
    if not questions:
        # Fallback question bank tagged with concept
        questions = [
            {
                "question_type": "mcq",
                "question_text": f"Which of the following is the key biological mechanism involved in {target_title}?",
                "options": ["A) Generation of ATP via proton gradient", "B) Direct absorption of nitrogen gas", "C) Passive lipid filtration", "D) Hydrolysis of inorganic salts"],
                "correct_answer": "A",
                "max_points": 1.0,
                "concept_tag": target_concepts[0] if target_concepts else "General",
            }
        ]

    # Tag questions with concept tags
    for i, q in enumerate(questions):
        tag = target_concepts[i % len(target_concepts)] if target_concepts else "General"
        q["concept_tag"] = tag

    # Create exam record
    max_score = sum(q.get("max_points", 1.0) for q in questions)
    exam_result = supa.insert("exams", {
        "user_id": user_id,
        "subject": target_subject,
        "topic_title": f"Adaptive: {target_title}",
        "total_questions": len(questions),
        "max_score": max_score,
        "status": "pending",
    })
    exam_id = exam_result.data[0]["id"]

    saved_questions = []
    for i, q in enumerate(questions):
        q_result = supa.insert("exam_questions", {
            "exam_id": exam_id,
            "question_type": q.get("question_type", "mcq"),
            "question_text": q.get("question_text", ""),
            "options": q.get("options"),
            "correct_answer": q.get("correct_answer", ""),
            "max_points": q.get("max_points", 1.0),
            "order_index": i,
        })
        saved_q = q_result.data[0]
        saved_q["options"] = q.get("options")
        saved_q["concept_tag"] = q.get("concept_tag")
        saved_questions.append(saved_q)

    return {
        "exam_id": exam_id,
        "topic_title": f"Adaptive: {target_title}",
        "targeted_concepts": target_concepts,
        "questions": saved_questions,
        "total_questions": len(saved_questions),
        "max_score": max_score,
    }


@router.post("/generate")
async def generate_custom_exam(
    body: GenerateExamRequest,
    user: dict = Depends(get_current_user),
):
    """Generate a custom topic exam. Subject is optional — just provide a topic."""
    gemini, supa = _get_services()

    topic = body.topic_title.strip()
    if not topic:
        raise HTTPException(status_code=400, detail="Topic title is required")

    subject = body.subject.strip() if body.subject else ""

    # Generate questions with Gemini
    exam_data = await gemini.generate_exam(
        subject=subject,
        topic=topic,
        num_mcq=body.num_mcq,
        num_short=body.num_short,
        num_long=body.num_long,
    )

    questions = exam_data.get("questions", [])
    if not questions:
        raise HTTPException(status_code=500, detail="Failed to generate exam questions. Try a different topic.")

    # Create exam record
    max_score = sum(q.get("max_points", 1.0) for q in questions)
    exam_result = supa.insert("exams", {
        "user_id": user["id"],
        "topic_id": body.topic_id,
        "subject": subject or topic,
        "topic_title": topic,
        "total_questions": len(questions),
        "max_score": max_score,
        "status": "pending",
    })
    exam_id = exam_result.data[0]["id"]

    # Save questions
    saved_questions = []
    for i, q in enumerate(questions):
        q_result = supa.insert("exam_questions", {
            "exam_id": exam_id,
            "question_type": q.get("question_type", "mcq"),
            "question_text": q.get("question_text", ""),
            "options": q.get("options"),
            "correct_answer": q.get("correct_answer", ""),
            "max_points": q.get("max_points", 1.0),
            "order_index": i,
        })
        saved_q = q_result.data[0]
        saved_q["options"] = q.get("options")
        saved_questions.append(saved_q)

    return {
        "exam_id": exam_id,
        "subject": subject or topic,
        "topic_title": topic,
        "questions": saved_questions,
        "total_questions": len(saved_questions),
        "max_score": max_score,
    }


@router.post("/submit")
async def submit_exam(
    body: SubmitExamRequest,
    user: dict = Depends(get_current_user),
):
    """Submit exam answers and get scores."""
    gemini, supa = _get_services()

    # Get exam and questions
    exam = supa.select("exams", "*", {"id": body.exam_id, "user_id": user["id"]})
    if not exam.data:
        raise HTTPException(status_code=404, detail="Exam not found")

    questions_result = supa.select("exam_questions", "*", {"exam_id": body.exam_id})
    questions_map = {q["id"]: q for q in questions_result.data}

    total_score = 0.0
    results = []

    for submission in body.answers:
        question = questions_map.get(submission.question_id)
        if not question:
            continue

        points = 0.0
        feedback = ""

        if question["question_type"] == "mcq":
            # Deterministic scoring for MCQs — no AI needed
            correct = question.get("correct_answer", "").strip().upper()
            student = submission.answer.strip().upper()
            if student and student[0] in "ABCD":
                student = student[0]
            if correct and correct[0] in "ABCD":
                correct = correct[0]

            is_correct = (student == correct)
            if is_correct:
                points = question.get("max_points", 1.0)
                feedback = "Correct! ✅"
            else:
                feedback = f"Incorrect. The correct answer is {question.get('correct_answer', 'N/A')}."
        else:
            # AI grading for short/long answers
            grade_result = await gemini.grade_answer(
                question=question["question_text"],
                student_answer=submission.answer,
                correct_answer=question.get("correct_answer", ""),
                max_points=question.get("max_points", 1.0),
            )
            points = grade_result.get("points_awarded", 0)
            feedback = grade_result.get("feedback", "")
            is_correct = points >= (question.get("max_points", 1.0) * 0.7)

        total_score += points

        # Update student's concept mastery map
        concept_tag = question.get("concept_tag") or f"{exam.data[0].get('subject', 'General')} > {exam.data[0].get('topic_title', 'Concept')}"
        mastery_map_service.record_attempt(
            user_id=user["id"],
            concept_tag=concept_tag,
            is_correct=is_correct,
            subject=exam.data[0].get("subject", "General"),
            title=exam.data[0].get("topic_title", "Concept"),
        )

        # Save submission
        supa.insert("exam_submissions", {
            "exam_id": body.exam_id,
            "question_id": submission.question_id,
            "user_id": user["id"],
            "answer": submission.answer,
            "points_awarded": points,
            "feedback": feedback,
        })

        results.append({
            "question_id": submission.question_id,
            "points_awarded": points,
            "max_points": question.get("max_points", 1.0),
            "feedback": feedback,
        })

    # Update exam with final score
    max_score = exam.data[0].get("max_score", 0)
    supa.update("exams", {
        "score": total_score,
        "status": "completed",
        "completed_at": "now()",
    }, {"id": body.exam_id})

    return {
        "exam_id": body.exam_id,
        "score": total_score,
        "max_score": max_score,
        "percentage": round((total_score / max_score * 100) if max_score > 0 else 0, 1),
        "results": results,
    }


@router.get("/history")
async def exam_history(user: dict = Depends(get_current_user)):
    """Get all completed exams for the current user."""
    _, supa = _get_services()
    result = supa.select("exams", "*", {"user_id": user["id"]})
    exams = sorted(result.data, key=lambda e: e.get("created_at", ""), reverse=True)
    return {"exams": exams}


@router.get("/{exam_id}/report")
async def exam_report(
    exam_id: str,
    user: dict = Depends(get_current_user),
):
    """Get detailed report for a completed exam."""
    gemini, supa = _get_services()

    # Get exam
    exam = supa.select("exams", "*", {"id": exam_id, "user_id": user["id"]})
    if not exam.data:
        raise HTTPException(status_code=404, detail="Exam not found")

    # Get submissions with feedback
    submissions = supa.select("exam_submissions", "*", {"exam_id": exam_id})

    # Generate AI report
    exam_data = exam.data[0]
    report = await gemini.generate_report(
        subject=exam_data.get("subject", ""),
        exam_results=[{
            "topic": exam_data.get("topic_title", ""),
            "score": exam_data.get("score", 0),
            "max_score": exam_data.get("max_score", 0),
            "submissions": submissions.data,
        }],
    )

    return {
        "exam": exam_data,
        "submissions": submissions.data,
        "report": report,
    }
