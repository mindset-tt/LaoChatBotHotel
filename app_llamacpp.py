# app_llamacpp.py
# OPTIMIZED VERSION for RTX 3050 Ti Mobile using llama.cpp
# This script runs a FastAPI server that integrates:
# 1. A real-time booking system via a SQLite database.
# 2. A RAG system to retrieve context from a local knowledge base.
# 3. llama.cpp for LLM inference (much more memory efficient)
# 4. A timeout fallback mechanism for fast responses.

# --- Core Libraries ---
import os
import sqlite3
import uuid
import logging
import re
import gc
import subprocess
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional, Set
import tempfile
import torchvision
print(torchvision.__version__)

# --- Third-party Libraries ---
import uvicorn
import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer, util
import httpx # Required for async calls if you switch to an external LLM
from fastapi.middleware.cors import CORSMiddleware

# --- Lao Language Specific Library ---
from laonlp.tokenize import word_tokenize
from laonlp.transliterate import *

# --- Basic Logging Configuration ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Centralized Configuration ---
class AppConfig:
    """A class to hold all configuration variables in one place."""
    
    # --- Model & Data Paths ---
    KNOWLEDGE_BASE_PATH: str = 'knowledge_base_with_embeddings.pt'
    RETRIEVER_MODEL: str = 'sentence-transformers/LaBSE'
    
    # --- llama.cpp Configuration ---
    LLAMACPP_MODEL_PATH: str = "../models/Sailor2-L-1B-Chat-F16.gguf"  # Relative to llama.cpp directory
    LLAMACPP_EXECUTABLE: str = "build/bin/Release/llama-cli.exe"  # Relative to llama.cpp directory
    LLAMACPP_DIR: str = "./llama.cpp"  # Working directory for llama.cpp
    
    # --- Database ---
    DB_FILE: str = "./hotel_management.db"

    # --- Chatbot Logic ---
    BOOKING_INTENT_KEYWORDS: Set[str] = {"ຈອງ", "book", "reserve", "booking", "reservation", "ຫ້ອງວ່າງ"}
    CONFIRMATION_KEYWORDS: Set[str] = {"yes", "ok", "y", "ແມ່ນ", "ຕົກລົງ", "confirm", "ແມ່ນແລ້ວ"}
    BOOKING_SIMILARITY_THRESHOLD: float = 0.65
    RAG_TOP_K: int = 2  # Reduced from 3 to save memory
    RAG_CONFIDENCE_THRESHOLD: float = 0.4
    LLM_TIMEOUT_SECONDS: int = 60  # Timeout for llama.cpp

    # --- llama.cpp Parameters ---
    MAX_NEW_TOKENS: int = 200    # Reduced for faster inference
    TEMPERATURE: float = 0.7
    TOP_P: float = 0.9

CONFIG = AppConfig()

# --- Predefined Room Numbers (for DB initialization) ---
ROOM_NUMBERS = [
    "101", "102", "103", "104", "201", "202", "203", "204", "205", "206", "207",
    "301", "302", "303", "304", "305", "306", "307", "401", "402", "403", "404",
    "405", "406", "407"
]

# --- Global Stores for Models and Conversation State ---
class ModelStore:
    def __init__(self):
        self.models_loaded = False
        self.retriever = None
        self.booking_intent_embedding = None
        self.rag_chunks: List[str] = []
        self.rag_embeddings: Optional[torch.Tensor] = None
        self.device = None

class ConversationManager:
    def __init__(self):
        self.states: Dict[str, str] = {}
        self.pending_bookings: Dict[str, Dict] = {}

    def get_state(self, session_id: str) -> str: return self.states.get(session_id, "NORMAL")
    def set_state(self, session_id: str, state: str, booking_info: Optional[Dict] = None):
        logging.info(f"Session '{session_id}' state changed to: {state}")
        self.states[session_id] = state
        if booking_info is not None: self.pending_bookings[session_id] = booking_info
    def get_pending_booking(self, session_id: str) -> Optional[Dict]: return self.pending_bookings.get(session_id)
    def clear_session(self, session_id: str) -> bool:
        cleared = False
        if session_id in self.states: del self.states[session_id]; cleared = True
        if session_id in self.pending_bookings: del self.pending_bookings[session_id]; cleared = True
        return cleared

model_store = ModelStore()
convo_manager = ConversationManager()

