# routes/room_routes.py
from typing import List
from fastapi import APIRouter, HTTPException
from models.schemas import Room
from database.operations import get_available_rooms_from_db, get_room_details_from_db, db_connection

router = APIRouter(prefix="/rooms", tags=["Room Management"])

@router.get("/", response_model=List[Room])
async def get_all_rooms():
    """Get all rooms"""
    conn = db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM rooms ORDER BY roomNumber")
    rooms_data = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rooms_data

@router.get("/available/", response_model=List[str])
async def get_available_rooms_api():
    """Get list of available room numbers"""
    return get_available_rooms_from_db()

@router.get("/status/{room_number}", response_model=Room)
async def get_room_status(room_number: str):
    """Get detailed status of a specific room"""
    room_details = get_room_details_from_db(room_number)
    if not room_details:
        raise HTTPException(status_code=404, detail=f"Room {room_number} not found")
    
    return Room(**room_details)
