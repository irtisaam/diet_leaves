"""
Supabase Storage Service for Image Uploads
"""
import os
import uuid
from typing import Optional
from fastapi import UploadFile, HTTPException
from ..utils.database import supabase

BUCKET_NAME = "product-images"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def get_file_extension(filename: str) -> str:
    """Get file extension from filename"""
    return os.path.splitext(filename)[1].lower() if filename else ""


def validate_image(file: UploadFile) -> bool:
    """Validate uploaded image file"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    ext = get_file_extension(file.filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    return True


async def upload_image(
    file: UploadFile,
    folder: str = "products",
    filename: Optional[str] = None
) -> str:
    """
    Upload image to Supabase Storage and return public URL
    
    Args:
        file: FastAPI UploadFile object
        folder: Folder path within bucket (e.g., 'products', 'banners', 'hero')
        filename: Custom filename (optional, generates UUID if not provided)
    
    Returns:
        Public URL of the uploaded image
    """
    validate_image(file)
    
    # Generate unique filename
    ext = get_file_extension(file.filename)
    if not filename:
        filename = f"{uuid.uuid4()}{ext}"
    
    # Full path in storage
    file_path = f"{folder}/{filename}"
    
    try:
        # Read file content
        content = await file.read()
        
        # Check file size
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
            )
        
        # Upload to Supabase Storage
        result = supabase.storage.from_(BUCKET_NAME).upload(
            path=file_path,
            file=content,
            file_options={"content-type": file.content_type or "image/jpeg"}
        )
        
        # Get public URL
        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(file_path)
        
        return public_url
        
    except Exception as e:
        error_msg = str(e)
        # Handle duplicate file error - update existing
        if "Duplicate" in error_msg or "already exists" in error_msg:
            try:
                # Remove existing and re-upload
                supabase.storage.from_(BUCKET_NAME).remove([file_path])
                await file.seek(0)
                content = await file.read()
                supabase.storage.from_(BUCKET_NAME).upload(
                    path=file_path,
                    file=content,
                    file_options={"content-type": file.content_type or "image/jpeg"}
                )
                return supabase.storage.from_(BUCKET_NAME).get_public_url(file_path)
            except Exception as inner_e:
                raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(inner_e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {error_msg}")


async def delete_image(image_url: str) -> bool:
    """
    Delete image from Supabase Storage
    
    Args:
        image_url: Full public URL of the image
    
    Returns:
        True if deleted successfully
    """
    try:
        # Extract file path from URL
        # URL format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
        if BUCKET_NAME in image_url:
            path = image_url.split(f"{BUCKET_NAME}/")[1]
            supabase.storage.from_(BUCKET_NAME).remove([path])
            return True
        return False
    except Exception as e:
        print(f"Failed to delete image: {str(e)}")
        return False


async def upload_multiple_images(
    files: list[UploadFile],
    folder: str = "products"
) -> list[str]:
    """
    Upload multiple images and return list of URLs
    """
    urls = []
    for file in files:
        url = await upload_image(file, folder)
        urls.append(url)
    return urls


def create_storage_bucket():
    """
    Create the storage bucket if it doesn't exist
    Call this on app startup
    """
    try:
        # Check if bucket exists
        buckets = supabase.storage.list_buckets()
        bucket_names = [b.name for b in buckets]
        
        if BUCKET_NAME not in bucket_names:
            # Create public bucket for product images
            supabase.storage.create_bucket(
                BUCKET_NAME,
                options={
                    "public": True,
                    "file_size_limit": MAX_FILE_SIZE
                }
            )
            print(f"✅ Created storage bucket: {BUCKET_NAME}")
        else:
            print(f"✅ Storage bucket exists: {BUCKET_NAME}")
            
    except Exception as e:
        print(f"⚠️ Storage bucket setup: {str(e)}")
