const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
}

async function fetchAPI<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options
  
  let url = `${API_URL}${endpoint}`
  
  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += `?${queryString}`
    }
  }
  
  // Get session ID from localStorage
  const sessionId = typeof window !== 'undefined' 
    ? localStorage.getItem('cart_session_id') || generateSessionId()
    : ''

  // Get auth token
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Session-ID': sessionId,
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...fetchOptions,
    cache: 'no-store',  // Always fetch fresh data to prevent stale nav/settings
    headers: {
      ...headers,
      ...fetchOptions.headers,
    },
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }))
    throw new Error(error.detail || 'An error occurred')
  }
  
  return response.json()
}

function generateSessionId(): string {
  const sessionId = crypto.randomUUID()
  if (typeof window !== 'undefined') {
    localStorage.setItem('cart_session_id', sessionId)
  }
  return sessionId
}

// Products API
export const productsAPI = {
  getAll: (params?: { page?: number; limit?: number; category?: string; featured?: boolean; on_sale?: boolean; search?: string }) =>
    fetchAPI('/api/products', { params }),
  
  getFeatured: (limit = 6) =>
    fetchAPI(`/api/products/featured?limit=${limit}`),
  
  getOnSale: (limit = 6) =>
    fetchAPI(`/api/products/on-sale?limit=${limit}`),
  
  getBySlug: (slug: string) =>
    fetchAPI(`/api/products/${slug}`),
  
  getReviews: (productId: string) =>
    fetchAPI(`/api/products/${productId}/reviews`),
  
  createReview: (productId: string, review: { rating: number; title?: string; review_text?: string; customer_name?: string; customer_email?: string }) =>
    fetchAPI(`/api/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(review),
    }),
  
  getCategories: () =>
    fetchAPI('/api/products/categories/all'),
}

// Cart API
export const cartAPI = {
  get: () =>
    fetchAPI('/api/cart'),
  
  add: (productId: string, quantity = 1, variantId?: string) =>
    fetchAPI('/api/cart/add', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity, variant_id: variantId }),
    }),
  
  update: (itemId: string, quantity: number) =>
    fetchAPI(`/api/cart/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }),
  
  remove: (itemId: string) =>
    fetchAPI(`/api/cart/${itemId}`, { method: 'DELETE' }),
  
  clear: () =>
    fetchAPI('/api/cart', { method: 'DELETE' }),
}

// Orders API
export const ordersAPI = {
  create: (orderData: any) =>
    fetchAPI('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),
  
  getByNumber: (orderNumber: string) =>
    fetchAPI(`/api/orders/${orderNumber}`),
  
  track: (orderNumber: string) =>
    fetchAPI(`/api/orders/track/${orderNumber}`),
}

// Settings API
export const settingsAPI = {
  get: () =>
    fetchAPI('/api/settings'),
  
  getNavigation: () =>
    fetchAPI('/api/settings/navigation'),
  
  getFooter: () =>
    fetchAPI('/api/settings/footer'),
  
  getHero: () =>
    fetchAPI('/api/settings/hero'),
  
  getBanners: (position = 'homepage') =>
    fetchAPI(`/api/settings/banners?position=${position}`),
  
  getHomepageSections: () =>
    fetchAPI('/api/settings/homepage-sections'),
  
  getHomepageData: () =>
    fetchAPI('/api/settings/homepage-data'),
}

// Auth API
export const authAPI = {
  login: (identifier: string, password: string) =>
    fetchAPI('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    }),

  adminLogin: (identifier: string, password: string) =>
    fetchAPI('/api/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    }),
  
  signup: (data: { email?: string; phone?: string; password: string; full_name?: string }) =>
    fetchAPI('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  logout: () =>
    fetchAPI('/api/auth/logout', { method: 'POST' }),
  
  getProfile: () =>
    fetchAPI('/api/auth/me'),
  
  updateProfile: (data: { full_name?: string; phone?: string; address?: string; city?: string; email_notifications?: boolean }) =>
    fetchAPI('/api/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  forgotPassword: (email: string) =>
    fetchAPI('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, new_password: string) =>
    fetchAPI('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password }),
    }),

  myOrders: () =>
    fetchAPI('/api/orders/my-orders'),
}

// Reviews API
export const reviewsAPI = {
  getFeatured: (limit: number = 6) =>
    fetchAPI(`/api/reviews/featured`, { params: { limit } }),
  
  getByProduct: (productId: string, page: number = 1, limit: number = 20) =>
    fetchAPI(`/api/reviews/${productId}`, { params: { page, limit } }),
  
  getStats: (productId: string) =>
    fetchAPI(`/api/reviews/stats/${productId}`),
  
  create: (data: {
    product_id: string;
    customer_name?: string;
    customer_email?: string;
    rating: number;
    title?: string;
    review_text?: string;
  }) =>
    fetchAPI('/api/reviews/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

export default fetchAPI
