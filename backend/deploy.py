# deploy.py
"""
Deployment script for the Enhanced Hotel Management System
"""

import os
import sys
import subprocess
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        logger.error("Python 3.8 or higher is required")
        return False
    logger.info(f"Python version: {sys.version}")
    return True

def check_gpu_availability():
    """Check if CUDA GPU is available"""
    try:
        import torch
        if torch.cuda.is_available():
            gpu_name = torch.cuda.get_device_name(0)
            gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
            logger.info(f"GPU detected: {gpu_name} ({gpu_memory:.1f}GB)")
            return True
        else:
            logger.warning("No CUDA GPU detected - CPU mode will be used")
            return False
    except ImportError:
        logger.warning("PyTorch not installed - will install from requirements")
        return False

def install_requirements():
    """Install Python requirements"""
    try:
        logger.info("Installing Python requirements...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        logger.info("Requirements installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to install requirements: {e}")
        return False

def setup_environment():
    """Setup environment variables"""
    env_example = Path(".env.example")
    env_file = Path(".env")
    
    if not env_file.exists() and env_example.exists():
        logger.info("Creating .env file from .env.example...")
        with open(env_example) as f:
            content = f.read()
        
        with open(env_file, 'w') as f:
            f.write(content)
        
        logger.warning("Please edit .env file with your actual configuration values")
        return True
    elif env_file.exists():
        logger.info(".env file already exists")
        return True
    else:
        logger.error("No .env.example file found")
        return False

def setup_database():
    """Initialize database with enhanced schema"""
    try:
        logger.info("Setting up database...")
        from database.models import db_manager
        db_manager.init_enhanced_tables()
        
        # Create default admin user if not exists
        try:
            from services.security import security_service
            existing_user = db_manager.get_user_by_username('admin')
            if not existing_user:
                admin_password = "admin123"  # Change this in production!
                hashed_password = security_service.hash_password(admin_password)
                db_manager.create_user(
                    username='admin',
                    password_hash=hashed_password,
                    email='admin@hotel.com',
                    full_name='System Administrator',
                    role='admin'
                )
                logger.info("Default admin user created (username: admin, password: admin123)")
                logger.warning("IMPORTANT: Change the default admin password immediately!")
            else:
                logger.info("Admin user already exists")
        except Exception as e:
            logger.error(f"Failed to create admin user: {e}")
        
        logger.info("Database setup completed")
        return True
    except Exception as e:
        logger.error(f"Database setup failed: {e}")
        return False

def setup_directories():
    """Create necessary directories"""
    directories = ['logs', 'backups', 'temp']
    
    for directory in directories:
        path = Path(directory)
        if not path.exists():
            path.mkdir(exist_ok=True)
            logger.info(f"Created directory: {directory}")
    
    return True

def check_dependencies():
    """Check for system dependencies"""
    try:
        # Check if required packages can be imported
        test_imports = [
            'fastapi',
            'uvicorn',
            'transformers',
            'torch',
            'sentence_transformers',
            'sqlite3',
            'bcrypt',
            'jose'
        ]
        
        failed_imports = []
        for module in test_imports:
            try:
                __import__(module)
            except ImportError:
                failed_imports.append(module)
        
        if failed_imports:
            logger.error(f"Missing dependencies: {', '.join(failed_imports)}")
            return False
        
        logger.info("All dependencies are available")
        return True
    except Exception as e:
        logger.error(f"Dependency check failed: {e}")
        return False

def run_health_check():
    """Run a basic health check"""
    try:
        logger.info("Running health check...")
        
        # Test database connection
        from database.models import db_manager
        with db_manager.get_connection() as conn:
            conn.execute("SELECT 1").fetchone()
        
        # Test configuration loading
        from config.settings import CONFIG
        logger.info(f"Configuration loaded: {CONFIG.DB_FILE}")
        
        # Test caching service
        from services.cache import cache_service
        cache_service.memory_cache.set("test", "value")
        if cache_service.memory_cache.get("test") == "value":
            logger.info("Cache service working")
        
        logger.info("Health check passed")
        return True
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return False

def main():
    """Main deployment function"""
    logger.info("Starting Enhanced Hotel Management System deployment...")
    
    # Run all setup steps
    steps = [
        ("Checking Python version", check_python_version),
        ("Setting up directories", setup_directories),
        ("Setting up environment", setup_environment),
        ("Installing requirements", install_requirements),
        ("Checking GPU availability", check_gpu_availability),
        ("Checking dependencies", check_dependencies),
        ("Setting up database", setup_database),
        ("Running health check", run_health_check),
    ]
    
    for step_name, step_func in steps:
        logger.info(f"Step: {step_name}")
        if not step_func():
            logger.error(f"Deployment failed at step: {step_name}")
            sys.exit(1)
        logger.info(f"✓ {step_name} completed")
    
    logger.info("🎉 Deployment completed successfully!")
    logger.info("To start the application, run: python main.py")
    logger.info("API documentation will be available at: http://localhost:8000/docs")
    
    # Print important security reminders
    print("\n" + "="*60)
    print("🔒 SECURITY REMINDERS:")
    print("1. Change the default admin password immediately")
    print("2. Update SECRET_KEY in .env file")
    print("3. Configure email settings in .env for notifications")
    print("4. Review and update rate limiting settings")
    print("5. Set up SSL/TLS for production deployment")
    print("="*60)

if __name__ == "__main__":
    main()
