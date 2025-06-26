# services/security.py
import hashlib
import secrets
import bcrypt
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import HTTPException, status
from config.settings import AuthConfig

class SecurityService:
    """Enhanced security service with password hashing, rate limiting, and JWT management"""
    
    def __init__(self):
        self.failed_login_attempts = {}
        self.blocked_ips = {}
        self.max_attempts = 5
        self.block_duration = 900  # 15 minutes
    
    def hash_password(self, password: str) -> str:
        """Hash password using bcrypt"""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    def verify_password(self, password: str, hashed: str) -> bool:
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None):
        """Create JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=AuthConfig.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, AuthConfig.SECRET_KEY, algorithm=AuthConfig.ALGORITHM)
        return encoded_jwt
    
    def verify_token(self, token: str) -> dict:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, AuthConfig.SECRET_KEY, algorithms=[AuthConfig.ALGORITHM])
            return payload
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    def check_rate_limit(self, ip_address: str) -> bool:
        """Check if IP is rate limited"""
        current_time = datetime.now()
        
        # Clean up old blocked IPs
        self.blocked_ips = {
            ip: block_time for ip, block_time in self.blocked_ips.items()
            if current_time - block_time < timedelta(seconds=self.block_duration)
        }
        
        return ip_address not in self.blocked_ips
    
    def record_failed_login(self, ip_address: str):
        """Record failed login attempt"""
        current_time = datetime.now()
        
        if ip_address not in self.failed_login_attempts:
            self.failed_login_attempts[ip_address] = []
        
        # Clean up old attempts (older than 1 hour)
        self.failed_login_attempts[ip_address] = [
            attempt_time for attempt_time in self.failed_login_attempts[ip_address]
            if current_time - attempt_time < timedelta(hours=1)
        ]
        
        self.failed_login_attempts[ip_address].append(current_time)
        
        # Block IP if too many attempts
        if len(self.failed_login_attempts[ip_address]) >= self.max_attempts:
            self.blocked_ips[ip_address] = current_time
    
    def clear_failed_attempts(self, ip_address: str):
        """Clear failed login attempts for IP"""
        if ip_address in self.failed_login_attempts:
            del self.failed_login_attempts[ip_address]
    
    def generate_api_key(self) -> str:
        """Generate secure API key"""
        return secrets.token_urlsafe(32)
    
    def hash_api_key(self, api_key: str) -> str:
        """Hash API key for storage"""
        return hashlib.sha256(api_key.encode()).hexdigest()

# Global security service instance
security_service = SecurityService()
