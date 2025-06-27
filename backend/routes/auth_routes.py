# routes/auth_routes.py
import secrets
import time
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends, Header
from models.schemas import LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse
from services.auth import authenticate_user, verify_refresh_token, create_tokens

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Store for refresh tokens (in production, use database or Redis)
refresh_tokens_store = {}

@router.post("/login/", response_model=LoginResponse)
async def login(login_request: LoginRequest):
    """User login endpoint with refresh token support"""
    user = authenticate_user(login_request.username, login_request.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Generate access and refresh tokens
    access_token = secrets.token_urlsafe(32)
    refresh_token = secrets.token_urlsafe(32)
    
    # Store refresh token with expiration (7 days)
    expires_at = datetime.utcnow() + timedelta(days=7)
    refresh_tokens_store[refresh_token] = {
        "user_id": user["user_id"],
        "username": user["username"],
        "role": user["role"],
        "expires_at": expires_at
    }
    
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=3600,  # 1 hour for access token
        username=user["username"],
        user_id=user["user_id"],
        role=user["role"]
    )

@router.post("/refresh/", response_model=RefreshTokenResponse)
async def refresh_token(refresh_request: RefreshTokenRequest):
    """Refresh access token using refresh token"""
    refresh_token = refresh_request.refresh_token
    
    if refresh_token not in refresh_tokens_store:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    token_data = refresh_tokens_store[refresh_token]
    
    # Check if refresh token is expired
    if datetime.utcnow() > token_data["expires_at"]:
        del refresh_tokens_store[refresh_token]
        raise HTTPException(status_code=401, detail="Refresh token expired")
    
    # Generate new tokens
    new_access_token = secrets.token_urlsafe(32)
    new_refresh_token = secrets.token_urlsafe(32)
    
    # Update refresh token store
    del refresh_tokens_store[refresh_token]  # Remove old token
    expires_at = datetime.utcnow() + timedelta(days=7)
    refresh_tokens_store[new_refresh_token] = {
        "user_id": token_data["user_id"],
        "username": token_data["username"],
        "role": token_data["role"],
        "expires_at": expires_at
    }
    
    return RefreshTokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=3600  # 1 hour for access token
    )

@router.post("/logout/")
async def logout(refresh_request: RefreshTokenRequest):
    """Logout endpoint to invalidate refresh token"""
    refresh_token = refresh_request.refresh_token
    
    if refresh_token in refresh_tokens_store:
        del refresh_tokens_store[refresh_token]
    
    return {"message": "Successfully logged out"}
