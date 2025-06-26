# services/auth.py
import hashlib
from typing import Optional
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
            "id": user['id'],
            "username": user['username'],
            "role": user['role']
        }
    return None
