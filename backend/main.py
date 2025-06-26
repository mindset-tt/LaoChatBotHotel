# main.py
# app.py - REFACTORED VERSION
# OPTIMIZED VERSION for RTX 3050 Ti Mobile (4GB VRAM)
# This script runs a FastAPI server that integrates:
# 1. A real-time booking system via a SQLite database.
# 2. A RAG system to retrieve context from a local knowledge base.
# 3. YOUR fine-tuned LLM for intelligent answer generation.
# 4. A timeout fallback mechanism for fast responses.

import uvicorn
import logging
import torchvision
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import configuration and utilities
from config.settings import CONFIG
from utils.logging_config import setup_logging

# Import database setup
from database.operations import setup_database

# Import ML model loading
from services.ml_models import load_all_models_and_data

# Import all route modules
from routes.auth_routes import router as auth_router
from routes.booking_routes import router as booking_router
from routes.room_routes import router as room_router
from routes.chatbot_routes import router as chatbot_router
from routes.history_routes import router as history_router
from routes.system_routes import router as system_router
from routes.config_routes import router as config_router
from routes.backup_routes import router as backup_router
from routes.analytics_routes import router as analytics_router
from routes.model_routes import router as model_router
from routes.notification_routes import router as notification_router
from routes.dashboard_routes import router as dashboard_router

# Import middleware
try:
    from middleware.security import RateLimitMiddleware
    from middleware.error_handling import ErrorHandlingMiddleware, RequestLoggingMiddleware
    MIDDLEWARE_AVAILABLE = True
except ImportError:
    MIDDLEWARE_AVAILABLE = False
    logging.warning("Middleware not available - running without rate limiting and enhanced error handling")

# Setup logging
setup_logging()

# Print version for debugging
print(f"TorchVision version: {torchvision.__version__}")

# --- FastAPI App ---
app = FastAPI(
    title="Lao Hotel Chatbot API - Mobile GPU Optimized",
    version="2.2.0",
    description="""
    🏨 **Lao Hotel Management & AI Chatbot System**
    
    A comprehensive hotel management system with AI-powered chatbot for Vang Vieng, Laos.
    
    ## Features
    * 🤖 **AI Chatbot** - Intelligent responses in Lao language using fine-tuned LLM
    * 📅 **Booking Management** - Real-time room booking and management
    * 🏨 **Room Management** - Complete hotel room status tracking
    * 📚 **Chat History** - Persistent conversation history
    * 🔐 **Authentication** - Secure admin access
    * 📊 **System Monitoring** - GPU and system status tracking
    
    ## Optimizations
    * ⚡ Optimized for RTX 3050 Ti Mobile (4GB VRAM)
    * 🚀 4-bit quantization for memory efficiency
    * 📦 RAG system with local knowledge base
    * ⏱️ Timeout fallback for fast responses
    """,
    contact={
        "name": "Hotel Management Team",
        "email": "admin@vangvienghotel.la"
    },
    license_info={
        "name": "MIT",
    },
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add custom middleware if available
if MIDDLEWARE_AVAILABLE:
    app.add_middleware(ErrorHandlingMiddleware)
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(RateLimitMiddleware, calls=100, period=60)  # 100 calls per minute

# Include all routers
app.include_router(auth_router)
app.include_router(booking_router)
app.include_router(room_router)
app.include_router(chatbot_router)
app.include_router(history_router)
app.include_router(system_router)
app.include_router(config_router)
app.include_router(backup_router)
app.include_router(analytics_router)
app.include_router(model_router)
app.include_router(notification_router)
app.include_router(dashboard_router)

@app.on_event("startup")
async def startup_event():
    """Initialize database and load ML models on startup"""
    setup_database()
    load_all_models_and_data()

# --- Main Execution Block ---
if __name__ == "__main__":
    print(f"Database file: {CONFIG.DB_FILE}")
    port = 8000
    logging.info(f"\n✅ Starting server optimized for RTX 3050 Ti Mobile on http://0.0.0.0:{port}...")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
