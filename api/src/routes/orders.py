"""
Orders Routes
"""
from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from uuid import UUID
from decimal import Decimal
from ..models.schemas import Order, OrderCreate, OrderList, OrderItem
from ..utils.database import supabase

router = APIRouter()


@router.post("", response_model=Order)
async def create_order(order: OrderCreate, x_session_id: Optional[str] = Header(None)):
    """Create a new order"""
    try:
        # Calculate totals
        subtotal = Decimal("0")
        order_items_data = []
        
        for item in order.items:
            # Get product details
            product = supabase.table("products").select("*").eq(
                "id", str(item.product_id)
            ).single().execute()
            
            if not product.data:
                raise HTTPException(status_code=404, detail=f"Product not found: {item.product_id}")
            
            # Check stock
            if product.data["stock_quantity"] < item.quantity:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Insufficient stock for {product.data['name']}"
                )
            
            item_total = Decimal(str(item.unit_price)) * item.quantity
            subtotal += item_total
            
            order_items_data.append({
                "product_id": str(item.product_id),
                "variant_id": str(item.variant_id) if item.variant_id else None,
                "product_name": product.data["name"],
                "quantity": item.quantity,
                "unit_price": float(item.unit_price),
                "total_price": float(item_total),
                "current_stock": product.data["stock_quantity"]  # Store for stock update
            })
        
        # Get shipping cost from settings
        shipping_setting = supabase.table("site_settings").select("setting_value").eq(
            "setting_key", "shipping_cost"
        ).single().execute()
        
        shipping_cost = Decimal(shipping_setting.data["setting_value"]) if shipping_setting.data else Decimal("180")
        
        # Check free shipping threshold
        threshold_setting = supabase.table("site_settings").select("setting_value").eq(
            "setting_key", "free_shipping_threshold"
        ).single().execute()
        
        threshold = Decimal(threshold_setting.data["setting_value"]) if threshold_setting.data else Decimal("2000")
        
        if subtotal >= threshold:
            shipping_cost = Decimal("0")
        
        total = subtotal + shipping_cost
        
        # Create order
        order_data = {
            "customer_email": order.customer_email,
            "customer_phone": order.customer_phone,
            "customer_name": order.customer_name,
            "shipping_address": order.shipping_address,
            "shipping_city": order.shipping_city,
            "shipping_country": order.shipping_country,
            "shipping_postal_code": order.shipping_postal_code,
            "billing_same_as_shipping": order.billing_same_as_shipping,
            "billing_address": order.billing_address,
            "billing_city": order.billing_city,
            "payment_method": order.payment_method,
            "customer_notes": order.customer_notes,
            "subtotal": float(subtotal),
            "shipping_cost": float(shipping_cost),
            "discount_amount": 0,
            "total": float(total),
            "status": "pending",
            "payment_status": "pending"
        }
        
        response = supabase.table("orders").insert(order_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create order")
        
        order_id = response.data[0]["id"]
        
        # Create order items
        for item_data in order_items_data:
            current_stock = item_data.pop("current_stock")  # Remove from insert data
            item_data["order_id"] = order_id
            supabase.table("order_items").insert(item_data).execute()
            
            # Update stock using the stored value
            new_stock = current_stock - item_data["quantity"]
            supabase.table("products").update({
                "stock_quantity": new_stock
            }).eq("id", item_data["product_id"]).execute()
        
        # Clear cart
        if x_session_id:
            supabase.table("cart_items").delete().eq("session_id", x_session_id).execute()
        
        # Get complete order with items
        complete_order = supabase.table("orders").select("*, order_items(*)").eq(
            "id", order_id
        ).single().execute()
        
        order_response = complete_order.data
        order_response["items"] = order_response.pop("order_items", [])
        
        return Order(**order_response)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=OrderList)
async def get_orders(user_id: Optional[UUID] = None):
    """Get orders for a user"""
    try:
        query = supabase.table("orders").select("*, order_items(*)")
        
        if user_id:
            query = query.eq("user_id", str(user_id))
        
        response = query.order("created_at", desc=True).execute()
        
        orders = []
        for o in response.data:
            o["items"] = o.pop("order_items", [])
            orders.append(Order(**o))
        
        return OrderList(orders=orders, total=len(orders))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{order_number}", response_model=Order)
async def get_order(order_number: str):
    """Get order by order number"""
    try:
        response = supabase.table("orders").select("*, order_items(*)").eq(
            "order_number", order_number
        ).single().execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Order not found")
        
        order_data = response.data
        order_data["items"] = order_data.pop("order_items", [])
        
        return Order(**order_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/track/{order_number}")
async def track_order(order_number: str):
    """Track order status"""
    try:
        response = supabase.table("orders").select(
            "order_number, status, payment_status, tracking_number, shipping_carrier, created_at, updated_at"
        ).eq("order_number", order_number).single().execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Order not found")
        
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
