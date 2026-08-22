"""
Groq Service — Whisper Large V3 Turbo speech-to-text.
Also provides optional low-latency text inference via Groq.
"""

from groq import Groq
from backend.config import Settings


class GroqService:
    """Speech-to-text via Groq's hosted Whisper and optional fast text inference."""

    def __init__(self, settings: Settings):
        self._client = Groq(api_key=settings.groq_api_key)
        self._whisper_model = settings.whisper_model

    async def transcribe(
        self,
        audio_bytes: bytes,
        filename: str = "audio.wav",
        language: str | None = None,
    ) -> str:
        """
        Transcribe audio using Whisper Large V3 Turbo via Groq.

        Args:
            audio_bytes: Raw audio file bytes.
            filename: Original filename (for format detection).
            language: Optional ISO language code hint.

        Returns:
            Transcribed text string.
        """
        try:
            kwargs = {
                "file": (filename, audio_bytes),
                "model": self._whisper_model,
                "response_format": "json",
            }
            if language:
                kwargs["language"] = language

            transcription = self._client.audio.transcriptions.create(**kwargs)
            return transcription.text or ""
        except Exception as e:
            print(f"Transcription failed: {e}")
            return ""

    async def fast_inference(self, prompt: str, system: str = "") -> str:
        """
        Optional low-latency text generation via Groq.
        Use for simple, fast tasks where Gemini latency would be excessive.

        Falls back gracefully — returns empty string on failure.
        """
        try:
            messages = []
            if system:
                messages.append({"role": "system", "content": system})
            messages.append({"role": "user", "content": prompt})

            response = self._client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                temperature=0.5,
                max_tokens=512,
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            print(f"Groq inference failed: {e}")
            return ""