# --- Memory Management Functions ---
def cleanup_gpu_memory():
    """Clean up GPU memory to prevent OOM errors"""
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
        torch.cuda.synchronize()
    gc.collect()

def check_gpu_memory():
    """Check and log GPU memory usage"""
    if torch.cuda.is_available():
        allocated = torch.cuda.memory_allocated() / 1024**3
        reserved = torch.cuda.memory_reserved() / 1024**3
        logging.info(f"GPU Memory - Allocated: {allocated:.2f}GB, Reserved: {reserved:.2f}GB")
        return allocated, reserved
    return 0, 0

# --- Database & Helper Functions ---
def db_connection():
    conn = sqlite3.connect(CONFIG.DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def setup_database():
    conn = db_connection()
    cursor = conn.cursor()
    cursor.execute("CREATE TABLE IF NOT EXISTS rooms (roomId TEXT PRIMARY KEY, roomNumber TEXT UNIQUE NOT NULL, status TEXT NOT NULL, reserveStartDate TEXT, reserveEndDate TEXT, note TEXT)")
    cursor.execute("CREATE TABLE IF NOT EXISTS chat_history (message_id TEXT PRIMARY KEY, session_id TEXT NOT NULL, role TEXT NOT NULL, content TEXT NOT NULL, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)")
    cursor.execute("SELECT COUNT(*) FROM rooms")
    if cursor.fetchone()[0] == 0:
        logging.info("Populating rooms table.")
        for room_num in ROOM_NUMBERS:
            cursor.execute("INSERT INTO rooms (roomId, roomNumber, status) VALUES (?, ?, ?)", (f"R-{uuid.uuid4().hex[:6]}", room_num, 'Available'))
    conn.commit()
    conn.close()
    logging.info("Database setup complete.")

# --- Model Loading (OPTIMIZED FOR llama.cpp) ---
def load_all_models_and_data():
    if model_store.models_loaded: return
    logging.info("🚀 Starting to load models optimized for llama.cpp...")

    try:
        # Set device with memory management
        model_store.device = "cuda" if torch.cuda.is_available() else "cpu"

        # Check if llama.cpp executable exists
        executable_full_path = os.path.join(CONFIG.LLAMACPP_DIR, CONFIG.LLAMACPP_EXECUTABLE)
        model_full_path = os.path.abspath(os.path.join(CONFIG.LLAMACPP_DIR, CONFIG.LLAMACPP_MODEL_PATH))
        
        if not os.path.exists(executable_full_path):
            raise FileNotFoundError(f"llama.cpp executable not found: {executable_full_path}")
        
        # Check if model file exists
        if not os.path.exists(model_full_path):
            raise FileNotFoundError(f"Model file not found: {model_full_path}")

        cleanup_gpu_memory()

        # Load smaller retriever model first
        logging.info(f"Loading retriever model: {CONFIG.RETRIEVER_MODEL}")
        model_store.retriever = SentenceTransformer(CONFIG.RETRIEVER_MODEL, device=model_store.device)
        check_gpu_memory()

        # Load knowledge base
        if os.path.exists(CONFIG.KNOWLEDGE_BASE_PATH):
            kb_data = torch.load(CONFIG.KNOWLEDGE_BASE_PATH, map_location=model_store.device)
            model_store.rag_chunks = kb_data['chunks']
            model_store.rag_embeddings = kb_data['embeddings'].to(model_store.device)
            logging.info(f"✅ Knowledge base loaded with {len(model_store.rag_chunks)} chunks.")
            check_gpu_memory()
        else:
            logging.warning(f"Knowledge base file not found. RAG will be disabled.")

        # Create booking intent embedding
        booking_intent_phrase = "ຂ້ອຍຕ້ອງການຈອງຫ້ອງ"
        model_store.booking_intent_embedding = model_store.retriever.encode(
            booking_intent_phrase,
            convert_to_tensor=True,
            device=model_store.device
        )

        model_store.models_loaded = True
        logging.info("👍 All models loaded successfully for llama.cpp integration.")

    except Exception as e:
        logging.error(f"❌❌❌ Error during model loading: {e}", exc_info=True)
        cleanup_gpu_memory()
        raise

# --- Core Chatbot Logic (OPTIMIZED for llama.cpp) ---
def get_rag_context(query: str) -> str:
    if not model_store.rag_chunks or model_store.rag_embeddings is None:
        return "ບໍ່ມີຂໍ້ມູນສະເພາະໃນຄັງຄວາມຮູ້ກ່ຽວກັບວັງວຽງ ແລະ ບໍລິການໂຮງແຮມ."

    try:
        tokenized_query = " ".join(word_tokenize(query))
        query_embedding = model_store.retriever.encode(
            tokenized_query,
            convert_to_tensor=True,
            device=model_store.device
        )
        hits = util.semantic_search(
            query_embedding,
            model_store.rag_embeddings,
            top_k=CONFIG.RAG_TOP_K
        )[0]

        if hits and hits[0]['score'] > CONFIG.RAG_CONFIDENCE_THRESHOLD:
            context = "\n".join([model_store.rag_chunks[hit['corpus_id']] for hit in hits])
            logging.info(f"Retrieved context with top score: {hits[0]['score']:.4f}")
            return context
        return "ບໍ່ມີຂໍ້ມູນສະເພາະກ່ຽວກັບເລື່ອງນີ້ໃນວັງວຽງ, ແຕ່ຂ້ອຍສາມາດໃຫ້ຄຳແນະນຳທົ່ວໄປໄດ້."
    except Exception as e:
        logging.error(f"Error in RAG context retrieval: {e}")
        return "ເກີດຂໍ້ຜິດພາດໃນການຄົ້ນຫາຂໍ້ມູນ."

async def generate_llm_answer_llamacpp(user_query: str, context: str) -> str:
    """
    Use llama.cpp subprocess for LLM inference - much more memory efficient
    """
    try:
        system_prompt = (
            "You are Sailor2, an AI assistant for Vang Vieng, Laos tourism and hotel services. "
            "Respond in Lao language (ພາສາລາວ) with helpful, professional information about:\n"
            "- Hotel bookings and accommodations\n"
            "- Tourist attractions in Vang Vieng\n"
            "- Restaurants and local food\n"
            "- Transportation and travel tips\n"
            "- Adventure activities\n"
            "Keep responses concise and friendly."
        )

        # Create the prompt
        prompt = (
            f"System: {system_prompt}\n\n"
            f"Context: {context[:400]}...\n\n"  # Limit context length
            f"Human: {user_query}\n\n"
            f"Assistant: "
        )

        # Write prompt to temporary file to handle special characters
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as temp_file:
            temp_file.write(prompt)
            temp_file_path = temp_file.name

        try:
            # Prepare llama.cpp command with full paths
            executable_path = os.path.join(CONFIG.LLAMACPP_DIR, CONFIG.LLAMACPP_EXECUTABLE)
            cmd = [
                executable_path,  # Use full path to executable
                "-m", CONFIG.LLAMACPP_MODEL_PATH,  # This will be relative to working dir
                "-f", os.path.abspath(temp_file_path),  # Use absolute path for temp file
                "-n", str(CONFIG.MAX_NEW_TOKENS),
                "--temp", str(CONFIG.TEMPERATURE),
                "--top-p", str(CONFIG.TOP_P),
                "-c", "4096",  # context size
                "--no-conversation",  # disable conversation mode for clean output
                "--simple-io"  # use simple IO for better subprocess compatibility
            ]

            # Run llama.cpp as subprocess
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=CONFIG.LLAMACPP_DIR  # Set working directory to llama.cpp
            )

            # Wait for process with timeout
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=CONFIG.LLM_TIMEOUT_SECONDS
            )

            if process.returncode != 0:
                logging.error(f"llama.cpp process failed with return code {process.returncode}")
                logging.error(f"stderr: {stderr.decode('utf-8', errors='ignore')}")
                return "ຂໍອະໄພ, ເກີດຂໍ້ຜິດພາດໃນການປະມວນຜົນຄຳຕອບ."

            # Parse output
            output = stdout.decode('utf-8', errors='ignore')
            
            # Extract the assistant's response (everything after "Assistant: ")
            if "Assistant: " in output:
                response = output.split("Assistant: ")[-1].strip()
            else:
                # Fallback: take everything after the prompt
                lines = output.split('\n')
                # Find where the actual response starts (after the prompt)
                response_lines = []
                found_response = False
                for line in lines:
                    if "Assistant:" in line or found_response:
                        found_response = True
                        if "Assistant:" in line:
                            # Take everything after "Assistant:"
                            response_lines.append(line.split("Assistant:")[-1].strip())
                        else:
                            response_lines.append(line)
                
                response = '\n'.join(response_lines).strip()

            # Clean up the response
            if not response:
                response = "ຂໍອະໄພ, ບໍ່ສາມາດສ້າງຄຳຕອບໄດ້."
            
            # Remove any unwanted metadata/system output
            response = response.split('\n')[0] if response else "ຂໍອະໄພ, ບໍ່ສາມາດສ້າງຄຳຕອບໄດ້."
            
            return response.strip()

        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_file_path)
            except:
                pass

    except asyncio.TimeoutError:
        logging.warning("llama.cpp process timed out")
        return "ຂໍອະໄພ, ການປະມວນຜົນໃຊ້ເວລານານເກີນໄປ. ກະລຸນາລອງຄຳຖາມສັ້ນໆ."
    except Exception as e:
        logging.error(f"Error in llama.cpp generation: {e}")
        return "ຂໍອະໄພ, ເກີດຂໍ້ຜິດພາດໃນການປະມວນຜົນຄຳຕອບ."

