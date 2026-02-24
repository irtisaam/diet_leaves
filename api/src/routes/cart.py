"""
Cart Routes
"""
from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from uuid import UUID, uuid4
from decimal import Decimal
from ..models.schemas import Cart, CartItem, CartItemCreate, CartItemUpdate
from ..utils.database import supabase

router = APIRouter()


def get_session_id(x_session_id: Optional[str] = Header(None)) -> str:
    """Get or create session ID for guest carts"""
    return x_session_id or str(uuid4())


@router.get("", response_model=Cart)
async def get_cart(x_session_id: Optional[str] = Header(None)):
    """Get cart items"""
    try:
        session_id = get_session_id(x_session_id)
        
        # Get cart items with product details
        response = supabase.table("cart_items").select(
            "*, products:product_id(*, product_images(*))"
        ).eq("session_id", session_id).execute()
        
        items = []
        subtotal = Decimal("0")
        
        for item in response.data:
            product_data = item.pop("products", None)
            if product_data:
                product_data["images"] = product_data.pop("product_images", [])
                product_data["variants"] = []
                item["product"] = product_data
                
                # Calculate item total
                item_total = Decimal(str(product_data["price"])) * item["quantity"]
                subtotal += item_total
            
            items.append(CartItem(**item))
        
        # Get shipping cost from settings
        shipping_setting = supabase.table("site_settings").select("setting_value").eq(
            "setting_key", "shipping_cost"
        ).single().execute()
        
        shipping_cost = Decimal(shipping_setting.data["setting_value"]) if shipping_setting.data else Decimal("180")
        
        # Get free shipping threshold
        threshold_setting = supabase.table("site_settings").select("setting_value").eq(
            "setting_key", "free_shipping_threshold"
        ).single().execute()
        
        threshold = Decimal(threshold_setting.data["setting_value"]) if threshold_setting.data else Decimal("2000")
        
        # Free shipping if above threshold
        if subtotal >= threshold:
            shipping_cost = Decimal("0")
        
        total = subtotal + shipping_cost
        
        return Cart(
            items=items,
            subtotal=subtotal,
            shipping=shipping_cost,
            total=total,
            item_count=sum(item.quantity for item in items)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/add", response_model=CartItem)
async def add_to_cart(item: CartItemCreate, x_session_id: Optional[str] = Header(None)):
    """Add item to cart"""
    try:
        session_id = get_session_id(x_session_id)
        
        # Check if product exists
        product = supabase.table("products").select("id, stock_quantity").eq(
            "id", str(item.product_id)
        ).single().execute()
        
        if not product.data:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Check stock
        if product.data["stock_quantity"] < item.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock")
        
        # Check if item already in cart
        existing = supabase.table("cart_items").select("*").eq(
            "session_id", session_id
        ).eq("product_id", str(item.product_id)).execute()
        
        if existing.data:
            # Update quantity
            new_quantity = existing.data[0]["quantity"] + item.quantity
            response = supabase.table("cart_items").update({
                "quantity": new_quantity
            }).eq("id", existing.data[0]["id"]).execute()
        else:
            # Add new item
            cart_data = {
                "session_id": session_id,
                "product_id": str(item.product_id),
                "variant_id": str(item.variant_id) if item.variant_id else None,
                "quantity": item.quantity
            }
            response = supabase.table("cart_items").insert(cart_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to add to cart")
        
        return CartItem(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{item_id}", response_model=CartItem)
async def update_cart_item(item_id: UUID, update: CartItemUpdate, x_session_id: Optional[str] = Header(None)):
    """Update cart item quantity"""
    try:
        session_id = get_session_id(x_session_id)
        
        if update.quantity <= 0:
            # Remove item if quantity is 0 or less
            supabase.table("cart_items").delete().eq(
                "id", str(item_id)
            ).eq("session_id", session_id).execute()
            raise HTTPException(status_code=200, detail="Item removed from cart")
        
        response = supabase.table("cart_items").update({
            "quantity": update.quantity
        }).eq("id", str(item_id)).eq("session_id", session_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Cart item not found")
        
        return CartItem(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{item_id}")
async def remove_from_cart(item_id: UUID, x_session_id: Optional[str] = Header(None)):
    """Remove item from cart"""
    try:
        session_id = get_session_id(x_session_id)
        
        supabase.table("cart_items").delete().eq(
            "id", str(item_id)
        ).eq("session_id", session_id).execute()
        
        return {"message": "Item removed from cart"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("")
async def clear_cart(x_session_id: Optional[str] = Header(None)):
    """Clear all items from cart"""
    try:
        session_id = get_session_id(x_session_id)
        
        supabase.table("cart_items").delete().eq("session_id", session_id).execute()
        
        return {"message": "Cart cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
