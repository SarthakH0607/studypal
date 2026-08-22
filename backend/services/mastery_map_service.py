"""
Mastery Map Service — Gap-Tracking, Sub-Skill Tagging & Adaptive Practice Engine.
Maintains running concept-level accuracy per student and targets lowest-mastery tags.
"""

from typing import Dict, List, Any
import datetime

# In-memory running store of student mastery per concept tag
# In production: stored in Supabase `student_mastery_map` table
_STUDENT_MASTERY_STORE: Dict[str, Dict[str, Dict[str, Any]]] = {}

DEFAULT_CONCEPT_TAGS = [
    {
        "subject": "Biology",
        "concept_tag": "Biology > Botany > Photosynthesis Mechanisms",
        "title": "Photosynthesis Mechanisms (Light & Dark Reactions)",
        "default_score": 0.85,
        "total_attempts": 6,
        "correct_attempts": 5,
    },
    {
        "subject": "Biology",
        "concept_tag": "Biology > Cytology > Cell Organelles & Membranes",
        "title": "Cell Organelles & Plasma Membrane Transport",
        "default_score": 0.92,
        "total_attempts": 8,
        "correct_attempts": 7,
    },
    {
        "subject": "Biology",
        "concept_tag": "Biology > Biochemistry > Cellular Respiration & ATP Synthase",
        "title": "Cellular Respiration, Glycolysis & ATP",
        "default_score": 0.42,  # Low mastery - needs focus!
        "total_attempts": 7,
        "correct_attempts": 3,
    },
    {
        "subject": "Mathematics",
        "concept_tag": "Mathematics > Algebra > Quadratic Equations & Factoring",
        "title": "Quadratic Equations, Discriminant & Factoring",
        "default_score": 0.88,
        "total_attempts": 10,
        "correct_attempts": 9,
    },
    {
        "subject": "Mathematics",
        "concept_tag": "Mathematics > Arithmetic > Fractions with Unlike Denominators",
        "title": "Fractions: LCM & Operations with Unlike Denominators",
        "default_score": 0.50,  # Weak tag
        "total_attempts": 6,
        "correct_attempts": 3,
    },
    {
        "subject": "Physics",
        "concept_tag": "Physics > Mechanics > Newton's Laws & Friction",
        "title": "Newton's 3 Laws of Motion & Free-Body Forces",
        "default_score": 0.72,
        "total_attempts": 5,
        "correct_attempts": 4,
    },
    {
        "subject": "Chemistry",
        "concept_tag": "Chemistry > Physical Chemistry > Reaction Types & Balancing",
        "title": "Balancing Equations & Chemical Reaction Types",
        "default_score": 0.80,
        "total_attempts": 5,
        "correct_attempts": 4,
    },
    {
        "subject": "History",
        "concept_tag": "History > Modern World History > WWI Causes & Treaty of Versailles",
        "title": "WWI M-A-I-N Causes & Treaty of Versailles (1919)",
        "default_score": 0.58,  # Needs review
        "total_attempts": 5,
        "correct_attempts": 3,
    },
]


class MasteryMapService:
    """Manages concept-level student skill tracking and adaptive practice targeting."""

    def __init__(self):
        pass

    def _ensure_student_profile(self, user_id: str):
        if user_id not in _STUDENT_MASTERY_STORE:
            _STUDENT_MASTERY_STORE[user_id] = {}
            for item in DEFAULT_CONCEPT_TAGS:
                tag = item["concept_tag"]
                _STUDENT_MASTERY_STORE[user_id][tag] = {
                    "subject": item["subject"],
                    "concept_tag": tag,
                    "title": item["title"],
                    "score": item["default_score"],
                    "total_attempts": item["total_attempts"],
                    "correct_attempts": item["correct_attempts"],
                    "recent_history": [True] * (item["correct_attempts"] - 1) + [False] * (item["total_attempts"] - item["correct_attempts"]) + [True],
                    "last_updated": datetime.datetime.utcnow().isoformat(),
                    "difficulty_level": "intermediate" if item["default_score"] >= 0.7 else "foundational",
                }

    def get_student_mastery_map(self, user_id: str, subject: str = "") -> List[Dict[str, Any]]:
        """Return the comprehensive mastery map for a student, optionally filtered by subject."""
        self._ensure_student_profile(user_id)
        student_data = _STUDENT_MASTERY_STORE[user_id]

        results = list(student_data.values())
        if subject:
            results = [r for r in results if r["subject"].lower() == subject.lower()]

        # Sort by score ascending (lowest mastery first) so weak spots are prominent
        results.sort(key=lambda x: x["score"])
        return results

    def get_weakest_concepts(self, user_id: str, limit: int = 3) -> List[Dict[str, Any]]:
        """Find the lowest-mastery concepts requiring immediate targeted practice."""
        self._ensure_student_profile(user_id)
        student_data = list(_STUDENT_MASTERY_STORE[user_id].values())
        student_data.sort(key=lambda x: x["score"])
        return student_data[:limit]

    def record_attempt(
        self,
        user_id: str,
        concept_tag: str,
        is_correct: bool,
        subject: str = "General",
        title: str = "",
    ):
        """Update the student's mastery score on a specific concept tag using weighted moving average."""
        self._ensure_student_profile(user_id)
        student_map = _STUDENT_MASTERY_STORE[user_id]

        if concept_tag not in student_map:
            student_map[concept_tag] = {
                "subject": subject,
                "concept_tag": concept_tag,
                "title": title or concept_tag.split(" > ")[-1],
                "score": 0.5,
                "total_attempts": 0,
                "correct_attempts": 0,
                "recent_history": [],
                "last_updated": datetime.datetime.utcnow().isoformat(),
                "difficulty_level": "foundational",
            }

        rec = student_map[concept_tag]
        rec["total_attempts"] += 1
        if is_correct:
            rec["correct_attempts"] += 1

        rec["recent_history"].append(is_correct)
        if len(rec["recent_history"]) > 10:
            rec["recent_history"].pop(0)

        # Weighted calculation (recent 5 attempts have 70% weight, overall accuracy 30%)
        recent = rec["recent_history"][-5:]
        recent_acc = sum(1 for a in recent if a) / len(recent)
        overall_acc = rec["correct_attempts"] / rec["total_attempts"]
        rec["score"] = round(0.7 * recent_acc + 0.3 * overall_acc, 2)

        # Update scaffolded difficulty
        if rec["score"] >= 0.85:
            rec["difficulty_level"] = "advanced"
        elif rec["score"] >= 0.65:
            rec["difficulty_level"] = "intermediate"
        else:
            rec["difficulty_level"] = "foundational"

        rec["last_updated"] = datetime.datetime.utcnow().isoformat()
        return rec


mastery_map_service = MasteryMapService()
