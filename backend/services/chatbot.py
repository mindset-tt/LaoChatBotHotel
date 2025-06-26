# services/chatbot.py
import logging
import uuid
from typing import Tuple

# Handle imports with error handling
try:
    from laonlp.tokenize import word_tokenize
except ImportError:
    word_tokenize = None

from database.operations import db_connection
from services.ml_models import get_rag_context, generate_llm_answer_sync
from services.conversation import (
    convo_manager, detect_booking_intent, handle_booking_request,
    handle_room_selection, handle_date_selection, handle_booking_confirmation
)

def save_chat_to_db(session_id: str, role: str, content: str):
    """Save chat message to database"""
    conn = db_connection()
    cursor = conn.cursor()
    message_id = str(uuid.uuid4())
    cursor.execute("INSERT INTO chat_history (message_id, session_id, role, content) VALUES (?, ?, ?, ?)", 
                   (message_id, session_id, role, content))
    conn.commit()
    conn.close()

async def generate_orchestrated_answer(user_input: str, session_id: str) -> Tuple[str, str]:
    """
    Main orchestration function that handles conversation flow
    """
    try:
        # Save user input to database
        save_chat_to_db(session_id, "user", user_input)
        
        # Get current conversation state
        current_state = convo_manager.get_state(session_id)
        
        # Handle different conversation states
        if current_state == "AWAITING_ROOM_CHOICE":
            reply, source = handle_room_selection(user_input, session_id)
        elif current_state == "AWAITING_DATES":
            reply, source = handle_date_selection(user_input, session_id)
        elif current_state == "AWAITING_BOOKING_CONFIRMATION":
            reply, source = handle_booking_confirmation(user_input, session_id)
        else:
            # Normal conversation - check for booking intent
            if word_tokenize:
                tokenized_query = " ".join(word_tokenize(user_input))
            else:
                tokenized_query = user_input  # Fallback if laonlp not available
            
            if detect_booking_intent(tokenized_query):
                reply, source = handle_booking_request(session_id)
            else:
                # Use RAG + LLM for general queries
                context = get_rag_context(user_input)
                reply = generate_llm_answer_sync(user_input, context)
                source = "LLM_WITH_RAG"
        
        # Save assistant response to database
        save_chat_to_db(session_id, "assistant", reply)
        
        return reply, source
        
    except Exception as e:
        logging.error(f"Error in orchestrated answer generation: {e}")
        error_reply = "ຂໍອະໄພ, ເກີດຂໍ້ຜິດພາດ. ກະລຸນາລອງຖາມຄຳຖາມໃໝ່."
        save_chat_to_db(session_id, "assistant", error_reply)
        return error_reply, "ERROR"
