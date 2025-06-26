# database/operations.py
import sqlite3
import uuid
import logging
import hashlib
from typing import Dict, List, Optional
from config.settings import CONFIG, ROOM_NUMBERS

def db_connection():
    conn = sqlite3.connect(CONFIG.DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def setup_database():
    conn = db_connection()
    cursor = conn.cursor()
    cursor.execute("CREATE TABLE IF NOT EXISTS rooms (roomId TEXT PRIMARY KEY, roomNumber TEXT UNIQUE NOT NULL, status TEXT NOT NULL, reserveStartDate TEXT, reserveEndDate TEXT, note TEXT)")
    cursor.execute("CREATE TABLE IF NOT EXISTS chat_history (message_id TEXT PRIMARY KEY, session_id TEXT NOT NULL, role TEXT NOT NULL, content TEXT NOT NULL, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)")
    cursor.execute("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role TEXT DEFAULT 'admin', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)")
    cursor.execute("SELECT COUNT(*) FROM rooms")
    if cursor.fetchone()[0] == 0:
        logging.info("Populating rooms table.")
        for room_num in ROOM_NUMBERS:
            cursor.execute("INSERT INTO rooms (roomId, roomNumber, status) VALUES (?, ?, ?)", (f"R-{uuid.uuid4().hex[:6]}", room_num, 'Available'))
    
    # Setup default admin user
    cursor.execute("SELECT COUNT(*) FROM users WHERE username = 'admin'")
    if cursor.fetchone()[0] == 0:
        admin_password_hash = hashlib.sha256("admin123".encode()).hexdigest()
        cursor.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", ("admin", admin_password_hash, "admin"))
        logging.info("Default admin user created (username: admin, password: admin123)")
    
    conn.commit()
    conn.close()
    logging.info("Database setup complete.")

def get_available_rooms_from_db() -> List[str]:
    conn = db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT roomNumber FROM rooms WHERE status = 'Available' ORDER BY roomNumber")
    rooms = [row['roomNumber'] for row in cursor.fetchall()]
    conn.close()
    return rooms

def get_room_details_from_db(room_number: str) -> Optional[Dict]:
    conn = db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM rooms WHERE roomNumber = ?", (room_number,))
    room = cursor.fetchone()
    conn.close()
    return dict(room) if room else None

def book_room_in_db(room_number: str, start_date: str, end_date: str, note: str) -> bool:
    conn = db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE rooms SET status = 'Booked', reserveStartDate = ?, reserveEndDate = ?, note = ? WHERE roomNumber = ? AND status = 'Available'",(start_date, end_date, note, room_number))
        conn.commit()
        return cursor.rowcount > 0
    except sqlite3.Error as e:
        logging.error(f"DB error on booking: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def get_booked_rooms() -> List[Dict]:
    """Get all booked rooms"""
    conn = db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM rooms WHERE status = 'Booked' ORDER BY roomNumber")
    rooms = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rooms

def update_room_booking(room_number: str, new_start_date: Optional[str] = None, 
                       new_end_date: Optional[str] = None, note: Optional[str] = None) -> bool:
    """Update existing room booking"""
    conn = db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if room is currently booked
        cursor.execute("SELECT * FROM rooms WHERE roomNumber = ? AND status = 'Booked'", (room_number,))
        room = cursor.fetchone()
        
        if not room:
            return False
        
        # Prepare update query
        update_fields = []
        update_values = []
        
        if new_start_date:
            update_fields.append("reserveStartDate = ?")
            update_values.append(new_start_date)
        
        if new_end_date:
            update_fields.append("reserveEndDate = ?")
            update_values.append(new_end_date)
        
        if note is not None:
            update_fields.append("note = ?")
            update_values.append(note)
        
        if update_fields:
            update_values.append(room_number)
            query = f"UPDATE rooms SET {', '.join(update_fields)} WHERE roomNumber = ?"
            cursor.execute(query, update_values)
            conn.commit()
            return cursor.rowcount > 0
        
        return True
        
    except sqlite3.Error as e:
        logging.error(f"DB error on booking update: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def cancel_room_booking(room_number: str, reason: Optional[str] = None) -> bool:
    """Cancel room booking and make it available"""
    conn = db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if room is currently booked
        cursor.execute("SELECT * FROM rooms WHERE roomNumber = ? AND status = 'Booked'", (room_number,))
        room = cursor.fetchone()
        
        if not room:
            return False
        
        # Cancel booking
        cancel_note = f"Cancelled: {reason}" if reason else "Cancelled"
        cursor.execute("""
            UPDATE rooms 
            SET status = 'Available', 
                reserveStartDate = NULL, 
                reserveEndDate = NULL, 
                note = ? 
            WHERE roomNumber = ?
        """, (cancel_note, room_number))
        
        conn.commit()
        return cursor.rowcount > 0
        
    except sqlite3.Error as e:
        logging.error(f"DB error on booking cancellation: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()