def parse_dates(text: str) -> Optional[Tuple[datetime, datetime]]:
    matches = re.findall(r'(\d{1,2})[/-](\d{1,2})[/-](\d{4})', text)
    if len(matches) >= 2:
        try:
            date1 = datetime.strptime(f"{matches[0][0]}-{matches[0][1]}-{matches[0][2]}", '%d-%m-%Y').date()
            date2 = datetime.strptime(f"{matches[1][0]}-{matches[1][1]}-{matches[1][2]}", '%d-%m-%Y').date()
            return (min(date1, date2), max(date1, date2))
        except ValueError: pass
    if "tomorrow" in text or "ມື້ອື່ນ" in text:
        start_date = datetime.now() + timedelta(days=1)
        duration_match = re.search(r'(\d+)\s*(day|night|ຄືນ|ມື້)', text)
        if duration_match:
            days = int(duration_match.group(1))
            end_date = start_date + timedelta(days=days)
            return start_date.date(), end_date.date()
    return None

def _get_available_rooms_from_db() -> List[str]:
    conn = db_connection(); cursor = conn.cursor()
    cursor.execute("SELECT roomNumber FROM rooms WHERE status = 'Available' ORDER BY roomNumber")
    rooms = [row['roomNumber'] for row in cursor.fetchall()]; conn.close()
    return rooms

