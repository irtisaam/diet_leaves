"""
Supabase Database Connection
"""
import os
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

# Load .env from repo root (diet_leaves/.env) or api/.env
_repo_root = Path(__file__).resolve().parents[3]
load_dotenv(_repo_root / ".env")
load_dotenv(_repo_root / "api" / ".env")

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Use service role for backend
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

def get_supabase_client() -> Client:
    """Get Supabase client with service role key (full access)"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("Supabase URL and Key must be set in environment variables")
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def get_supabase_anon_client() -> Client:
    """Get Supabase client with anon key (for public operations)"""
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise ValueError("Supabase URL and Anon Key must be set in environment variables")
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Create singleton instance
supabase: Client = get_supabase_client()
