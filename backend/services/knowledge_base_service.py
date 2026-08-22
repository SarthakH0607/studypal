"""
Knowledge Base Service — Open Educational Content (NCERT / OpenStax / CK-12).
Provides chunking, embedding, vector retrieval, and textbook citations for grounded tutoring.
"""

import json
import math
import os
import re
from typing import List, Dict, Any

# Curated open educational content (NCERT Science & Math, OpenStax Biology/Physics, World History)
EDUCATIONAL_KNOWLEDGE_BASE = [
    {
        "source": "NCERT Class 8 Science, Ch. 4 — Plant Reproduction & Photosynthesis",
        "subject": "Biology",
        "grade": "Class 8",
        "topic": "Photosynthesis and Plant Physiology",
        "concept_tag": "Biology > Botany > Photosynthesis Mechanisms",
        "content": """Photosynthesis is the process by which green plants and certain other organisms synthesize nutrients from carbon dioxide and water using radiant light energy absorbed by chlorophyll. The overall chemical equation is: 6CO2 + 6H2O + light energy -> C6H12O6 + 6O2. Chlorophyll, the green pigment located within chloroplasts, captures sunlight. During the light-dependent reactions taking place in the thylakoid membranes, water molecules are split (photolysis) into oxygen gas, protons, and electrons, generating ATP and NADPH. During the light-independent Calvin cycle in the stroma, carbon dioxide is fixed into glucose using the chemical energy stored in ATP and NADPH. Stomata on the leaf surface regulate gas exchange, allowing carbon dioxide intake and releasing oxygen and water vapor."""
    },
    {
        "source": "NCERT Class 9 Science, Ch. 5 — The Fundamental Unit of Life (Cell Biology)",
        "subject": "Biology",
        "grade": "Class 9",
        "topic": "Cell Structure and Organelles",
        "concept_tag": "Biology > Cytology > Cell Organelles & Membranes",
        "content": """The cell is the structural and functional unit of life. Robert Hooke first observed dead cork cells in 1665, while Antonie van Leeuwenhoek observed living cells in 1674. The plasma membrane is a selectively permeable lipid bilayer that controls the movement of substances in and out via diffusion and osmosis. Plant cells possess a rigid outer cell wall composed of cellulose for structural support. Key organelles include: Nucleus (contains genetic material DNA and nucleolus), Mitochondria (the powerhouse of the cell producing ATP via cellular respiration), Endoplasmic Reticulum (Rough ER with ribosomes for protein synthesis, Smooth ER for lipid synthesis and detoxification), Golgi Apparatus (packages and modifies macromolecules), and Lysosomes (contain digestive enzymes for cellular cleanup and autophagy)."""
    },
    {
        "source": "NCERT Class 10 Mathematics, Ch. 4 — Quadratic Equations",
        "subject": "Mathematics",
        "grade": "Class 10",
        "topic": "Quadratic Equations and Roots",
        "concept_tag": "Mathematics > Algebra > Quadratic Equations & Factoring",
        "content": """A quadratic equation in variable x is an equation of the standard form ax^2 + bx + c = 0, where a, b, c are real numbers and a ≠ 0. The roots or solutions of a quadratic equation can be found using three primary methods:
1. Factorization Method: Splitting the middle term bx into two terms whose product equals ac.
2. Completing the Square: Transforming ax^2 + bx + c = 0 into (x + p)^2 = q.
3. Quadratic Formula: x = (-b ± √(b^2 - 4ac)) / (2a).
The discriminant D = b^2 - 4ac determines the nature of the roots:
- If D > 0, there are two distinct real roots.
- If D = 0, there are two equal real roots (x = -b / 2a).
- If D < 0, there are no real roots (the roots are complex conjugates)."""
    },
    {
        "source": "OpenStax College Physics, Ch. 4 — Newton's Laws of Motion",
        "subject": "Physics",
        "grade": "Class 9-11",
        "topic": "Newtonian Mechanics and Forces",
        "concept_tag": "Physics > Mechanics > Newton's Laws & Friction",
        "content": """Sir Isaac Newton formulated three fundamental laws of classical mechanics:
1. Newton's First Law (Law of Inertia): An object remains at rest or in uniform motion along a straight line unless acted upon by a net external nonzero force. Inertia is quantified by mass.
2. Newton's Second Law: The acceleration of an object is directly proportional to the net force acting upon it and inversely proportional to its mass: F_net = m * a (in SI units: Newtons = kg * m/s^2).
3. Newton's Third Law (Action-Reaction): For every action force, there is an equal and opposite reaction force (F_AB = -F_BA). These paired forces act on two different bodies and never cancel each other out on a single free-body diagram. Friction is a resistive force opposing relative motion, calculated as f_k = μ_k * N for kinetic friction."""
    },
    {
        "source": "NCERT Class 10 Science, Ch. 1 — Chemical Reactions and Equations",
        "subject": "Chemistry",
        "grade": "Class 10",
        "topic": "Types of Chemical Reactions",
        "concept_tag": "Chemistry > Physical Chemistry > Reaction Types & Balancing",
        "content": """A chemical reaction transforms reactants into new products with different chemical properties. The Law of Conservation of Mass dictates that mass can neither be created nor destroyed; therefore, chemical equations must be balanced so equal numbers of each element appear on both sides.
Major reaction types:
1. Combination Reaction: Two or more reactants combine to form a single product (e.g., CaO + H2O -> Ca(OH)2).
2. Decomposition Reaction: A single compound breaks down into two or more simpler substances when heated or energized (e.g., 2FeSO4 -> Fe2O3 + SO2 + SO3).
3. Displacement Reaction: A more reactive element displaces a less reactive element from its compound (e.g., Fe + CuSO4 -> FeSO4 + Cu).
4. Double Displacement Reaction: Mutual exchange of ions between reactants, often forming an insoluble precipitate.
5. Redox Reactions: Involve simultaneous oxidation (loss of electrons / gain of oxygen) and reduction (gain of electrons / loss of oxygen)."""
    },
    {
        "source": "OpenStax World History, Ch. 28 — The First World War and Treaty of Versailles",
        "subject": "History",
        "grade": "Class 9-12",
        "topic": "World War I and the Interwar Period",
        "concept_tag": "History > Modern World History > WWI Causes & Treaty of Versailles",
        "content": """The First World War (1914-1918) was triggered by the assassination of Archduke Franz Ferdinand in Sarajevo, accelerating long-simmering tensions driven by Militarism, Alliances, Imperialism, and Nationalism (M-A-I-N). The Allied Powers (France, Britain, Russia, and later the United States) fought the Central Powers (Germany, Austria-Hungary, Ottoman Empire). The war concluded with the signing of the Treaty of Versailles in 1919. Key clauses included Article 231 (the 'War Guilt Clause'), imposing crippling financial reparations and demilitarization on Germany, redrawing European borders, and establishing the League of Nations proposed in Woodrow Wilson's Fourteen Points. These punitive measures fostered severe economic instability in Weimar Germany, laying the groundwork for World War II."""
    },
    {
        "source": "NCERT Class 7-8 Mathematics, Ch. 2 — Fractions and Decimals",
        "subject": "Mathematics",
        "grade": "Class 7-8",
        "topic": "Operations on Fractions",
        "concept_tag": "Mathematics > Arithmetic > Fractions with Unlike Denominators",
        "content": """A fraction represents a part of a whole, written as numerator/denominator (a/b where b ≠ 0). 
To add or subtract fractions with unlike denominators:
1. Find the Least Common Multiple (LCM) of the denominators to create a common denominator.
2. Convert each fraction into an equivalent fraction with this common denominator: multiply both numerator and denominator by (LCM / original denominator).
3. Add or subtract the numerators while keeping the common denominator unchanged.
4. Simplify the resulting fraction to its lowest terms by dividing the numerator and denominator by their greatest common divisor (GCD).
Example: 1/3 + 2/5 -> LCM of 3 and 5 is 15 -> (5/15) + (6/15) = 11/15."""
    },
    {
        "source": "OpenStax Concepts of Biology, Ch. 9 — Cellular Respiration & ATP",
        "subject": "Biology",
        "grade": "Class 9-12",
        "topic": "Energy Metabolism and Respiration",
        "concept_tag": "Biology > Biochemistry > Cellular Respiration & ATP Synthase",
        "content": """Cellular respiration is the biochemical process that converts glucose and oxygen into usable energy (ATP), with carbon dioxide and water as byproducts: C6H12O6 + 6O2 -> 6CO2 + 6H2O + ~36-38 ATP.
Three main stages:
1. Glycolysis (in cytoplasm): Glucose (6-carbon) is broken into two molecules of pyruvate (3-carbon), producing a net yield of 2 ATP and 2 NADH without requiring oxygen.
2. Krebs Cycle / Citric Acid Cycle (in mitochondrial matrix): Pyruvate is oxidized into Acetyl CoA, producing CO2, 2 ATP, 6 NADH, and 2 FADH2.
3. Oxidative Phosphorylation & Electron Transport Chain (in inner mitochondrial cristae): High-energy electrons from NADH and FADH2 move through electron carriers, creating a proton gradient across the inner membrane. ATP Synthase harnesses this chemiosmotic gradient to phosphorylate ADP into ATP, generating ~32-34 ATP. Oxygen acts as the terminal electron acceptor, forming water."""
    }
]


