"""
Reviews Routes - Public endpoints for product reviews
"""
from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from uuid import UUID
from ..models.schemas import Review, ReviewCreate, ReviewList
from ..utils.database import supabase

router = APIRouter()

ADVANCED_COLS = ["is_featured", "is_active", "sort_order", "is_approved"]


def _try_query(query_fn, fallback_fn=None):
    """Try a query, and if it fails due to unknown columns, run a fallback."""
    try:
        return query_fn()
    except Exception as e:
        err = str(e).lower()
        if fallback_fn and ("does not exist" in err or "pgrst" in err or "schema cache" in err):
            return fallback_fn()
        raise


@router.get("/migration-status")
async def get_migration_status():
    """Check if the product_reviews table has all required columns"""
    try:
        supabase.table("product_reviews").select("is_featured").limit(1).execute()
        return {"status": "ok", "has_advanced_columns": True, "message": "Reviews table is ready"}
    except Exception:
        return {
            "status": "migration_needed",
            "has_advanced_columns": False,
            "message": (
                "Please run 002b_reviews_fix.sql in Supabase SQL Editor, "
                "then go to Supabase Dashboard → Settings → API → click 'Reload' to refresh the schema cache."
            ),
        }


@router.get("/featured", response_model=ReviewList)
async def get_featured_reviews(limit: int = 6):
    """Get featured reviews for homepage display"""
    try:
        def _advanced():
            return supabase.table("product_reviews").select(
                "*, products(name, slug)"
            ).eq("is_featured", True).eq("is_approved", True).eq("is_active", True).order(
                "sort_order"
            ).order("created_at", desc=True).limit(limit).execute()

        def _basic():
            return supabase.table("product_reviews").select(
                "*, products(name, slug)"
            ).order("created_at", desc=True).limit(limit).execute()

        response = _try_query(_advanced, _basic)

        reviews = []
        for r in response.data:
            product_info = r.pop("products", None)
            review = Review(**r)
            if product_info:
                review.product_name = product_info.get("name")
                review.product_slug = product_info.get("slug")
            reviews.append(review)

        # Average rating
        def _avg_advanced():
            return supabase.table("product_reviews").select("rating").eq(
                "is_approved", True
            ).eq("is_active", True).execute()

        def _avg_basic():
            return supabase.table("product_reviews").select("rating").execute()

        avg_response = _try_query(_avg_advanced, _avg_basic)
        ratings = [r["rating"] for r in avg_response.data]
        avg_rating = sum(ratings) / len(ratings) if ratings else 0.0

        return ReviewList(reviews=reviews, total=len(reviews), average_rating=round(avg_rating, 1))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{product_id}", response_model=ReviewList)
async def get_product_reviews(
    product_id: UUID,
    include_unapproved: bool = False,
    page: int = 1,
    limit: int = 20,
):
    """Get reviews for a product"""
    try:
        offset = (page - 1) * limit

        def _advanced():
            q = supabase.table("product_reviews").select("*", count="exact").eq(
                "product_id", str(product_id)
            )
            if not include_unapproved:
                q = q.eq("is_approved", True).eq("is_active", True)
            return q.order("is_featured", desc=True).order("sort_order").order(
                "created_at", desc=True
            ).range(offset, offset + limit - 1).execute()

        def _basic():
            return supabase.table("product_reviews").select("*", count="exact").eq(
                "product_id", str(product_id)
            ).order("created_at", desc=True).range(offset, offset + limit - 1).execute()

        response = _try_query(_advanced, _basic)
        reviews = [Review(**r) for r in response.data]

        # Average rating
        def _avg_adv():
            return supabase.table("product_reviews").select("rating").eq(
                "product_id", str(product_id)
            ).eq("is_approved", True).eq("is_active", True).execute()

        def _avg_bas():
            return supabase.table("product_reviews").select("rating").eq(
                "product_id", str(product_id)
            ).execute()

        avg_response = _try_query(_avg_adv, _avg_bas)
        ratings = [r["rating"] for r in avg_response.data]
        avg_rating = sum(ratings) / len(ratings) if ratings else 0.0

        return ReviewList(
            reviews=reviews,
            total=response.count or 0,
            average_rating=round(avg_rating, 1),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=Review)
async def create_review(
    review: ReviewCreate,
    authorization: Optional[str] = Header(default=None),
):
    """Create a new review (can be anonymous or authenticated)"""
    try:
        review_data = review.model_dump()
        review_data["product_id"] = str(review_data["product_id"])

        # If user is authenticated, attach user_id and check if verified purchase
        if authorization and authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "")
            try:
                user_response = supabase.auth.get_user(token)
                if user_response and user_response.user:
                    user_id = user_response.user.id
                    review_data["user_id"] = user_id
                    orders_response = supabase.table("orders").select(
                        "id, order_items!inner(product_id)"
                    ).eq("user_id", user_id).eq(
                        "order_items.product_id", review_data["product_id"]
                    ).eq("status", "delivered").execute()
                    if orders_response.data:
                        review_data["is_verified_purchase"] = True
            except Exception:
                pass

        # Try inserting with advanced columns first, fallback to basic
        advanced_fields = {
            "is_verified_purchase": review_data.get("is_verified_purchase", False),
            "is_approved": False,
            "is_active": True,
            "is_featured": False,
            "sort_order": 0,
        }

        def _insert_advanced():
            return supabase.table("product_reviews").insert(
                {**review_data, **advanced_fields}
            ).execute()

        def _insert_basic():
            basic = {k: v for k, v in review_data.items() if k not in ADVANCED_COLS}
            return supabase.table("product_reviews").insert(basic).execute()

        response = _try_query(_insert_advanced, _insert_basic)

        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create review")

        return Review(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        if "violates foreign key" in error_msg.lower():
            error_msg = "Invalid product_id - product does not exist"
        raise HTTPException(status_code=500, detail=error_msg)


@router.get("/stats/{product_id}")
async def get_review_stats(product_id: UUID):
    """Get review statistics for a product"""
    try:
        def _adv():
            return supabase.table("product_reviews").select("rating").eq(
                "product_id", str(product_id)
            ).eq("is_approved", True).eq("is_active", True).execute()

        def _bas():
            return supabase.table("product_reviews").select("rating").eq(
                "product_id", str(product_id)
            ).execute()

        response = _try_query(_adv, _bas)
        ratings = [r["rating"] for r in response.data]
        total = len(ratings)

        if total == 0:
            return {"total_reviews": 0, "average_rating": 0, "rating_distribution": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}}

        distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for rating in ratings:
            distribution[rating] = distribution.get(rating, 0) + 1

        return {
            "total_reviews": total,
            "average_rating": round(sum(ratings) / total, 1),
            "rating_distribution": distribution,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
