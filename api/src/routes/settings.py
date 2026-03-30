"""
Site Settings Routes (Public)
"""
import asyncio
from fastapi import APIRouter, HTTPException
from ..models.schemas import (
    SiteSettings, NavigationItem, FooterItem, 
    HeroSection, Banner, HomepageSection, Product, Review
)
from ..utils.database import supabase
from ..utils.cache import get_cached, set_cached

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


@router.get("/homepage-data")
async def get_homepage_data():
    """
    Get all homepage data in a single request for faster page load.
    Fetches hero, products, and reviews in parallel.
    Cached for 60 seconds to improve performance.
    """
    try:
        # Check cache first (60 second TTL)
        cache_key = "settings:homepage-data"
        cached = get_cached(cache_key, ttl=60)
        if cached:
            return cached
        
        # Fetch all data in parallel using asyncio
        async def fetch_hero():
            try:
                response = supabase.table("hero_sections").select("*").eq(
                    "is_active", True
                ).order("display_order").execute()
                return [HeroSection(**h).model_dump() for h in response.data]
            except:
                return []
        
        async def fetch_products():
            try:
                response = supabase.table("products").select(
                    "*, product_images(*), product_variants(*), categories(name, slug)"
                ).eq("is_active", True).order("is_featured", desc=True).order("created_at", desc=True).limit(6).execute()
                products = []
                for p in response.data:
                    p["images"] = p.pop("product_images", [])
                    p["variants"] = p.pop("product_variants", [])
                    products.append(Product(**p).model_dump())
                return products
            except:
                return []
        
        async def fetch_reviews():
            try:
                # Try advanced columns first (featured/approved/active)
                response = supabase.table("product_reviews").select(
                    "*, products(name, slug)"
                ).eq("is_featured", True).eq("is_approved", True).eq("is_active", True).order(
                    "sort_order"
                ).limit(6).execute()
                return response.data
            except Exception:
                # Fallback: if advanced columns don't exist, return all reviews
                try:
                    response = supabase.table("product_reviews").select(
                        "*, products(name, slug)"
                    ).order("created_at", desc=True).limit(6).execute()
                    return response.data
                except Exception:
                    return []

        async def fetch_banners():
            try:
                response = supabase.table("banners").select("*").eq(
                    "is_active", True
                ).order("display_order").execute()
                return response.data
            except:
                return []

        # Run all fetches in parallel
        hero_task = asyncio.create_task(fetch_hero())
        products_task = asyncio.create_task(fetch_products())
        reviews_task = asyncio.create_task(fetch_reviews())
        banners_task = asyncio.create_task(fetch_banners())

        hero, products, reviews, banners = await asyncio.gather(
            hero_task, products_task, reviews_task, banners_task
        )

        result = {
            "hero": hero,
            "products": products,
            "reviews": reviews,
            "banners": banners
        }
        
        # Cache the result
        set_cached(cache_key, result)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
