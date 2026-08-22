"""
Supabase Service — Database, Auth, Storage, and Vector helpers.
Central data access layer for the entire backend.
"""

from supabase import create_client, Client
from backend.config import Settings


class SupabaseService:
    """Wraps the Supabase Python client for DB, Auth, and Storage operations."""

    def __init__(self, settings: Settings):
        self._settings = settings
        # Admin client (bypasses RLS — use only for server-side operations)
        self._admin: Client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key,
        )
        # Public client (respects RLS — use for user-scoped operations)
        self._public: Client = create_client(
            settings.supabase_url,
            settings.supabase_anon_key,
        )

    @property
    def admin(self) -> Client:
        return self._admin

    @property
    def public(self) -> Client:
        return self._public

    # ------------------------------------------------------------------
    # Auth helpers
    # ------------------------------------------------------------------
    def sign_up(self, email: str, password: str, full_name: str = ""):
        """Register a new user via Supabase Auth (with admin auto-confirm fallback)."""
        try:
            return self._public.auth.sign_up({
                "email": email,
                "password": password,
                "options": {"data": {"full_name": full_name}},
            })
        except Exception:
            # Fallback to admin create_user which auto-confirms email and bypasses rate limits
            return self._admin.auth.admin.create_user({
                "email": email,
                "password": password,
                "email_confirm": True,
                "user_metadata": {"full_name": full_name},
            })

    def admin_create_user(self, email: str, password: str, full_name: str = ""):
        """Direct admin user creation with email auto-confirmed."""
        return self._admin.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {"full_name": full_name},
        })

    def sign_in(self, email: str, password: str):
        """Sign in with email + password."""
        return self._public.auth.sign_in_with_password({
            "email": email,
            "password": password,
        })

    # ------------------------------------------------------------------
    # Profile helpers
    # ------------------------------------------------------------------
    def get_profile(self, user_id: str):
        return (
            self._admin.table("profiles")
            .select("*")
            .eq("id", user_id)
            .single()
            .execute()
        )

    def update_profile(self, user_id: str, data: dict):
        return (
            self._admin.table("profiles")
            .update(data)
            .eq("id", user_id)
            .execute()
        )

    # ------------------------------------------------------------------
    # Generic table helpers
    # ------------------------------------------------------------------
    def insert(self, table: str, data: dict):
        return self._admin.table(table).insert(data).execute()

    def select(self, table: str, columns: str = "*", filters: dict | None = None):
        query = self._admin.table(table).select(columns)
        if filters:
            for key, value in filters.items():
                query = query.eq(key, value)
        return query.execute()

    def update(self, table: str, data: dict, filters: dict):
        query = self._admin.table(table).update(data)
        for key, value in filters.items():
            query = query.eq(key, value)
        return query.execute()

    def delete(self, table: str, filters: dict):
        query = self._admin.table(table).delete()
        for key, value in filters.items():
            query = query.eq(key, value)
        return query.execute()

    # ------------------------------------------------------------------
    # Vector search via RPC
    # ------------------------------------------------------------------
    def match_document_chunks(
        self,
        query_embedding: list[float],
        user_id: str,
        match_count: int = 5,
    ):
        """Call the match_document_chunks RPC function for vector similarity search.
        Falls back to a direct table query if the RPC function doesn't exist."""
        try:
            return self._admin.rpc(
                "match_document_chunks",
                {
                    "query_embedding": query_embedding,
                    "match_count": match_count,
                    "filter_user_id": user_id,
                },
            ).execute()
        except Exception as e:
            print(f"[WARN] match_document_chunks RPC failed: {e}")
            print("[INFO] Falling back to direct chunk retrieval (no vector similarity)")
            # Fallback: return the most recent chunks for this user
            try:
                result = (
                    self._admin.table("document_chunks")
                    .select("*")
                    .eq("user_id", user_id)
                    .limit(match_count)
                    .execute()
                )
                # Add a fake similarity score for compatibility
                for chunk in (result.data or []):
                    chunk["similarity"] = 0.5
                return result
            except Exception as fallback_err:
                print(f"[ERROR] Fallback chunk retrieval also failed: {fallback_err}")
                # Return an empty-like result
                class EmptyResult:
                    data = []
                return EmptyResult()
