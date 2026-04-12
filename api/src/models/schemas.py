"""
Pydantic Models for Diet Leaves API
"""
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Any
from datetime import datetime
from decimal import Decimal
from uuid import UUID


# ===========================================
# BASE MODELS
# ===========================================

class BaseResponse(BaseModel):
    success: bool = True
    message: str = ""


# ===========================================
# USER / AUTH MODELS
# ===========================================

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    id: UUID
    email: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: str = "Pakistan"
    is_admin: bool = False
    created_at: datetime

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile


# ===========================================
# PRODUCT MODELS
# ===========================================

class NutritionalInfo(BaseModel):
    calories: int = 0
    calories_from_fat: int = 0
    total_fat: float = 0
    cholesterol: float = 0
    sodium: float = 0
    potassium: float = 0
    carbohydrate: float = 0
    protein: float = 0
    vitamin_d: float = 0
    iron: float = 0
    calcium: float = 0
    total_sugar: float = 0

class ProductImage(BaseModel):
    id: UUID
    product_id: UUID
    image_url: str
    alt_text: Optional[str] = None
    display_order: int = 0
    is_primary: bool = False

class ProductImageCreate(BaseModel):
    image_url: str
    alt_text: Optional[str] = None
    display_order: int = 0
    is_primary: bool = False

class ProductVariant(BaseModel):
    id: UUID
    product_id: UUID
    name: str
    sku: Optional[str] = None
    price: Decimal
    compare_at_price: Optional[Decimal] = None
    stock_quantity: int = 0
    is_active: bool = True

class ProductVariantCreate(BaseModel):
    name: str
    sku: Optional[str] = None
    price: Decimal
    compare_at_price: Optional[Decimal] = None
    stock_quantity: int = 0

class ProductBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    short_description: Optional[str] = None
    price: Decimal
    compare_at_price: Optional[Decimal] = None
    sku: Optional[str] = None
    stock_quantity: int = 0
    is_active: bool = True
    is_featured: bool = False
    is_on_sale: bool = False
    nutritional_info: Optional[NutritionalInfo] = None
    ingredients: Optional[str] = None
    servings_per_container: Optional[int] = None

    @field_validator('sku', mode='before')
    @classmethod
    def empty_sku_to_none(cls, v):
        if v == '':
            return None
        return v

    @field_validator('servings_per_container', mode='before')
    @classmethod
    def empty_servings_to_none(cls, v):
        if v == '' or v == 0:
            return None
        return v

class ProductCreate(ProductBase):
    category_id: Optional[UUID] = None
    images: Optional[List[ProductImageCreate]] = []
    variants: Optional[List[ProductVariantCreate]] = []

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    category_id: Optional[UUID] = None
    price: Optional[Decimal] = None
    compare_at_price: Optional[Decimal] = None
    sku: Optional[str] = None
    stock_quantity: Optional[int] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    is_on_sale: Optional[bool] = None
    nutritional_info: Optional[NutritionalInfo] = None
    ingredients: Optional[str] = None

class Product(ProductBase):
    id: UUID
    category_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    images: List[ProductImage] = []
    variants: List[ProductVariant] = []

class ProductList(BaseModel):
    products: List[Product]
    total: int
    page: int
    limit: int


# ===========================================
# CATEGORY MODELS
# ===========================================

class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    display_order: int = 0
    is_active: bool = True

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: UUID
    created_at: datetime


# ===========================================
# CART MODELS
# ===========================================

class CartItemBase(BaseModel):
    product_id: UUID
    variant_id: Optional[UUID] = None
    quantity: int = 1

class CartItemCreate(CartItemBase):
    pass

class CartItemUpdate(BaseModel):
    quantity: int

class CartItem(CartItemBase):
    id: UUID
    user_id: Optional[UUID] = None
    session_id: Optional[str] = None
    product: Optional[Product] = None
    created_at: datetime

class Cart(BaseModel):
    items: List[CartItem]
    subtotal: Decimal
    shipping: Decimal
    total: Decimal
    item_count: int


# ===========================================
# ORDER MODELS
# ===========================================

