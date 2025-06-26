# config/settings.py
import os
from typing import Set
import secrets
from .environment import EnvironmentConfig

# Initialize environment config
env_config = EnvironmentConfig()

class AppConfig:
    """A class to hold all configuration variables in one place."""
    # !! OPTIMIZED PATHS FOR MOBILE GPU !!
    system_path = os.environ.get('PATH')

    # --- Model & Data Paths ---
    # Organized model directory structure
    MODELS_BASE_DIR: str = "./models"
    KNOWLEDGE_BASE_PATH: str = './models/knowledge_base/knowledge_base_with_embeddings.pt'
    FINETUNED_OUTPUT_DIR: str = "./models/checkpoints/sailor2-1b-vangvieng-finetuned"
    BASE_LLM_MODEL: str = "sail/Sailor2-L-1B-Chat"
    RETRIEVER_MODEL: str = 'sentence-transformers/LaBSE'
    
    # Model checkpoint preferences
    PREFER_BEST_CHECKPOINT: bool = env_config.prefer_best_checkpoint  # Use best-checkpoint over latest numbered checkpoint
    
    # Alternative paths for backward compatibility
    LEGACY_KNOWLEDGE_BASE_PATH: str = 'knowledge_base_with_embeddings.pt'
    LEGACY_FINETUNED_OUTPUT_DIR: str = "sailor2-1b-vangvieng-finetuned"

    # --- Database ---
    DB_FILE: str = "./hotel_management.db"

    # --- Chatbot Logic ---
    BOOKING_INTENT_KEYWORDS: Set[str] = {"ຈອງ", "book", "reserve", "booking", "reservation", "ຫ້ອງວ່າງ"}
    CONFIRMATION_KEYWORDS: Set[str] = {"yes", "ok", "y", "ແມ່ນ", "ຕົກລົງ", "confirm", "ແມ່ນແລ້ວ"}
    PRICE_INQUIRY_KEYWORDS: Set[str] = {"ລາຄາ", "price", "cost", "ເທົ່າໃດ", "how much", "ຄ່າຫ້ອງ", "ຄ່າໃຊ້ຈ່າຍ"}
    BOOKING_SIMILARITY_THRESHOLD: float = 0.65
    RAG_TOP_K: int = 2  # Reduced from 3 to save memory
    RAG_CONFIDENCE_THRESHOLD: float = 0.4
    LLM_TIMEOUT_SECONDS: int = 180  # Reduced timeout for mobile GPU

    # --- MOBILE GPU OPTIMIZATIONS ---
    MAX_INPUT_LENGTH: int = 512  # Reduced from 1024
    MAX_NEW_TOKENS: int = 2048    # Reduced from 256
    BATCH_SIZE: int = 1          # Single batch processing
    
    # --- Performance Settings ---
    CACHE_TTL_DEFAULT: int = 3600  # 1 hour
    CACHE_TTL_CHATBOT: int = 1800  # 30 minutes
    CACHE_TTL_ANALYTICS: int = 600  # 10 minutes
    MAX_CACHE_SIZE: int = 2000
    
    # --- Rate Limiting ---
    RATE_LIMIT_CALLS: int = 100
    RATE_LIMIT_PERIOD: int = 60  # seconds
    
    # --- Email Configuration ---
    EMAIL_ENABLED: bool = os.getenv('EMAIL_ENABLED', 'false').lower() == 'true'
    SMTP_SERVER: str = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
    SMTP_PORT: int = int(os.getenv('SMTP_PORT', '587'))
    SMTP_USERNAME: str = os.getenv('SMTP_USERNAME', '')
    SMTP_PASSWORD: str = os.getenv('SMTP_PASSWORD', '')
    FROM_EMAIL: str = os.getenv('FROM_EMAIL', 'noreply@hotel.com')
    FROM_NAME: str = os.getenv('FROM_NAME', 'Vang Vieng Hotel')

