"""
Auth Routes — User registration, login, and profile.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from backend.config import get_settings
from backend.middleware.auth import get_current_user
from backend.services.supabase_service import SupabaseService

router = APIRouter()


# ---------------------------------------------------------------------------
# Request / Response Schemas
# ---------------------------------------------------------------------------
class SignupRequest(BaseModel):
    email: str
    password: str
    full_name: str = ""


class LoginRequest(BaseModel):
    email: str
    password: str


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    grade_level: str | None = None
    preferred_subjects: list[str] | None = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _get_supabase() -> SupabaseService:
    return SupabaseService(get_settings())


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@router.post("/signup")
async def signup(body: SignupRequest):
    """Register a new student account."""
    supa = _get_supabase()
    clean_email = body.email.strip().lower()
    try:
        result = supa.admin_create_user(clean_email, body.password, body.full_name.strip())
        user_id = result.user.id if hasattr(result, "user") and result.user else None
        return {
            "message": "Account created successfully",
            "user_id": user_id,
        }
    except Exception as e:
        # Fallback to standard sign_up if admin method throws
        try:
            result = supa.sign_up(clean_email, body.password, body.full_name.strip())
            return {"message": "Account created successfully"}
        except Exception as e2:
            raise HTTPException(status_code=400, detail=str(e2))


@router.post("/login")
async def login(body: LoginRequest):
    """Login and return access token."""
    supa = _get_supabase()
    clean_email = body.email.strip().lower()
    try:
        result = supa.sign_in(clean_email, body.password)
        if hasattr(result, "session") and result.session:
            return {
                "access_token": result.session.access_token,
                "refresh_token": result.session.refresh_token,
                "user": {
                    "id": result.user.id,
                    "email": result.user.email,
                },
            }
        raise HTTPException(status_code=401, detail="Invalid credentials")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Get the current user's profile."""
    supa = _get_supabase()
    try:
        result = supa.get_profile(user["id"])
        return {"user": user, "profile": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/profile")
async def update_profile(
    body: ProfileUpdate,
    user: dict = Depends(get_current_user),
):
    """Update the current user's profile."""
    supa = _get_supabase()
    try:
        update_data = body.model_dump(exclude_none=True)
        if update_data:
            supa.update_profile(user["id"], update_data)
        return {"message": "Profile updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
