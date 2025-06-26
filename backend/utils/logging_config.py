# utils/logging_config.py
import logging
import sys
from datetime import datetime
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler
from pathlib import Path
import json

class JSONFormatter(logging.Formatter):
    """JSON formatter for structured logging"""
    
    def format(self, record):
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
            
        # Add custom fields if present
        if hasattr(record, 'user_id'):
            log_entry["user_id"] = record.user_id
        if hasattr(record, 'session_id'):
            log_entry["session_id"] = record.session_id
        if hasattr(record, 'request_id'):
            log_entry["request_id"] = record.request_id
            
        return json.dumps(log_entry)

def setup_logging(log_level: str = "INFO", enable_json: bool = False):
    """Setup comprehensive logging configuration"""
    
    # Create logs directory
    logs_dir = Path("logs")
    logs_dir.mkdir(exist_ok=True)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper()))
    
    # Clear existing handlers
    root_logger.handlers.clear()
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    
    if enable_json:
        console_handler.setFormatter(JSONFormatter())
    else:
        console_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        console_handler.setFormatter(console_formatter)
    
    root_logger.addHandler(console_handler)
    
    # File handler for general logs
    file_handler = TimedRotatingFileHandler(
        logs_dir / "app.log",
        when="midnight",
        interval=1,
        backupCount=30,
        encoding="utf-8"
    )
    file_handler.setLevel(logging.DEBUG)
    
    if enable_json:
        file_handler.setFormatter(JSONFormatter())
    else:
        file_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(module)s:%(funcName)s:%(lineno)d - %(message)s'
        )
        file_handler.setFormatter(file_formatter)
    
    root_logger.addHandler(file_handler)
    
    # Error-specific handler
    error_handler = RotatingFileHandler(
        logs_dir / "errors.log",
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5,
        encoding="utf-8"
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(JSONFormatter() if enable_json else file_formatter)
    root_logger.addHandler(error_handler)
    
    # Chat-specific logger
    chat_logger = logging.getLogger("chat")
    chat_handler = TimedRotatingFileHandler(
        logs_dir / "chat.log",
        when="midnight",
        interval=1,
        backupCount=30,
        encoding="utf-8"
    )
    chat_handler.setFormatter(JSONFormatter() if enable_json else file_formatter)
    chat_logger.addHandler(chat_handler)
    chat_logger.setLevel(logging.INFO)
    
    # Performance logger
    perf_logger = logging.getLogger("performance")
    perf_handler = TimedRotatingFileHandler(
        logs_dir / "performance.log",
        when="midnight",
        interval=1,
        backupCount=7,
        encoding="utf-8"
    )
    perf_handler.setFormatter(JSONFormatter() if enable_json else file_formatter)
    perf_logger.addHandler(perf_handler)
    perf_logger.setLevel(logging.INFO)
    
    # Security logger
    security_logger = logging.getLogger("security")
    security_handler = TimedRotatingFileHandler(
        logs_dir / "security.log",
        when="midnight",
        interval=1,
        backupCount=90,  # Keep security logs longer
        encoding="utf-8"
    )
    security_handler.setFormatter(JSONFormatter() if enable_json else file_formatter)
    security_logger.addHandler(security_handler)
    security_logger.setLevel(logging.WARNING)
    
    logging.info("Logging system initialized")

class PerformanceLogger:
    """Context manager for performance logging"""
    
    def __init__(self, operation_name: str, logger_name: str = "performance"):
        self.operation_name = operation_name
        self.logger = logging.getLogger(logger_name)
        self.start_time = None
    
    def __enter__(self):
        self.start_time = datetime.utcnow()
        self.logger.info(f"Started: {self.operation_name}")
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = (datetime.utcnow() - self.start_time).total_seconds()
        if exc_type:
            self.logger.error(f"Failed: {self.operation_name} - Duration: {duration:.3f}s - Error: {exc_val}")
        else:
            self.logger.info(f"Completed: {self.operation_name} - Duration: {duration:.3f}s")
