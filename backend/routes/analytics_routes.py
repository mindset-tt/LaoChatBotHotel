# routes/analytics_routes.py
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from database.operations import db_connection

router = APIRouter(prefix="/analytics", tags=["Analytics & Reporting"])

@router.get("/chat/insights/")
async def get_chat_insights(days: int = Query(7, ge=1, le=365)):
    """Get chat analytics and insights"""
    conn = db_connection()
    cursor = conn.cursor()
    
    start_date = datetime.now() - timedelta(days=days)
    
    try:
        # Message volume over time
        cursor.execute("""
            SELECT 
                DATE(timestamp) as date,
                COUNT(*) as total_messages,
                COUNT(CASE WHEN role = 'user' THEN 1 END) as user_messages,
                COUNT(CASE WHEN role = 'assistant' THEN 1 END) as bot_messages
            FROM chat_history 
            WHERE timestamp >= ?
            GROUP BY DATE(timestamp)
            ORDER BY date
        """, (start_date.isoformat(),))
        daily_stats = [dict(row) for row in cursor.fetchall()]
        
        # Session statistics
        cursor.execute("""
            SELECT 
                session_id,
                COUNT(*) as message_count,
                MIN(timestamp) as session_start,
                MAX(timestamp) as session_end
            FROM chat_history 
            WHERE timestamp >= ?
            GROUP BY session_id
        """, (start_date.isoformat(),))
        session_stats = cursor.fetchall()
        
        # Calculate session durations
        session_durations = []
        for session in session_stats:
            start = datetime.fromisoformat(session['session_start'])
            end = datetime.fromisoformat(session['session_end'])
            duration_minutes = (end - start).total_seconds() / 60
            session_durations.append(duration_minutes)
        
        avg_session_duration = sum(session_durations) / len(session_durations) if session_durations else 0
        
        # Most common words in user messages (simple analysis)
        cursor.execute("""
            SELECT content FROM chat_history 
            WHERE role = 'user' AND timestamp >= ?
        """, (start_date.isoformat(),))
        user_messages = [row['content'] for row in cursor.fetchall()]
        
        # Basic word frequency (simplified)
        word_freq = {}
        for message in user_messages:
            words = message.lower().split()
            for word in words:
                if len(word) > 3:  # Skip short words
                    word_freq[word] = word_freq.get(word, 0) + 1
        
        # Top 10 words
        top_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:10]
        
        conn.close()
        
        return {
            "period_days": days,
            "summary": {
                "total_sessions": len(session_stats),
                "total_messages": sum(row['total_messages'] for row in daily_stats),
                "avg_session_duration_minutes": round(avg_session_duration, 2),
                "avg_messages_per_session": round(sum(s['message_count'] for s in session_stats) / len(session_stats), 2) if session_stats else 0
            },
            "daily_stats": daily_stats,
            "top_words": top_words,
            "session_distribution": {
                "short_sessions": len([s for s in session_durations if s < 5]),
                "medium_sessions": len([s for s in session_durations if 5 <= s < 15]),
                "long_sessions": len([s for s in session_durations if s >= 15])
            }
        }
        
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=f"Analytics error: {str(e)}")

@router.get("/bookings/insights/")
async def get_booking_insights(days: int = Query(30, ge=1, le=365)):
    """Get booking analytics and insights"""
    conn = db_connection()
    cursor = conn.cursor()
    
    start_date = datetime.now() - timedelta(days=days)
    
    try:
        # Booking trends
        cursor.execute("""
            SELECT 
                DATE(reserveStartDate) as booking_date,
                COUNT(*) as bookings_count
            FROM rooms 
            WHERE reserveStartDate >= ? AND reserveStartDate IS NOT NULL
            GROUP BY DATE(reserveStartDate)
            ORDER BY booking_date
        """, (start_date.date().isoformat(),))
        booking_trends = [dict(row) for row in cursor.fetchall()]
        
        # Room utilization
        cursor.execute("""
            SELECT 
                roomNumber,
                COUNT(*) as times_booked,
                AVG(julianday(reserveEndDate) - julianday(reserveStartDate)) as avg_stay_duration
            FROM rooms 
            WHERE reserveStartDate >= ? AND reserveStartDate IS NOT NULL
            GROUP BY roomNumber
            ORDER BY times_booked DESC
        """, (start_date.date().isoformat(),))
        room_utilization = [dict(row) for row in cursor.fetchall()]
        
        # Current occupancy
        cursor.execute("""
            SELECT 
                COUNT(CASE WHEN status = 'Available' THEN 1 END) as available,
                COUNT(CASE WHEN status = 'Booked' THEN 1 END) as booked,
                COUNT(*) as total
            FROM rooms
        """)
        occupancy = dict(cursor.fetchone())
        occupancy['occupancy_rate'] = round((occupancy['booked'] / occupancy['total']) * 100, 2)
        
        # Booking duration analysis
        cursor.execute("""
            SELECT 
                julianday(reserveEndDate) - julianday(reserveStartDate) as duration_days
            FROM rooms 
            WHERE reserveStartDate >= ? AND reserveStartDate IS NOT NULL
            AND reserveEndDate IS NOT NULL
        """, (start_date.date().isoformat(),))
        durations = [row['duration_days'] for row in cursor.fetchall()]
        
        avg_duration = sum(durations) / len(durations) if durations else 0
        
        conn.close()
        
        return {
            "period_days": days,
            "summary": {
                "total_bookings": len(booking_trends),
                "avg_stay_duration_days": round(avg_duration, 2),
                "current_occupancy_rate": occupancy['occupancy_rate']
            },
            "booking_trends": booking_trends,
            "room_utilization": room_utilization,
            "current_occupancy": occupancy,
            "duration_distribution": {
                "short_stays": len([d for d in durations if d <= 2]),
                "medium_stays": len([d for d in durations if 2 < d <= 7]),
                "long_stays": len([d for d in durations if d > 7])
            }
        }
        
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=f"Booking analytics error: {str(e)}")

@router.get("/performance/")
async def get_performance_metrics():
    """Get system performance metrics"""
    from services.ml_models import model_store
    import psutil
    
    try:
        # Memory usage
        memory = psutil.virtual_memory()
        
        # Model information
        model_info = {
            "models_loaded": model_store.models_loaded,
            "rag_chunks_count": len(model_store.rag_chunks) if model_store.rag_chunks else 0
        }
        
        # Database size
        import os
        from config.settings import CONFIG
        db_size = os.path.getsize(CONFIG.DB_FILE) if os.path.exists(CONFIG.DB_FILE) else 0
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "system_resources": {
                "memory_usage_percent": memory.percent,
                "memory_used_gb": round(memory.used / (1024**3), 2),
                "memory_total_gb": round(memory.total / (1024**3), 2)
            },
            "database": {
                "size_mb": round(db_size / (1024**2), 2)
            },
            "models": model_info
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Performance metrics error: {str(e)}")