class OrderItemBase(BaseModel):
    product_id: UUID
    variant_id: Optional[UUID] = None
    quantity: int
    unit_price: Decimal

class OrderItemCreate(OrderItemBase):
    pass

class OrderItem(OrderItemBase):
    id: UUID
    order_id: UUID
    product_name: str
    variant_name: Optional[str] = None
    total_price: Decimal

class ShippingAddress(BaseModel):
    address: str
    city: str
    country: str = "Pakistan"
    postal_code: Optional[str] = None

class OrderCreate(BaseModel):
    customer_email: EmailStr
    customer_phone: Optional[str] = None
    customer_name: str
    shipping_address: str
    shipping_city: str
    shipping_country: str = "Pakistan"
    shipping_postal_code: Optional[str] = None
    billing_same_as_shipping: bool = True
    billing_address: Optional[str] = None
    billing_city: Optional[str] = None
    payment_method: str = "cod"
    customer_notes: Optional[str] = None
    items: List[OrderItemCreate]

class OrderUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None
    tracking_number: Optional[str] = None
    shipping_carrier: Optional[str] = None
    admin_notes: Optional[str] = None

class Order(BaseModel):
    id: UUID
    order_number: str
    user_id: Optional[UUID] = None
    customer_email: str
    customer_phone: Optional[str] = None
    customer_name: str
    shipping_address: str
    shipping_city: str
    shipping_country: str
    shipping_postal_code: Optional[str] = None
    billing_address: Optional[str] = None
    billing_city: Optional[str] = None
    subtotal: Decimal
    shipping_cost: Decimal
    discount_amount: Decimal
    total: Decimal
    payment_method: str
    payment_status: str
    status: str
    tracking_number: Optional[str] = None
    shipping_carrier: Optional[str] = None
    admin_notes: Optional[str] = None
    customer_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[OrderItem] = []

class OrderList(BaseModel):
    orders: List[Order]
    total: int


# ===========================================
# REVIEW MODELS
# ===========================================

class ReviewCreate(BaseModel):
    product_id: UUID
    rating: int = Field(..., ge=1, le=5)
    title: Optional[str] = None
    review_text: Optional[str] = None
    customer_name: Optional[str] = None
    customer_email: Optional[EmailStr] = None

class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    title: Optional[str] = None
    review_text: Optional[str] = None
    is_approved: Optional[bool] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    sort_order: Optional[int] = None

class Review(BaseModel):
    id: UUID
    product_id: UUID
    user_id: Optional[UUID] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    rating: int
    title: Optional[str] = None
    review_text: Optional[str] = None
    is_verified_purchase: bool = False
    is_approved: bool = False
    is_active: bool = True
    is_featured: bool = False
    sort_order: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None
    # Optional fields for homepage display
    product_name: Optional[str] = None
    product_slug: Optional[str] = None

class ReviewList(BaseModel):
    reviews: List[Review]
    total: int
    average_rating: float = 0.0


# ===========================================
# SITE SETTINGS MODELS
# ===========================================

class SiteSettingUpdate(BaseModel):
    setting_value: str

class SiteSetting(BaseModel):
    id: UUID
    setting_key: str
    setting_value: Optional[str] = None
    setting_type: str = "text"
    description: Optional[str] = None

class SiteSettings(BaseModel):
    settings: dict[str, Any]


# ===========================================
# FAQ MODELS
# ===========================================

class FAQCreate(BaseModel):
    question: str
    answer: str
    image_url: Optional[str] = None
    display_order: int = 0
    is_active: bool = True

