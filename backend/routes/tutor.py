"""
Tutor Routes — AI chat, voice tutoring, and visual understanding.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form
from fastapi.responses import Response
from pydantic import BaseModel

from backend.config import get_settings
from backend.middleware.auth import get_current_user
from backend.services.gemini_service import GeminiService
from backend.services.gemini_tts_service import GeminiTTSService
from backend.services.gemini_vision_service import GeminiVisionService
from backend.services.gemini_image_service import GeminiImageService
from backend.services.groq_service import GroqService
from backend.services.supabase_service import SupabaseService

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None
    subject: str = ""
    topic: str = ""


class VisualRequest(BaseModel):
    prompt: str | None = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _get_services():
    settings = get_settings()
    return (
        GeminiService(settings),
        GeminiTTSService(settings),
        GeminiVisionService(settings),
        GeminiImageService(settings),
        GroqService(settings),
        SupabaseService(settings),
    )


from backend.services.knowledge_base_service import knowledge_base

# ---------------------------------------------------------------------------
# Text Chat (Grounded Retrieval with Citations)
# ---------------------------------------------------------------------------
@router.post("/chat")
async def chat(body: ChatRequest, user: dict = Depends(get_current_user)):
    """Send a message to the AI tutor with knowledge-base grounding and citations."""
    gemini, _, _, _, _, supa = _get_services()

    # 1. Retrieve grounded textbook excerpts from open knowledge base
    matched_chunks = knowledge_base.retrieve(body.message, top_k=2)

    # 2. Create or fetch session
    session_id = body.session_id
    if not session_id:
        session_result = supa.insert("chat_sessions", {
            "user_id": user["id"],
            "title": body.message[:50] + "..." if len(body.message) > 50 else body.message,
            "subject": body.subject or (matched_chunks[0]["subject"] if matched_chunks else "General"),
        })
        session_id = session_result.data[0]["id"]

    # 3. Get history for context (last 20 messages)
    history_result = supa.select("chat_messages", "*", {"session_id": session_id})
    history = sorted(history_result.data, key=lambda m: m.get("created_at", ""))[-20:]

    # 4. Build grounded prompt
    if matched_chunks:
        context_text = "\n\n---\n\n".join([
            f"SOURCE: {c['source']}\nTOPIC: {c['topic']}\nEXCERPT: {c['excerpt']}"
            for c in matched_chunks
        ])
        system_prompt = f"""You are StudyPal, an expert AI tutor for students.
You MUST answer the student's question grounded in the provided curriculum textbook excerpts below.

CRITICAL INSTRUCTIONS:
- Base your explanations on the facts, definitions, formulas, and terminology in the provided text.
- If the excerpt contains the direct answer, explain it clearly with step-by-step reasoning.
- Always include an encouraging tone, bold key concepts, and keep your explanations clear and memorable.

CURRICULUM TEXTBOOK CONTEXT:
{context_text}
"""
    else:
        system_prompt = GeminiService._default_tutor_prompt() + """
