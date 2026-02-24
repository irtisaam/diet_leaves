"""
Products Routes
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from uuid import UUID
from ..models.schemas import (
    Product, ProductList, ProductCreate, ProductUpdate,
    Category, CategoryCreate, Review, ReviewCreate
)
from ..utils.database import supabase

router = APIRouter()


# ===========================================
# PRODUCTS
# ===========================================

@router.get("", response_model=ProductList)
async def get_products(
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=100),
    category: Optional[str] = None,
    featured: Optional[bool] = None,
    on_sale: Optional[bool] = None,
    search: Optional[str] = None
):
    """Get all products with pagination and filters"""
    try:
        query = supabase.table("products").select("*, product_images(*), product_variants(*)").eq("is_active", True)
        
        if category:
            # Get category by slug
            cat_response = supabase.table("categories").select("id").eq("slug", category).single().execute()
            if cat_response.data:
                query = query.eq("category_id", cat_response.data["id"])
        
        if featured is not None:
            query = query.eq("is_featured", featured)
        
        if on_sale is not None:
            query = query.eq("is_on_sale", on_sale)
        
        if search:
            query = query.ilike("name", f"%{search}%")
        
        # Get total count
        count_response = supabase.table("products").select("id", count="exact").eq("is_active", True).execute()
        total = count_response.count or 0
        
        # Apply pagination
        offset = (page - 1) * limit
        query = query.range(offset, offset + limit - 1).order("created_at", desc=True)
        
        response = query.execute()
        
        products = []
        for p in response.data:
            p["images"] = p.pop("product_images", [])
            p["variants"] = p.pop("product_variants", [])
            products.append(Product(**p))
        
        return ProductList(products=products, total=total, page=page, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/featured", response_model=list[Product])
async def get_featured_products(limit: int = Query(6, ge=1, le=20)):
    """Get featured products for homepage"""
    try:
        response = supabase.table("products").select(
            "*, product_images(*), product_variants(*)"
        ).eq("is_active", True).eq("is_featured", True).limit(limit).execute()
        
        products = []
        for p in response.data:
            p["images"] = p.pop("product_images", [])
            p["variants"] = p.pop("product_variants", [])
            products.append(Product(**p))
        
        return products
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/on-sale", response_model=list[Product])
async def get_sale_products(limit: int = Query(6, ge=1, le=20)):
    """Get products on sale"""
    try:
        response = supabase.table("products").select(
            "*, product_images(*), product_variants(*)"
        ).eq("is_active", True).eq("is_on_sale", True).limit(limit).execute()
        
        products = []
        for p in response.data:
            p["images"] = p.pop("product_images", [])
            p["variants"] = p.pop("product_variants", [])
            products.append(Product(**p))
        
        return products
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{slug}", response_model=Product)
async def get_product(slug: str):
    """Get product by slug"""
    try:
        response = supabase.table("products").select(
            "*, product_images(*), product_variants(*)"
        ).eq("slug", slug).eq("is_active", True).single().execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Product not found")
        
        data = response.data
        data["images"] = data.pop("product_images", [])
        data["variants"] = data.pop("product_variants", [])
        
        return Product(**data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{product_id}/reviews", response_model=list[Review])
async def get_product_reviews(product_id: UUID):
    """Get reviews for a product"""
    try:
        response = supabase.table("product_reviews").select("*").eq(
            "product_id", str(product_id)
        ).eq("is_approved", True).order("created_at", desc=True).execute()
        
        return [Review(**r) for r in response.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{product_id}/reviews", response_model=Review)
async def create_review(product_id: UUID, review: ReviewCreate):
    """Create a product review"""
    try:
        review_data = review.model_dump()
        review_data["product_id"] = str(product_id)
        review_data["is_approved"] = False  # Requires admin approval
        
        response = supabase.table("product_reviews").insert(review_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create review")
        
        return Review(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===========================================
# CATEGORIES
# ===========================================

@router.get("/categories/all", response_model=list[Category])
async def get_categories():
    """Get all categories"""
    try:
        response = supabase.table("categories").select("*").eq(
            "is_active", True
        ).order("display_order").execute()
        
        return [Category(**c) for c in response.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/categories/{slug}", response_model=Category)
async def get_category(slug: str):
    """Get category by slug"""
    try:
        response = supabase.table("categories").select("*").eq(
            "slug", slug
        ).eq("is_active", True).single().execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Category not found")
        
        return Category(**response.data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
