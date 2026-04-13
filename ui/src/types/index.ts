// Product Types
export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  short_description: string | null
  category_id: string | null
  price: number
  compare_at_price: number | null
  sku: string | null
  stock_quantity: number
  is_active: boolean
  is_featured: boolean
  is_on_sale: boolean
  nutritional_info: NutritionalInfo | null
  ingredients: string | null
  servings_per_container: number | null
  created_at: string
  updated_at: string
  images: ProductImage[]
  variants: ProductVariant[]
}

export interface ProductImage {
  id: string
  product_id: string
  image_url: string
  alt_text: string | null
  display_order: number
  is_primary: boolean
}

export interface ProductVariant {
  id: string
  product_id: string
  name: string
  sku: string | null
  price: number
  compare_at_price: number | null
  stock_quantity: number
  is_active: boolean
}

export interface NutritionalInfo {
  calories: number
  calories_from_fat: number
  total_fat: number
  cholesterol: number
  sodium: number
  potassium: number
  carbohydrate: number
  protein: number
  vitamin_d: number
  iron: number
  calcium: number
  total_sugar: number
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  display_order: number
  is_active: boolean
  created_at: string
}

// Cart Types
export interface CartItem {
  id: string
  user_id: string | null
  session_id: string | null
  product_id: string
  variant_id: string | null
  quantity: number
  product: Product | null
  created_at: string
}

export interface Cart {
  items: CartItem[]
  subtotal: number
  shipping: number
  total: number
  item_count: number
}

// Order Types
export interface Order {
  id: string
  order_number: string
  user_id: string | null
  customer_email: string
  customer_phone: string | null
  customer_name: string
  shipping_address: string
  shipping_city: string
  shipping_country: string
  subtotal: number
  shipping_cost: number
  discount_amount: number
  total: number
  payment_method: string
  payment_status: string
  status: string
  tracking_number: string | null
  shipping_carrier: string | null
  email_notifications: boolean
  created_at: string
  updated_at: string
  items: OrderItem[]
}

// User / Auth Types
export interface User {
  id: string
  email: string | null
  full_name: string | null
  phone: string | null
  address: string | null
  city: string | null
  country: string
  is_admin: boolean
  role: string
  email_notifications: boolean
  created_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  variant_id: string | null
  product_name: string
  variant_name: string | null
  quantity: number
  unit_price: number
  total_price: number
}

// Site Settings Types
export interface SiteSettings {
  site_name: string
  site_logo: string
  announcement_bar_text: string
  announcement_bar_enabled: string
  primary_color: string
  secondary_color: string
  contact_email: string
  contact_phone: string
  contact_address: string
  free_shipping_threshold: string
  shipping_cost: string
  currency: string
  currency_symbol: string
}

export interface NavigationItem {
  id: string
  label: string
  url: string
  display_order: number
  is_active: boolean
  parent_id: string | null
}

export interface FooterItem {
  id: string
  label: string
  item_type: 'text' | 'social_link' | 'page_link'
  url: string | null
  icon: string | null
  section: string
  display_order: number
  is_active: boolean
}

export interface HeroSection {
  id: string
  title: string | null
  subtitle: string | null
  media_type: 'image' | 'video'
  media_url: string
  media_width: number
  media_height: number
  link_url: string | null
  link_text: string | null
  display_order: number
  is_active: boolean
  created_at: string
}

export interface Banner {
  id: string
  title: string | null
  description: string | null
  image_url: string
  image_width: number
  image_height: number
  link_url: string | null
  position: string
  display_order: number
  is_active: boolean
  created_at: string
}

export interface HomepageSection {
  id: string
  section_type: string
  title: string | null
  subtitle: string | null
  settings: Record<string, any> | null
  display_order: number
  is_active: boolean
}

// Review Types
export interface Review {
  id: string
  product_id: string
  user_id: string | null
  customer_name: string | null
  rating: number
  title: string | null
  review_text: string | null
  is_verified_purchase: boolean
  created_at: string
}

// API Response Types
export interface ProductListResponse {
  products: Product[]
  total: number
  page: number
  limit: number
}

export interface OrderListResponse {
  orders: Order[]
  total: number
}
