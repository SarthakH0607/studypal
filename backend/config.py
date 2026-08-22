"""
OOSC Backend Configuration
Loads and validates all environment variables from .env file.
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # --- Gemini ---
    gemini_api_key: str = Field(..., description="Google Gemini API key")

    # --- Groq ---
    groq_api_key: str = Field(..., description="Groq API key for Whisper STT")

    # --- Supabase ---
    supabase_url: str = Field(..., description="Supabase project URL")
    supabase_anon_key: str = Field(..., description="Supabase anonymous/public key")
    supabase_service_role_key: str = Field(..., description="Supabase service role key")

    # --- App ---
    app_name: str = "OOSC"
    debug: bool = False
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # --- AI Model Defaults ---
    gemini_model: str = "gemini-3.6-flash"
    gemini_image_model: str = "gemini-3.6-flash"
    whisper_model: str = "whisper-large-v3-turbo"
    bge_m3_model: str = "BAAI/bge-m3"

    # --- RAG ---
    chunk_size: int = 500
    chunk_overlap: int = 50
    vector_dimension: int = 1024
    similarity_top_k: int = 5

    model_config = {
        "env_file": "backend/.env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


@lru_cache()
def get_settings() -> Settings:
    """Cached settings singleton. Call this to access config throughout the app."""
    return Settings()
