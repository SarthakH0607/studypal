"""
Active Insight & Flagging Agent — Automated Student Detection & Class Roster Insights.
Evaluates mastery trends, engagement anomalies, and generates human-readable flags for Parents and Teachers.
"""

from typing import List, Dict, Any
from backend.services.mastery_map_service import mastery_map_service

# Class roster dataset for Teacher Portal
CLASS_ROSTER = [
    {
        "id": "STU-44021",
        "name": "Sarah Jenkins",
        "grade": "Grade 9",
        "email": "sarah.j@school.edu",
        "avatar": "SJ",
        "overall_grade": "A- (88%)",
        "streak_days": 3,
        "last_active": "Today, 4:15 PM",
        "urgency": "medium",
        "flags": [
            {
                "id": "flag-101",
                "severity": "medium",
                "type": "concept_struggle",
                "subject": "Biology",
                "concept": "Cellular Respiration & ATP Synthase",
                "message": "Sarah has missed 3 consecutive questions on Cellular Respiration and is currently at 42% mastery on this concept.",
                "action": "Assign 5-question foundational review quiz",
            }
        ],
    },
    {
        "id": "STU-88102",
        "name": "Liam Patel",
        "grade": "Grade 9",
        "email": "liam.p@school.edu",
        "avatar": "LP",
        "overall_grade": "C+ (74%)",
        "streak_days": 0,
        "last_active": "4 days ago",
        "urgency": "high",
        "flags": [
            {
                "id": "flag-102",
                "severity": "high",
                "type": "inactivity_streak_loss",
                "subject": "Mathematics",
                "concept": "Quadratic Equations",
                "message": "Liam has been inactive for 4 consecutive days and missed 2 planned Algebra study sessions.",
                "action": "Send parent check-in reminder & schedule 1-on-1 tutoring",
            },
            {
                "id": "flag-103",
                "severity": "high",
                "type": "falling_trend",
                "subject": "Physics",
                "concept": "Newton's 3 Laws & Friction",
                "message": "Quiz accuracy in Physics dropped from 85% to 50% over the last 2 attempts.",
                "action": "Review Free-Body Diagram misconceptions",
            }
        ],
    },
    {
        "id": "STU-99413",
        "name": "Emma Watson",
        "grade": "Grade 9",
        "email": "emma.w@school.edu",
        "avatar": "EW",
        "overall_grade": "A+ (96%)",
        "streak_days": 12,
        "last_active": "Today, 2:30 PM",
        "urgency": "low",
        "flags": [],
    },
    {
        "id": "STU-12849",
        "name": "Marcus Chen",
        "grade": "Grade 9",
        "email": "marcus.c@school.edu",
        "avatar": "MC",
        "overall_grade": "B (82%)",
        "streak_days": 2,
        "last_active": "Yesterday, 5:10 PM",
        "urgency": "medium",
        "flags": [
            {
                "id": "flag-104",
                "severity": "medium",
                "type": "concept_struggle",
                "subject": "History",
                "concept": "WWI Causes & Treaty of Versailles",
                "message": "Scored 58% on Treaty of Versailles. Struggles with Article 231 war guilt repercussions.",
                "action": "Recommend visual timeline review",
            }
        ],
    },
]


class FlaggingService:
    """Detects at-risk learning patterns and generates proactive plain-language alerts."""

    def __init__(self):
        pass

    def evaluate_student_flags(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Scan a student's active mastery map and generate plain-language alerts.
        """
        weak_concepts = mastery_map_service.get_weakest_concepts(user_id, limit=3)
        flags = []

        for concept in weak_concepts:
            score_pct = int(concept["score"] * 100)
            if score_pct < 65:
                severity = "high" if score_pct < 50 else "medium"
                flags.append({
                    "id": f"flag-{concept['concept_tag'][:8]}",
                    "severity": severity,
                    "type": "concept_struggle",
                    "subject": concept["subject"],
                    "concept": concept["title"],
                    "score": score_pct,
                    "message": f"Student is struggling with {concept['title']} ({score_pct}% mastery across {concept['total_attempts']} attempts).",
                    "action": f"Recommended practice: Foundational {concept['subject']} scaffolding quiz.",
                })

        return flags

    def get_teacher_roster(self, teacher_id: str = "TCH-100", class_id: str = "CLS-9A") -> List[Dict[str, Any]]:
        """Return the class roster with student alerts sorted by urgency (high > medium > low)."""
        urgency_rank = {"high": 1, "medium": 2, "low": 3}
        roster = list(CLASS_ROSTER)
        roster.sort(key=lambda s: (urgency_rank.get(s["urgency"], 4), len(s["flags"]) * -1))
        return roster


flagging_service = FlaggingService()
