# routes/auth_routes.py
import secrets
from fastapi import APIRouter, HTTPException
from models.schemas import LoginRequest, LoginResponse
from services.auth import authenticate_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login/", response_model=LoginResponse)
async def login(login_request: LoginRequest):
    """Admin login endpoint"""
    user = authenticate_user(login_request.username, login_request.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Simple token generation
    access_token = secrets.token_urlsafe(32)
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        username=user["username"]
    )
