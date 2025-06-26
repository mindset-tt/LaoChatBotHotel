# routes/booking_routes.py
from typing import List
from fastapi import APIRouter, HTTPException
from models.schemas import Room, StandardResponse, BookingUpdateRequest, BookingCancelRequest
from database.operations import (
    get_booked_rooms, update_room_booking, cancel_room_booking,
    get_room_details_from_db, book_room_in_db
)

router = APIRouter(prefix="/bookings", tags=["Booking Management"])

@router.get("/", response_model=List[Room])
async def get_booked_rooms_api():
    """Get all currently booked rooms"""
    return get_booked_rooms()

@router.put("/update/", response_model=StandardResponse)
async def update_booking(update_request: BookingUpdateRequest):
    """Update an existing room booking"""
    success = update_room_booking(
        room_number=update_request.room_number,
        new_start_date=update_request.new_start_date,
        new_end_date=update_request.new_end_date,
        note=update_request.note
    )
    
    if success:
        return StandardResponse(message=f"Booking for room {update_request.room_number} updated successfully")
    else:
        raise HTTPException(status_code=404, detail=f"Room {update_request.room_number} not found or not currently booked")

@router.post("/cancel/", response_model=StandardResponse)
async def cancel_booking(cancel_request: BookingCancelRequest):
    """Cancel a room booking"""
    success = cancel_room_booking(
        room_number=cancel_request.room_number,
        reason=cancel_request.reason
    )
    
    if success:
        return StandardResponse(message=f"Booking for room {cancel_request.room_number} cancelled successfully")
    else:
        raise HTTPException(status_code=404, detail=f"Room {cancel_request.room_number} not found or not currently booked")

@router.post("/manual/", response_model=StandardResponse)
async def create_manual_booking(booking_data: dict):
    """Create a manual booking (admin only)"""
    room_number = booking_data.get("room_number")
    start_date = booking_data.get("start_date")
    end_date = booking_data.get("end_date")
    note = booking_data.get("note", "Manual booking via admin")
    
    if not all([room_number, start_date, end_date]):
        raise HTTPException(status_code=400, detail="room_number, start_date, and end_date are required")
    
    # Check if room exists and is available
    room_details = get_room_details_from_db(room_number)
    if not room_details:
        raise HTTPException(status_code=404, detail=f"Room {room_number} not found")
    
    if room_details['status'] != 'Available':
        raise HTTPException(status_code=400, detail=f"Room {room_number} is not available")
    
    # Book the room
    success = book_room_in_db(room_number, start_date, end_date, note)
    
    if success:
        return StandardResponse(message=f"Room {room_number} booked successfully from {start_date} to {end_date}")
    else:
        raise HTTPException(status_code=500, detail="Failed to create booking")
