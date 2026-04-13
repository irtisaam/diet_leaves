"""
Inventory Management Routes — with Batch Tracking
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel
from decimal import Decimal
from datetime import date, datetime, timedelta
from ..utils.database import supabase
from ..utils.cache import get_cached, set_cached, invalidate_cache
from ..utils.auth import require_admin

router = APIRouter(dependencies=[Depends(require_admin)])

SCHEMA_RELOAD_MSG = (
    "Inventory tables not found in database schema cache. "
    "Please run 005_complete_migration.sql in the Supabase SQL Editor, "
    "then go to Supabase Dashboard → Settings → API → click 'Reload' to refresh the schema cache."
)


def _safe_table(table_name: str):
    """Try accessing a table, raise helpful error if it's not in PostgREST cache."""
    try:
        return supabase.table(table_name)
    except Exception as e:
        err = str(e).lower()
        if "pgrst" in err or "schema cache" in err:
            raise HTTPException(status_code=503, detail=SCHEMA_RELOAD_MSG)
        raise


def _inventory_query(fn):
    """Wrap an inventory query — catch PostgREST table-not-found errors."""
    try:
        return fn()
    except HTTPException:
        raise
    except Exception as e:
        err = str(e).lower()
        if "pgrst205" in err or "schema cache" in err or "inventory_categories" in err or "inventory_items" in err:
            raise HTTPException(status_code=503, detail=SCHEMA_RELOAD_MSG)
        raise


# ===========================================
# PYDANTIC MODELS
# ===========================================

class InventoryCategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None


class InventoryCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class InventoryCategory(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class InventoryItemCreate(BaseModel):
    name: str
    sku: Optional[str] = None
    category_id: Optional[str] = None
    unit: str = "pcs"
    unit_cost: Optional[float] = 0.0
    quantity_available: Optional[float] = 0.0
    min_stock_level: Optional[float] = 0.0
    expiry_date: Optional[date] = None
    purchase_date: Optional[date] = None
    purchased_by: Optional[str] = None
    description: Optional[str] = None
    supplier: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = True


class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    category_id: Optional[str] = None
    unit: Optional[str] = None
    unit_cost: Optional[float] = None
    quantity_available: Optional[float] = None
    min_stock_level: Optional[float] = None
    expiry_date: Optional[date] = None
    purchase_date: Optional[date] = None
    purchased_by: Optional[str] = None
    description: Optional[str] = None
    supplier: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class InventoryItem(BaseModel):
    id: str
    name: str
    sku: Optional[str] = None
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    unit: str
    unit_cost: Optional[float] = 0.0
    quantity_available: Optional[float] = 0.0
    quantity_in_use: Optional[float] = 0.0
    quantity_consumed: Optional[float] = 0.0
    min_stock_level: Optional[float] = 0.0
    expiry_date: Optional[str] = None
    purchase_date: Optional[str] = None
    purchased_by: Optional[str] = None
    description: Optional[str] = None
    supplier: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    batches: Optional[list] = None


class BatchCreate(BaseModel):
    quantity: float
    expiry_date: Optional[date] = None
    purchase_date: Optional[date] = None
    purchased_by: Optional[str] = None
    notes: Optional[str] = None


class AdjustQuantityRequest(BaseModel):
    quantity_available: float
    notes: Optional[str] = None
    expiry_date: Optional[date] = None
    purchase_date: Optional[date] = None
    purchased_by: Optional[str] = None


class BulkProductMappingItem(BaseModel):
    inventory_item_id: str
    quantity_per_unit: float = 1.0


class ProductMappingCreate(BaseModel):
    product_id: str
    inventory_item_id: str
    quantity_per_unit: float = 1.0


class ProductMapping(BaseModel):
    id: str
    product_id: str
    inventory_item_id: str
    quantity_per_unit: float
    product_name: Optional[str] = None
    inventory_item_name: Optional[str] = None
    unit: Optional[str] = None
    created_at: Optional[str] = None


# ===========================================
# HELPERS
# ===========================================

def _get_cat_map():
    """Build {cat_id: cat_name} lookup (cached 60s)."""
    cached = get_cached("inv_cat_map", ttl=60)
    if cached is not None:
        return cached
    def _cats():
        return supabase.table("inventory_categories").select("id,name").execute()
    cats_resp = _inventory_query(_cats)
    result = {c["id"]: c["name"] for c in cats_resp.data}
    set_cached("inv_cat_map", result)
    return result


def _enrich_item(item: dict, categories: dict, batches_map: dict = None) -> InventoryItem:
    """Add category_name and batches to an item dict."""
    cat_id = item.get("category_id")
    item["category_name"] = categories.get(cat_id) if cat_id else None
    if batches_map and item.get("id") in batches_map:
        item["batches"] = batches_map[item["id"]]
    return InventoryItem(**item)


def _sync_item_qty(item_id: str):
    """Recalculate inventory_items.quantity_available = SUM of active batch quantities."""
    try:
        resp = supabase.table("inventory_batches").select("quantity").eq(
            "inventory_item_id", item_id
        ).eq("is_active", True).execute()
        total = sum(float(b.get("quantity", 0)) for b in resp.data)
        supabase.table("inventory_items").update(
            {"quantity_available": total}
        ).eq("id", item_id).execute()
        return total
    except Exception:
        pass
    return None


def _get_batches_for_items(item_ids: list) -> dict:
    """Fetch all active batches grouped by inventory_item_id."""
    result: dict = {}
    if not item_ids:
        return result
    try:
        resp = supabase.table("inventory_batches").select("*").in_(
            "inventory_item_id", item_ids
        ).eq("is_active", True).order("expiry_date").execute()
        for b in resp.data:
            iid = b["inventory_item_id"]
            result.setdefault(iid, []).append(b)
    except Exception:
        pass
    return result


# ===========================================
# CATEGORIES
# ===========================================

@router.get("/categories", response_model=List[InventoryCategory])
async def list_categories():
    """List all inventory categories"""
    try:
        def _do():
            return supabase.table("inventory_categories").select("*").order("name").execute()
        response = _inventory_query(_do)
        return [InventoryCategory(**c) for c in response.data]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/categories", response_model=InventoryCategory)
async def create_category(category: InventoryCategoryCreate):
    """Create a new inventory category"""
    try:
        def _do():
            return supabase.table("inventory_categories").insert(category.model_dump(exclude_none=True)).execute()
        response = _inventory_query(_do)
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create category")
        invalidate_cache("inv_")
        return InventoryCategory(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/categories/{category_id}", response_model=InventoryCategory)
async def update_category(category_id: UUID, category: InventoryCategoryUpdate):
    """Update an inventory category"""
    try:
        data = category.model_dump(exclude_none=True)
        if not data:
            raise HTTPException(status_code=400, detail="No fields to update")
        def _do():
            return supabase.table("inventory_categories").update(data).eq("id", str(category_id)).execute()
        response = _inventory_query(_do)
        if not response.data:
            raise HTTPException(status_code=404, detail="Category not found")
        invalidate_cache("inv_")
        return InventoryCategory(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/categories/{category_id}")
async def delete_category(category_id: UUID):
    """Delete an inventory category"""
    try:
        def _do():
            return supabase.table("inventory_categories").delete().eq("id", str(category_id)).execute()
        _inventory_query(_do)
        invalidate_cache("inv_")
        return {"message": "Category deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===========================================
# INVENTORY ITEMS
# ===========================================


@router.get("", response_model=List[InventoryItem])
async def list_inventory_items(
    search: Optional[str] = Query(None),
    category_id: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("name"),
    only_low_stock: Optional[bool] = Query(False),
    only_expiring: Optional[bool] = Query(False),
    only_expired: Optional[bool] = Query(False),
    include_inactive: Optional[bool] = Query(False),
):
    """List inventory items with optional filters"""
    try:
        # Cache key based on query params
        cache_key = f"inv_list_{search}_{category_id}_{sort_by}_{only_low_stock}_{only_expiring}_{only_expired}_{include_inactive}"
        cached = get_cached(cache_key, ttl=20)
        if cached is not None:
            return cached

        def _do():
            q = supabase.table("inventory_items").select("*")
            if not include_inactive:
                q = q.eq("is_active", True)
            if category_id:
                q = q.eq("category_id", category_id)
            if sort_by in ("name", "created_at", "expiry_date", "quantity_available"):
                q = q.order(sort_by)
            else:
                q = q.order("name")
            return q.execute()

        response = _inventory_query(_do)
        items = response.data

        # Filter low stock in Python (column comparison not easy in builder)
        if only_low_stock:
            items = [i for i in items if float(i.get("quantity_available", 0)) <= float(i.get("min_stock_level", 0))]

        if search:
            s = search.lower()
            items = [i for i in items if s in i.get("name", "").lower() or s in (i.get("sku") or "").lower() or s in (i.get("supplier") or "").lower()]

        cat_map = _get_cat_map()

        # Fetch batches for all items
        item_ids = [i["id"] for i in items]
        batches_map = _get_batches_for_items(item_ids)

        # Filter expiring within 30 days (batch-aware)
        if only_expiring:
            cutoff = (date.today() + timedelta(days=30)).isoformat()
            today_str = date.today().isoformat()
            filtered = []
            for i in items:
                iid = i["id"]
                item_batches = batches_map.get(iid, [])
                if item_batches:
                    has_expiring = any(
                        b.get("expiry_date") and today_str <= b["expiry_date"] <= cutoff
                        for b in item_batches
                    )
                    if has_expiring:
                        filtered.append(i)
                else:
                    if i.get("expiry_date") and today_str <= i["expiry_date"] <= cutoff:
                        filtered.append(i)
            items = filtered

        # Filter expired (batch-aware)
        if only_expired:
            today_str = date.today().isoformat()
            filtered = []
            for i in items:
                iid = i["id"]
                item_batches = batches_map.get(iid, [])
                if item_batches:
                    has_expired = any(
                        b.get("expiry_date") and b["expiry_date"] < today_str
                        for b in item_batches
                    )
                    if has_expired:
                        filtered.append(i)
                else:
                    if i.get("expiry_date") and i["expiry_date"] < today_str:
                        filtered.append(i)
            items = filtered

        result = [_enrich_item(i, cat_map, batches_map) for i in items]
        set_cached(cache_key, result)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/expiring", response_model=List[InventoryItem])
async def list_expiring_items(days: int = Query(30)):
    """List items expiring within `days` days (also includes already expired)"""
    try:
        cutoff = (date.today() + timedelta(days=days)).isoformat()
        def _do():
            return supabase.table("inventory_items").select("*").not_.is_("expiry_date", "null").lte("expiry_date", cutoff).eq("is_active", True).order("expiry_date").execute()
        response = _inventory_query(_do)
        cat_map = _get_cat_map()
        item_ids = [i["id"] for i in response.data]
        batches_map = _get_batches_for_items(item_ids)
        return [_enrich_item(i, cat_map, batches_map) for i in response.data]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/product-mappings", response_model=List[ProductMapping])
async def list_product_mappings(product_id: Optional[str] = Query(None)):
    """List product ↔ inventory item mappings"""
    try:
        def _do():
            q = supabase.table("product_inventory_items").select(
                "id, product_id, inventory_item_id, quantity_per_unit, created_at, "
                "products(name), inventory_items(name, unit)"
            )
            if product_id:
                q = q.eq("product_id", product_id)
            return q.execute()
        response = _inventory_query(_do)
        result = []
        for row in response.data:
            result.append(ProductMapping(
                id=row["id"],
                product_id=row["product_id"],
                inventory_item_id=row["inventory_item_id"],
                quantity_per_unit=float(row["quantity_per_unit"]),
                product_name=row.get("products", {}).get("name") if row.get("products") else None,
                inventory_item_name=row.get("inventory_items", {}).get("name") if row.get("inventory_items") else None,
                unit=row.get("inventory_items", {}).get("unit") if row.get("inventory_items") else None,
                created_at=row.get("created_at"),
            ))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/product-mappings", response_model=ProductMapping)
async def create_product_mapping(mapping: ProductMappingCreate):
    """Map a product to an inventory item"""
    try:
        def _do():
            return supabase.table("product_inventory_items").insert(mapping.model_dump()).execute()
        response = _inventory_query(_do)
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create mapping")
        row = response.data[0]
        return ProductMapping(
            id=row["id"],
            product_id=row["product_id"],
            inventory_item_id=row["inventory_item_id"],
            quantity_per_unit=float(row["quantity_per_unit"]),
            created_at=row.get("created_at"),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/product-mappings/{mapping_id}")
async def delete_product_mapping(mapping_id: UUID):
    """Remove a product ↔ inventory item mapping"""
    try:
        def _do():
            return supabase.table("product_inventory_items").delete().eq("id", str(mapping_id)).execute()
        _inventory_query(_do)
        return {"message": "Mapping deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/item-products/{item_id}")
async def list_products_using_item(item_id: UUID):
    """List all products that use a given inventory item (reverse relationship)."""
    try:
        def _do():
            return supabase.table("product_inventory_items").select(
                "id, product_id, quantity_per_unit, products(name, slug, price, images:product_images(image_url, is_primary))"
            ).eq("inventory_item_id", str(item_id)).execute()
        response = _inventory_query(_do)
        products = []
        for row in response.data:
            prod = row.get("products") or {}
            images = prod.get("images") or []
            primary_img = next((img["image_url"] for img in images if img.get("is_primary")), None)
            if not primary_img and images:
                primary_img = images[0].get("image_url")
            products.append({
                "mapping_id": row["id"],
                "product_id": row["product_id"],
                "product_name": prod.get("name", "Unknown"),
                "product_slug": prod.get("slug", ""),
                "product_price": float(prod.get("price", 0)),
                "product_image": primary_img,
                "quantity_per_unit": float(row["quantity_per_unit"]),
            })
        return {"products": products, "count": len(products)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{item_id}", response_model=InventoryItem)
async def get_inventory_item(item_id: UUID):
    """Get a single inventory item with its batches"""
    try:
        def _do():
            return supabase.table("inventory_items").select("*").eq("id", str(item_id)).execute()
        response = _inventory_query(_do)
        if not response.data:
            raise HTTPException(status_code=404, detail="Inventory item not found")
        cat_map = _get_cat_map()
        batches_map = _get_batches_for_items([str(item_id)])
        return _enrich_item(response.data[0], cat_map, batches_map)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=InventoryItem)
async def create_inventory_item(item: InventoryItemCreate):
    """Create a new inventory item (and optionally an initial batch)"""
    try:
        data = item.model_dump(exclude_none=True)
        if "expiry_date" in data and data["expiry_date"]:
            data["expiry_date"] = str(data["expiry_date"])
        if "purchase_date" in data and data["purchase_date"]:
            data["purchase_date"] = str(data["purchase_date"])
        def _do():
            return supabase.table("inventory_items").insert(data).execute()
        response = _inventory_query(_do)
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create inventory item")

        created = response.data[0]

        # Create initial batch if quantity > 0
        qty = float(data.get("quantity_available", 0))
        if qty > 0:
            batch = {
                "inventory_item_id": created["id"],
                "quantity": qty,
                "notes": "Initial stock",
            }
            if data.get("expiry_date"):
                batch["expiry_date"] = data["expiry_date"]
            if data.get("purchase_date"):
                batch["purchase_date"] = data["purchase_date"]
            if data.get("purchased_by"):
                batch["purchased_by"] = data["purchased_by"]
            try:
                supabase.table("inventory_batches").insert(batch).execute()
            except Exception:
                pass

        cat_map = _get_cat_map()
        batches_map = _get_batches_for_items([created["id"]])
        invalidate_cache("inv_")
        return _enrich_item(created, cat_map, batches_map)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{item_id}", response_model=InventoryItem)
async def update_inventory_item(item_id: UUID, item: InventoryItemUpdate):
    """Update an inventory item"""
    try:
        data = item.model_dump(exclude_none=True)
        if not data:
            raise HTTPException(status_code=400, detail="No fields to update")
        if "expiry_date" in data and data["expiry_date"]:
            data["expiry_date"] = str(data["expiry_date"])
        if "purchase_date" in data and data["purchase_date"]:
            data["purchase_date"] = str(data["purchase_date"])
        def _do():
            return supabase.table("inventory_items").update(data).eq("id", str(item_id)).execute()
        response = _inventory_query(_do)
        if not response.data:
            raise HTTPException(status_code=404, detail="Inventory item not found")
        cat_map = _get_cat_map()
        batches_map = _get_batches_for_items([str(item_id)])
        invalidate_cache("inv_")
        return _enrich_item(response.data[0], cat_map, batches_map)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{item_id}")
async def delete_inventory_item(item_id: UUID):
    """Delete an inventory item (soft-delete by marking inactive)"""
    try:
        def _do():
            return supabase.table("inventory_items").update({"is_active": False}).eq("id", str(item_id)).execute()
        response = _inventory_query(_do)
        if not response.data:
            raise HTTPException(status_code=404, detail="Inventory item not found")
        invalidate_cache("inv_")
        return {"message": "Inventory item deactivated"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{item_id}/adjust")
async def adjust_inventory_quantity(item_id: UUID, adjustment: AdjustQuantityRequest):
    """Add stock as a new batch (restock flow). Creates a batch for the added quantity."""
    try:
        # Get existing total
        def _get_existing():
            return supabase.table("inventory_items").select("quantity_available,notes").eq("id", str(item_id)).execute()
        existing = _inventory_query(_get_existing)
        if not existing.data:
            raise HTTPException(status_code=404, detail="Inventory item not found")
        prev_qty = float(existing.data[0].get("quantity_available", 0))
        new_qty = adjustment.quantity_available

        # Create a batch for the added quantity
        add_qty = new_qty - prev_qty
        if add_qty > 0:
            batch_row = {
                "inventory_item_id": str(item_id),
                "quantity": add_qty,
            }
            if adjustment.expiry_date:
                batch_row["expiry_date"] = str(adjustment.expiry_date)
            if adjustment.purchase_date:
                batch_row["purchase_date"] = str(adjustment.purchase_date)
            if adjustment.purchased_by:
                batch_row["purchased_by"] = adjustment.purchased_by
            if adjustment.notes:
                batch_row["notes"] = adjustment.notes
            try:
                supabase.table("inventory_batches").insert(batch_row).execute()
            except Exception:
                pass

        # Update item-level fields
        data: dict = {"quantity_available": new_qty}
        if adjustment.expiry_date:
            data["expiry_date"] = str(adjustment.expiry_date)
        if adjustment.purchase_date:
            data["purchase_date"] = str(adjustment.purchase_date)
        if adjustment.purchased_by:
            data["purchased_by"] = adjustment.purchased_by
        if adjustment.notes:
            prev_notes = existing.data[0].get("notes") or ""
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
            data["notes"] = f"{prev_notes}\n[{timestamp}] Adjusted {prev_qty} → {new_qty}: {adjustment.notes}".strip()

        # Audit trail
        try:
            audit = {
                "inventory_item_id": str(item_id),
                "quantity_before": prev_qty,
                "quantity_after": new_qty,
                "notes": adjustment.notes,
            }
            if adjustment.expiry_date:
                audit["expiry_date"] = str(adjustment.expiry_date)
            if adjustment.purchase_date:
                audit["purchase_date"] = str(adjustment.purchase_date)
            if adjustment.purchased_by:
                audit["purchased_by"] = adjustment.purchased_by
            supabase.table("inventory_adjustments").insert(audit).execute()
        except Exception:
            pass

        def _do():
            return supabase.table("inventory_items").update(data).eq("id", str(item_id)).execute()
        response = _inventory_query(_do)
        if not response.data:
            raise HTTPException(status_code=404, detail="Inventory item not found")

        # Sync from batches
        _sync_item_qty(str(item_id))

        cat_map = _get_cat_map()
        batches_map = _get_batches_for_items([str(item_id)])
        invalidate_cache("inv_")
        return _enrich_item(response.data[0], cat_map, batches_map)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===========================================
# BATCH ENDPOINTS
# ===========================================

@router.get("/{item_id}/batches")
async def list_batches(item_id: UUID, include_inactive: bool = Query(False)):
    """List all batches for an inventory item"""
    try:
        def _do():
            q = supabase.table("inventory_batches").select("*").eq(
                "inventory_item_id", str(item_id)
            )
            if not include_inactive:
                q = q.eq("is_active", True)
            return q.order("expiry_date").execute()
        response = _inventory_query(_do)
        return {"batches": response.data, "count": len(response.data)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{item_id}/batches")
async def add_batch(item_id: UUID, batch: BatchCreate):
    """Add a new batch (restock) to an inventory item."""
    try:
        row = {
            "inventory_item_id": str(item_id),
            "quantity": batch.quantity,
        }
        if batch.expiry_date:
            row["expiry_date"] = str(batch.expiry_date)
        if batch.purchase_date:
            row["purchase_date"] = str(batch.purchase_date)
        if batch.purchased_by:
            row["purchased_by"] = batch.purchased_by
        if batch.notes:
            row["notes"] = batch.notes

        def _do():
            return supabase.table("inventory_batches").insert(row).execute()
        response = _inventory_query(_do)
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create batch")

        # Get previous qty for audit
        try:
            existing = supabase.table("inventory_items").select("quantity_available").eq("id", str(item_id)).execute()
            before_qty = float(existing.data[0].get("quantity_available", 0)) if existing.data else 0
        except Exception:
            before_qty = 0

        # Sync quantity
        new_total = _sync_item_qty(str(item_id))

        # Audit
        try:
            audit = {
                "inventory_item_id": str(item_id),
                "quantity_before": before_qty,
                "quantity_after": new_total if new_total is not None else before_qty + batch.quantity,
                "notes": batch.notes or f"Added batch of {batch.quantity}",
            }
            if batch.expiry_date:
                audit["expiry_date"] = str(batch.expiry_date)
            if batch.purchase_date:
                audit["purchase_date"] = str(batch.purchase_date)
            if batch.purchased_by:
                audit["purchased_by"] = batch.purchased_by
            supabase.table("inventory_adjustments").insert(audit).execute()
        except Exception:
            pass

        invalidate_cache("inv_")
        return {
            "batch": response.data[0],
            "new_total": new_total if new_total is not None else before_qty + batch.quantity,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/batches/{batch_id}")
async def remove_batch(batch_id: UUID):
    """Remove / deactivate a batch (e.g. expired). Deducts its quantity from item total."""
    try:
        # Get batch info
        def _get():
            return supabase.table("inventory_batches").select("*").eq("id", str(batch_id)).execute()
        resp = _inventory_query(_get)
        if not resp.data:
            raise HTTPException(status_code=404, detail="Batch not found")
        batch = resp.data[0]
        item_id = batch["inventory_item_id"]
        batch_qty = float(batch.get("quantity", 0))

        # Deactivate batch
        def _deactivate():
            return supabase.table("inventory_batches").update(
                {"is_active": False, "quantity": 0}
            ).eq("id", str(batch_id)).execute()
        _inventory_query(_deactivate)

        # Sync item quantity
        new_total = _sync_item_qty(item_id)

        # Audit trail
        try:
            supabase.table("inventory_adjustments").insert({
                "inventory_item_id": item_id,
                "quantity_before": (new_total or 0) + batch_qty,
                "quantity_after": new_total or 0,
                "notes": f"Removed expired batch ({batch_qty} units, expiry: {batch.get('expiry_date', 'N/A')})",
            }).execute()
        except Exception:
            pass

        invalidate_cache("inv_")
        return {
            "message": "Batch removed",
            "removed_quantity": batch_qty,
            "new_total": new_total if new_total is not None else 0,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/product-mappings/bulk/{product_id}")
async def bulk_update_product_mappings(product_id: str, mappings: List[BulkProductMappingItem]):
    """Replace all inventory mappings for a product in a single call"""
    try:
        # Delete existing mappings for this product
        def _del():
            return supabase.table("product_inventory_items").delete().eq("product_id", product_id).execute()
        _inventory_query(_del)

        if mappings:
            rows = [
                {"product_id": product_id, "inventory_item_id": m.inventory_item_id, "quantity_per_unit": m.quantity_per_unit}
                for m in mappings
            ]
            def _ins():
                return supabase.table("product_inventory_items").insert(rows).execute()
            _inventory_query(_ins)

        return {"message": "Mappings updated", "count": len(mappings)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
