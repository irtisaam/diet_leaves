"""
Authentication Routes — standalone JWT + bcrypt (no Supabase Auth)

Endpoints:
  POST /signup         — customer registration only
  POST /login          — customer login only (rejects admin accounts)
  POST /admin/login    — admin login only (rejects customer accounts)
  POST /logout         — logout (client discards token)
  GET  /me             — current user profile
  PUT  /me             — update current user profile
  POST /forgot-password
  POST /reset-password
"""
import secrets
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Depends
from ..models.schemas import (
    UserRegister, UserLogin, UserProfile, TokenResponse,
    UserProfileUpdate, ForgotPasswordRequest, ResetPasswordRequest,
)
from ..utils.database import supabase
from ..utils.auth import (
    hash_password, verify_password, create_access_token, get_current_user,
)

router = APIRouter()


def _build_token_response(profile: dict) -> TokenResponse:
    token = create_access_token({"sub": profile["id"], "role": profile.get("role", "customer")})
    return TokenResponse(
        access_token=token,
        user=UserProfile(**profile),
    )


def _find_profile_by_identifier(identifier: str) -> dict | None:
    """Look up a profile by email or phone."""
    profile = None
    if "@" in identifier:
        resp = supabase.table("profiles").select("*").eq("email", identifier.lower()).execute()
        if resp.data:
            profile = resp.data[0]
    if not profile:
        resp = supabase.table("profiles").select("*").eq("phone", identifier).execute()
        if resp.data:
            profile = resp.data[0]
    if not profile:
        resp = supabase.table("profiles").select("*").eq("email", identifier.lower()).execute()
        if resp.data:
            profile = resp.data[0]
    return profile


def _verify_credentials(profile: dict | None, password: str) -> dict:
    """Verify password against profile. Raises 401 on failure."""
    if not profile or not profile.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(password, profile["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return profile


@router.post("/signup", response_model=TokenResponse)
async def signup(user: UserRegister):
    """Register a new customer account (email OR phone required). Admin accounts cannot be created here."""
    identifier = (user.email or "").strip().lower()
    phone = (user.phone or "").strip()

    if not identifier and not phone:
        raise HTTPException(status_code=400, detail="Email or phone number is required")

    # Check duplicates
    if identifier:
        existing = supabase.table("profiles").select("id").eq("email", identifier).execute()
        if existing.data:
            raise HTTPException(status_code=409, detail="An account with this email already exists")
    if phone:
        existing = supabase.table("profiles").select("id").eq("phone", phone).execute()
        if existing.data:
            raise HTTPException(status_code=409, detail="An account with this phone number already exists")

    profile_data = {
        "id": str(uuid4()),
        "email": identifier or None,
        "phone": phone or None,
        "full_name": user.full_name,
        "password_hash": hash_password(user.password),
        "role": "customer",          # always customer — no override allowed
        "is_admin": False,           # always false
        "country": "Pakistan",
    }

    resp = supabase.table("profiles").insert(profile_data).execute()
    if not resp.data:
        raise HTTPException(status_code=500, detail="Failed to create account")

    return _build_token_response(resp.data[0])


@router.post("/login", response_model=TokenResponse)
async def customer_login(credentials: UserLogin):
    """Customer login. Admin accounts are rejected — use /admin/login instead."""
    identifier = credentials.identifier.strip()
    profile = _find_profile_by_identifier(identifier)
    profile = _verify_credentials(profile, credentials.password)

    if profile.get("role") == "admin" or profile.get("is_admin"):
        raise HTTPException(status_code=403, detail="Please use the admin login page")

    return _build_token_response(profile)


@router.post("/admin/login", response_model=TokenResponse)
async def admin_login(credentials: UserLogin):
    """Admin login. Customer accounts are rejected — use /login instead."""
    identifier = credentials.identifier.strip()
    profile = _find_profile_by_identifier(identifier)
    profile = _verify_credentials(profile, credentials.password)

    if profile.get("role") != "admin" and not profile.get("is_admin"):
        raise HTTPException(status_code=403, detail="Access denied. Admin accounts only.")

    return _build_token_response(profile)


@router.post("/logout")
async def logout():
    """Logout (client should discard the token)."""
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserProfile)
async def me(user: dict = Depends(get_current_user)):
    """Return the current authenticated user's profile."""
    return UserProfile(**user)


@router.put("/me", response_model=UserProfile)
async def update_profile(
    profile_update: UserProfileUpdate,
    user: dict = Depends(get_current_user),
):
    """Update the authenticated user's profile."""
    update_data = profile_update.model_dump(exclude_unset=True)
    if not update_data:
        return UserProfile(**user)

    resp = supabase.table("profiles").update(update_data).eq("id", user["id"]).execute()
    if not resp.data:
        raise HTTPException(status_code=400, detail="Failed to update profile")

    return UserProfile(**resp.data[0])


@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    """Generate a password-reset token and (later) email it."""
    email = req.email.strip().lower()
    resp = supabase.table("profiles").select("id, email").eq("email", email).execute()
    # Always return success to prevent email enumeration
    if not resp.data:
        return {"message": "If an account with that email exists, a reset link has been sent."}

    token = secrets.token_urlsafe(48)
    expires = datetime.now(timezone.utc) + timedelta(hours=1)
    supabase.table("profiles").update({
        "reset_token": token,
        "reset_token_expires": expires.isoformat(),
    }).eq("id", resp.data[0]["id"]).execute()

    # Send email (fire-and-forget)
    try:
        from ..services.email import send_password_reset_email
        send_password_reset_email(email, token)
    except Exception:
        pass  # email service optional

    return {"message": "If an account with that email exists, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest):
    """Reset password using a valid reset token."""
    resp = supabase.table("profiles").select("id, reset_token_expires").eq(
        "reset_token", req.token
    ).execute()
    if not resp.data:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    profile = resp.data[0]
    expires = profile.get("reset_token_expires")
    if expires:
        exp_dt = datetime.fromisoformat(expires.replace("Z", "+00:00"))
        if datetime.now(timezone.utc) > exp_dt:
            raise HTTPException(status_code=400, detail="Reset token has expired")

    supabase.table("profiles").update({
        "password_hash": hash_password(req.new_password),
        "reset_token": None,
        "reset_token_expires": None,
    }).eq("id", profile["id"]).execute()

    return {"message": "Password has been reset successfully"}