class FAQUpdate(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None
    image_url: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None

class FAQReorderItem(BaseModel):
    id: UUID
    display_order: int

class FAQ(BaseModel):
    id: UUID
    question: str
    answer: str
    image_url: Optional[str] = None
    display_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


# ===========================================
# BLOG MODELS
# ===========================================

class BlogPostCreate(BaseModel):
    title: str
    slug: Optional[str] = None
    short_description: Optional[str] = None
    content: str
    hero_image_url: Optional[str] = None
    author: Optional[str] = "Diet Leaves"
    is_published: bool = False
    is_pinned: bool = False
    display_order: int = 0

class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    short_description: Optional[str] = None
    content: Optional[str] = None
    hero_image_url: Optional[str] = None
    author: Optional[str] = None
    is_published: Optional[bool] = None
    is_pinned: Optional[bool] = None
    display_order: Optional[int] = None

class BlogPost(BaseModel):
    id: UUID
    title: str
    slug: str
    short_description: Optional[str] = None
    content: str
    hero_image_url: Optional[str] = None
    author: Optional[str] = "Diet Leaves"
    is_published: bool
    is_pinned: bool
    display_order: int
    created_at: datetime
    updated_at: datetime


# ===========================================
# HERO SECTION MODELS
# ===========================================

class HeroSectionCreate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    media_type: str = "image"
    media_url: Optional[str] = None
    media_width: int = 1920
    media_height: int = 1080
    link_url: Optional[str] = None
    link_text: Optional[str] = None
    display_order: int = 0
    is_active: bool = True

class HeroSectionUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    media_type: Optional[str] = None
    media_url: Optional[str] = None
    media_width: Optional[int] = None
    media_height: Optional[int] = None
    link_url: Optional[str] = None
    link_text: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None

class HeroSection(BaseModel):
    id: UUID
    title: Optional[str] = None
    subtitle: Optional[str] = None
    media_type: str
    media_url: Optional[str] = None
    media_width: int
    media_height: int
    link_url: Optional[str] = None
    link_text: Optional[str] = None
    display_order: int
    is_active: bool
    created_at: datetime


# ===========================================
# BANNER MODELS
# ===========================================

class BannerCreate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    image_width: int = 1200
    image_height: int = 400
    link_url: Optional[str] = None
    position: str = "homepage"
    display_order: int = 0
    is_active: bool = True

class BannerUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    image_width: Optional[int] = None
    image_height: Optional[int] = None
    link_url: Optional[str] = None
    position: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None

class Banner(BaseModel):
    id: UUID
    title: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    image_width: int
    image_height: int
    link_url: Optional[str] = None
    position: str
    display_order: int
    is_active: bool
    created_at: datetime


# ===========================================
# NAVIGATION MODELS
# ===========================================

class NavigationItemCreate(BaseModel):
    label: str
    url: str
    display_order: int = 0
    is_active: bool = True
    parent_id: Optional[UUID] = None

class NavigationItemUpdate(BaseModel):
    label: Optional[str] = None
    url: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None
    parent_id: Optional[UUID] = None

class NavigationItem(BaseModel):
    id: UUID
    label: str
    url: str
    display_order: int
    is_active: bool
    parent_id: Optional[UUID] = None


# ===========================================
# FOOTER MODELS
# ===========================================

class FooterItemCreate(BaseModel):
    label: str
    item_type: str = "text"  # text, social_link, page_link
    url: Optional[str] = None
    icon: Optional[str] = None
    section: str = "main"
    display_order: int = 0
    is_active: bool = True

class FooterItemUpdate(BaseModel):
    label: Optional[str] = None
    item_type: Optional[str] = None
    url: Optional[str] = None
    icon: Optional[str] = None
    section: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None

class FooterItem(BaseModel):
    id: UUID
    label: str
    item_type: str
    url: Optional[str] = None
    icon: Optional[str] = None
    section: str
    display_order: int
    is_active: bool


# ===========================================
# HOMEPAGE SECTION MODELS
# ===========================================

class HomepageSectionCreate(BaseModel):
    section_type: str
    title: Optional[str] = None
    subtitle: Optional[str] = None
    settings: Optional[dict] = None
    display_order: int = 0
    is_active: bool = True

class HomepageSectionUpdate(BaseModel):
    section_type: Optional[str] = None
    title: Optional[str] = None
    subtitle: Optional[str] = None
    settings: Optional[dict] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None

class HomepageSection(BaseModel):
    id: UUID
    section_type: str
    title: Optional[str] = None
    subtitle: Optional[str] = None
    settings: Optional[dict] = None
    display_order: int
    is_active: bool
