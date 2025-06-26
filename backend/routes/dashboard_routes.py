# routes/dashboard_routes.py
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Dict, List, Optional
import logging
from services.analytics import analytics_service
from services.cache import cache_service
from database.models import db_manager
from models.schemas import StandardResponse
from pydantic import BaseModel

logger = logging.getLogger(__name__)

class DashboardSummary(BaseModel):
    current_occupancy: Dict
    today_stats: Dict
    recent_bookings: List[Dict]
    recent_chats: List[Dict]
    system_health: Dict
    cache_stats: Dict

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/summary")
async def get_dashboard_summary():
    """Get comprehensive dashboard summary"""
    try:
        # Check cache first
        cached_summary = cache_service.get_cached_analytics_result('dashboard_summary', {})
        if cached_summary:
            return cached_summary

        # Get current occupancy
        occupancy_analytics = analytics_service.get_occupancy_analytics(days=1)
        
        # Get today's statistics
        today_stats = analytics_service.generate_daily_report()
        
        # Get recent bookings (last 10)
        with db_manager.get_connection() as conn:
            recent_bookings = conn.execute("""
                SELECT b.*, r.room_number, r.room_type
                FROM bookings b
                JOIN rooms r ON b.room_id = r.id
                ORDER BY b.created_at DESC
                LIMIT 10
            """).fetchall()
            recent_bookings = [dict(row) for row in recent_bookings]
        
        # Get recent chat sessions (last 10)
        with db_manager.get_connection() as conn:
            recent_chats = conn.execute("""
                SELECT session_id, user_message, bot_response, timestamp, response_source
                FROM chat_history
                ORDER BY timestamp DESC
                LIMIT 10
            """).fetchall()
            recent_chats = [dict(row) for row in recent_chats]
        
        # Get system health metrics
        performance_metrics = analytics_service.get_performance_metrics()
        
        # Get cache statistics
        cache_stats = cache_service.get_cache_statistics()
        
        summary = {
            'current_occupancy': occupancy_analytics.get('current_occupancy', {}),
            'today_stats': today_stats.get('summary', {}),
            'recent_bookings': recent_bookings,
            'recent_chats': recent_chats,
            'system_health': performance_metrics,
            'cache_stats': cache_stats,
            'last_updated': analytics_service.db_manager.get_connection().execute("SELECT datetime('now')").fetchone()[0]
        }
        
        # Cache the result for 5 minutes
        cache_service.cache_analytics_result('dashboard_summary', {}, summary, ttl=300)
        
        return summary
        
    except Exception as e:
        logger.error(f"Failed to get dashboard summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard summary: {str(e)}")

@router.get("/occupancy")
async def get_occupancy_dashboard(days: int = Query(default=30, ge=1, le=365)):
    """Get detailed occupancy dashboard"""
    try:
        cache_key = {'days': days}
        cached_result = cache_service.get_cached_analytics_result('occupancy_dashboard', cache_key)
        if cached_result:
            return cached_result
        
        occupancy_data = analytics_service.get_occupancy_analytics(days=days)
        
        # Additional occupancy insights
        with db_manager.get_connection() as conn:
            # Forecast based on confirmed bookings
            future_bookings = conn.execute("""
                SELECT 
                    DATE(check_in_date) as date,
                    COUNT(*) as expected_check_ins
                FROM bookings
                WHERE check_in_date > date('now')
                AND check_in_date <= date('now', '+30 days')
                AND status = 'confirmed'
                GROUP BY DATE(check_in_date)
                ORDER BY date
            """).fetchall()
            future_bookings = [dict(row) for row in future_bookings]
        
        result = {
            **occupancy_data,
            'future_bookings': future_bookings
        }
        
        # Cache for 15 minutes
        cache_service.cache_analytics_result('occupancy_dashboard', cache_key, result, ttl=900)
        return result
        
    except Exception as e:
        logger.error(f"Failed to get occupancy dashboard: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get occupancy dashboard: {str(e)}")

@router.get("/revenue")
async def get_revenue_dashboard(days: int = Query(default=30, ge=1, le=365)):
    """Get detailed revenue dashboard"""
    try:
        cache_key = {'days': days}
        cached_result = cache_service.get_cached_analytics_result('revenue_dashboard', cache_key)
        if cached_result:
            return cached_result
        
        booking_analytics = analytics_service.get_booking_analytics(days=days)
        
        # Additional revenue insights
        with db_manager.get_connection() as conn:
            # Revenue by month
            monthly_revenue = conn.execute("""
                SELECT 
                    strftime('%Y-%m', created_at) as month,
                    COUNT(*) as booking_count,
                    SUM(total_amount) as monthly_revenue,
                    AVG(total_amount) as avg_booking_value
                FROM bookings
                WHERE created_at >= datetime('now', '-12 months')
                GROUP BY strftime('%Y-%m', created_at)
                ORDER BY month DESC
            """).fetchall()
            monthly_revenue = [dict(row) for row in monthly_revenue]
            
            # Revenue by room type
            revenue_by_room_type = conn.execute("""
                SELECT 
                    r.room_type,
                    COUNT(*) as bookings,
                    SUM(b.total_amount) as total_revenue,
                    AVG(b.total_amount) as avg_revenue,
                    AVG(julianday(b.check_out_date) - julianday(b.check_in_date)) as avg_stay_duration
                FROM bookings b
                JOIN rooms r ON b.room_id = r.id
                WHERE b.created_at >= datetime('now', '-{} days')
                GROUP BY r.room_type
                ORDER BY total_revenue DESC
            """.format(days)).fetchall()
            revenue_by_room_type = [dict(row) for row in revenue_by_room_type]
        
        result = {
            **booking_analytics,
            'monthly_revenue': monthly_revenue,
            'revenue_by_room_type': revenue_by_room_type
        }
        
        # Cache for 15 minutes
        cache_service.cache_analytics_result('revenue_dashboard', cache_key, result, ttl=900)
        return result
        
    except Exception as e:
        logger.error(f"Failed to get revenue dashboard: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get revenue dashboard: {str(e)}")

