"""
Gemini Vision Service — Multimodal image understanding.
Handles: screenshots, scanned notes, math equations, diagrams.
"""

import base64
from google import genai
from google.genai import types
from backend.config import Settings


class GeminiVisionService:
    """Analyze images (photos, screenshots, handwritten notes) using Gemini Multimodal."""

    def __init__(self, settings: Settings):
        self._client = genai.Client(api_key=settings.gemini_api_key)
        self._model = settings.gemini_model

    async def analyze_image(
        self,
        image_bytes: bytes,
        mime_type: str = "image/jpeg",
        prompt: str | None = None,
    ) -> str:
        """
        Analyze an image and return a structured explanation.

        Args:
            image_bytes: Raw image bytes.
            mime_type: MIME type of the image (jpeg, png, webp).
            prompt: Optional custom prompt. Defaults to educational analysis.

        Returns:
            Markdown-formatted explanation.
        """
        try:
            user_prompt = prompt or self._default_vision_prompt()

            contents = [
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                types.Part.from_text(text=user_prompt),
            ]

            config = types.GenerateContentConfig(
                temperature=0.4,
                max_output_tokens=3072,
            )

            response = self._client.models.generate_content(
                model=self._model,
                contents=contents,
                config=config,
            )
            return response.text or "I couldn't analyze this image. Please try a clearer photo."
        except Exception as e:
            return f"Image analysis failed: {str(e)}. Please try again with a different image."

    @staticmethod
    def _default_vision_prompt() -> str:
        return """Analyze this image as an educational AI tutor.

If it contains:
- **Math equations**: Solve step-by-step, showing all work
- **Science diagrams**: Explain each component and how they relate
- **Text/Notes**: Summarize and explain the key concepts
- **Graphs/Charts**: Interpret the data and explain trends
- **Homework problems**: Guide the student through the solution

Format your response with:
1. **What I see**: Brief description of the image content
2. **Explanation**: Detailed educational analysis
3. **Key Takeaways**: Bullet points of important concepts

Use markdown formatting for readability."""
