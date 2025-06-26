# routes/system_routes.py
import time
import psutil
from datetime import datetime
from fastapi import APIRouter
from services.ml_models import check_gpu_memory, model_store
from database.operations import db_connection
import torch

router = APIRouter(prefix="/system", tags=["System"])

# Store startup time
startup_time = time.time()

@router.get("/health/")
async def health_check():
    """Basic health check endpoint"""
    try:
        # Test database connection
        conn = db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        conn.close()
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    # Check model status
    model_status = "loaded" if model_store.models_loaded else "not_loaded"
    
    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "timestamp": datetime.utcnow().isoformat(),
        "database": db_status,
        "models": model_status,
        "uptime_seconds": time.time() - startup_time
    }

@router.get("/gpu_status/")
async def get_gpu_status():
    """Get GPU status information"""
    if torch.cuda.is_available():
        allocated, reserved = check_gpu_memory()
        return {
            "gpu_available": True,
            "allocated_gb": allocated,
            "reserved_gb": reserved,
            "device_name": torch.cuda.get_device_name(),
            "device_count": torch.cuda.device_count(),
            "cuda_version": torch.version.cuda
        }
    return {"gpu_available": False}

@router.get("/metrics/")
async def get_system_metrics():
    """Get comprehensive system metrics"""
    # CPU and Memory
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    # GPU info
    gpu_info = {}
    if torch.cuda.is_available():
        allocated, reserved = check_gpu_memory()
        gpu_info = {
            "allocated_gb": allocated,
            "reserved_gb": reserved,
            "device_name": torch.cuda.get_device_name(),
        }
    
    # Database stats
    try:
        conn = db_connection()
        cursor = conn.cursor()
        
        # Count total rooms
        cursor.execute("SELECT COUNT(*) as total FROM rooms")
        total_rooms = cursor.fetchone()["total"]
        
        # Count available rooms
        cursor.execute("SELECT COUNT(*) as available FROM rooms WHERE status = 'Available'")
        available_rooms = cursor.fetchone()["available"]
        
        # Count chat sessions
        cursor.execute("SELECT COUNT(DISTINCT session_id) as sessions FROM chat_history")
        total_sessions = cursor.fetchone()["sessions"]
        
        # Count total messages
        cursor.execute("SELECT COUNT(*) as messages FROM chat_history")
        total_messages = cursor.fetchone()["messages"]
        
        conn.close()
        
        db_stats = {
            "total_rooms": total_rooms,
            "available_rooms": available_rooms,
            "booked_rooms": total_rooms - available_rooms,
            "total_chat_sessions": total_sessions,
            "total_messages": total_messages
        }
    except Exception as e:
        db_stats = {"error": str(e)}
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "uptime_seconds": time.time() - startup_time,
        "system": {
            "cpu_percent": cpu_percent,
            "memory_percent": memory.percent,
            "memory_used_gb": memory.used / (1024**3),
            "memory_total_gb": memory.total / (1024**3),
            "disk_percent": disk.percent,
            "disk_used_gb": disk.used / (1024**3),
            "disk_total_gb": disk.total / (1024**3)
        },
        "gpu": gpu_info,
        "database": db_stats,
        "models": {
            "loaded": model_store.models_loaded,
            "rag_chunks": len(model_store.rag_chunks) if model_store.rag_chunks else 0
        }
    }
