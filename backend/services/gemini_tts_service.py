"""
Gemini TTS Service — Text-to-Speech via Gemini native TTS.
Converts text responses to natural speech audio.
"""

import base64
import io
import wave
from google import genai
from google.genai import types
from backend.config import Settings


class GeminiTTSService:
    """Generate spoken audio from text using Gemini's native TTS capability."""

    PRIMARY_TTS_MODEL = "gemini-3.1-flash-tts-preview"
    FALLBACK_MODELS = [
        "gemini-2.5-flash-preview-tts",
        "gemini-2.5-pro-preview-tts",
    ]

    def __init__(self, settings: Settings):
        self._client = genai.Client(api_key=settings.gemini_api_key)
        self._model = getattr(settings, "gemini_tts_model", self.PRIMARY_TTS_MODEL)

    async def synthesize(self, text: str, voice: str = "Kore") -> bytes | None:
        """
        Convert text to speech using Gemini TTS.

        Args:
            text: The text to speak.
            voice: Prebuilt voice name (default: "Kore").

        Returns:
            WAV audio bytes, or None if TTS fails.
        """
        config = types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name=voice,
                    )
                )
            ),
        )

        models_to_try = [self._model] + [m for m in self.FALLBACK_MODELS if m != self._model]

        for model_name in models_to_try:
            try:
                response = self._client.models.generate_content(
                    model=model_name,
                    contents=f"Read the following text naturally and clearly:\n\n{text}",
                    config=config,
                )

                if (
                    response.candidates
                    and response.candidates[0].content
                    and response.candidates[0].content.parts
                ):
                    part = response.candidates[0].content.parts[0]
                    if hasattr(part, "inline_data") and part.inline_data:
                        audio_data = part.inline_data.data
                        if isinstance(audio_data, str):
                            pcm_data = base64.b64decode(audio_data)
                        else:
                            pcm_data = audio_data
                        return self._pcm_to_wav(pcm_data)
            except Exception as e:
                print(f"TTS attempt with {model_name} failed: {e}")

        return None

    @staticmethod
    def _pcm_to_wav(
        pcm_data: bytes,
        channels: int = 1,
        sample_rate: int = 24000,
        sample_width: int = 2,
    ) -> bytes:
        """Wrap raw PCM audio data in a WAV container."""
        buffer = io.BytesIO()
        with wave.open(buffer, "wb") as wf:
            wf.setnchannels(channels)
            wf.setsampwidth(sample_width)
            wf.setframerate(sample_rate)
            wf.writeframes(pcm_data)
        buffer.seek(0)
        return buffer.read()
