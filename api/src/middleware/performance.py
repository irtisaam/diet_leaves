"""
Middleware for API performance optimization
- Response caching headers
- Request logging
- Rate limiting (basic)
"""
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import time

class CacheMiddleware(BaseHTTPMiddleware):
    """Add cache-control headers to API responses"""
    
    # Paths and their cache durations (in seconds)
    CACHEABLE_PATHS = {
        "/api/products/featured": 120,  # 2 minutes for featured
        "/api/products/on-sale": 120,  # 2 minutes for sale
        "/api/products/categories": 300,  # 5 minutes for categories
        "/api/products": 60,  # 1 minute for product lists
        "/api/settings/homepage-data": 30,  # 30 seconds for homepage aggregate
        "/api/settings/faqs": 60,           # 1 minute for public FAQs
        "/api/settings": 300,               # 5 minutes for settings
        "/api/reviews/featured": 120,  # 2 minutes for featured reviews
        "/api/reviews/stats": 180,  # 3 minutes for review stats
    }
    
    async def dispatch(self, request: Request, call_next):
        # Record start time
        start_time = time.time()
        
        # Process request
        response = await call_next(request)
        
        # Calculate response time
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = f"{process_time:.4f}"
        
        # Add cache headers for GET requests only
        if request.method == "GET":
            path = request.url.path
            
            # Check if path should be cached
            for cacheable_path, cache_duration in self.CACHEABLE_PATHS.items():
                if path.startswith(cacheable_path):
                    # Don't cache if response has error
                    if 200 <= response.status_code < 300:
                        response.headers["Cache-Control"] = (
                            f"public, max-age={cache_duration}, "
                            f"stale-while-revalidate={cache_duration * 2}"
                        )
                    break
            else:
                # Default: no-store for non-cacheable paths
                if "Cache-Control" not in response.headers:
                    response.headers["Cache-Control"] = "no-store"
        else:
            # No caching for non-GET requests
            response.headers["Cache-Control"] = "no-store"
        
        return response


class CompressionMiddleware(BaseHTTPMiddleware):
    """
    Placeholder for compression - actual gzip compression 
    should be handled by a reverse proxy (nginx) in production
    """
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        # Add Vary header to indicate content varies by Accept-Encoding
        response.headers["Vary"] = "Accept-Encoding"
        return response
