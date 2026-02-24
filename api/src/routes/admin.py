"""
Admin Routes - Full CRUD for all entities
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
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
    UserProfile
)
from ..utils.database import supabase

router = APIRouter()


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
        supabase.table("products").delete().eq("id", str(product_id)).execute()
        return {"message": "Product deleted"}
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


@router.put("/orders/{order_id}", response_model=Order)
async def admin_update_order(order_id: UUID, order: OrderUpdate):
    """Update order status"""
    try:
        update_data = order.model_dump(exclude_unset=True)
        
        response = supabase.table("orders").update(update_data).eq(
            "id", str(order_id)
        ).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Get complete order
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

@router.get("/reviews", response_model=list[Review])
async def admin_get_reviews(approved: Optional[bool] = None):
    """Get all reviews"""
    try:
        query = supabase.table("product_reviews").select("*")
        
        if approved is not None:
            query = query.eq("is_approved", approved)
        
        response = query.order("created_at", desc=True).execute()
        return [Review(**r) for r in response.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/reviews/{review_id}/approve")
async def admin_approve_review(review_id: UUID):
    """Approve a review"""
    try:
        supabase.table("product_reviews").update({
            "is_approved": True
        }).eq("id", str(review_id)).execute()
        return {"message": "Review approved"}
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
        return HeroSection(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/hero/{hero_id}", response_model=HeroSection)
async def admin_update_hero_section(hero_id: UUID, hero: HeroSectionUpdate):
    """Update a hero section"""
    try:
        response = supabase.table("hero_sections").update(
            hero.model_dump(exclude_unset=True)
        ).eq("id", str(hero_id)).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Hero section not found")
        return HeroSection(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/hero/{hero_id}")
async def admin_delete_hero_section(hero_id: UUID):
    """Delete a hero section"""
    try:
        supabase.table("hero_sections").delete().eq("id", str(hero_id)).execute()
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
        return Banner(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/banners/{banner_id}", response_model=Banner)
async def admin_update_banner(banner_id: UUID, banner: BannerUpdate):
    """Update a banner"""
    try:
        response = supabase.table("banners").update(
            banner.model_dump(exclude_unset=True)
        ).eq("id", str(banner_id)).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Banner not found")
        return Banner(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/banners/{banner_id}")
async def admin_delete_banner(banner_id: UUID):
    """Delete a banner"""
    try:
        supabase.table("banners").delete().eq("id", str(banner_id)).execute()
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
        return NavigationItem(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/navigation/{nav_id}", response_model=NavigationItem)
async def admin_update_navigation_item(nav_id: UUID, nav: NavigationItemUpdate):
    """Update a navigation item"""
    try:
        update_data = nav.model_dump(exclude_unset=True)
        if "parent_id" in update_data and update_data["parent_id"]:
            update_data["parent_id"] = str(update_data["parent_id"])
        
        response = supabase.table("navigation_items").update(update_data).eq(
            "id", str(nav_id)
        ).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Navigation item not found")
        return NavigationItem(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/navigation/{nav_id}")
async def admin_delete_navigation_item(nav_id: UUID):
    """Delete a navigation item"""
    try:
        supabase.table("navigation_items").delete().eq("id", str(nav_id)).execute()
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
        response = supabase.table("footer_items").update(
            footer.model_dump(exclude_unset=True)
        ).eq("id", str(footer_id)).execute()
        
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

@router.get("/users", response_model=list[UserProfile])
async def admin_get_users():
    """Get all users"""
    try:
        response = supabase.table("profiles").select("*").order("created_at", desc=True).execute()
        return [UserProfile(**u) for u in response.data]
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
# INVENTORY / STOCK MANAGEMENT
# ===========================================

@router.get("/inventory")
async def admin_get_inventory():
    """Get inventory overview"""
    try:
        response = supabase.table("products").select(
            "id, name, sku, stock_quantity, low_stock_threshold, is_active"
        ).order("stock_quantity").execute()
        
        low_stock = [p for p in response.data if p["stock_quantity"] <= p["low_stock_threshold"]]
        out_of_stock = [p for p in response.data if p["stock_quantity"] == 0]
        
        return {
            "products": response.data,
            "low_stock_count": len(low_stock),
            "out_of_stock_count": len(out_of_stock),
            "low_stock_products": low_stock,
            "out_of_stock_products": out_of_stock
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/inventory/{product_id}")
async def admin_update_stock(product_id: UUID, stock_quantity: int):
    """Update product stock"""
    try:
        response = supabase.table("products").update({
            "stock_quantity": stock_quantity
        }).eq("id", str(product_id)).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return {"message": "Stock updated", "new_quantity": stock_quantity}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===========================================
# DASHBOARD STATS
# ===========================================

@router.get("/dashboard")
async def admin_dashboard():
    """Get dashboard statistics"""
    try:
        # Total orders
        orders = supabase.table("orders").select("id, total, status", count="exact").execute()
        
        # Total revenue
        total_revenue = sum(o["total"] for o in orders.data) if orders.data else 0
        
        # Orders by status
        pending_orders = len([o for o in orders.data if o["status"] == "pending"])
        processing_orders = len([o for o in orders.data if o["status"] == "processing"])
        shipped_orders = len([o for o in orders.data if o["status"] == "shipped"])
        delivered_orders = len([o for o in orders.data if o["status"] == "delivered"])
        
        # Total products
        products = supabase.table("products").select("id", count="exact").execute()
        
        # Total users
        users = supabase.table("profiles").select("id", count="exact").execute()
        
        # Pending reviews
        pending_reviews = supabase.table("product_reviews").select(
            "id", count="exact"
        ).eq("is_approved", False).execute()
        
        return {
            "total_orders": orders.count or 0,
            "total_revenue": total_revenue,
            "pending_orders": pending_orders,
            "processing_orders": processing_orders,
            "shipped_orders": shipped_orders,
            "delivered_orders": delivered_orders,
            "total_products": products.count or 0,
            "total_users": users.count or 0,
            "pending_reviews": pending_reviews.count or 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
