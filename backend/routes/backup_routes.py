# routes/backup_routes.py
import json
import csv
from io import StringIO
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import StreamingResponse
from database.operations import db_connection
from models.schemas import StandardResponse

router = APIRouter(prefix="/backup", tags=["Backup & Export"])

@router.get("/chat-history/export/")
async def export_chat_history(format: str = "json", session_id: Optional[str] = None):
    """Export chat history in JSON or CSV format"""
    conn = db_connection()
    cursor = conn.cursor()
    
    # Build query based on parameters
    if session_id:
        cursor.execute("""
            SELECT session_id, role, content, timestamp 
            FROM chat_history 
            WHERE session_id = ? 
            ORDER BY timestamp ASC
        """, (session_id,))
        filename = f"chat_history_{session_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    else:
        cursor.execute("""
            SELECT session_id, role, content, timestamp 
            FROM chat_history 
            ORDER BY session_id, timestamp ASC
        """)
        filename = f"chat_history_all_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    records = cursor.fetchall()
    conn.close()
    
    if not records:
        raise HTTPException(status_code=404, detail="No chat history found")
    
    # Convert to list of dicts
    data = [dict(record) for record in records]
    
    if format.lower() == "csv":
        # Create CSV
        output = StringIO()
        if data:
            fieldnames = data[0].keys()
            writer = csv.DictWriter(output, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}.csv"}
        )
    else:
        # Return JSON
        return Response(
            content=json.dumps(data, indent=2, default=str),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename={filename}.json"}
        )

@router.get("/bookings/export/")
async def export_bookings(format: str = "json"):
    """Export all bookings"""
    conn = db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT roomId, roomNumber, status, reserveStartDate, reserveEndDate, note
        FROM rooms 
        WHERE status = 'Booked'
        ORDER BY roomNumber
    """)
    
    records = cursor.fetchall()
    conn.close()
    
    if not records:
        raise HTTPException(status_code=404, detail="No bookings found")
    
    data = [dict(record) for record in records]
    filename = f"bookings_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    if format.lower() == "csv":
        output = StringIO()
        if data:
            fieldnames = data[0].keys()
            writer = csv.DictWriter(output, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}.csv"}
        )
    else:
        return Response(
            content=json.dumps(data, indent=2, default=str),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename={filename}.json"}
        )

@router.post("/database/")
async def backup_database():
    """Create a backup of the entire database"""
    try:
        import shutil
        import os
        from config.settings import CONFIG
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_filename = f"hotel_backup_{timestamp}.db"
        backup_path = f"./backups/{backup_filename}"
        
        # Create backups directory if it doesn't exist
        os.makedirs("./backups", exist_ok=True)
        
        # Copy database file
        shutil.copy2(CONFIG.DB_FILE, backup_path)
        
        return StandardResponse(
            message=f"Database backup created successfully: {backup_filename}"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backup failed: {str(e)}")

@router.get("/statistics/")
async def get_system_statistics():
    """Get comprehensive system statistics"""
    conn = db_connection()
    cursor = conn.cursor()
    
    try:
        # Room statistics
        cursor.execute("SELECT status, COUNT(*) as count FROM rooms GROUP BY status")
        room_stats = {row['status']: row['count'] for row in cursor.fetchall()}
        
        # Chat statistics
        cursor.execute("SELECT COUNT(DISTINCT session_id) as unique_sessions FROM chat_history")
        unique_sessions = cursor.fetchone()['unique_sessions']
        
        cursor.execute("SELECT COUNT(*) as total_messages FROM chat_history")
        total_messages = cursor.fetchone()['total_messages']
        
        cursor.execute("""
            SELECT DATE(timestamp) as date, COUNT(*) as messages 
            FROM chat_history 
            WHERE timestamp >= datetime('now', '-7 days')
            GROUP BY DATE(timestamp)
            ORDER BY date
        """)
        daily_messages = [dict(row) for row in cursor.fetchall()]
        
        # Booking trends
        cursor.execute("""
            SELECT DATE(reserveStartDate) as date, COUNT(*) as bookings
            FROM rooms 
            WHERE reserveStartDate IS NOT NULL 
            AND reserveStartDate >= date('now', '-30 days')
            GROUP BY DATE(reserveStartDate)
            ORDER BY date
        """)
        booking_trends = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "rooms": room_stats,
            "chat": {
                "unique_sessions": unique_sessions,
                "total_messages": total_messages,
                "daily_messages_last_7_days": daily_messages
            },
            "bookings": {
                "trends_last_30_days": booking_trends
            }
        }
        
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=f"Statistics error: {str(e)}")
