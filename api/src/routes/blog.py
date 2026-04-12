"""
Blog Routes - Public endpoints for reading blog posts
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from ..models.schemas import BlogPost
from ..utils.database import supabase
from ..utils.cache import get_cached, set_cached, invalidate_cache

router = APIRouter()


@router.get("", response_model=list[BlogPost])
async def get_blog_posts(
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
):
    """Get published blog posts ordered by pinned first, then display_order"""
    try:
        cache_key = f"blog:list:{page}:{limit}"
        cached = get_cached(cache_key, ttl=60)
        if cached:
            return [BlogPost(**p) for p in cached]

        response = supabase.table("blog_posts").select("*").eq(
            "is_published", True
        ).order(
            "is_pinned", desc=True
        ).order(
            "display_order", desc=False
        ).order(
            "created_at", desc=True
        ).range((page - 1) * limit, (page - 1) * limit + limit - 1).execute()

        posts = [BlogPost(**p) for p in response.data]
        set_cached(cache_key, [p.model_dump() for p in posts], ttl=60)
        return posts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{slug}", response_model=BlogPost)
async def get_blog_post(slug: str):
    """Get a single blog post by slug"""
    try:
        cache_key = f"blog:post:{slug}"
        cached = get_cached(cache_key, ttl=120)
        if cached:
            return BlogPost(**cached)

        response = supabase.table("blog_posts").select("*").eq(
            "slug", slug
        ).eq("is_published", True).execute()

        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=404, detail="Blog post not found")

        post = BlogPost(**response.data[0])
        set_cached(cache_key, post.model_dump(), ttl=120)
        return post
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
