# routes/notification_routes.py
from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
import logging
from models.schemas import StandardResponse
from services.notifications import notification_service
from services.security import security_service
from pydantic import BaseModel

logger = logging.getLogger(__name__)

class NotificationRequest(BaseModel):
    title: str
    message: str
    notification_type: str = 'info'
    action_url: Optional[str] = None

class EmailRequest(BaseModel):
    to_email: str
    subject: str
    body: str
    to_name: Optional[str] = None
    html_body: Optional[str] = None

class SystemAlertRequest(BaseModel):
    alert_type: str
    alert_details: str
    severity: str = 'medium'
    admin_emails: Optional[List[str]] = None

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

def get_current_user(token: str = Depends(security_service.verify_token)):
    """Dependency to get current user from token"""
    return token

@router.post("/send-email", response_model=StandardResponse)
async def send_email(request: EmailRequest, current_user: dict = Depends(get_current_user)):
    """Send email notification"""
    try:
        success = notification_service.send_email(
            to_email=request.to_email,
            subject=request.subject,
            body=request.body,
            to_name=request.to_name,
            html_body=request.html_body
        )
        
        if success:
            return StandardResponse(message="Email sent successfully")
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send email"
            )
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email: {str(e)}"
        )

@router.post("/system-alert", response_model=StandardResponse)
async def send_system_alert(request: SystemAlertRequest, current_user: dict = Depends(get_current_user)):
    """Send system alert to administrators"""
    try:
        success = notification_service.send_system_alert(
            alert_type=request.alert_type,
            alert_details=request.alert_details,
            severity=request.severity,
            admin_emails=request.admin_emails
        )
        
        if success:
            return StandardResponse(message="System alert sent successfully")
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send system alert"
            )
    except Exception as e:
        logger.error(f"Failed to send system alert: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send system alert: {str(e)}"
        )

@router.post("/schedule-reminders", response_model=StandardResponse)
async def schedule_check_in_reminders(current_user: dict = Depends(get_current_user)):
    """Schedule check-in reminder emails for tomorrow's guests"""
    try:
        sent_count = notification_service.schedule_check_in_reminders()
        return StandardResponse(message=f"Scheduled {sent_count} check-in reminder emails")
    except Exception as e:
        logger.error(f"Failed to schedule reminders: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to schedule reminders: {str(e)}"
        )

@router.post("/in-app", response_model=StandardResponse)
async def create_in_app_notification(request: NotificationRequest, 
                                   target_user_id: int,
                                   current_user: dict = Depends(get_current_user)):
    """Create in-app notification for a user"""
    try:
        notification_id = notification_service.create_in_app_notification(
            user_id=target_user_id,
            title=request.title,
            message=request.message,
            notification_type=request.notification_type,
            action_url=request.action_url
        )
        
        if notification_id:
            return StandardResponse(message=f"In-app notification created with ID: {notification_id}")
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create in-app notification"
            )
    except Exception as e:
        logger.error(f"Failed to create in-app notification: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create in-app notification: {str(e)}"
        )

@router.get("/my-notifications")
async def get_my_notifications(unread_only: bool = False, current_user: dict = Depends(get_current_user)):
    """Get notifications for the current user"""
    try:
        user_id = current_user.get('user_id')
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID not found in token"
            )
        
        notifications = notification_service.get_user_notifications(
            user_id=user_id,
            unread_only=unread_only
        )
        
        return {
            "notifications": notifications,
            "total_count": len(notifications)
        }
    except Exception as e:
        logger.error(f"Failed to get user notifications: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get notifications: {str(e)}"
        )

@router.post("/mark-read/{notification_id}", response_model=StandardResponse)
async def mark_notification_read(notification_id: int, current_user: dict = Depends(get_current_user)):
    """Mark a notification as read"""
    try:
        user_id = current_user.get('user_id')
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID not found in token"
            )
        
        success = notification_service.mark_notification_read(
            notification_id=notification_id,
            user_id=user_id
        )
        
        if success:
            return StandardResponse(message="Notification marked as read")
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
    except Exception as e:
        logger.error(f"Failed to mark notification as read: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mark notification as read: {str(e)}"
        )

@router.get("/templates")
async def get_notification_templates(current_user: dict = Depends(get_current_user)):
    """Get available notification templates"""
    try:
        return {
            "templates": list(notification_service.notification_templates.keys()),
            "template_details": notification_service.notification_templates
        }
    except Exception as e:
        logger.error(f"Failed to get notification templates: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get templates: {str(e)}"
        )
