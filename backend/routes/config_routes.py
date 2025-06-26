# routes/config_routes.py
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from models.schemas import StandardResponse
from config.settings import CONFIG
from services.auth import authenticate_user

router = APIRouter(prefix="/config", tags=["Configuration"])

@router.get("/")
async def get_config():
    """Get current configuration (non-sensitive values only)"""
    return {
        "model_config": {
            "base_llm_model": CONFIG.BASE_LLM_MODEL,
            "retriever_model": CONFIG.RETRIEVER_MODEL,
            "max_input_length": CONFIG.MAX_INPUT_LENGTH,
            "max_new_tokens": CONFIG.MAX_NEW_TOKENS,
            "rag_top_k": CONFIG.RAG_TOP_K,
            "rag_confidence_threshold": CONFIG.RAG_CONFIDENCE_THRESHOLD,
            "booking_similarity_threshold": CONFIG.BOOKING_SIMILARITY_THRESHOLD
        },
        "system_config": {
            "llm_timeout_seconds": CONFIG.LLM_TIMEOUT_SECONDS,
            "batch_size": CONFIG.BATCH_SIZE
        },
        "keywords": {
            "booking_intent_keywords": list(CONFIG.BOOKING_INTENT_KEYWORDS),
            "confirmation_keywords": list(CONFIG.CONFIRMATION_KEYWORDS),
            "price_inquiry_keywords": list(CONFIG.PRICE_INQUIRY_KEYWORDS)
        }
    }

@router.put("/thresholds/")
async def update_thresholds(thresholds: Dict[str, float]):
    """Update AI model thresholds (admin only)"""
    # Note: This would require proper authentication in production
    
    updated = {}
    
    if "rag_confidence_threshold" in thresholds:
        CONFIG.RAG_CONFIDENCE_THRESHOLD = thresholds["rag_confidence_threshold"]
        updated["rag_confidence_threshold"] = CONFIG.RAG_CONFIDENCE_THRESHOLD
    
    if "booking_similarity_threshold" in thresholds:
        CONFIG.BOOKING_SIMILARITY_THRESHOLD = thresholds["booking_similarity_threshold"] 
        updated["booking_similarity_threshold"] = CONFIG.BOOKING_SIMILARITY_THRESHOLD
    
    if not updated:
        raise HTTPException(status_code=400, detail="No valid thresholds provided")
    
    return StandardResponse(
        message=f"Updated thresholds: {', '.join(updated.keys())}"
    )

@router.get("/keywords/")
async def get_keywords():
    """Get all configured keywords"""
    return {
        "booking_intent": list(CONFIG.BOOKING_INTENT_KEYWORDS),
        "confirmation": list(CONFIG.CONFIRMATION_KEYWORDS),
        "price_inquiry": list(CONFIG.PRICE_INQUIRY_KEYWORDS)
    }

@router.post("/keywords/booking/")
async def add_booking_keyword(keyword_data: Dict[str, str]):
    """Add new booking intent keyword"""
    keyword = keyword_data.get("keyword", "").strip()
    if not keyword:
        raise HTTPException(status_code=400, detail="Keyword cannot be empty")
    
    CONFIG.BOOKING_INTENT_KEYWORDS.add(keyword.lower())
    
    return StandardResponse(
        message=f"Added booking keyword: {keyword}"
    )
