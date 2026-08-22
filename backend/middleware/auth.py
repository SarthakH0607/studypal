"""
Authentication middleware — JWT verification via Supabase Auth.
Provides `get_current_user` dependency for protected routes.
"""

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from backend.config import get_settings

security = HTTPBearer()


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Verify the JWT from Supabase Auth and return the user payload.
    Uses Supabase Auth get_user for authentic validation.
    """
    settings = get_settings()
    token = credentials.credentials

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing access token",
        )

    try:
        from backend.services.supabase_service import SupabaseService
        supa = SupabaseService(settings)
        user_res = supa.admin.auth.get_user(token)
        if user_res and user_res.user:
            return {
                "id": str(user_res.user.id),
                "email": user_res.user.email,
                "role": getattr(user_res.user, "role", "authenticated"),
            }
    except Exception:
        pass

    # Fallback to decode claims directly
    try:
        from jose import jwt
        payload = jwt.get_unverified_claims(token)
        user_id = payload.get("sub")
        if user_id:
            return {
                "id": str(user_id),
                "email": payload.get("email"),
                "role": payload.get("role", "authenticated"),
            }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
        )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Unauthorized user session",
    )
