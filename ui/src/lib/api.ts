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
  
  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      'X-Session-ID': sessionId,
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
}

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    fetchAPI('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  
  signup: (data: { email: string; password: string; full_name?: string }) =>
    fetchAPI('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  logout: () =>
    fetchAPI('/api/auth/logout', { method: 'POST' }),
  
  getProfile: () =>
    fetchAPI('/api/auth/me'),
  
  updateProfile: (data: { full_name?: string; phone?: string; address?: string; city?: string }) =>
    fetchAPI('/api/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
}

export default fetchAPI
