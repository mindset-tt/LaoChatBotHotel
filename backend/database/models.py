# database/models.py
import sqlite3
from typing import Optional, List, Dict, Any
from datetime import datetime
from config.settings import CONFIG
import logging

logger = logging.getLogger(__name__)

class DatabaseManager:
    """Enhanced database manager with comprehensive hotel management features"""
    
    def __init__(self, db_path: str = None):
        self.db_path = db_path or CONFIG.DB_FILE
        self.init_enhanced_tables()
    
    def get_connection(self):
        """Get database connection with foreign key support"""
        conn = sqlite3.connect(self.db_path)
        conn.execute("PRAGMA foreign_keys = ON")
        conn.row_factory = sqlite3.Row
        return conn
    
    def init_enhanced_tables(self):
        """Initialize all database tables with enhanced schema"""
        with self.get_connection() as conn:
            # Users table with enhanced authentication
            conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    email TEXT UNIQUE,
                    full_name TEXT,
                    role TEXT DEFAULT 'user',
                    is_active BOOLEAN DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP,
                    api_key_hash TEXT,
                    phone TEXT,
                    preferences TEXT  -- JSON string for user preferences
                )
            """)
            
            # Enhanced rooms table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS rooms (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    room_number TEXT UNIQUE NOT NULL,
                    room_type TEXT DEFAULT 'standard',
                    floor INTEGER,
                    max_occupancy INTEGER DEFAULT 2,
                    price_per_night REAL DEFAULT 0.0,
                    amenities TEXT,  -- JSON string
                    status TEXT DEFAULT 'available',
                    last_cleaned TIMESTAMP,
                    maintenance_notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Enhanced bookings table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS bookings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    booking_reference TEXT UNIQUE NOT NULL,
                    room_id INTEGER NOT NULL,
                    guest_name TEXT NOT NULL,
                    guest_email TEXT,
                    guest_phone TEXT,
                    check_in_date DATE NOT NULL,
                    check_out_date DATE NOT NULL,
                    total_amount REAL DEFAULT 0.0,
                    status TEXT DEFAULT 'confirmed',
                    special_requests TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_by_user_id INTEGER,
                    FOREIGN KEY (room_id) REFERENCES rooms (id),
                    FOREIGN KEY (created_by_user_id) REFERENCES users (id)
                )
            """)
            
            # Enhanced chat history
            conn.execute("""
                CREATE TABLE IF NOT EXISTS chat_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    user_message TEXT NOT NULL,
                    bot_response TEXT NOT NULL,
                    response_source TEXT DEFAULT 'unknown',
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    user_id INTEGER,
                    sentiment_score REAL,
                    intent_classification TEXT,
                    response_time_ms INTEGER,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """)
            
            # System logs table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS system_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    log_level TEXT NOT NULL,
                    module TEXT NOT NULL,
                    message TEXT NOT NULL,
                    user_id INTEGER,
                    ip_address TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    additional_data TEXT,  -- JSON string
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """)
            
            # Analytics events table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS analytics_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    event_type TEXT NOT NULL,
                    event_data TEXT NOT NULL,  -- JSON string
                    user_id INTEGER,
                    session_id TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """)
            
            # Hotel configuration table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS hotel_config (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    config_key TEXT UNIQUE NOT NULL,
                    config_value TEXT NOT NULL,
                    config_type TEXT DEFAULT 'string',
                    description TEXT,
                    updated_by_user_id INTEGER,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (updated_by_user_id) REFERENCES users (id)
                )
            """)
            
            # Create indexes for better performance
            conn.execute("CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in_date, check_out_date)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_chat_session ON chat_history(session_id)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_chat_timestamp ON chat_history(timestamp)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type)")
            
            conn.commit()
            logger.info("Enhanced database tables initialized successfully")
    
    # User Management Methods
    def create_user(self, username: str, password_hash: str, email: str = None, 
                   full_name: str = None, role: str = 'user') -> int:
        """Create a new user"""
        with self.get_connection() as conn:
            cursor = conn.execute("""
                INSERT INTO users (username, password_hash, email, full_name, role)
                VALUES (?, ?, ?, ?, ?)
            """, (username, password_hash, email, full_name, role))
            return cursor.lastrowid
    
    def get_user_by_username(self, username: str) -> Optional[Dict]:
        """Get user by username"""
        with self.get_connection() as conn:
            row = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
            return dict(row) if row else None
    
    def update_user_last_login(self, user_id: int):
        """Update user's last login timestamp"""
        with self.get_connection() as conn:
            conn.execute("""
                UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?
            """, (user_id,))
    
    # Enhanced Room Management
    def create_room(self, room_number: str, room_type: str = 'standard', 
                   floor: int = None, max_occupancy: int = 2, 
                   price_per_night: float = 0.0, amenities: str = None) -> int:
        """Create a new room"""
        with self.get_connection() as conn:
            cursor = conn.execute("""
                INSERT INTO rooms (room_number, room_type, floor, max_occupancy, 
                                 price_per_night, amenities)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (room_number, room_type, floor, max_occupancy, price_per_night, amenities))
            return cursor.lastrowid
    
    def get_room_by_number(self, room_number: str) -> Optional[Dict]:
        """Get room by room number"""
        with self.get_connection() as conn:
            row = conn.execute("SELECT * FROM rooms WHERE room_number = ?", (room_number,)).fetchone()
            return dict(row) if row else None
    
    def get_available_rooms(self, check_in: str, check_out: str) -> List[Dict]:
        """Get rooms available for specified dates"""
        with self.get_connection() as conn:
            rows = conn.execute("""
                SELECT r.* FROM rooms r
                WHERE r.status = 'available'
                AND r.id NOT IN (
                    SELECT b.room_id FROM bookings b
                    WHERE b.status IN ('confirmed', 'checked_in')
                    AND NOT (b.check_out_date <= ? OR b.check_in_date >= ?)
                )
            """, (check_in, check_out)).fetchall()
            return [dict(row) for row in rows]
    
    # Enhanced Booking Management
    def create_booking(self, booking_data: Dict) -> str:
        """Create a new booking and return booking reference"""
        import uuid
        booking_reference = f"BK{uuid.uuid4().hex[:8].upper()}"
        
        with self.get_connection() as conn:
            conn.execute("""
                INSERT INTO bookings (booking_reference, room_id, guest_name, guest_email,
                                    guest_phone, check_in_date, check_out_date, total_amount,
                                    special_requests, created_by_user_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                booking_reference,
                booking_data.get('room_id'),
                booking_data.get('guest_name'),
                booking_data.get('guest_email'),
                booking_data.get('guest_phone'),
                booking_data.get('check_in_date'),
                booking_data.get('check_out_date'),
                booking_data.get('total_amount', 0.0),
                booking_data.get('special_requests'),
                booking_data.get('created_by_user_id')
            ))
            
            # Update room status if needed
            if booking_data.get('room_id'):
                conn.execute("""
                    UPDATE rooms SET status = 'occupied', updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (booking_data.get('room_id'),))
            
            return booking_reference
    
    def get_booking_by_reference(self, booking_reference: str) -> Optional[Dict]:
        """Get booking by reference number"""
        with self.get_connection() as conn:
            row = conn.execute("""
                SELECT b.*, r.room_number, r.room_type
                FROM bookings b
                JOIN rooms r ON b.room_id = r.id
                WHERE b.booking_reference = ?
            """, (booking_reference,)).fetchone()
            return dict(row) if row else None
    
    # Enhanced Chat History
    def save_chat_enhanced(self, session_id: str, user_message: str, bot_response: str,
                          response_source: str = 'unknown', user_id: int = None,
                          sentiment_score: float = None, intent_classification: str = None,
                          response_time_ms: int = None):
        """Save chat with enhanced metadata"""
        with self.get_connection() as conn:
            conn.execute("""
                INSERT INTO chat_history (session_id, user_message, bot_response, 
                                        response_source, user_id, sentiment_score,
                                        intent_classification, response_time_ms)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (session_id, user_message, bot_response, response_source, user_id,
                  sentiment_score, intent_classification, response_time_ms))
    
    # Analytics Methods
    def log_analytics_event(self, event_type: str, event_data: Dict, 
                           user_id: int = None, session_id: str = None):
        """Log analytics event"""
        import json
        with self.get_connection() as conn:
            conn.execute("""
                INSERT INTO analytics_events (event_type, event_data, user_id, session_id)
                VALUES (?, ?, ?, ?)
            """, (event_type, json.dumps(event_data), user_id, session_id))
    
    def get_analytics_summary(self, days: int = 30) -> Dict:
        """Get analytics summary for specified number of days"""
        with self.get_connection() as conn:
            # Chat statistics
            chat_stats = conn.execute("""
                SELECT COUNT(*) as total_chats,
                       COUNT(DISTINCT session_id) as unique_sessions,
                       AVG(response_time_ms) as avg_response_time
                FROM chat_history
                WHERE timestamp >= datetime('now', '-{} days')
            """.format(days)).fetchone()
            
            # Booking statistics
            booking_stats = conn.execute("""
                SELECT COUNT(*) as total_bookings,
                       SUM(total_amount) as total_revenue,
                       AVG(total_amount) as avg_booking_value
                FROM bookings
                WHERE created_at >= datetime('now', '-{} days')
            """.format(days)).fetchone()
            
            # Room utilization
            room_stats = conn.execute("""
                SELECT 
                    COUNT(CASE WHEN status = 'available' THEN 1 END) as available_rooms,
                    COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied_rooms,
                    COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_rooms,
                    COUNT(*) as total_rooms
                FROM rooms
            """).fetchone()
            
            return {
                'chat_stats': dict(chat_stats) if chat_stats else {},
                'booking_stats': dict(booking_stats) if booking_stats else {},
                'room_stats': dict(room_stats) if room_stats else {},
                'period_days': days
            }
    
    # System Configuration
    def get_config(self, key: str, default_value: str = None) -> str:
        """Get configuration value"""
        with self.get_connection() as conn:
            row = conn.execute("SELECT config_value FROM hotel_config WHERE config_key = ?", (key,)).fetchone()
            return row[0] if row else default_value
    
    def set_config(self, key: str, value: str, description: str = None, 
                  updated_by_user_id: int = None):
        """Set configuration value"""
        with self.get_connection() as conn:
            conn.execute("""
                INSERT OR REPLACE INTO hotel_config 
                (config_key, config_value, description, updated_by_user_id, updated_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, (key, value, description, updated_by_user_id))

# Global database manager instance
db_manager = DatabaseManager()