NOTE: No direct matching excerpt was indexed in the NCERT/OpenStax open curriculum for this exact question. 
Explicitly mention in the first sentence: "Note: Answering based on general academic principles as this specific topic is outside the core indexed textbook chapters."
"""

    if body.subject:
        system_prompt += f"\n\nCurrent subject: {body.subject}"
    if body.topic:
        system_prompt += f"\nCurrent topic: {body.topic}"

    # 5. Save user message
    supa.insert("chat_messages", {
        "session_id": session_id,
        "user_id": user["id"],
        "role": "user",
        "content": body.message,
    })

    # 6. Get AI response
    response_text = await gemini.chat(
        message=body.message,
        history=[{"role": m["role"], "content": m["content"]} for m in history],
        system_prompt=system_prompt,
    )

    # 7. Format citation metadata
    sources = [
        {
            "source": c["source"],
            "subject": c["subject"],
            "topic": c["topic"],
            "concept_tag": c["concept_tag"],
            "excerpt": c["excerpt"],
            "similarity_score": c["similarity_score"],
        }
        for c in matched_chunks
    ]

    # Save assistant message with metadata
    supa.insert("chat_messages", {
        "session_id": session_id,
        "user_id": user["id"],
        "role": "assistant",
        "content": response_text,
        "metadata": {"sources": sources},
    })

    return {
        "session_id": session_id,
        "response": response_text,
        "sources": sources,
    }


@router.get("/history/{session_id}")
async def get_chat_history(
    session_id: str,
    user: dict = Depends(get_current_user),
):
    """Get chat history for a session."""
    _, _, _, _, _, supa = _get_services()
    result = supa.select("chat_messages", "*", {"session_id": session_id})
    messages = sorted(result.data, key=lambda m: m.get("created_at", ""))
    return {"messages": messages}


@router.get("/sessions")
async def list_sessions(user: dict = Depends(get_current_user)):
    """List all chat sessions for the current user."""
    _, _, _, _, _, supa = _get_services()
    try:
        result = supa.select("chat_sessions", "*", {"user_id": user["id"]})
        sessions = sorted(result.data or [], key=lambda s: (s.get("created_at") or ""), reverse=True)
        return {"sessions": sessions}
    except Exception:
        return {"sessions": []}


@router.delete("/session/{session_id}")
async def delete_session(session_id: str, user: dict = Depends(get_current_user)):
    """Delete a chat session and its messages."""
    _, _, _, _, _, supa = _get_services()
    try:
        supa.delete("chat_messages", {"session_id": session_id})
        supa.delete("chat_sessions", {"id": session_id, "user_id": user["id"]})
        return {"message": "Session deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Voice Tutor
# ---------------------------------------------------------------------------
@router.post("/voice")
async def voice_tutor(
    audio: UploadFile = File(...),
    session_id: str = Form(default=""),
    subject: str = Form(default=""),
    user: dict = Depends(get_current_user),
):
    """
    Voice → Whisper (Groq) → Gemini → TTS → Audio response.
    Full voice tutoring pipeline.
    """
    gemini, tts, _, _, groq, supa = _get_services()

    # 1. Read audio file
    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="No audio data received")

    # 2. Transcribe with Whisper via Groq
    transcript = await groq.transcribe(audio_bytes, filename=audio.filename or "recording.webm")
    
    # Handle empty / inaudible speech gracefully
    if not transcript or not transcript.strip() or transcript.strip() in [".", "...", "[BLANK_AUDIO]"]:
        transcript = "[Inaudible / Quiet Audio]"
        response_text = "I couldn't hear you clearly. Please hold the microphone button and try speaking again!"
    else:
        # 3. Get AI response from Gemini
        system_prompt = GeminiService._default_tutor_prompt()
        if subject:
            system_prompt += f"\n\nSubject: {subject}"
            
        response_text = await gemini.chat(
            message=transcript,
            system_prompt=system_prompt,
        )

    # 4. Generate TTS audio
    audio_response = await tts.synthesize(response_text)

    # 5. Create or save to chat session safely
    try:
        if session_id:
            # Verify if session exists
            existing = supa.select("chat_sessions", "*", {"id": session_id})
            if not existing or not existing.data:
                session_id = ""

        if not session_id and user and user.get("id"):
            session_result = supa.insert("chat_sessions", {
                "user_id": user["id"],
                "title": f"🎤 Voice: {transcript[:30]}",
                "subject": subject or "General",
            })
            if session_result and session_result.data:
                session_id = session_result.data[0]["id"]

        if session_id and user and user.get("id"):
            supa.insert("chat_messages", {
                "session_id": session_id,
                "user_id": user["id"],
                "role": "user",
                "content": transcript,
                "metadata": {"source": "voice"},
            })
            supa.insert("chat_messages", {
                "session_id": session_id,
                "user_id": user["id"],
                "role": "assistant",
                "content": response_text,
                "metadata": {"source": "voice"},
            })
    except Exception as db_err:
        print(f"[WARN] Failed to record voice message in database: {db_err}")

    result = {
        "session_id": session_id,
        "transcript": transcript,
        "response": response_text,
        "has_audio": audio_response is not None,
    }

    if audio_response:
        # Return audio as binary response
        headers = {
            "X-Transcript": transcript[:200].replace("\n", " "),
            "X-Response-Text": response_text[:200].replace("\n", " "),
        }
        if session_id:
            headers["X-Session-Id"] = str(session_id)
            
        return Response(
            content=audio_response,
            media_type="audio/wav",
            headers=headers,
        )

    # Fallback: return text only if TTS fails
    return result


# ---------------------------------------------------------------------------
# Visual Understanding (Snap & Learn)
# ---------------------------------------------------------------------------
@router.post("/visual")
async def visual_understanding(
    image: UploadFile = File(...),
    prompt: str = Form(default=""),
    user: dict = Depends(get_current_user),
):
    """Upload an image for AI visual analysis and explanation."""
    _, _, vision, _, _, _ = _get_services()

    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="No image data received")

    # Determine MIME type
    content_type = image.content_type or "image/jpeg"

    explanation = await vision.analyze_image(
        image_bytes=image_bytes,
        mime_type=content_type,
        prompt=prompt or None,
    )

    return {"explanation": explanation}


# ---------------------------------------------------------------------------
# Educational Visual Generation
# ---------------------------------------------------------------------------
@router.post("/generate-visual")
async def generate_visual(
    description: str = Form(...),
    context: str = Form(default=""),
    user: dict = Depends(get_current_user),
):
    """Generate an educational visual/diagram using Gemini Image Generation."""
    _, _, _, image_svc, _, _ = _get_services()

    image_bytes = await image_svc.generate_visual(description, context)

    if image_bytes:
        return Response(content=image_bytes, media_type="image/png")

    raise HTTPException(status_code=500, detail="Failed to generate visual")