def _get_room_details_from_db(room_number: str) -> Optional[Dict]:
    conn = db_connection(); cursor = conn.cursor()
    cursor.execute("SELECT * FROM rooms WHERE roomNumber = ?", (room_number,))
    room = cursor.fetchone(); conn.close()
    return dict(room) if room else None

def _book_room_in_db(room_number: str, start_date: str, end_date: str, note: str) -> bool:
    conn = db_connection(); cursor = conn.cursor()
    try:
        cursor.execute("UPDATE rooms SET status = 'Booked', reserveStartDate = ?, reserveEndDate = ?, note = ? WHERE roomNumber = ? AND status = 'Available'",(start_date, end_date, note, room_number))
        conn.commit()
        return cursor.rowcount > 0
    except sqlite3.Error as e:
        logging.error(f"DB error on booking: {e}"); conn.rollback(); return False
    finally: conn.close()

def detect_booking_intent(tokenized_query: str) -> bool:
    if any(keyword in tokenized_query.lower() for keyword in CONFIG.BOOKING_INTENT_KEYWORDS): return True
    try:
        query_embedding = model_store.retriever.encode(tokenized_query, convert_to_tensor=True, device=model_store.device)
        score = util.cos_sim(query_embedding, model_store.booking_intent_embedding)[0][0].item()
        return score > CONFIG.BOOKING_SIMILARITY_THRESHOLD
    except:
        return False

def handle_booking_request(session_id: str) -> Tuple[str, str]:
    available_rooms = _get_available_rooms_from_db()
    if not available_rooms: return "ຂໍອະໄພ, ຕອນນີ້ບໍ່ມີຫ້ອງວ່າງເລີຍ.", "STATUS_CHECK"
    rooms_list_str = ", ".join(available_rooms)
    reply = f"ແນ່ນອນ, ຕອນນີ້ພວກເຮົາມີຫ້ອງວ່າງດັ່ງນີ້: {rooms_list_str}. ກະລຸນາເລືອກໝາຍເລກຫ້ອງທີ່ທ່ານຕ້ອງການ."
    convo_manager.set_state(session_id, "AWAITING_ROOM_CHOICE"); return reply, "BOOKING_SUGGESTION"

