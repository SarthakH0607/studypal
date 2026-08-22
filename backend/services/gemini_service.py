"""
Gemini Service — Primary AI intelligence layer.
Handles: tutoring chat, learning path generation, exam generation,
         answer grading, and report generation.
"""

import json
from google import genai
from google.genai import types
from backend.config import Settings


class GeminiService:
    """Core Gemini text-generation service using google-genai SDK with automatic model fallbacks."""

    FALLBACK_MODELS = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"]

    def __init__(self, settings: Settings):
        self._client = genai.Client(api_key=settings.gemini_api_key)
        self._model = settings.gemini_model

    def _generate_with_fallback(self, contents, config: types.GenerateContentConfig):
        """Attempts generation with primary model; automatically falls back if 503 / 429 occurs."""
        models_to_try = [self._model] + [m for m in self.FALLBACK_MODELS if m != self._model]
        last_error = None

        for model_name in models_to_try:
            try:
                response = self._client.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=config,
                )
                return response
            except Exception as e:
                last_error = e
                err_str = str(e)
                print(f"[WARN] Gemini model {model_name} failed: {err_str[:120]}. Trying next fallback...")
                # Continue loop to try next model in fallback list

        raise last_error

    # ------------------------------------------------------------------
    # Tutor Chat
    # ------------------------------------------------------------------
    async def chat(
        self,
        message: str,
        history: list[dict] | None = None,
        system_prompt: str | None = None,
    ) -> str:
        """
        Send a message to Gemini with optional conversation history.
        Returns the assistant's text response with automatic model fallback.
        """
        try:
            contents = []

            # Build conversation history
            if history:
                for msg in history:
                    role = "user" if msg["role"] == "user" else "model"
                    contents.append(
                        types.Content(
                            role=role,
                            parts=[types.Part.from_text(text=msg["content"])],
                        )
                    )

            # Add current message
            contents.append(
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=message)],
                )
            )

            config = types.GenerateContentConfig(
                system_instruction=system_prompt or self._default_tutor_prompt(),
                temperature=0.7,
                max_output_tokens=2048,
            )

            response = self._generate_with_fallback(contents, config)
            return response.text or "I'm sorry, I couldn't generate a response."
        except Exception as e:
            return f"I encountered an issue: {str(e)}. Please try again in a moment."

    # ------------------------------------------------------------------
    # Learning Path Generation
    # ------------------------------------------------------------------
    async def generate_learning_path(
        self, subject: str, grade_level: str
    ) -> dict:
        """Generate a structured learning path with topics for a subject+grade."""
        try:
            prompt = f"""Create a comprehensive learning path for a {grade_level} student studying {subject}.

Return a JSON object with this exact structure:
{{
    "title": "Learning Path Title",
    "description": "Brief description of what this path covers",
    "topics": [
        {{
            "title": "Topic Name",
            "description": "What the student will learn",
            "order_index": 0,
            "prerequisites": []
        }}
    ]
}}

Include 8-12 topics in logical learning order. Each topic should build on previous ones where appropriate.
Return ONLY valid JSON, no markdown or extra text."""

            config = types.GenerateContentConfig(
                temperature=0.5,
                max_output_tokens=4096,
            )

            response = self._generate_with_fallback(prompt, config)

            text = response.text.strip()
            # Strip markdown code block if present
            if text.startswith("```"):
                text = text.split("\n", 1)[1]
                text = text.rsplit("```", 1)[0]

            return json.loads(text)
        except (json.JSONDecodeError, Exception) as e:
            return {
                "title": f"{subject} — {grade_level}",
                "description": f"Learning path for {subject}",
                "topics": [
                    {
                        "title": f"Introduction to {subject}",
                        "description": f"Fundamentals of {subject} for {grade_level}",
                        "order_index": 0,
                        "prerequisites": [],
                    }
                ],
                "error": str(e),
            }

    # ------------------------------------------------------------------
    # Exam Generation
    # ------------------------------------------------------------------
    async def generate_exam(
        self, subject: str, topic: str, num_mcq: int = 5, num_short: int = 2, num_long: int = 1
    ) -> dict:
        """Generate exam questions for a topic."""
        try:
            subject_context = f' in {subject}' if subject else ''
            prompt = f"""Create an exam for the topic "{topic}"{subject_context}.

Generate exactly:
- {num_mcq} multiple-choice questions (4 options each, one correct)
- {num_short} short-answer questions
- {num_long} long-answer question(s)

Return a JSON object:
{{
    "questions": [
        {{
            "question_type": "mcq",
            "question_text": "...",
            "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
            "correct_answer": "A",
            "max_points": 1.0
        }},
        {{
            "question_type": "short_answer",
            "question_text": "...",
            "correct_answer": "Expected answer key",
            "max_points": 2.0
        }},
        {{
            "question_type": "long_answer",
            "question_text": "...",
            "correct_answer": "Rubric / key points expected",
            "max_points": 5.0
        }}
    ]
}}

Return ONLY valid JSON."""

            config = types.GenerateContentConfig(
                temperature=0.6,
                max_output_tokens=4096,
            )

            response = self._generate_with_fallback(prompt, config)

            text = response.text.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1]
                text = text.rsplit("```", 1)[0]

            return json.loads(text)
        except Exception as e:
            return {"questions": [], "error": str(e)}

    # ------------------------------------------------------------------
    # Answer Grading (free-text)
    # ------------------------------------------------------------------
    async def grade_answer(
        self,
        question: str,
        student_answer: str,
        correct_answer: str,
        max_points: float,
    ) -> dict:
        """Grade a free-text answer using Gemini. Returns points + feedback."""
        try:
            prompt = f"""You are grading a student's answer.

Question: {question}
Expected Answer / Rubric: {correct_answer}
Student's Answer: {student_answer}
Maximum Points: {max_points}

Evaluate the student's answer. Return a JSON object:
{{
    "points_awarded": <number between 0 and {max_points}>,
    "feedback": "Constructive feedback explaining the grade"
}}

Be fair but thorough. Give partial credit where appropriate.
Return ONLY valid JSON."""

            config = types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=512,
            )

            response = self._generate_with_fallback(prompt, config)

            text = response.text.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1]
                text = text.rsplit("```", 1)[0]

            return json.loads(text)
        except Exception as e:
            return {
                "points_awarded": 0,
                "feedback": f"Could not grade automatically: {str(e)}",
            }

    # ------------------------------------------------------------------
    # Performance Report
    # ------------------------------------------------------------------
    async def generate_report(
        self, subject: str, exam_results: list[dict]
    ) -> str:
        """Generate a natural-language performance report from exam data."""
        try:
            prompt = f"""Analyze this student's performance in {subject} and write a brief report.

Exam Results:
{json.dumps(exam_results, indent=2)}

Include:
1. Overall assessment
2. Strengths identified
3. Areas needing improvement
4. Specific recommendations for next steps

Keep it encouraging but honest. Use markdown formatting."""

            config = types.GenerateContentConfig(
                temperature=0.6,
                max_output_tokens=1024,
            )

            response = self._generate_with_fallback(prompt, config)
            return response.text or "Unable to generate report."
        except Exception as e:
            return f"Report generation failed: {str(e)}"

    # ------------------------------------------------------------------
    # RAG-grounded answer
    # ------------------------------------------------------------------
    async def generate_rag_answer(
        self, question: str, context_chunks: list[str]
    ) -> str:
        """Generate an answer grounded in retrieved document chunks."""
        try:
            context = "\n\n---\n\n".join(context_chunks)
            prompt = f"""Answer the student's question using ONLY the provided context.
If the context doesn't contain enough information, say so.
Cite which parts of the context support your answer.

Context:
{context}

Question: {question}

Answer in a clear, educational manner using markdown formatting."""

            config = types.GenerateContentConfig(
                temperature=0.4,
                max_output_tokens=2048,
            )

            response = self._generate_with_fallback(prompt, config)
            return response.text or "I couldn't find a relevant answer in your documents."
        except Exception as e:
            return f"Error generating answer: {str(e)}"

    # ------------------------------------------------------------------
    # Dashboard Recommendations
    # ------------------------------------------------------------------
    async def generate_recommendations(self, progress_data: dict) -> str:
        """Generate personalized learning recommendations."""
        try:
            prompt = f"""Based on this student's learning progress, suggest the top 3 next steps.

Progress Data:
{json.dumps(progress_data, indent=2)}

For each recommendation, explain WHY it's important. Be specific and actionable.
Use markdown formatting with numbered list."""

            config = types.GenerateContentConfig(
                temperature=0.5,
                max_output_tokens=512,
            )

            response = self._generate_with_fallback(prompt, config)
            return response.text or "Keep up the great work!"
        except Exception as e:
            return "Continue practicing your current topics to build mastery."

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _default_tutor_prompt() -> str:
        return """You are OOSC, an expert AI tutor for K-12 and university students.

Your teaching style:
- Explain concepts clearly with examples and analogies
- Use the Socratic method — ask guiding questions to help students discover answers
- Break complex topics into digestible steps
- Be encouraging and patient
- Use markdown formatting for readability
- When relevant, mention related concepts to build connections

If the student asks something outside academics, gently redirect to learning.
Always adapt your language level to the student's grade and topic."""
