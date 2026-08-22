"""
BGE-M3 Embedding Service — Vector embeddings for RAG pipeline.
Uses FlagEmbedding to generate dense vectors for semantic search.
"""

from backend.config import Settings


class Bge_M3_Service:
    """
    BGE-M3 embedding model.
    Generates 1024-dimensional dense vectors for document chunks and queries.
    """

    def __init__(self, settings: Settings):
        self._settings = settings
        self._dimension = settings.vector_dimension
        self._model = None

    def _get_model(self):
        if self._model is None:
            print(f"Loading BGE-M3 model: {self._settings.bge_m3_model} ...")
            try:
                from FlagEmbedding import BGEM3FlagModel
                self._model = BGEM3FlagModel(
                    self._settings.bge_m3_model,
                    use_fp16=False,
                )
            except Exception as e:
                print(f"BGE-M3 load failed: {e}")
                raise e
        return self._model

    @property
    def dimension(self) -> int:
        return self._dimension

    def encode(self, texts: list[str], batch_size: int = 12) -> list[list[float]]:
        """
        Encode a list of texts into dense embedding vectors.

        Args:
            texts: List of text strings to embed.
            batch_size: Batch size for encoding.

        Returns:
            List of embedding vectors (each 1024-dimensional).
        """
        if not texts:
            return []

        model = self._get_model()
        embeddings = model.encode(
            texts,
            batch_size=batch_size,
            max_length=512,  # Keep shorter for chunks
        )

        # Return dense vectors as Python lists (for JSON serialization / pgvector)
        return embeddings["dense_vecs"].tolist()

    def encode_query(self, query: str) -> list[float]:
        """Encode a single query string into an embedding vector."""
        results = self.encode([query])
        return results[0] if results else []
