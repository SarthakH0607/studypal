"""
Gemini Image Generation Service — Educational visual generation.
Creates diagrams, illustrations, and educational visuals using Gemini.
"""

from google import genai
from google.genai import types
from backend.config import Settings


class GeminiImageService:
    """Generate educational visuals using Gemini's native image generation."""

    def __init__(self, settings: Settings):
        self._client = genai.Client(api_key=settings.gemini_api_key)
        self._model = settings.gemini_image_model

    async def generate_visual(
        self, description: str, context: str = ""
    ) -> bytes | None:
        """
        Generate an educational visual/diagram.

        Args:
            description: What the visual should depict.
            context: Additional educational context.

        Returns:
            PNG image bytes, or None if generation fails.
        """
        try:
            prompt = f"""Create a clear, educational illustration or diagram for:

{description}

{"Context: " + context if context else ""}

Style: Clean, labeled, educational diagram suitable for a student.
Use clear labels, arrows, and annotations where helpful.
Make it visually appealing with a clean color scheme."""

            config = types.GenerateContentConfig(
                response_modalities=["IMAGE"],
            )

            response = self._client.models.generate_content(
                model=self._model,
                contents=prompt,
                config=config,
            )

            # Extract image bytes from response
            if (
                response.candidates
                and response.candidates[0].content
                and response.candidates[0].content.parts
            ):
                for part in response.candidates[0].content.parts:
                    if hasattr(part, "inline_data") and part.inline_data:
                        return part.inline_data.data

            return None
        except Exception as e:
            print(f"Image generation failed: {e}")
            return None
