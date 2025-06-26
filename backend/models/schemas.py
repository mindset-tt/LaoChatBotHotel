# models/schemas.py
from pydantic import BaseModel, Field
from typing import Dict, List, Optional

class Query(BaseModel):
    text: str = Field(..., description="User's question or message")
    session_id: str = Field(..., description="Unique session identifier for conversation tracking")

class Answer(BaseModel):
    reply: str = Field(..., description="Chatbot's response")
    source: str = Field(..., description="Source of the response (e.g., LLM, Booking, RAG)")
    session_id: str = Field(..., description="Session ID for tracking conversations")

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
    timestamp: str

class FlatHistoryEntry(BaseModel):
    sessionID: str
    content: Dict[str, str]

# --- Authentication Models ---
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    username: str

# --- Booking Management Models ---
class BookingUpdateRequest(BaseModel):
    room_number: str
    new_start_date: Optional[str] = None
    new_end_date: Optional[str] = None
    note: Optional[str] = None

class BookingCancelRequest(BaseModel):
    room_number: str
    reason: Optional[str] = None