@router.get("/chat-performance")
async def get_chat_performance_dashboard(days: int = Query(default=30, ge=1, le=365)):
    """Get detailed chat performance dashboard"""
    try:
        cache_key = {'days': days}
        cached_result = cache_service.get_cached_analytics_result('chat_performance', cache_key)
        if cached_result:
            return cached_result
        
        chat_analytics = analytics_service.get_chat_analytics(days=days)
        user_behavior = analytics_service.get_user_behavior_insights(days=days)
        
        # Additional chat insights
        with db_manager.get_connection() as conn:
            # Response time trends
            response_time_trends = conn.execute("""
                SELECT 
                    DATE(timestamp) as date,
                    AVG(response_time_ms) as avg_response_time,
                    MIN(response_time_ms) as min_response_time,
                    MAX(response_time_ms) as max_response_time,
                    COUNT(*) as message_count
                FROM chat_history
                WHERE timestamp >= datetime('now', '-{} days')
                AND response_time_ms IS NOT NULL
                GROUP BY DATE(timestamp)
                ORDER BY date
            """.format(days)).fetchall()
            response_time_trends = [dict(row) for row in response_time_trends]
            
            # Most common questions
            common_questions = conn.execute("""
                SELECT 
                    user_message,
                    COUNT(*) as frequency,
                    AVG(response_time_ms) as avg_response_time
                FROM chat_history
                WHERE timestamp >= datetime('now', '-{} days')
                GROUP BY LOWER(TRIM(user_message))
                HAVING COUNT(*) > 1
                ORDER BY frequency DESC
                LIMIT 20
            """.format(days)).fetchall()
            common_questions = [dict(row) for row in common_questions]
        
        result = {
            **chat_analytics,
            'user_behavior': user_behavior,
            'response_time_trends': response_time_trends,
            'common_questions': common_questions
        }
        
        # Cache for 10 minutes
        cache_service.cache_analytics_result('chat_performance', cache_key, result, ttl=600)
        return result
        
    except Exception as e:
        logger.error(f"Failed to get chat performance dashboard: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get chat performance dashboard: {str(e)}")

@router.get("/alerts")
async def get_system_alerts():
    """Get system alerts and warnings"""
    try:
        alerts = []
        
        # Check occupancy rate
        occupancy_data = analytics_service.get_occupancy_analytics(days=1)
        if occupancy_data.get('occupancy_rate', 0) > 95:
            alerts.append({
                'type': 'warning',
                'message': 'Hotel occupancy is above 95%',
                'severity': 'high',
                'category': 'occupancy'
            })
        
        # Check response times
        performance_metrics = analytics_service.get_performance_metrics()
        avg_response_time = performance_metrics.get('response_time_metrics', {}).get('avg_response_time', 0)
        if avg_response_time > 5000:  # 5 seconds
            alerts.append({
                'type': 'warning',
                'message': f'Average response time is high: {avg_response_time:.0f}ms',
                'severity': 'medium',
                'category': 'performance'
            })
        
        # Check error rate
        error_metrics = performance_metrics.get('error_metrics', {})
        error_count = error_metrics.get('error_count', 0)
        if error_count > 10:
            alerts.append({
                'type': 'error',
                'message': f'High error count in last 24 hours: {error_count}',
                'severity': 'high',
                'category': 'errors'
            })
        
        # Check cache performance
        cache_stats = cache_service.get_cache_statistics()
        memory_cache_hit_rate = cache_stats.get('memory_cache', {}).get('hit_rate', 0)
        if memory_cache_hit_rate < 50:
            alerts.append({
                'type': 'info',
                'message': f'Cache hit rate is low: {memory_cache_hit_rate}%',
                'severity': 'low',
                'category': 'performance'
            })
        
        return {
            'alerts': alerts,
            'total_alerts': len(alerts),
            'last_checked': analytics_service.db_manager.get_connection().execute("SELECT datetime('now')").fetchone()[0]
        }
        
    except Exception as e:
        logger.error(f"Failed to get system alerts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get system alerts: {str(e)}")

@router.post("/refresh-cache", response_model=StandardResponse)
async def refresh_dashboard_cache():
    """Refresh dashboard cache"""
    try:
        # Clear analytics cache
        cache_service.query_cache.clear(prefix='analytics')
        
        # Trigger cache warm-up
        cache_service.warm_up_cache()
        
        return StandardResponse(message="Dashboard cache refreshed successfully")
        
    except Exception as e:
        logger.error(f"Failed to refresh dashboard cache: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to refresh cache: {str(e)}")
