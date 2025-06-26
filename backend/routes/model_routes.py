# routes/model_routes.py
from fastapi import APIRouter, HTTPException
from models.schemas import StandardResponse
from services.ml_models import model_store, cleanup_gpu_memory, check_gpu_memory
from config.settings import CONFIG

router = APIRouter(prefix="/models", tags=["Model Management"])

@router.get("/status/")
async def get_model_status():
    """Get current model loading status"""
    return {
        "models_loaded": model_store.models_loaded,
        "retriever_loaded": model_store.retriever is not None,
        "generator_loaded": model_store.generator_llm is not None,
        "tokenizer_loaded": model_store.tokenizer is not None,
        "rag_chunks_count": len(model_store.rag_chunks) if model_store.rag_chunks else 0,
        "device": str(model_store.device) if model_store.device else None
    }

@router.post("/cleanup/")
async def cleanup_models():
    """Clean up GPU memory"""
    try:
        cleanup_gpu_memory()
        allocated, reserved = check_gpu_memory()
        return {
            "message": "GPU memory cleaned up successfully",
            "gpu_memory": {
                "allocated_gb": allocated,
                "reserved_gb": reserved
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")

@router.post("/reload/")
async def reload_models():
    """Reload ML models (caution: this will take time)"""
    try:
        # Reset model store
        model_store.models_loaded = False
        model_store.retriever = None
        model_store.generator_llm = None
        model_store.tokenizer = None
        model_store.rag_chunks = []
        model_store.rag_embeddings = None
        
        # Clean up memory
        cleanup_gpu_memory()
        
        # Reload models
        from services.ml_models import load_all_models_and_data
        load_all_models_and_data()
        
        return StandardResponse(message="Models reloaded successfully")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model reload failed: {str(e)}")

@router.get("/config/")
async def get_model_config():
    """Get current model configuration"""
    return {
        "base_llm_model": CONFIG.BASE_LLM_MODEL,
        "retriever_model": CONFIG.RETRIEVER_MODEL,
        "finetuned_output_dir": CONFIG.FINETUNED_OUTPUT_DIR,
        "knowledge_base_path": CONFIG.KNOWLEDGE_BASE_PATH,
        "max_input_length": CONFIG.MAX_INPUT_LENGTH,
        "max_new_tokens": CONFIG.MAX_NEW_TOKENS,
        "batch_size": CONFIG.BATCH_SIZE,
        "rag_top_k": CONFIG.RAG_TOP_K,
        "rag_confidence_threshold": CONFIG.RAG_CONFIDENCE_THRESHOLD
    }

@router.get("/memory/")
async def get_memory_usage():
    """Get detailed memory usage information"""
    try:
        import torch
        import psutil
        
        memory_info = {}
        
        # System memory
        sys_memory = psutil.virtual_memory()
        memory_info["system"] = {
            "total_gb": round(sys_memory.total / (1024**3), 2),
            "used_gb": round(sys_memory.used / (1024**3), 2),
            "available_gb": round(sys_memory.available / (1024**3), 2),
            "percent_used": sys_memory.percent
        }
        
        # GPU memory
        if torch.cuda.is_available():
            allocated, reserved = check_gpu_memory()
            total_memory = torch.cuda.get_device_properties(0).total_memory / (1024**3)
            
            memory_info["gpu"] = {
                "total_gb": round(total_memory, 2),
                "allocated_gb": allocated,
                "reserved_gb": reserved,
                "free_gb": round(total_memory - reserved, 2),
                "device_name": torch.cuda.get_device_name()
            }
        else:
            memory_info["gpu"] = {"available": False}
        
        return memory_info
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Memory info error: {str(e)}")
