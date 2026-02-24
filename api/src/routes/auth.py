"""
Authentication Routes
"""
from fastapi import APIRouter, HTTPException, Depends
from ..models.schemas import UserCreate, UserLogin, UserProfile, TokenResponse, UserProfileUpdate
from ..utils.database import supabase

router = APIRouter()


@router.post("/signup", response_model=TokenResponse)
async def signup(user: UserCreate):
    """Register a new user"""
    try:
        # Create user in Supabase Auth
        response = supabase.auth.sign_up({
            "email": user.email,
            "password": user.password,
            "options": {
                "data": {
                    "full_name": user.full_name
                }
            }
        })
        
        if response.user is None:
            raise HTTPException(status_code=400, detail="Failed to create user")
        
        # Get user profile
        profile_response = supabase.table("profiles").select("*").eq("id", response.user.id).single().execute()
        
        return TokenResponse(
            access_token=response.session.access_token if response.session else "",
            user=UserProfile(**profile_response.data) if profile_response.data else None
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login user"""
    try:
        response = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })
        
        if response.user is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Get user profile
        profile_response = supabase.table("profiles").select("*").eq("id", response.user.id).single().execute()
        
        return TokenResponse(
            access_token=response.session.access_token,
            user=UserProfile(**profile_response.data) if profile_response.data else None
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials")


@router.post("/logout")
async def logout():
    """Logout user"""
    try:
        supabase.auth.sign_out()
        return {"message": "Logged out successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/me", response_model=UserProfile)
async def get_current_user(authorization: str = None):
    """Get current user profile"""
    try:
        # Get user from token
        user = supabase.auth.get_user()
        if user is None:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        # Get profile
        profile_response = supabase.table("profiles").select("*").eq("id", user.user.id).single().execute()
        
        if not profile_response.data:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        return UserProfile(**profile_response.data)
    except Exception as e:
        raise HTTPException(status_code=401, detail="Not authenticated")


@router.put("/me", response_model=UserProfile)
async def update_profile(profile_update: UserProfileUpdate):
    """Update current user profile"""
    try:
        user = supabase.auth.get_user()
        if user is None:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        # Update profile
        update_data = profile_update.model_dump(exclude_unset=True)
        response = supabase.table("profiles").update(update_data).eq("id", user.user.id).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to update profile")
        
        return UserProfile(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
