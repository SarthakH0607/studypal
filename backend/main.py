"""
OOSC Backend — FastAPI Application Entry Point
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import get_settings
from backend.routes import auth, learning, tutor, documents, exams, dashboard, teacher


# ---------------------------------------------------------------------------
# Lifespan: startup / shutdown
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: load heavy models (BGE-M3). Shutdown: cleanup."""
    settings = get_settings()
    print(f"Starting {settings.app_name} backend ...")

    # Lazy-import so the model is only loaded once at startup
    from backend.services.bge_m3_service import Bge_M3_Service
    app.state.bge_m3 = Bge_M3_Service(settings)
    print("BGE-M3 service initialized")

    yield  # ---- app is running ----

    print("Shutting down ...")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="OOSC — AI Tutoring Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(learning.router, prefix="/api/learning", tags=["Learning Paths"])
app.include_router(tutor.router, prefix="/api/tutor", tags=["AI Tutor"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents & RAG"])
app.include_router(exams.router, prefix="/api/exams", tags=["Exams"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(teacher.router, prefix="/api/teacher", tags=["Teacher & Flags"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "app": settings.app_name}
