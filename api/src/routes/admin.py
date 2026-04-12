"""
Admin Routes - Full CRUD for all entities
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Body
from typing import Optional, List
from uuid import UUID
from ..models.schemas import (
    # Products
    Product, ProductCreate, ProductUpdate, ProductList,
    Category, CategoryCreate,
    Review,
    # Orders
    Order, OrderUpdate, OrderList,
    # Site Settings
    SiteSetting, SiteSettingUpdate,
    # Hero
    HeroSection, HeroSectionCreate, HeroSectionUpdate,
    # Banners
    Banner, BannerCreate, BannerUpdate,
    # Navigation
    NavigationItem, NavigationItemCreate, NavigationItemUpdate,
    # Footer
    FooterItem, FooterItemCreate, FooterItemUpdate,
    # Homepage
    HomepageSection, HomepageSectionCreate, HomepageSectionUpdate,
    # Users
    UserProfile,
    # FAQ
    FAQ, FAQCreate, FAQUpdate, FAQReorderItem,
)
from ..utils.database import supabase
from ..services.storage import upload_image, delete_image, upload_multiple_images
from ..utils.cache import get_cached, set_cached, invalidate_cache

router = APIRouter()


def _try_query(query_fn, fallback_fn=None):
    """Try a query, and if it fails due to unknown columns/tables, run a fallback."""
    try:
        return query_fn()
    except Exception as e:
        err = str(e).lower()
        if fallback_fn and ("does not exist" in err or "pgrst" in err or "schema cache" in err):
            return fallback_fn()
        raise


# ===========================================
# IMAGE UPLOAD ENDPOINTS
# ===========================================

@router.post("/upload/image")
async def upload_single_image(
    file: UploadFile = File(...),
    folder: str = Form(default="products")
):
    """Upload a single image to Supabase Storage"""
    try:
        url = await upload_image(file, folder)
        return {"url": url, "success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload/images")
async def upload_images(
    files: List[UploadFile] = File(...),
    folder: str = Form(default="products")
):
    """Upload multiple images to Supabase Storage"""
    try:
        urls = await upload_multiple_images(files, folder)
        return {"urls": urls, "success": True, "count": len(urls)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/upload/image")
async def delete_uploaded_image(image_url: str):
    """Delete an image from Supabase Storage"""
    try:
        success = await delete_image(image_url)
        return {"success": success}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===========================================
# PRODUCTS MANAGEMENT
# ===========================================

@router.get("/products", response_model=ProductList)
async def admin_get_products(page: int = 1, limit: int = 20, include_inactive: bool = True):
    """Get all products (including inactive)"""
    try:
        query = supabase.table("products").select("*, product_images(*), product_variants(*)", count="exact")
        
        if not include_inactive:
            query = query.eq("is_active", True)
        
        offset = (page - 1) * limit
        response = query.range(offset, offset + limit - 1).order("created_at", desc=True).execute()
        
        products = []
        for p in response.data:
            p["images"] = p.pop("product_images", [])
            p["variants"] = p.pop("product_variants", [])
            products.append(Product(**p))
        
        return ProductList(products=products, total=response.count or 0, page=page, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/products/{product_id}", response_model=Product)
async def admin_get_product(product_id: UUID):
    """Get a single product by ID"""
    try:
        response = supabase.table("products").select(
            "*, product_images(*), product_variants(*)"
        ).eq("id", str(product_id)).single().execute()
        
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


@router.post("/products", response_model=Product)
async def admin_create_product(product: ProductCreate):
    """Create a new product"""
    try:
        # Prepare product data
        product_data = product.model_dump(exclude={"images", "variants"})
        if product_data.get("category_id"):
            product_data["category_id"] = str(product_data["category_id"])
        if product_data.get("nutritional_info"):
            product_data["nutritional_info"] = dict(product_data["nutritional_info"])
        
        # Convert Decimal to float
        product_data["price"] = float(product_data["price"])
        if product_data.get("compare_at_price"):
            product_data["compare_at_price"] = float(product_data["compare_at_price"])
        
        response = supabase.table("products").insert(product_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create product")
        
        product_id = response.data[0]["id"]
        
        # Add images
        if product.images:
            for img in product.images:
                img_data = img.model_dump()
                img_data["product_id"] = product_id
                supabase.table("product_images").insert(img_data).execute()
        
        # Add variants
        if product.variants:
            for var in product.variants:
                var_data = var.model_dump()
                var_data["product_id"] = product_id
                var_data["price"] = float(var_data["price"])
                if var_data.get("compare_at_price"):
                    var_data["compare_at_price"] = float(var_data["compare_at_price"])
                supabase.table("product_variants").insert(var_data).execute()
        
        # Return complete product
        complete = supabase.table("products").select(
            "*, product_images(*), product_variants(*)"
        ).eq("id", product_id).single().execute()
        
        data = complete.data
        data["images"] = data.pop("product_images", [])
        data["variants"] = data.pop("product_variants", [])
        
        return Product(**data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/products/{product_id}", response_model=Product)
async def admin_update_product(product_id: UUID, product: ProductUpdate):
    """Update a product"""
    try:
        update_data = product.model_dump(exclude_unset=True)
        
        if "category_id" in update_data and update_data["category_id"]:
            update_data["category_id"] = str(update_data["category_id"])
        if "price" in update_data:
            update_data["price"] = float(update_data["price"])
        if "compare_at_price" in update_data and update_data["compare_at_price"]:
            update_data["compare_at_price"] = float(update_data["compare_at_price"])
        if "nutritional_info" in update_data and update_data["nutritional_info"]:
            update_data["nutritional_info"] = dict(update_data["nutritional_info"])
        
        response = supabase.table("products").update(update_data).eq(
            "id", str(product_id)
        ).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Return complete product
        complete = supabase.table("products").select(
            "*, product_images(*), product_variants(*)"
        ).eq("id", str(product_id)).single().execute()
        
        data = complete.data
        data["images"] = data.pop("product_images", [])
        data["variants"] = data.pop("product_variants", [])
        
        return Product(**data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/products/{product_id}")
async def admin_delete_product(product_id: UUID):
    """Delete a product"""
    try:
        # First get product images to delete from storage
        images_response = supabase.table("product_images").select("image_url").eq(
            "product_id", str(product_id)
        ).execute()
        
        # Delete images from storage
        for img in images_response.data:
            await delete_image(img["image_url"])
        
        # Delete product (cascades to images and variants)
        supabase.table("products").delete().eq("id", str(product_id)).execute()
        return {"message": "Product deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===========================================
# PRODUCT IMAGES MANAGEMENT
# ===========================================

@router.post("/products/{product_id}/images")
async def add_product_image(
    product_id: UUID,
    body: dict = Body(...)
):
    """Add an image to a product"""
    try:
        image_url = body.get("image_url")
        alt_text = body.get("alt_text")
        is_primary = body.get("is_primary", False)
        display_order = body.get("display_order", 0)
        
        if not image_url:
            raise HTTPException(status_code=400, detail="image_url is required")
        
        # If setting as primary, unset other primary images
        if is_primary:
            supabase.table("product_images").update({"is_primary": False}).eq(
                "product_id", str(product_id)
            ).execute()
        
        image_data = {
            "product_id": str(product_id),
            "image_url": image_url,
            "alt_text": alt_text,
            "is_primary": is_primary,
            "display_order": display_order
        }
        
        response = supabase.table("product_images").insert(image_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to add image")
        
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/products/{product_id}/images/{image_id}")
async def delete_product_image(product_id: UUID, image_id: UUID):
    """Delete a product image"""
    try:
        # Get image URL first
        img_response = supabase.table("product_images").select("image_url").eq(
            "id", str(image_id)
        ).single().execute()
        
        if img_response.data:
            # Delete from storage
            await delete_image(img_response.data["image_url"])
            
            # Delete from database
            supabase.table("product_images").delete().eq("id", str(image_id)).execute()
        
        return {"message": "Image deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/products/{product_id}/images/{image_id}/primary")
async def set_primary_image(product_id: UUID, image_id: UUID):
    """Set an image as primary for a product"""
    try:
        # Unset all primary
        supabase.table("product_images").update({"is_primary": False}).eq(
            "product_id", str(product_id)
        ).execute()
        
        # Set this one as primary
        supabase.table("product_images").update({"is_primary": True}).eq(
            "id", str(image_id)
        ).execute()
        
        return {"message": "Primary image updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===========================================
# CATEGORIES MANAGEMENT
# ===========================================

@router.get("/categories", response_model=list[Category])
async def admin_get_categories():
    """Get all categories"""
    try:
        response = supabase.table("categories").select("*").order("display_order").execute()
        return [Category(**c) for c in response.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/categories", response_model=Category)
async def admin_create_category(category: CategoryCreate):
    """Create a category"""
    try:
        response = supabase.table("categories").insert(category.model_dump()).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create category")
        return Category(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/categories/{category_id}", response_model=Category)
async def admin_update_category(category_id: UUID, category: CategoryCreate):
    """Update a category"""
    try:
        response = supabase.table("categories").update(category.model_dump()).eq(
            "id", str(category_id)
        ).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Category not found")
        return Category(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/categories/{category_id}")
async def admin_delete_category(category_id: UUID):
    """Delete a category"""
    try:
        supabase.table("categories").delete().eq("id", str(category_id)).execute()
        return {"message": "Category deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===========================================
# ORDERS MANAGEMENT
# ===========================================

@router.get("/orders", response_model=OrderList)
async def admin_get_orders(
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 20
):
    """Get all orders"""
    try:
        query = supabase.table("orders").select("*, order_items(*)", count="exact")
        
        if status:
            query = query.eq("status", status)
        
        offset = (page - 1) * limit
        response = query.range(offset, offset + limit - 1).order("created_at", desc=True).execute()
        
        orders = []
        for o in response.data:
            o["items"] = o.pop("order_items", [])
            orders.append(Order(**o))
        
        return OrderList(orders=orders, total=response.count or 0)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/orders/{order_id}", response_model=Order)
async def admin_get_order(order_id: UUID):
    """Get single order details"""
    try:
        response = supabase.table("orders").select(
            "*, order_items(*, products(name, slug, price, images:product_images(image_url, is_primary)))"
        ).eq("id", str(order_id)).single().execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Order not found")
        
        data = response.data
        items = data.pop("order_items", [])
        # Attach product info to items
        for item in items:
            product = item.pop("products", None)
            if product:
                item["product"] = product
        data["items"] = items
        
        return Order(**data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _deduct_inventory_for_order(order_id: str):
    """Deduct inventory batches (FIFO by expiry) when order moves to shipping.
    Allows stock to go negative — order is never halted.
    Logs every deduction to order_inventory_deductions for future reversal.
    Guards against double-deduction if the order is somehow re-set to shipping.
    """
    try:
        # Guard: skip if this order was already deducted (table may not exist yet — that's OK)
        try:
            existing = supabase.table("order_inventory_deductions").select("id").eq(
                "order_id", order_id
            ).eq("is_reversed", False).limit(1).execute()
            if existing.data:
                return  # Already deducted for this order
        except Exception:
            pass  # Table not created yet — proceed anyway

        # Get order items
        oi_resp = supabase.table("order_items").select("product_id, quantity").eq(
            "order_id", order_id
        ).execute()
        if not oi_resp.data:
            return

        product_ids = list({item["product_id"] for item in oi_resp.data})

        # Get inventory mappings for these products
        mappings_resp = supabase.table("product_inventory_items").select(
            "product_id, inventory_item_id, quantity_per_unit"
        ).in_("product_id", product_ids).execute()
        if not mappings_resp.data:
            return

        # Build product_id -> list of (inventory_item_id, qty_per_unit)
        prod_map: dict = {}
        for m in mappings_resp.data:
            prod_map.setdefault(m["product_id"], []).append(m)

        # Collect all inventory_item_ids that need deduction
        deductions: dict = {}  # inventory_item_id -> total qty to deduct
        for oi in oi_resp.data:
            pid = oi["product_id"]
            order_qty = int(oi["quantity"])
            for mapping in prod_map.get(pid, []):
                inv_id = mapping["inventory_item_id"]
                qty_needed = float(mapping["quantity_per_unit"]) * order_qty
                deductions[inv_id] = deductions.get(inv_id, 0) + qty_needed

        # Deduct from batches FIFO (oldest expiry first)
        for inv_item_id, total_to_deduct in deductions.items():
            remaining = total_to_deduct

            # Get active batches ordered by expiry (nulls last — use created_at as tiebreaker)
            batches_resp = supabase.table("inventory_batches").select("id, quantity").eq(
                "inventory_item_id", inv_item_id
            ).eq("is_active", True).order("expiry_date", desc=False).order("created_at", desc=False).execute()

            for batch in (batches_resp.data or []):
                if remaining <= 0:
                    break
                batch_qty = float(batch["quantity"])
                if batch_qty <= 0:
                    continue
                deduct = min(batch_qty, remaining)
                new_qty = batch_qty - deduct
                update_data_b: dict = {"quantity": new_qty}
                if new_qty <= 0:
                    update_data_b["is_active"] = False
                supabase.table("inventory_batches").update(update_data_b).eq(
                    "id", batch["id"]
                ).execute()
                remaining -= deduct

            # Recalculate quantity_available from active batches
            sync_resp = supabase.table("inventory_batches").select("quantity").eq(
                "inventory_item_id", inv_item_id
            ).eq("is_active", True).execute()
            new_total = sum(float(b.get("quantity", 0)) for b in (sync_resp.data or []))

            # If remaining > 0, stock is insufficient — allow negative (don't halt order)
            if remaining > 0:
                new_total -= remaining  # goes negative

            supabase.table("inventory_items").update(
                {"quantity_available": new_total}
            ).eq("id", inv_item_id).execute()

            # Log the deduction for future reversal (upsert by order+item)
            supabase.table("order_inventory_deductions").insert({
                "order_id": order_id,
                "inventory_item_id": inv_item_id,
                "quantity_deducted": total_to_deduct,
            }).execute()

    except Exception:
        # Never fail the order update due to inventory issues
        pass


def _restore_inventory_for_order(order_id: str):
    """Restore inventory quantities when an order that was already shipped
    gets cancelled or refunded. Reads the deduction log and adds back the quantities.
    """
    try:
        from datetime import datetime, timezone
        # Find non-reversed deductions for this order
        ded_resp = supabase.table("order_inventory_deductions").select(
            "id, inventory_item_id, quantity_deducted"
        ).eq("order_id", order_id).eq("is_reversed", False).execute()

        if not ded_resp.data:
            return  # Nothing was deducted or already reversed

        now_iso = datetime.now(timezone.utc).isoformat()

        for ded in ded_resp.data:
            inv_id = ded["inventory_item_id"]
            qty_to_restore = float(ded["quantity_deducted"])

            # Fetch current quantity_available
            item_resp = supabase.table("inventory_items").select(
                "quantity_available"
            ).eq("id", inv_id).single().execute()

            if item_resp.data:
                current_qty = float(item_resp.data.get("quantity_available", 0))
                supabase.table("inventory_items").update({
                    "quantity_available": current_qty + qty_to_restore
                }).eq("id", inv_id).execute()

            # Mark deduction as reversed
            supabase.table("order_inventory_deductions").update({
                "is_reversed": True,
                "reversed_at": now_iso,
            }).eq("id", ded["id"]).execute()

    except Exception:
        # Never fail the order update due to inventory restore issues
        pass


@router.put("/orders/{order_id}", response_model=Order)
async def admin_update_order(order_id: UUID, order: OrderUpdate):
    """Update order status.
    - Status → 'shipping': auto-deducts inventory (FIFO, allows negative stock).
    - Status → 'cancelled'/'refunded': restores inventory IF order was already shipped.
    """
    try:
        update_data = order.model_dump(exclude_unset=True)
        new_status = update_data.get("status")

        # Always fetch old status when status is changing — needed for both deduction and restore
        old_status = None
        if new_status:
            old_resp = supabase.table("orders").select("status").eq(
                "id", str(order_id)
            ).single().execute()
            if old_resp.data:
                old_status = old_resp.data.get("status")

        response = supabase.table("orders").update(update_data).eq(
            "id", str(order_id)
        ).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Order not found")

        # Statuses that mean inventory was already deducted
        _DEDUCTED_STATUSES = {"shipping", "shipped", "delivered", "completed"}

        # Deduct inventory when transitioning TO 'shipping' (only once)
        if new_status == "shipping" and old_status and old_status != "shipping":
            _deduct_inventory_for_order(str(order_id))

        # Restore inventory when cancelling/refunding an order that was already shipped
        elif new_status in ("cancelled", "refunded") and old_status in _DEDUCTED_STATUSES:
            _restore_inventory_for_order(str(order_id))

        # Get complete order with items
        complete = supabase.table("orders").select("*, order_items(*)").eq(
            "id", str(order_id)
        ).single().execute()

        data = complete.data
        data["items"] = data.pop("order_items", [])

        return Order(**data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===========================================
# REVIEWS MANAGEMENT
# ===========================================

@router.get("/reviews")
async def admin_get_reviews(
    approved: Optional[bool] = None,
    active: Optional[bool] = None,
    featured: Optional[bool] = None,
    product_id: Optional[str] = None,
    page: int = 1,
    limit: int = 20
):
    """Get all reviews with filtering and pagination"""
    try:
        offset = (page - 1) * limit

        def _advanced():
            query = supabase.table("product_reviews").select(
                "*, products(name, slug)", count="exact"
            )
            if approved is not None:
                query = query.eq("is_approved", approved)
            if active is not None:
                query = query.eq("is_active", active)
            if featured is not None:
                query = query.eq("is_featured", featured)
            if product_id:
                query = query.eq("product_id", product_id)
            return query.order("is_featured", desc=True).order("sort_order").order(
                "created_at", desc=True
            ).range(offset, offset + limit - 1).execute()

        def _basic():
            query = supabase.table("product_reviews").select(
                "*, products(name, slug)", count="exact"
            )
            if product_id:
                query = query.eq("product_id", product_id)
            return query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()

        response = _try_query(_advanced, _basic)

        reviews = []
        for r in response.data:
            product = r.pop("products", None)
            r["product_name"] = product["name"] if product else None
            r["product_slug"] = product["slug"] if product else None
            # Ensure advanced fields have defaults for frontend
            r.setdefault("is_approved", True)
            r.setdefault("is_active", True)
            r.setdefault("is_featured", False)
            r.setdefault("sort_order", 0)
            reviews.append(r)
        
        return {"reviews": reviews, "total": response.count or len(reviews), "page": page, "limit": limit}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/reviews/bulk-update")
async def admin_bulk_update_reviews(body: dict = Body(...)):
    """Bulk update multiple reviews"""
    try:
        review_ids = body.get("review_ids", [])
        update_data = body.get("update_data", {})
        
        allowed_fields = ["is_approved", "is_active", "is_featured"]
        filtered_data = {k: v for k, v in update_data.items() if k in allowed_fields}
        
        if not filtered_data:
            raise HTTPException(status_code=400, detail="No valid fields to update")
        
        updated = []
        for rid in review_ids:
            try:
                response = supabase.table("product_reviews").update(filtered_data).eq(
                    "id", rid
                ).execute()
                if response.data:
                    updated.append(response.data[0])
            except Exception:
                # Column may not exist yet — skip silently
                pass
        
        return {"message": f"Updated {len(updated)} reviews", "count": len(updated)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reviews/{review_id}")
async def admin_get_review(review_id: UUID):
    """Get single review details"""
    try:
        response = supabase.table("product_reviews").select(
            "*, products(name, slug)"
        ).eq("id", str(review_id)).single().execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Review not found")
        
        data = response.data
        product = data.pop("products", None)
        data["product_name"] = product["name"] if product else None
        data["product_slug"] = product["slug"] if product else None
        data.setdefault("is_approved", True)
        data.setdefault("is_active", True)
        data.setdefault("is_featured", False)
        data.setdefault("sort_order", 0)
        
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/reviews/{review_id}")
async def admin_update_review(review_id: UUID, update_data: dict):
    """Update a review (approve, feature, set sort order, activate/deactivate)"""
    try:
        # Only allow specific fields to be updated
        allowed_fields = ["is_approved", "is_active", "is_featured", "sort_order"]
        filtered_data = {k: v for k, v in update_data.items() if k in allowed_fields}
        
        if not filtered_data:
            raise HTTPException(status_code=400, detail="No valid fields to update")
        
        def _advanced():
            return supabase.table("product_reviews").update(filtered_data).eq(
                "id", str(review_id)
            ).execute()

        def _fallback():
            # If advanced columns don't exist, skip them
            return supabase.table("product_reviews").select("*").eq(
                "id", str(review_id)
            ).execute()

        response = _try_query(_advanced, _fallback)
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Review not found")
        
        result = response.data[0]
        result.setdefault("is_approved", True)
        result.setdefault("is_active", True)
        result.setdefault("is_featured", False)
        result.setdefault("sort_order", 0)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/reviews/{review_id}/approve")
async def admin_approve_review(review_id: UUID):
    """Approve a review"""
    try:
        def _do():
            return supabase.table("product_reviews").update({
                "is_approved": True
            }).eq("id", str(review_id)).execute()
        def _fallback():
            return supabase.table("product_reviews").select("*").eq("id", str(review_id)).execute()
        response = _try_query(_do, _fallback)
        if not response.data:
            raise HTTPException(status_code=404, detail="Review not found")
        return {"message": "Review approved", "review": response.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/reviews/{review_id}/reject")
async def admin_reject_review(review_id: UUID):
    """Reject/unapprove a review"""
    try:
        def _do():
            return supabase.table("product_reviews").update({
                "is_approved": False
            }).eq("id", str(review_id)).execute()
        def _fallback():
            return supabase.table("product_reviews").select("*").eq("id", str(review_id)).execute()
        response = _try_query(_do, _fallback)
        if not response.data:
            raise HTTPException(status_code=404, detail="Review not found")
        return {"message": "Review rejected", "review": response.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/reviews/{review_id}/feature")
async def admin_feature_review(review_id: UUID, featured: bool = True):
    """Feature/unfeature a review (pinned to top)"""
    try:
        def _do():
            return supabase.table("product_reviews").update({
                "is_featured": featured
            }).eq("id", str(review_id)).execute()
        def _fallback():
            return supabase.table("product_reviews").select("*").eq("id", str(review_id)).execute()
        response = _try_query(_do, _fallback)
        if not response.data:
            raise HTTPException(status_code=404, detail="Review not found")
        return {"message": f"Review {'featured' if featured else 'unfeatured'}", "review": response.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/reviews/{review_id}/toggle-active")
async def admin_toggle_review_active(review_id: UUID):
    """Toggle review active status (show/hide on website)"""
    try:
        def _do():
            current = supabase.table("product_reviews").select("is_active").eq(
                "id", str(review_id)
            ).single().execute()
            if not current.data:
                raise HTTPException(status_code=404, detail="Review not found")
            new_state = not current.data["is_active"]
            return supabase.table("product_reviews").update({
                "is_active": new_state
            }).eq("id", str(review_id)).execute()
        def _fallback():
            return supabase.table("product_reviews").select("*").eq("id", str(review_id)).execute()
        response = _try_query(_do, _fallback)
        if not response.data:
            raise HTTPException(status_code=404, detail="Review not found")
        result = response.data[0]
        return {"message": f"Review {'activated' if result.get('is_active', True) else 'deactivated'}", "review": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/reviews/{review_id}")
async def admin_delete_review(review_id: UUID):
    """Delete a review"""
    try:
        supabase.table("product_reviews").delete().eq("id", str(review_id)).execute()
        return {"message": "Review deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===========================================
# SITE SETTINGS MANAGEMENT
# ===========================================

@router.get("/settings", response_model=list[SiteSetting])
async def admin_get_settings():
    """Get all site settings"""
    try:
        response = supabase.table("site_settings").select("*").execute()
        return [SiteSetting(**s) for s in response.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/settings/{setting_key}", response_model=SiteSetting)
async def admin_update_setting(setting_key: str, setting: SiteSettingUpdate):
    """Update a site setting"""
    try:
        response = supabase.table("site_settings").update({
            "setting_value": setting.setting_value
        }).eq("setting_key", setting_key).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Setting not found")
        
        # Invalidate homepage-data cache so announcement bar and settings update immediately
        invalidate_cache("settings:")
        
        return SiteSetting(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===========================================
# HERO SECTIONS MANAGEMENT
# ===========================================

@router.get("/hero", response_model=list[HeroSection])
async def admin_get_hero_sections():
    """Get all hero sections"""
    try:
        response = supabase.table("hero_sections").select("*").order("display_order").execute()
        return [HeroSection(**h) for h in response.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/hero", response_model=HeroSection)
async def admin_create_hero_section(hero: HeroSectionCreate):
    """Create a hero section"""
    try:
        response = supabase.table("hero_sections").insert(hero.model_dump()).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create hero section")
        invalidate_cache("settings:")
        return HeroSection(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/hero/{hero_id}", response_model=HeroSection)
async def admin_update_hero_section(hero_id: UUID, hero: HeroSectionUpdate):
    """Update a hero section"""
    try:
        update_data = hero.model_dump(exclude_none=True)
        
        # Handle is_active explicitly since it might be False
        if hero.is_active is not None:
            update_data["is_active"] = hero.is_active
        
        response = supabase.table("hero_sections").update(update_data).eq(
            "id", str(hero_id)
        ).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Hero section not found")
        invalidate_cache("settings:")
        return HeroSection(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/hero/{hero_id}")
async def admin_delete_hero_section(hero_id: UUID):
    """Delete a hero section"""
    try:
        supabase.table("hero_sections").delete().eq("id", str(hero_id)).execute()
        invalidate_cache("settings:")
        return {"message": "Hero section deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===========================================
# BANNERS MANAGEMENT
# ===========================================

@router.get("/banners", response_model=list[Banner])
async def admin_get_banners():
    """Get all banners"""
    try:
        response = supabase.table("banners").select("*").order("display_order").execute()
        return [Banner(**b) for b in response.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/banners", response_model=Banner)
async def admin_create_banner(banner: BannerCreate):
    """Create a banner"""
    try:
        response = supabase.table("banners").insert(banner.model_dump()).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create banner")
        invalidate_cache("settings:")
        return Banner(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/banners/{banner_id}", response_model=Banner)
async def admin_update_banner(banner_id: UUID, banner: BannerUpdate):
    """Update a banner"""
    try:
        update_data = banner.model_dump(exclude_none=True)
        
        # Handle is_active explicitly since it might be False
        if banner.is_active is not None:
            update_data["is_active"] = banner.is_active
        
        response = supabase.table("banners").update(update_data).eq(
            "id", str(banner_id)
        ).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Banner not found")
        invalidate_cache("settings:")
        return Banner(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/banners/{banner_id}")
async def admin_delete_banner(banner_id: UUID):
    """Delete a banner"""
    try:
        supabase.table("banners").delete().eq("id", str(banner_id)).execute()
        invalidate_cache("settings:")
        return {"message": "Banner deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===========================================
# NAVIGATION MANAGEMENT
# ===========================================

@router.get("/navigation", response_model=list[NavigationItem])
async def admin_get_navigation():
    """Get all navigation items"""
    try:
        response = supabase.table("navigation_items").select("*").order("display_order").execute()
        return [NavigationItem(**n) for n in response.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/navigation", response_model=NavigationItem)
async def admin_create_navigation_item(nav: NavigationItemCreate):
    """Create a navigation item"""
    try:
        nav_data = nav.model_dump()
        if nav_data.get("parent_id"):
            nav_data["parent_id"] = str(nav_data["parent_id"])
        
        response = supabase.table("navigation_items").insert(nav_data).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create navigation item")
        invalidate_cache("settings:")
        return NavigationItem(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/navigation/{nav_id}", response_model=NavigationItem)
async def admin_update_navigation_item(nav_id: UUID, nav: NavigationItemUpdate):
    """Update a navigation item"""
    try:
        # Use exclude_none to allow explicit false values for is_active
        update_data = nav.model_dump(exclude_none=True)
        
        # Handle is_active explicitly since it might be False
        if nav.is_active is not None:
            update_data["is_active"] = nav.is_active
        
        if "parent_id" in update_data and update_data["parent_id"]:
            update_data["parent_id"] = str(update_data["parent_id"])
        
        response = supabase.table("navigation_items").update(update_data).eq(
            "id", str(nav_id)
        ).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Navigation item not found")
        invalidate_cache("settings:")
        return NavigationItem(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/navigation/{nav_id}")
async def admin_delete_navigation_item(nav_id: UUID):
    """Delete a navigation item"""
    try:
        supabase.table("navigation_items").delete().eq("id", str(nav_id)).execute()
        invalidate_cache("settings:")
        return {"message": "Navigation item deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===========================================
# FOOTER MANAGEMENT
# ===========================================

@router.get("/footer", response_model=list[FooterItem])
async def admin_get_footer():
    """Get all footer items"""
    try:
        response = supabase.table("footer_items").select("*").order("display_order").execute()
        return [FooterItem(**f) for f in response.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/footer", response_model=FooterItem)
async def admin_create_footer_item(footer: FooterItemCreate):
    """Create a footer item"""
    try:
        response = supabase.table("footer_items").insert(footer.model_dump()).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create footer item")
        return FooterItem(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/footer/{footer_id}", response_model=FooterItem)
async def admin_update_footer_item(footer_id: UUID, footer: FooterItemUpdate):
    """Update a footer item"""
    try:
        update_data = footer.model_dump(exclude_none=True)
        
        # Handle is_active explicitly since it might be False
        if footer.is_active is not None:
            update_data["is_active"] = footer.is_active
        
        response = supabase.table("footer_items").update(update_data).eq(
            "id", str(footer_id)
        ).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Footer item not found")
        return FooterItem(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/footer/{footer_id}")
async def admin_delete_footer_item(footer_id: UUID):
    """Delete a footer item"""
    try:
        supabase.table("footer_items").delete().eq("id", str(footer_id)).execute()
        return {"message": "Footer item deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===========================================
# HOMEPAGE SECTIONS MANAGEMENT
# ===========================================

@router.get("/homepage-sections", response_model=list[HomepageSection])
async def admin_get_homepage_sections():
    """Get all homepage sections"""
    try:
        response = supabase.table("homepage_sections").select("*").order("display_order").execute()
        return [HomepageSection(**s) for s in response.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/homepage-sections", response_model=HomepageSection)
async def admin_create_homepage_section(section: HomepageSectionCreate):
    """Create a homepage section"""
    try:
        response = supabase.table("homepage_sections").insert(section.model_dump()).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create section")
        return HomepageSection(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/homepage-sections/{section_id}", response_model=HomepageSection)
async def admin_update_homepage_section(section_id: UUID, section: HomepageSectionUpdate):
    """Update a homepage section"""
    try:
        response = supabase.table("homepage_sections").update(
            section.model_dump(exclude_unset=True)
        ).eq("id", str(section_id)).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Section not found")
        return HomepageSection(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/homepage-sections/{section_id}")
async def admin_delete_homepage_section(section_id: UUID):
    """Delete a homepage section"""
    try:
        supabase.table("homepage_sections").delete().eq("id", str(section_id)).execute()
        return {"message": "Section deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===========================================
# USERS MANAGEMENT
# ===========================================

@router.get("/users")
async def admin_get_users():
    """Get all users"""
    try:
        response = supabase.table("profiles").select("*").order("created_at", desc=True).execute()
        users = [UserProfile(**u).model_dump() for u in response.data]
        return {"users": users, "total": len(users)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/users/{user_id}/admin")
async def admin_toggle_admin(user_id: UUID, is_admin: bool = True):
    """Toggle admin status for a user"""
    try:
        supabase.table("profiles").update({"is_admin": is_admin}).eq(
            "id", str(user_id)
        ).execute()
        return {"message": f"Admin status set to {is_admin}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===========================================
# DASHBOARD STATS
# ===========================================

@router.get("/dashboard")
async def admin_dashboard():
    """Get comprehensive dashboard statistics for e-commerce analytics."""
    from datetime import datetime, timedelta
    from ..utils.cache import get_cached, set_cached

    # Cache dashboard for 30 seconds to avoid hammering DB
    cached = get_cached("dashboard_stats", ttl=30)
    if cached is not None:
        return cached
    try:
        # ── Orders ──
        orders_resp = supabase.table("orders").select(
            "id, total, status, created_at, payment_status"
        ).execute()
        all_orders = orders_resp.data or []

        total_orders = len(all_orders)
        total_revenue = sum(float(o.get("total", 0)) for o in all_orders)

        # Orders by status
        status_counts: dict = {}
        for o in all_orders:
            s = o.get("status", "unknown")
            status_counts[s] = status_counts.get(s, 0) + 1

        # Average order value
        avg_order_value = round(total_revenue / total_orders, 2) if total_orders else 0

        # ── Time-based revenue ──
        now = datetime.utcnow()

        def _month_key(d_str):
            try:
                dt = datetime.fromisoformat(d_str.replace("Z", "+00:00"))
                return dt.strftime("%Y-%m")
            except Exception:
                return None

        def _week_key(d_str):
            try:
                dt = datetime.fromisoformat(d_str.replace("Z", "+00:00"))
                # ISO week: Monday start
                return dt.strftime("%Y-W%V")
            except Exception:
                return None

        # Monthly revenue (last 12 months)
        monthly_revenue: dict = {}
        monthly_orders: dict = {}
        for o in all_orders:
            mk = _month_key(o.get("created_at", ""))
            if mk:
                monthly_revenue[mk] = monthly_revenue.get(mk, 0) + float(o.get("total", 0))
                monthly_orders[mk] = monthly_orders.get(mk, 0) + 1

        # Generate last 12 months
        monthly_data = []
        for i in range(11, -1, -1):
            d = now - timedelta(days=i * 30)
            key = d.strftime("%Y-%m")
            monthly_data.append({
                "month": key,
                "label": d.strftime("%b %Y"),
                "revenue": round(monthly_revenue.get(key, 0), 2),
                "orders": monthly_orders.get(key, 0),
            })

        # Weekly revenue (last 8 weeks)
        weekly_revenue: dict = {}
        weekly_orders: dict = {}
        for o in all_orders:
            wk = _week_key(o.get("created_at", ""))
            if wk:
                weekly_revenue[wk] = weekly_revenue.get(wk, 0) + float(o.get("total", 0))
                weekly_orders[wk] = weekly_orders.get(wk, 0) + 1

        weekly_data = []
        for i in range(7, -1, -1):
            d = now - timedelta(weeks=i)
            key = d.strftime("%Y-W%V")
            weekly_data.append({
                "week": key,
                "label": f"Week {d.strftime('%V')}",
                "revenue": round(weekly_revenue.get(key, 0), 2),
                "orders": weekly_orders.get(key, 0),
            })

        # Today's stats
        today_str = now.strftime("%Y-%m-%d")
        today_orders = [o for o in all_orders if (o.get("created_at") or "")[:10] == today_str]
        today_revenue = sum(float(o.get("total", 0)) for o in today_orders)

        # This month stats
        this_month_key = now.strftime("%Y-%m")
        this_month_revenue = monthly_revenue.get(this_month_key, 0)
        this_month_orders = monthly_orders.get(this_month_key, 0)

        # ── Products ──
        products_resp = supabase.table("products").select(
            "id, name, slug, price, is_active", count="exact"
        ).execute()
        all_products = products_resp.data or []

        # ── Users ──
        users_resp = supabase.table("profiles").select("id, created_at", count="exact").execute()
        all_users = users_resp.data or []
        # New users this month
        new_users_month = len([u for u in all_users if (u.get("created_at") or "")[:7] == this_month_key])

        # ── Reviews ──
        try:
            pending_reviews_resp = supabase.table("product_reviews").select(
                "id", count="exact"
            ).eq("is_approved", False).execute()
            pending_reviews = pending_reviews_resp.count or 0
        except Exception:
            pending_reviews = 0

        # ── Product Analytics with cost/profit ──
        product_analytics = []
        total_cost = 0.0
        total_profit = 0.0
        analytics_available = False
        sold_map: dict = {}

        try:
            # Build product cost map
            mappings_resp = supabase.table("product_inventory_items").select(
                "product_id, quantity_per_unit, inventory_item_id"
            ).execute()
            items_resp = supabase.table("inventory_items").select("id, unit_cost").execute()
            item_cost_map = {i["id"]: float(i.get("unit_cost") or 0) for i in items_resp.data}

            product_cost_map: dict = {}
            for m in mappings_resp.data:
                pid = m["product_id"]
                item_unit_cost = item_cost_map.get(m["inventory_item_id"], 0)
                qty_per_unit = float(m.get("quantity_per_unit") or 1)
                product_cost_map[pid] = product_cost_map.get(pid, 0.0) + item_unit_cost * qty_per_unit

            # Sold quantities from order_items
            try:
                oi_resp = supabase.table("order_items").select(
                    "product_id, quantity, unit_price"
                ).execute()
                for oi in oi_resp.data:
                    pid = oi.get("product_id")
                    if pid:
                        entry = sold_map.setdefault(pid, {"units": 0, "revenue": 0.0})
                        qty = int(oi.get("quantity") or 0)
                        entry["units"] += qty
                        entry["revenue"] += float(oi.get("unit_price") or 0) * qty
            except Exception:
                pass

            for p in all_products:
                pid = p["id"]
                cost = round(product_cost_map.get(pid, 0.0), 2)
                price = float(p.get("price") or 0)
                margin = round(price - cost, 2)
                sold = sold_map.get(pid, {})
                units_sold = sold.get("units", 0)
                revenue = sold.get("revenue", 0.0)
                profit = round(margin * units_sold, 2)
                total_cost += cost * units_sold
                total_profit += profit
                product_analytics.append({
                    "id": pid,
                    "name": p["name"],
                    "slug": p.get("slug"),
                    "image": None,
                    "price": price,
                    "cost": cost,
                    "margin": margin,
                    "units_sold": units_sold,
                    "revenue": round(revenue, 2),
                    "profit": profit,
                })
            analytics_available = True
        except Exception:
            pass

        # Top 5 and bottom 5 products by units sold
        sorted_by_units = sorted(product_analytics, key=lambda x: x["units_sold"], reverse=True)
        top_products = sorted_by_units[:5]
        # Bottom = least sold but still active (exclude zero unless all are zero)
        active_sold = [p for p in sorted_by_units if p["units_sold"] > 0]
        least_products = list(reversed(active_sold[-5:])) if active_sold else sorted_by_units[:5]

        # Top 5 by revenue
        top_by_revenue = sorted(product_analytics, key=lambda x: x["revenue"], reverse=True)[:5]

        # ── Inventory summary ──
        inv_summary = {"total_items": 0, "low_stock": 0, "expired": 0, "stock_value": 0}
        try:
            inv_resp = supabase.table("inventory_items").select(
                "quantity_available, unit_cost, min_stock_level, expiry_date"
            ).eq("is_active", True).execute()
            inv_items = inv_resp.data or []
            inv_summary["total_items"] = len(inv_items)
            inv_summary["stock_value"] = round(
                sum(float(i.get("quantity_available", 0)) * float(i.get("unit_cost", 0)) for i in inv_items), 2
            )
            inv_summary["low_stock"] = len([
                i for i in inv_items
                if float(i.get("min_stock_level", 0)) > 0
                and float(i.get("quantity_available", 0)) <= float(i.get("min_stock_level", 0))
            ])
            today_date = now.strftime("%Y-%m-%d")
            inv_summary["expired"] = len([
                i for i in inv_items if i.get("expiry_date") and i["expiry_date"] < today_date
            ])
        except Exception:
            pass

        result = {
            # Summary cards
            "total_orders": total_orders,
            "total_revenue": round(total_revenue, 2),
            "avg_order_value": avg_order_value,
            "total_products": len(all_products),
            "total_users": len(all_users),
            "new_users_month": new_users_month,
            "pending_reviews": pending_reviews,
            # Today
            "today_orders": len(today_orders),
            "today_revenue": round(today_revenue, 2),
            # This month
            "this_month_orders": this_month_orders,
            "this_month_revenue": round(this_month_revenue, 2),
            # Status breakdown
            "orders_by_status": status_counts,
            # Time series
            "monthly_data": monthly_data,
            "weekly_data": weekly_data,
            # Product analytics
            "analytics_available": analytics_available,
            "product_analytics": sorted(product_analytics, key=lambda x: x["profit"], reverse=True),
            "top_products": top_products,
            "least_products": least_products,
            "top_by_revenue": top_by_revenue,
            "total_cost": round(total_cost, 2),
            "total_profit": round(total_profit, 2),
            # Inventory
            "inventory_summary": inv_summary,
        }
        set_cached("dashboard_stats", result)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===========================================
# SCHEMA HEALTH CHECK
# ===========================================

@router.get("/schema-status")
async def check_schema_status():
    """Check if all required tables and columns exist in PostgREST schema cache"""
    status = {"overall": "ok", "issues": [], "instructions": []}
    
    # Check review advanced columns
    try:
        supabase.table("product_reviews").select("is_featured").limit(1).execute()
    except Exception:
        status["overall"] = "migration_needed"
        status["issues"].append("product_reviews missing columns: is_featured, is_approved, is_active, sort_order")
    
    # Check inventory tables
    for table in ["inventory_categories", "inventory_items", "product_inventory_items"]:
        try:
            supabase.table(table).select("id").limit(1).execute()
        except Exception:
            status["overall"] = "migration_needed"
            status["issues"].append(f"Table '{table}' not found in schema cache")
    
    # Check reload_schema RPC function
    try:
        supabase.rpc("reload_schema", {}).execute()
        status["reload_schema_fn"] = True
    except Exception:
        status["reload_schema_fn"] = False
    
    if status["issues"]:
        status["instructions"] = [
            "1. Go to Supabase Dashboard → SQL Editor",
            "2. Paste and run the contents of api/sql/005_complete_migration.sql",
            "3. Go to Supabase Dashboard → Settings → API",
            "4. Click the 'Reload' button to refresh PostgREST schema cache",
            "5. Call this endpoint again to verify everything works"
        ]
    
    return status


# ===========================================
# FAQ MANAGEMENT
# ===========================================

@router.get("/faqs", response_model=list[FAQ])
async def admin_get_faqs():
    """Get all FAQs (admin - includes inactive)"""
    cached = get_cached("faqs:admin")
    if cached:
        return cached
    try:
        response = supabase.table("faqs").select("*").order("display_order").execute()
        result = [FAQ(**f) for f in response.data]
        set_cached("faqs:admin", result, ttl=30)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/faqs", response_model=FAQ)
async def admin_create_faq(faq: FAQCreate):
    """Create a new FAQ"""
    try:
        response = supabase.table("faqs").insert(faq.model_dump()).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create FAQ")
        invalidate_cache("faqs:")
        return FAQ(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/faqs/reorder")
async def admin_reorder_faqs(items: list[FAQReorderItem]):
    """Bulk update display_order for FAQs"""
    try:
        for item in items:
            supabase.table("faqs").update(
                {"display_order": item.display_order}
            ).eq("id", str(item.id)).execute()
        invalidate_cache("faqs:")
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/faqs/{faq_id}", response_model=FAQ)
async def admin_update_faq(faq_id: UUID, faq: FAQUpdate):
    """Update a FAQ"""
    try:
        update_data = faq.model_dump(exclude_none=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        response = supabase.table("faqs").update(update_data).eq("id", str(faq_id)).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="FAQ not found")
        invalidate_cache("faqs:")
        return FAQ(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/faqs/{faq_id}")
async def admin_delete_faq(faq_id: UUID):
    """Delete a FAQ"""
    try:
        response = supabase.table("faqs").delete().eq("id", str(faq_id)).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="FAQ not found")
        invalidate_cache("faqs:")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