def handle_room_selection(user_input: str, session_id: str) -> Tuple[str, str]:
    selected_room = next((word for word in user_input.split() if word in ROOM_NUMBERS), None)
    if not selected_room: return "ຂໍອະໄພ, ຂ້ອຍບໍ່ເຫັນໝາຍເລກຫ້ອງທີ່ຖືກຕ້ອງ. ກະລຸນາລອງໃໝ່.", "INVALID_ROOM"
    room_details = _get_room_details_from_db(selected_room)
    if not room_details or room_details['status'] != 'Available':
        return f"ຫ້ອງ {selected_room} ບໍ່ວ່າງ. ກະລຸນາເລືອກຫ້ອງອື່ນຈາກລາຍການ: {', '.join(_get_available_rooms_from_db())}", "STATUS_CHECK"
    convo_manager.set_state(session_id, "AWAITING_DATES", booking_info={"room": selected_room})
    reply = f"ເຂົ້າໃຈແລ້ວ, ທ່ານເລືອກຫ້ອງ {selected_room}. ກະລຸນາລະບຸວັນທີເລີ່ມຈອງ ແລະ ວັນທີສິ້ນສຸດ (ຕົວຢ່າງ: 11/06/2025 - 13/06/2025 ຫຼື 'ມື້ອື່ນ 2 ຄືນ')."
    return reply, "DATE_REQUEST"

def handle_date_selection(user_input: str, session_id: str) -> Tuple[str, str]:
    dates = parse_dates(user_input)
    pending_booking = convo_manager.get_pending_booking(session_id)
    if not dates or not pending_booking: return "ຂໍອະໄພ, ຂ້ອຍບໍ່ເຂົ້າໃຈຮູບແບບວັນທີ. ກະລຸນາໃຊ້ຮູບແບບ DD/MM/YYYY ຫຼື 'ມື້ອື່ນ x ຄືນ'.", "INVALID_DATE"
    start_date, end_date = dates
    pending_booking['start_date'] = start_date.strftime('%Y-%m-%d')
    pending_booking['end_date'] = end_date.strftime('%Y-%m-%d')
    convo_manager.set_state(session_id, "AWAITING_BOOKING_CONFIRMATION", booking_info=pending_booking)
    reply = (f"ທ່ານຕ້ອງການຈອງຫ້ອງ {pending_booking['room']} "
             f"ແຕ່ວັນທີ {pending_booking['start_date']} ຫາ {pending_booking['end_date']}, ແມ່ນບໍ່? (ແມ່ນ/ບໍ່)")
    return reply, "CONFIRMATION_REQUEST"

def handle_booking_confirmation(user_input: str, session_id: str) -> Tuple[str, str]:
    pending_booking = convo_manager.get_pending_booking(session_id)
    if not pending_booking:
        convo_manager.set_state(session_id, "NORMAL"); return "ເກີດຂໍ້ຜິດພາດ, ກະລຸນາເລີ່ມການຈອງໃໝ່.", "ERROR"
    if any(keyword in user_input.lower() for keyword in CONFIG.CONFIRMATION_KEYWORDS):
        success = _book_room_in_db(pending_booking['room'], pending_booking['start_date'], pending_booking['end_date'], f"Booked via Chatbot session {session_id}")
        convo_manager.clear_session(session_id)
        if success: return f"ສຳເລັດ! ຫ້ອງ {pending_booking['room']} ໄດ້ຖືກຈອງໃຫ້ທ່ານແລ້ວ. ຂອບໃຈທີ່ໃຊ້ບໍລິການ.", "BOOKING_CONFIRMED"
        else: return "ຂໍອະໄພ, ເກີດຂໍ້ຜິດພາດໃນຂະນະທີ່ພະຍາຍາມຈອງ. ຫ້ອງນັ້ນອາດຈະຖືກຈອງໄປແລ້ວ. ກະລຸນາລອງໃໝ່.", "ERROR"
    else:
        convo_manager.clear_session(session_id)
        return "ການຈອງໄດ້ຖືກຍົກເລີກ. ຖ້າທ່ານຕ້ອງການເລີ່ມໃໝ່, ພຽງແຕ່ບອກຂ້ອຍ.", "BOOKING_CANCELLED"

