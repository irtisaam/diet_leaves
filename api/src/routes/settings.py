"""
Site Settings Routes (Public)
"""
from fastapi import APIRouter, HTTPException
from ..models.schemas import (
    SiteSettings, NavigationItem, FooterItem, 
    HeroSection, Banner, HomepageSection
)
from ..utils.database import supabase

router = APIRouter()


@router.get("", response_model=SiteSettings)
async def get_site_settings():
    """Get all public site settings"""
    try:
        response = supabase.table("site_settings").select("*").execute()
        
        settings = {}
        for s in response.data:
            settings[s["setting_key"]] = s["setting_value"]
        
        return SiteSettings(settings=settings)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/navigation", response_model=list[NavigationItem])
async def get_navigation():
    """Get navigation items"""
    try:
        response = supabase.table("navigation_items").select("*").eq(
            "is_active", True
        ).order("display_order").execute()
        
        return [NavigationItem(**n) for n in response.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/footer", response_model=list[FooterItem])
async def get_footer():
    """Get footer items"""
    try:
        response = supabase.table("footer_items").select("*").eq(
            "is_active", True
        ).order("display_order").execute()
        
        return [FooterItem(**f) for f in response.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/hero", response_model=list[HeroSection])
async def get_hero_sections():
    """Get hero sections for homepage"""
    try:
        response = supabase.table("hero_sections").select("*").eq(
            "is_active", True
        ).order("display_order").execute()
        
        return [HeroSection(**h) for h in response.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/banners", response_model=list[Banner])
async def get_banners(position: str = "homepage"):
    """Get banners for a specific position"""
    try:
        response = supabase.table("banners").select("*").eq(
            "is_active", True
        ).eq("position", position).order("display_order").execute()
        
        return [Banner(**b) for b in response.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/homepage-sections", response_model=list[HomepageSection])
async def get_homepage_sections():
    """Get homepage sections configuration"""
    try:
        response = supabase.table("homepage_sections").select("*").eq(
            "is_active", True
        ).order("display_order").execute()
        
        return [HomepageSection(**s) for s in response.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
