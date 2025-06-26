# config/environment.py
import os
from typing import Optional
from enum import Enum

class Environment(str, Enum):
    DEVELOPMENT = "development"
    STAGING = "staging" 
    PRODUCTION = "production"

class EnvironmentConfig:
    """Environment-specific configuration management"""
    
    def __init__(self):
        self.environment = Environment(os.getenv("ENVIRONMENT", "development"))
        self.debug = os.getenv("DEBUG", "true").lower() == "true"
        self.log_level = os.getenv("LOG_LEVEL", "INFO")
        
        # Database settings
        self.db_pool_size = int(os.getenv("DB_POOL_SIZE", "5"))
        self.db_max_overflow = int(os.getenv("DB_MAX_OVERFLOW", "10"))
        
        # Server settings
        self.host = os.getenv("HOST", "0.0.0.0")
        self.port = int(os.getenv("PORT", "8000"))
        self.workers = int(os.getenv("WORKERS", "1"))
        
        # Security settings
        self.secret_key = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
        self.cors_origins = os.getenv("CORS_ORIGINS", "*").split(",")
        self.rate_limit_calls = int(os.getenv("RATE_LIMIT_CALLS", "100"))
        self.rate_limit_period = int(os.getenv("RATE_LIMIT_PERIOD", "60"))
        
        # ML Model settings
        self.model_cache_dir = os.getenv("MODEL_CACHE_DIR", "./model_cache")
        self.gpu_memory_fraction = float(os.getenv("GPU_MEMORY_FRACTION", "0.85"))
        self.model_load_timeout = int(os.getenv("MODEL_LOAD_TIMEOUT", "300"))
        self.prefer_best_checkpoint = os.getenv("PREFER_BEST_CHECKPOINT", "true").lower() == "true"
        
        # External API settings
        self.external_llm_api_key = os.getenv("EXTERNAL_LLM_API_KEY")
        self.fallback_to_external = os.getenv("FALLBACK_TO_EXTERNAL", "false").lower() == "true"
        
        # Monitoring and observability
        self.enable_metrics = os.getenv("ENABLE_METRICS", "true").lower() == "true"
        self.metrics_port = int(os.getenv("METRICS_PORT", "9090"))
        self.enable_tracing = os.getenv("ENABLE_TRACING", "false").lower() == "true"
        
    @property
    def is_development(self) -> bool:
        return self.environment == Environment.DEVELOPMENT
    
    @property
    def is_production(self) -> bool:
        return self.environment == Environment.PRODUCTION
    
    def get_cors_config(self) -> dict:
        """Get CORS configuration based on environment"""
        if self.is_production:
            return {
                "allow_origins": self.cors_origins,
                "allow_credentials": True,
                "allow_methods": ["GET", "POST", "PUT", "DELETE"],
                "allow_headers": ["*"],
            }
        else:
            return {
                "allow_origins": ["*"],
                "allow_credentials": True,
                "allow_methods": ["*"],
                "allow_headers": ["*"],
            }

env_config = EnvironmentConfig()