# --- Orchestrator (OPTIMIZED for llama.cpp) ---
async def generate_orchestrated_answer(user_query: str, session_id: str) -> Tuple[str, str]:
    normalized_query = thai2lao_script(user_query)
    tokenized_query = " ".join(word_tokenize(normalized_query))
    current_state = convo_manager.get_state(session_id)

    # Handle state-based booking flow first
    if current_state == "AWAITING_ROOM_CHOICE": reply, source = handle_room_selection(normalized_query, session_id)
    elif current_state == "AWAITING_DATES": reply, source = handle_date_selection(normalized_query, session_id)
    elif current_state == "AWAITING_BOOKING_CONFIRMATION": reply, source = handle_booking_confirmation(normalized_query, session_id)
    elif detect_booking_intent(tokenized_query): reply, source = handle_booking_request(session_id)
    else:
        # RAG + LLM flow for general questions
        context = get_rag_context(normalized_query)
        try:
            # Use llama.cpp for generation
            reply = await generate_llm_answer_llamacpp(normalized_query, context)
            source = "RAG_LLAMACPP"
        except Exception as e:
            logging.error(f"Error during llama.cpp generation: {e}")
            reply = f"ຈາກຂໍ້ມູນທີ່ຂ້ອຍມີ:\n{context[:500]}..."
            source = "RAG_CONTEXT_ONLY"

    # Persist conversation
    conn = db_connection()
    try:
        with conn:
            conn.execute("INSERT INTO chat_history (message_id, session_id, role, content) VALUES (?, ?, ?, ?)", (f"M-{uuid.uuid4().hex[:8]}", session_id, 'user', user_query))
            conn.execute("INSERT INTO chat_history (message_id, session_id, role, content) VALUES (?, ?, ?, ?)", (f"M-{uuid.uuid4().hex[:8]}", session_id, 'bot', reply))
    except Exception as e: logging.error(f"Failed to write chat history: {e}")
    finally: conn.close()

    return reply, source

# --- Pydantic Models (same as original) ---
class Query(BaseModel):
    text: str
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
class Answer(BaseModel):
    reply: str
    source: str
    session_id: str
class Room(BaseModel):
    roomId: str
    roomNumber: str
    status: str
    reserveStartDate: Optional[str] = None
    reserveEndDate: Optional[str] = None
    note: Optional[str] = None
class StandardResponse(BaseModel):
    message: str
    session_id: Optional[str] = None
class HistoryEntry(BaseModel):
    role: str
    content: str
    timestamp: datetime
class FlatHistoryEntry(BaseModel):
    sessionID: str
    content: HistoryEntry

# --- FastAPI App ---
app = FastAPI(title="Lao Hotel Chatbot API - llama.cpp Integration", version="3.0.0")

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    setup_database()
    load_all_models_and_data()

@app.post("/ask/", response_model=Answer, tags=["Chatbot"])
async def ask_question(query: Query):
    if not model_store.models_loaded: raise HTTPException(status_code=503, detail="Models are not loaded yet.")
    if not query.text.strip(): raise HTTPException(status_code=400, detail="Query text cannot be empty.")
    reply, source = await generate_orchestrated_answer(query.text, query.session_id)
    return Answer(reply=reply, source=source, session_id=query.session_id)

@app.get("/rooms/", response_model=List[Room], tags=["Room Management"])
async def get_all_rooms():
    conn = db_connection(); cursor = conn.cursor()
    cursor.execute("SELECT * FROM rooms ORDER BY roomNumber")
    rooms_data = [dict(row) for row in cursor.fetchall()]; conn.close()
    return rooms_data

@app.post("/clear_session/", response_model=StandardResponse, tags=["Chatbot"])
async def clear_session(query: dict):
    session_id = query.get("session_id")
    if not session_id: raise HTTPException(status_code=400, detail="session_id is required.")
    if convo_manager.clear_session(session_id):
        return StandardResponse(message="Short-term memory and state cleared.", session_id=session_id)
    else:
        raise HTTPException(status_code=404, detail="Session ID not found in short-term memory.")

@app.get("/gpu_status/", tags=["System"])
async def get_gpu_status():
    if torch.cuda.is_available():
        allocated, reserved = check_gpu_memory()
        return {"gpu_available": True, "allocated_gb": allocated, "reserved_gb": reserved}
    return {"gpu_available": False}

