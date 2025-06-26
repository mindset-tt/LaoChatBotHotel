# services/notifications.py
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from database.models import db_manager
import json

logger = logging.getLogger(__name__)

class NotificationService:
    """Enhanced notification service for email, SMS, and in-app notifications"""
    
    def __init__(self):
        self.db_manager = db_manager
        self.email_config = self._load_email_config()
        self.notification_templates = self._load_templates()
    
    def _load_email_config(self) -> Dict:
        """Load email configuration from database or environment"""
        return {
            'smtp_server': self.db_manager.get_config('smtp_server', 'smtp.gmail.com'),
            'smtp_port': int(self.db_manager.get_config('smtp_port', '587')),
            'smtp_username': self.db_manager.get_config('smtp_username', ''),
            'smtp_password': self.db_manager.get_config('smtp_password', ''),
            'from_email': self.db_manager.get_config('from_email', 'noreply@hotel.com'),
            'from_name': self.db_manager.get_config('from_name', 'Vang Vieng Hotel')
        }
    
    def _load_templates(self) -> Dict:
        """Load notification templates"""
        return {
            'booking_confirmation': {
                'subject': 'Booking Confirmation - {booking_reference}',
                'body': '''
Dear {guest_name},

Your booking has been confirmed!

Booking Details:
- Booking Reference: {booking_reference}
- Room: {room_number} ({room_type})
- Check-in: {check_in_date}
- Check-out: {check_out_date}
- Total Amount: ${total_amount}

Special Requests: {special_requests}

Thank you for choosing our hotel!

Best regards,
{hotel_name}
                '''
            },
            'booking_reminder': {
                'subject': 'Check-in Reminder - {booking_reference}',
                'body': '''
Dear {guest_name},

This is a friendly reminder that your check-in is tomorrow.

Booking Details:
- Booking Reference: {booking_reference}
- Check-in Date: {check_in_date}
- Room: {room_number}

Check-in time: 3:00 PM
Check-out time: 11:00 AM

We look forward to welcoming you!

Best regards,
{hotel_name}
                '''
            },
            'booking_cancellation': {
                'subject': 'Booking Cancellation - {booking_reference}',
                'body': '''
Dear {guest_name},

Your booking has been cancelled as requested.

Cancelled Booking Details:
- Booking Reference: {booking_reference}
- Room: {room_number}
- Original Check-in: {check_in_date}
- Original Check-out: {check_out_date}

If you have any questions, please contact us.

Best regards,
{hotel_name}
                '''
            },
            'system_alert': {
                'subject': 'System Alert - {alert_type}',
                'body': '''
System Alert: {alert_type}

Details:
{alert_details}

Timestamp: {timestamp}
Severity: {severity}

Please investigate immediately.

System Monitoring
                '''
            }
        }
    
    def send_email(self, to_email: str, subject: str, body: str, 
                   to_name: str = None, html_body: str = None) -> bool:
        """Send email notification"""
        try:
            if not self.email_config['smtp_username'] or not self.email_config['smtp_password']:
                logger.warning("Email configuration not complete - email not sent")
                return False
            
            msg = MIMEMultipart('alternative')
            msg['From'] = f"{self.email_config['from_name']} <{self.email_config['from_email']}>"
            msg['To'] = f"{to_name} <{to_email}>" if to_name else to_email
            msg['Subject'] = subject
            
            # Add plain text part
            text_part = MIMEText(body, 'plain', 'utf-8')
            msg.attach(text_part)
            
            # Add HTML part if provided
            if html_body:
                html_part = MIMEText(html_body, 'html', 'utf-8')
                msg.attach(html_part)
            
            # Send email
            with smtplib.SMTP(self.email_config['smtp_server'], self.email_config['smtp_port']) as server:
                server.starttls()
                server.login(self.email_config['smtp_username'], self.email_config['smtp_password'])
                server.send_message(msg)
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False
    
    def send_booking_confirmation(self, booking_data: Dict) -> bool:
        """Send booking confirmation email"""
        template = self.notification_templates['booking_confirmation']
        
        subject = template['subject'].format(**booking_data)
        body = template['body'].format(**booking_data)
        
        return self.send_email(
            to_email=booking_data.get('guest_email', ''),
            to_name=booking_data.get('guest_name', ''),
            subject=subject,
            body=body
        )
    
    def send_booking_reminder(self, booking_data: Dict) -> bool:
        """Send booking reminder email"""
        template = self.notification_templates['booking_reminder']
        
        subject = template['subject'].format(**booking_data)
        body = template['body'].format(**booking_data)
        
        return self.send_email(
            to_email=booking_data.get('guest_email', ''),
            to_name=booking_data.get('guest_name', ''),
            subject=subject,
            body=body
        )
    
    def send_booking_cancellation(self, booking_data: Dict) -> bool:
        """Send booking cancellation email"""
        template = self.notification_templates['booking_cancellation']
        
        subject = template['subject'].format(**booking_data)
        body = template['body'].format(**booking_data)
        
        return self.send_email(
            to_email=booking_data.get('guest_email', ''),
            to_name=booking_data.get('guest_name', ''),
            subject=subject,
            body=body
        )
    
    def send_system_alert(self, alert_type: str, alert_details: str, 
                         severity: str = 'medium', admin_emails: List[str] = None) -> bool:
        """Send system alert to administrators"""
        if not admin_emails:
            admin_emails = self._get_admin_emails()
        
        template = self.notification_templates['system_alert']
        
        alert_data = {
            'alert_type': alert_type,
            'alert_details': alert_details,
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'severity': severity
        }
        
        subject = template['subject'].format(**alert_data)
        body = template['body'].format(**alert_data)
        
        success_count = 0
        for email in admin_emails:
            if self.send_email(to_email=email, subject=subject, body=body):
                success_count += 1
        
        return success_count > 0
    
    def _get_admin_emails(self) -> List[str]:
        """Get list of administrator emails"""
        try:
            with self.db_manager.get_connection() as conn:
                rows = conn.execute("""
                    SELECT email FROM users 
                    WHERE role IN ('admin', 'manager') 
                    AND is_active = 1 
                    AND email IS NOT NULL
                """).fetchall()
                return [row[0] for row in rows if row[0]]
        except Exception as e:
            logger.error(f"Failed to get admin emails: {str(e)}")
            return []
    
    def schedule_check_in_reminders(self) -> int:
        """Schedule check-in reminders for tomorrow's guests"""
        try:
            tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
            
            with self.db_manager.get_connection() as conn:
                rows = conn.execute("""
                    SELECT b.*, r.room_number, r.room_type
                    FROM bookings b
                    JOIN rooms r ON b.room_id = r.id
                    WHERE DATE(b.check_in_date) = ?
                    AND b.status = 'confirmed'
                    AND b.guest_email IS NOT NULL
                """, (tomorrow,)).fetchall()
                
                sent_count = 0
                for row in rows:
                    booking_data = dict(row)
                    booking_data['hotel_name'] = self.db_manager.get_config('hotel_name', 'Vang Vieng Hotel')
                    
                    if self.send_booking_reminder(booking_data):
                        sent_count += 1
                
                logger.info(f"Sent {sent_count} check-in reminder emails")
                return sent_count
                
        except Exception as e:
            logger.error(f"Failed to schedule check-in reminders: {str(e)}")
            return 0
    
    def create_in_app_notification(self, user_id: int, title: str, message: str, 
                                  notification_type: str = 'info', 
                                  action_url: str = None) -> int:
        """Create in-app notification"""
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.execute("""
                    INSERT INTO notifications (user_id, title, message, type, action_url, created_at, is_read)
                    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 0)
                """, (user_id, title, message, notification_type, action_url))
                return cursor.lastrowid
        except Exception as e:
            logger.error(f"Failed to create in-app notification: {str(e)}")
            return 0
    
    def get_user_notifications(self, user_id: int, unread_only: bool = False) -> List[Dict]:
        """Get notifications for a user"""
        try:
            with self.db_manager.get_connection() as conn:
                query = """
                    SELECT * FROM notifications 
                    WHERE user_id = ?
                """
                params = [user_id]
                
                if unread_only:
                    query += " AND is_read = 0"
                
                query += " ORDER BY created_at DESC LIMIT 50"
                
                rows = conn.execute(query, params).fetchall()
                return [dict(row) for row in rows]
        except Exception as e:
            logger.error(f"Failed to get user notifications: {str(e)}")
            return []
    
    def mark_notification_read(self, notification_id: int, user_id: int) -> bool:
        """Mark notification as read"""
        try:
            with self.db_manager.get_connection() as conn:
                conn.execute("""
                    UPDATE notifications 
                    SET is_read = 1, read_at = CURRENT_TIMESTAMP
                    WHERE id = ? AND user_id = ?
                """, (notification_id, user_id))
                return True
        except Exception as e:
            logger.error(f"Failed to mark notification as read: {str(e)}")
            return False
    
    def setup_notification_tables(self):
        """Setup notification tables if they don't exist"""
        try:
            with self.db_manager.get_connection() as conn:
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS notifications (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        title TEXT NOT NULL,
                        message TEXT NOT NULL,
                        type TEXT DEFAULT 'info',
                        action_url TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        read_at TIMESTAMP,
                        is_read BOOLEAN DEFAULT 0,
                        FOREIGN KEY (user_id) REFERENCES users (id)
                    )
                """)
                
                conn.execute("""
                    CREATE INDEX IF NOT EXISTS idx_notifications_user 
                    ON notifications(user_id, is_read)
                """)
                
                conn.commit()
                logger.info("Notification tables setup completed")
        except Exception as e:
            logger.error(f"Failed to setup notification tables: {str(e)}")

# Global notification service instance
notification_service = NotificationService()

# Setup notification tables on import
try:
    notification_service.setup_notification_tables()
except Exception as e:
    logger.error(f"Failed to setup notification service: {str(e)}")