class KnowledgeBaseService:
    """Lightweight in-memory vector store & retrieval engine for educational grounding."""

    def __init__(self):
        self.documents = EDUCATIONAL_KNOWLEDGE_BASE
        # Precompute simple TF-IDF / term-frequency vectors for lightning-fast cosine similarity
        self.vocabulary: Dict[str, int] = {}
        self.doc_vectors: List[Dict[str, float]] = []
        self._build_index()

    def _tokenize(self, text: str) -> List[str]:
        """Normalize text into lowercase alphanumeric tokens."""
        clean = re.sub(r'[^a-zA-Z0-9\s]', ' ', text.lower())
        tokens = [w for w in clean.split() if len(w) > 2]
        return tokens

    def _build_index(self):
        """Build term-frequency index across all curriculum documents."""
        all_tokens = set()
        for doc in self.documents:
            full_text = f"{doc['subject']} {doc['topic']} {doc['concept_tag']} {doc['content']}"
            tokens = self._tokenize(full_text)
            doc["_tokens"] = tokens
            all_tokens.update(tokens)

        self.vocabulary = {term: idx for idx, term in enumerate(all_tokens)}

        for doc in self.documents:
            vec = {}
            for token in doc["_tokens"]:
                vec[token] = vec.get(token, 0) + 1
            # Normalize vector magnitude
            norm = math.sqrt(sum(v * v for v in vec.values())) or 1.0
            doc["_vec"] = {k: v / norm for k, v in vec.items()}

    def retrieve(self, query: str, top_k: int = 2, min_score: float = 0.08) -> List[Dict[str, Any]]:
        """
        Retrieve the most relevant textbook chunks for a query using cosine similarity.
        Returns empty list if relevance is below min_score.
        """
        query_tokens = self._tokenize(query)
        if not query_tokens:
            return []

        # Vectorize query
        q_vec = {}
        for token in query_tokens:
            q_vec[token] = q_vec.get(token, 0) + 1
        q_norm = math.sqrt(sum(v * v for v in q_vec.values())) or 1.0
        q_vec = {k: v / q_norm for k, v in q_vec.items()}

        scores = []
        for idx, doc in enumerate(self.documents):
            # Cosine similarity dot product
            dot = sum(doc["_vec"].get(term, 0.0) * weight for term, weight in q_vec.items())
            scores.append((dot, doc))

        # Sort descending
        scores.sort(key=lambda x: x[0], reverse=True)

        results = []
        for score, doc in scores[:top_k]:
            if score >= min_score:
                results.append({
                    "source": doc["source"],
                    "subject": doc["subject"],
                    "grade": doc["grade"],
                    "topic": doc["topic"],
                    "concept_tag": doc["concept_tag"],
                    "excerpt": doc["content"],
                    "similarity_score": round(score, 3),
                })

        return results


# Global singleton instance
knowledge_base = KnowledgeBaseService()