class AuthConfig:
    SECRET_KEY = os.getenv('SECRET_KEY', secrets.token_urlsafe(32))
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '30'))
    
    # Security settings
    PASSWORD_MIN_LENGTH = 8
    MAX_LOGIN_ATTEMPTS = 5
    LOCKOUT_DURATION = 900  # 15 minutes

class DatabaseConfig:
    """Database configuration settings"""
    DB_FILE = os.getenv('DATABASE_URL', './hotel_management.db')
    DB_TIMEOUT = 30
    DB_CHECK_SAME_THREAD = False
    
    # Backup settings
    BACKUP_ENABLED = os.getenv('BACKUP_ENABLED', 'true').lower() == 'true'
    BACKUP_INTERVAL_HOURS = int(os.getenv('BACKUP_INTERVAL_HOURS', '24'))
    BACKUP_RETENTION_DAYS = int(os.getenv('BACKUP_RETENTION_DAYS', '30'))

class LoggingConfig:
    """Logging configuration"""
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FORMAT = os.getenv('LOG_FORMAT', 'json')  # 'json' or 'text'
    LOG_FILE_ENABLED = os.getenv('LOG_FILE_ENABLED', 'true').lower() == 'true'
    LOG_FILE_PATH = os.getenv('LOG_FILE_PATH', 'logs/hotel_app.log')
    LOG_ROTATION_SIZE = os.getenv('LOG_ROTATION_SIZE', '10MB')
    LOG_RETENTION_COUNT = int(os.getenv('LOG_RETENTION_COUNT', '5'))

class MonitoringConfig:
    """Monitoring and analytics configuration"""
    ANALYTICS_ENABLED = os.getenv('ANALYTICS_ENABLED', 'true').lower() == 'true'
    PERFORMANCE_MONITORING = os.getenv('PERFORMANCE_MONITORING', 'true').lower() == 'true'
    ERROR_TRACKING = os.getenv('ERROR_TRACKING', 'true').lower() == 'true'
    
    # Alert thresholds
    HIGH_RESPONSE_TIME_MS = int(os.getenv('HIGH_RESPONSE_TIME_MS', '5000'))
    HIGH_ERROR_COUNT = int(os.getenv('HIGH_ERROR_COUNT', '10'))
    HIGH_OCCUPANCY_RATE = float(os.getenv('HIGH_OCCUPANCY_RATE', '95.0'))
    LOW_CACHE_HIT_RATE = float(os.getenv('LOW_CACHE_HIT_RATE', '50.0'))

# --- Predefined Room Numbers (for DB initialization) ---
ROOM_NUMBERS = [
    "101", "102", "103", "104", "201", "202", "203", "204", "205", "206", "207",
    "301", "302", "303", "304", "305", "306", "307", "401", "402", "403", "404",
    "405", "406", "407"
]

# Hotel Information
HOTEL_INFO = {
    'name': os.getenv('HOTEL_NAME', 'Vang Vieng Hotel'),
    'address': os.getenv('HOTEL_ADDRESS', 'Vang Vieng, Laos'),
    'phone': os.getenv('HOTEL_PHONE', '+856 20 12345678'),
    'email': os.getenv('HOTEL_EMAIL', 'info@vangvienghotel.la'),
    'website': os.getenv('HOTEL_WEBSITE', 'https://vangvienghotel.la'),
    'timezone': os.getenv('HOTEL_TIMEZONE', 'Asia/Vientiane'),
    'currency': os.getenv('HOTEL_CURRENCY', 'LAK'),
    'check_in_time': os.getenv('CHECK_IN_TIME', '15:00'),
    'check_out_time': os.getenv('CHECK_OUT_TIME', '11:00')
}

CONFIG = AppConfig()
AUTH_CONFIG = AuthConfig()
DB_CONFIG = DatabaseConfig()
LOG_CONFIG = LoggingConfig()
MONITOR_CONFIG = MonitoringConfig()
