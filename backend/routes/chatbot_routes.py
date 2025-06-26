# routes/chatbot_routes.py
from typing import List, Dict
from fastapi import APIRouter, HTTPException
from models.schemas import Query, Answer, StandardResponse
from services.chatbot import generate_orchestrated_answer
from services.conversation import convo_manager
from services.ml_models import model_store

router = APIRouter(tags=["Chatbot"])

@router.post("/ask/", response_model=Answer)
async def ask_question(query: Query):
    """Main chatbot endpoint"""
    if not model_store.models_loaded: 
        raise HTTPException(status_code=503, detail="Models are not loaded yet.")
    if not query.text.strip(): 
        raise HTTPException(status_code=400, detail="Query text cannot be empty.")
    reply, source = await generate_orchestrated_answer(query.text, query.session_id)
    return Answer(reply=reply, source=source, session_id=query.session_id)

@router.post("/clear_session/", response_model=StandardResponse)
async def clear_session(query: dict):
    """Clear conversation session"""
    session_id = query.get("session_id")
    if not session_id: 
        raise HTTPException(status_code=400, detail="session_id is required.")
    if convo_manager.clear_session(session_id):
        return StandardResponse(message="Short-term memory and state cleared.", session_id=session_id)
    else:
        raise HTTPException(status_code=404, detail="Session ID not found in short-term memory.")
