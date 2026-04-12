"""
Diet Leaves API - Main Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import routes
from src.routes import products, orders, cart, admin, auth, settings, reviews, inventory, blog
from src.services.storage import create_storage_bucket
from src.middleware.performance import CacheMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    print("🌿 Diet Leaves API Starting...")
    # Create storage bucket if it doesn't exist
    create_storage_bucket()
    yield
    print("🌿 Diet Leaves API Shutting down...")

# Create FastAPI app
app = FastAPI(
    title="Diet Leaves API",
    description="E-commerce backend for Diet Leaves stevia products",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        os.getenv("FRONTEND_URL", "http://localhost:3000")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Performance middleware for caching headers
app.add_middleware(CacheMiddleware)

# GZip compression for responses > 500 bytes
app.add_middleware(GZipMiddleware, minimum_size=500)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(cart.router, prefix="/api/cart", tags=["Cart"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(reviews.router, prefix="/api/reviews", tags=["Reviews"])
app.include_router(settings.router, prefix="/api/settings", tags=["Site Settings"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(inventory.router, prefix="/api/admin/inventory", tags=["Inventory"])
app.include_router(blog.router, prefix="/api/blog", tags=["Blog"])

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "message": "Diet Leaves API is running",
        "version": "1.0.0"
    }

@app.get("/api/health")
async def health_check():
    """API health check"""
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("API_HOST", "0.0.0.0"),
        port=int(os.getenv("API_PORT", 8000)),
        reload=os.getenv("API_DEBUG", "true").lower() == "true"
    )