@app.get("/llamacpp_status/", tags=["System"])
async def get_llamacpp_status():
    """Check if llama.cpp is working"""
    try:
        # Check if paths exist
        exec_path = os.path.join(CONFIG.LLAMACPP_DIR, CONFIG.LLAMACPP_EXECUTABLE)
        model_path = os.path.abspath(os.path.join(CONFIG.LLAMACPP_DIR, CONFIG.LLAMACPP_MODEL_PATH))
        
        # Test llama.cpp with a simple command
        executable_path = os.path.join(CONFIG.LLAMACPP_DIR, CONFIG.LLAMACPP_EXECUTABLE)
        process = await asyncio.create_subprocess_exec(
            executable_path,  # Use full path
            "--help",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=CONFIG.LLAMACPP_DIR
        )
        stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=10)
        
        return {
            "llamacpp_available": process.returncode == 0,
            "model_path": model_path,
            "model_exists": os.path.exists(model_path),
            "executable_path": exec_path,
            "executable_exists": os.path.exists(exec_path),
            "working_directory": CONFIG.LLAMACPP_DIR,
            "working_dir_exists": os.path.exists(CONFIG.LLAMACPP_DIR)
        }
    except Exception as e:
        exec_path = os.path.join(CONFIG.LLAMACPP_DIR, CONFIG.LLAMACPP_EXECUTABLE)
        model_path = os.path.abspath(os.path.join(CONFIG.LLAMACPP_DIR, CONFIG.LLAMACPP_MODEL_PATH))
        
        return {
            "llamacpp_available": False,
            "error": str(e),
            "model_path": model_path,
            "model_exists": os.path.exists(model_path),
            "executable_path": exec_path,
            "executable_exists": os.path.exists(exec_path),
            "working_directory": CONFIG.LLAMACPP_DIR,
            "working_dir_exists": os.path.exists(CONFIG.LLAMACPP_DIR)
        }

# --- History Routes (same as original) ---
@app.get("/history/allContent", response_model=Dict[str, List[HistoryEntry]], tags=["Chat History"])
async def get_all_sessions_and_history():
    sessions_with_history = {}
    conn = db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT session_id, role, content, timestamp FROM chat_history ORDER BY session_id, timestamp ASC")
    all_history_records = cursor.fetchall()
    conn.close()
    if not all_history_records: return {}
    for record in all_history_records:
        session_id = record['session_id']
        if session_id not in sessions_with_history: sessions_with_history[session_id] = []
        sessions_with_history[session_id].append({"role": record['role'], "content": record['content'], "timestamp": record['timestamp']})
    return sessions_with_history

@app.get("/history/all", response_model=List[FlatHistoryEntry], tags=["Chat History"])
async def get_all_sessions_and_history():
    flat_history_list = []
    conn = db_connection()
    cursor = conn.cursor()
    sql_query = """
        WITH RankedMessages AS (
            SELECT session_id, role, content, timestamp,
                   ROW_NUMBER() OVER(PARTITION BY session_id ORDER BY timestamp ASC) as rn
            FROM chat_history WHERE role = 'user'
        )
        SELECT session_id, role, content, timestamp FROM RankedMessages
        WHERE rn = 1 ORDER BY timestamp DESC;
    """
    cursor.execute(sql_query)
    first_user_inputs = cursor.fetchall()
    conn.close()
    if not first_user_inputs: return []
    for record in first_user_inputs:
        content_data = {"role": record['role'], "content": record['content'], "timestamp": record['timestamp']}
        flat_history_list.append({"sessionID": record['session_id'], "content": content_data})
    return flat_history_list

@app.get("/history/{session_id}", response_model=List[HistoryEntry], tags=["Chat History"])
async def get_session_history(session_id: str):
    conn = db_connection(); cursor = conn.cursor()
    cursor.execute("SELECT role, content, timestamp FROM chat_history WHERE session_id = ? ORDER BY timestamp ASC", (session_id,))
    history = cursor.fetchall(); conn.close()
    if not history: raise HTTPException(status_code=404, detail="Session ID not found or history is empty.")
    return [dict(row) for row in history]

# --- Main Execution Block ---
if __name__ == "__main__":
    print(f"Database: {CONFIG.DB_FILE}")
    print(f"llama.cpp model: {CONFIG.LLAMACPP_MODEL_PATH}")
    print(f"llama.cpp executable: {CONFIG.LLAMACPP_EXECUTABLE}")
    
    port = 8000
    logging.info(f"\n✅ Starting server with llama.cpp integration on http://0.0.0.0:{port}...")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
