/**
 * Performance optimization utilities for the frontend
 * - Request deduplication
 * - Data caching
 * - Image lazy loading helpers
 */

// Simple in-memory cache for API responses
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

const cache = new Map<string, CacheEntry<any>>()

/**
 * Fetch with caching - prevents duplicate requests and caches responses
 */
export async function fetchWithCache<T>(
  url: string,
  options?: RequestInit & { cacheTTL?: number }
): Promise<T> {
  const cacheKey = `${url}-${JSON.stringify(options?.body || '')}`
  const cacheTTL = options?.cacheTTL || 60000 // Default 1 minute

  // Check cache
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data as T
  }

  // Fetch fresh data
  const response = await fetch(url, options)
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  const data = await response.json()
  
  // Cache the response
  cache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttl: cacheTTL
  })

  return data as T
}

/**
 * Invalidate cache by prefix
 */
export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    cache.clear()
    return
  }
  
  const keysToDelete = Array.from(cache.keys()).filter(key => key.startsWith(prefix))
  keysToDelete.forEach(key => cache.delete(key))
}

/**
 * Preload images for better perceived performance
 */
export function preloadImages(urls: string[]): void {
  urls.forEach(url => {
    if (url) {
      const img = new Image()
      img.src = url
    }
  })
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle function for scroll events
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Check if element is in viewport (for lazy loading)
 */
export function isInViewport(element: HTMLElement, margin = 100): boolean {
  const rect = element.getBoundingClientRect()
  return (
    rect.top >= -margin &&
    rect.left >= -margin &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + margin &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth) + margin
  )
}

/**
 * Request idle callback polyfill
 */
export const requestIdleCallback =
  typeof window !== 'undefined' && window.requestIdleCallback
    ? window.requestIdleCallback
    : (cb: IdleRequestCallback) => setTimeout(cb, 1)

/**
 * Get optimized image URL with size parameters (for Supabase storage)
 */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  width?: number,
  height?: number,
  quality = 80
): string {
  if (!url) return ''
  
  // Supabase storage doesn't support direct image transformation
  // This is a placeholder for future CDN integration
  return url
}

/**
 * Batch multiple API calls for efficiency
 */
export async function batchRequests<T>(
  requests: Promise<T>[]
): Promise<PromiseSettledResult<T>[]> {
  return Promise.allSettled(requests)
}

/**
 * Measure performance of a function
 */
export function measurePerformance<T>(
  name: string,
  fn: () => T
): T {
  if (typeof window !== 'undefined' && window.performance) {
    const start = performance.now()
    const result = fn()
    const end = performance.now()
    console.debug(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`)
    return result
  }
  return fn()
}
