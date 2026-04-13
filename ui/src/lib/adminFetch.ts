/**
 * Authenticated fetch wrapper for admin pages.
 * Automatically injects the Bearer token from localStorage.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

export async function adminFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const authHeaders = getAuthHeaders()
  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (options.body instanceof FormData) {
    delete authHeaders['Content-Type']
  }
  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...authHeaders,
      ...(options.headers || {}),
    },
  })
}

export { API_URL }
