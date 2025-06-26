# services/analytics.py
import json
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from database.models import db_manager
import logging

logger = logging.getLogger(__name__)

class AnalyticsService:
    """Advanced analytics service for hotel operations and chatbot performance"""
    
    def __init__(self):
        self.db_manager = db_manager
    
    def track_user_interaction(self, event_type: str, session_id: str, 
                             user_message: str = None, bot_response: str = None,
                             response_time_ms: int = None, user_id: int = None):
        """Track user interaction events"""
        event_data = {
            'user_message': user_message,
            'bot_response': bot_response,
            'response_time_ms': response_time_ms,
            'timestamp': datetime.now().isoformat()
        }
        
        self.db_manager.log_analytics_event(
            event_type=event_type,
            event_data=event_data,
            user_id=user_id,
            session_id=session_id
        )
    
    def track_booking_event(self, event_type: str, booking_reference: str = None,
                           room_number: str = None, guest_name: str = None,
                           amount: float = None, user_id: int = None):
        """Track booking-related events"""
        event_data = {
            'booking_reference': booking_reference,
            'room_number': room_number,
            'guest_name': guest_name,
            'amount': amount,
            'timestamp': datetime.now().isoformat()
        }
        
        self.db_manager.log_analytics_event(
            event_type=event_type,
            event_data=event_data,
            user_id=user_id
        )
    
    def get_chat_analytics(self, days: int = 30) -> Dict:
        """Get comprehensive chat analytics"""
        with self.db_manager.get_connection() as conn:
            # Basic chat metrics
            basic_metrics = conn.execute("""
                SELECT 
                    COUNT(*) as total_messages,
                    COUNT(DISTINCT session_id) as unique_sessions,
                    AVG(response_time_ms) as avg_response_time,
                    MIN(response_time_ms) as min_response_time,
                    MAX(response_time_ms) as max_response_time
                FROM chat_history
                WHERE timestamp >= datetime('now', '-{} days')
            """.format(days)).fetchone()
            
            # Response source distribution
            source_distribution = conn.execute("""
                SELECT response_source, COUNT(*) as count
                FROM chat_history
                WHERE timestamp >= datetime('now', '-{} days')
                GROUP BY response_source
                ORDER BY count DESC
            """.format(days)).fetchall()
            
            # Hourly activity pattern
            hourly_activity = conn.execute("""
                SELECT 
                    CAST(strftime('%H', timestamp) AS INTEGER) as hour,
                    COUNT(*) as message_count
                FROM chat_history
                WHERE timestamp >= datetime('now', '-{} days')
                GROUP BY hour
                ORDER BY hour
            """.format(days)).fetchall()
            
            # Intent classification distribution
            intent_distribution = conn.execute("""
                SELECT intent_classification, COUNT(*) as count
                FROM chat_history
                WHERE timestamp >= datetime('now', '-{} days')
                AND intent_classification IS NOT NULL
                GROUP BY intent_classification
                ORDER BY count DESC
            """.format(days)).fetchall()
            
            # Average sentiment score
            sentiment_avg = conn.execute("""
                SELECT AVG(sentiment_score) as avg_sentiment
                FROM chat_history
                WHERE timestamp >= datetime('now', '-{} days')
                AND sentiment_score IS NOT NULL
            """.format(days)).fetchone()
            
            return {
                'basic_metrics': dict(basic_metrics) if basic_metrics else {},
                'source_distribution': [dict(row) for row in source_distribution],
                'hourly_activity': [dict(row) for row in hourly_activity],
                'intent_distribution': [dict(row) for row in intent_distribution],
                'average_sentiment': sentiment_avg[0] if sentiment_avg and sentiment_avg[0] else 0.0,
                'period_days': days
            }
    
    def get_booking_analytics(self, days: int = 30) -> Dict:
        """Get comprehensive booking analytics"""
        with self.db_manager.get_connection() as conn:
            # Revenue and booking metrics
            revenue_metrics = conn.execute("""
                SELECT 
                    COUNT(*) as total_bookings,
                    SUM(total_amount) as total_revenue,
                    AVG(total_amount) as avg_booking_value,
                    MIN(total_amount) as min_booking_value,
                    MAX(total_amount) as max_booking_value
                FROM bookings
                WHERE created_at >= datetime('now', '-{} days')
            """.format(days)).fetchone()
            
            # Booking status distribution
            status_distribution = conn.execute("""
                SELECT status, COUNT(*) as count
                FROM bookings
                WHERE created_at >= datetime('now', '-{} days')
                GROUP BY status
                ORDER BY count DESC
            """.format(days)).fetchall()
            
            # Daily booking trend
            daily_bookings = conn.execute("""
                SELECT 
                    DATE(created_at) as booking_date,
                    COUNT(*) as booking_count,
                    SUM(total_amount) as daily_revenue
                FROM bookings
                WHERE created_at >= datetime('now', '-{} days')
                GROUP BY DATE(created_at)
                ORDER BY booking_date
            """.format(days)).fetchall()
            
            # Room type popularity
            room_type_popularity = conn.execute("""
                SELECT 
                    r.room_type,
                    COUNT(*) as booking_count,
                    SUM(b.total_amount) as total_revenue
                FROM bookings b
                JOIN rooms r ON b.room_id = r.id
                WHERE b.created_at >= datetime('now', '-{} days')
                GROUP BY r.room_type
                ORDER BY booking_count DESC
            """.format(days)).fetchall()
            
            # Average stay duration
            avg_stay = conn.execute("""
                SELECT AVG(julianday(check_out_date) - julianday(check_in_date)) as avg_stay_days
                FROM bookings
                WHERE created_at >= datetime('now', '-{} days')
            """.format(days)).fetchone()
            
            return {
                'revenue_metrics': dict(revenue_metrics) if revenue_metrics else {},
                'status_distribution': [dict(row) for row in status_distribution],
                'daily_bookings': [dict(row) for row in daily_bookings],
                'room_type_popularity': [dict(row) for row in room_type_popularity],
                'average_stay_duration': avg_stay[0] if avg_stay and avg_stay[0] else 0.0,
                'period_days': days
            }
    
    def get_occupancy_analytics(self, days: int = 30) -> Dict:
        """Get room occupancy analytics"""
        with self.db_manager.get_connection() as conn:
            # Current occupancy
            current_occupancy = conn.execute("""
                SELECT 
                    COUNT(CASE WHEN status = 'available' THEN 1 END) as available,
                    COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied,
                    COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance,
                    COUNT(CASE WHEN status = 'cleaning' THEN 1 END) as cleaning,
                    COUNT(*) as total_rooms
                FROM rooms
            """).fetchone()
            
            # Historical occupancy trend
            occupancy_trend = conn.execute("""
                SELECT 
                    DATE(check_in_date) as date,
                    COUNT(*) as check_ins
                FROM bookings
                WHERE check_in_date >= date('now', '-{} days')
                AND status IN ('confirmed', 'checked_in')
                GROUP BY DATE(check_in_date)
                ORDER BY date
            """.format(days)).fetchall()
            
            # Floor-wise occupancy
            floor_occupancy = conn.execute("""
                SELECT 
                    floor,
                    COUNT(CASE WHEN status = 'available' THEN 1 END) as available,
                    COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied,
                    COUNT(*) as total_rooms_floor
                FROM rooms
                WHERE floor IS NOT NULL
                GROUP BY floor
                ORDER BY floor
            """).fetchall()
            
            return {
                'current_occupancy': dict(current_occupancy) if current_occupancy else {},
                'occupancy_trend': [dict(row) for row in occupancy_trend],
                'floor_occupancy': [dict(row) for row in floor_occupancy],
                'occupancy_rate': (current_occupancy[1] / current_occupancy[4] * 100) if current_occupancy and current_occupancy[4] > 0 else 0
            }
    
    def get_performance_metrics(self) -> Dict:
        """Get system performance metrics"""
        with self.db_manager.get_connection() as conn:
            # Response time metrics from last 24 hours
            response_time_metrics = conn.execute("""
                SELECT 
                    AVG(response_time_ms) as avg_response_time,
                    MIN(response_time_ms) as min_response_time,
                    MAX(response_time_ms) as max_response_time,
                    COUNT(CASE WHEN response_time_ms > 5000 THEN 1 END) as slow_responses,
                    COUNT(*) as total_responses
                FROM chat_history
                WHERE timestamp >= datetime('now', '-1 day')
                AND response_time_ms IS NOT NULL
            """).fetchone()
            
            # Error rate from system logs
            error_rate = conn.execute("""
                SELECT 
                    COUNT(CASE WHEN log_level = 'ERROR' THEN 1 END) as error_count,
                    COUNT(CASE WHEN log_level = 'WARNING' THEN 1 END) as warning_count,
                    COUNT(*) as total_logs
                FROM system_logs
                WHERE timestamp >= datetime('now', '-1 day')
            """).fetchone()
            
            return {
                'response_time_metrics': dict(response_time_metrics) if response_time_metrics else {},
                'error_metrics': dict(error_rate) if error_rate else {},
                'system_health': 'Good' if (error_rate and error_rate[0] < 10) else 'Needs Attention'
            }
    
    def generate_daily_report(self, target_date: str = None) -> Dict:
        """Generate comprehensive daily report"""
        if not target_date:
            target_date = datetime.now().strftime('%Y-%m-%d')
        
        with self.db_manager.get_connection() as conn:
            # Daily summary
            daily_summary = conn.execute("""
                SELECT 
                    (SELECT COUNT(*) FROM chat_history WHERE DATE(timestamp) = ?) as total_chats,
                    (SELECT COUNT(DISTINCT session_id) FROM chat_history WHERE DATE(timestamp) = ?) as unique_sessions,
                    (SELECT COUNT(*) FROM bookings WHERE DATE(created_at) = ?) as new_bookings,
                    (SELECT SUM(total_amount) FROM bookings WHERE DATE(created_at) = ?) as daily_revenue,
                    (SELECT COUNT(*) FROM bookings WHERE DATE(check_in_date) = ?) as check_ins,
                    (SELECT COUNT(*) FROM bookings WHERE DATE(check_out_date) = ?) as check_outs
            """, (target_date, target_date, target_date, target_date, target_date, target_date)).fetchone()
            
            return {
                'date': target_date,
                'summary': dict(daily_summary) if daily_summary else {},
                'generated_at': datetime.now().isoformat()
            }
    
    def get_user_behavior_insights(self, days: int = 30) -> Dict:
        """Get insights into user behavior patterns"""
        with self.db_manager.get_connection() as conn:
            # Session duration analysis
            session_duration = conn.execute("""
                SELECT 
                    session_id,
                    COUNT(*) as message_count,
                    (julianday(MAX(timestamp)) - julianday(MIN(timestamp))) * 24 * 60 as duration_minutes
                FROM chat_history
                WHERE timestamp >= datetime('now', '-{} days')
                GROUP BY session_id
                HAVING COUNT(*) > 1
            """.format(days)).fetchall()
            
            # Common question patterns
            common_patterns = conn.execute("""
                SELECT 
                    intent_classification,
                    COUNT(*) as frequency,
                    AVG(response_time_ms) as avg_response_time
                FROM chat_history
                WHERE timestamp >= datetime('now', '-{} days')
                AND intent_classification IS NOT NULL
                GROUP BY intent_classification
                ORDER BY frequency DESC
                LIMIT 10
            """.format(days)).fetchall()
            
            avg_session_duration = sum(row[2] for row in session_duration) / len(session_duration) if session_duration else 0
            avg_messages_per_session = sum(row[1] for row in session_duration) / len(session_duration) if session_duration else 0
            
            return {
                'average_session_duration_minutes': avg_session_duration,
                'average_messages_per_session': avg_messages_per_session,
                'common_patterns': [dict(row) for row in common_patterns],
                'total_analyzed_sessions': len(session_duration)
            }

# Global analytics service instance
analytics_service = AnalyticsService()
