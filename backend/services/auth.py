# services/auth.py
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Tuple
from database.operations import db_connection

def hash_password(password: str) -> str:
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return hash_password(password) == hashed_password

def authenticate_user(username: str, password: str) -> Optional[dict]:
    """Authenticate user credentials"""
    conn = db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, username, password_hash, role FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()
    
    if user and verify_password(password, user['password_hash']):
        return {
            "user_id": str(user['id']),
            "username": user['username'],
            "role": user['role']
        }
    return None

def create_tokens() -> Tuple[str, str]:
    """Create access and refresh tokens"""
    access_token = secrets.token_urlsafe(32)
    refresh_token = secrets.token_urlsafe(32)
    return access_token, refresh_token

def verify_refresh_token(refresh_token: str, token_store: Dict) -> Optional[Dict]:
    """Verify refresh token and return user data if valid"""
    if refresh_token not in token_store:
        return None
    
    token_data = token_store[refresh_token]
    
    # Check if refresh token is expired
    if datetime.utcnow() > token_data["expires_at"]:
        del token_store[refresh_token]
        return None
    
    return token_data
