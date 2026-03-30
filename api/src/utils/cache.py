"""
Simple In-Memory Cache for API Responses
Provides caching for frequently accessed data like products and categories
"""
import time
from typing import Any, Dict, Optional
from functools import wraps
import hashlib
import json

# Simple in-memory cache store
_cache: Dict[str, Dict[str, Any]] = {}

def get_cache_key(prefix: str, params: Dict[str, Any]) -> str:
    """Generate a cache key from prefix and parameters"""
    params_str = json.dumps(params, sort_keys=True, default=str)
    hash_str = hashlib.md5(params_str.encode()).hexdigest()[:8]
    return f"{prefix}:{hash_str}"


def get_cached(key: str, ttl: int = 300) -> Optional[Any]:
    """
    Get a cached value if it exists and hasn't expired
    
    Args:
        key: Cache key
        ttl: Time to live in seconds (used to validate expiry)
    
    Returns:
        Cached value or None if not found/expired
    """
    if key in _cache:
        entry = _cache[key]
        if time.time() - entry["timestamp"] < ttl:
            return entry["value"]
        else:
            # Expired, remove from cache
            del _cache[key]
    return None


def set_cached(key: str, value: Any) -> None:
    """
    Set a value in the cache
    
    Args:
        key: Cache key
        value: Value to cache
    """
    _cache[key] = {
        "value": value,
        "timestamp": time.time()
    }


def invalidate_cache(prefix: Optional[str] = None) -> None:
    """
    Invalidate cache entries
    
    Args:
        prefix: If provided, only invalidate entries starting with this prefix
                If None, clear entire cache
    """
    global _cache
    if prefix is None:
        _cache = {}
    else:
        keys_to_delete = [k for k in _cache.keys() if k.startswith(prefix)]
        for key in keys_to_delete:
            del _cache[key]


def cache_response(prefix: str, ttl: int = 300):
    """
    Decorator to cache function responses
    
    Args:
        prefix: Cache key prefix (e.g., "products", "categories")
        ttl: Time to live in seconds (default: 5 minutes)
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key from function args
            cache_key = get_cache_key(prefix, {"args": args, "kwargs": kwargs})
            
            # Try to get from cache
            cached = get_cached(cache_key, ttl)
            if cached is not None:
                return cached
            
            # Call the actual function
            result = await func(*args, **kwargs)
            
            # Store in cache
            set_cached(cache_key, result)
            
            return result
        return wrapper
    return decorator


# Cache TTL constants (in seconds)
CACHE_TTL_SHORT = 60  # 1 minute
CACHE_TTL_MEDIUM = 300  # 5 minutes
CACHE_TTL_LONG = 900  # 15 minutes
CACHE_TTL_HOUR = 3600  # 1 hour
