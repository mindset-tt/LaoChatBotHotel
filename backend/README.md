# 🏨 Hotel Management Backend API

A comprehensive, production-ready hotel management system with AI-powered chatbot, built with FastAPI and optimized for RTX 3050 Ti Mobile GPU.

## 🚀 Technology Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| **FastAPI** | Web Framework & API | Latest |
| **PyTorch** | AI/ML Model Support | Latest |
| **Transformers** | Hugging Face Models | 4.46.3 |
| **SQLite** | Database | Built-in |
| **Uvicorn** | ASGI Server | Latest |
| **Pydantic** | Data Validation | Latest |

## ✨ Major Features

### 🤖 **AI-Powered Chatbot**
- **Fine-tuned Model:** Sailor2-1B optimized for hotel domain
- **RAG System:** Retrieval-Augmented Generation with knowledge base
- **Context Awareness:** Maintains conversation context
- **Multi-language:** Supports multiple languages including Lao
- **GPU Optimization:** Efficient memory usage for RTX 3050 Ti

### 📊 **Analytics & Reporting**
- **Chat Insights:** Conversation analytics and patterns
- **Booking Analytics:** Trends, utilization, and forecasting
- **Performance Metrics:** System monitoring and health checks
- **Business Intelligence:** Revenue analysis and occupancy rates

### 💾 **Data Management**
- **Export Capabilities:** JSON/CSV export for chat history and bookings
- **Database Backup:** Full database backup and restoration
- **Configuration Management:** Runtime configuration updates
- **Data Validation:** Comprehensive input validation and sanitization

### 🔒 **Security & Monitoring**
- **Rate Limiting:** 100 requests/minute per client
- **Authentication:** JWT-based authentication system
- **Error Handling:** Comprehensive error logging and reporting
- **Health Checks:** Real-time system health monitoring

## 📁 Project Architecture

```
backend/
├── main.py                     # Application entry point
├── requirements.txt            # Python dependencies
├── setup_models.py            # AI model setup script
├── deploy.py                  # Deployment utilities
├── config/                    # Configuration management
│   ├── __init__.py
│   ├── environment.py         # Environment variables
│   └── settings.py           # Application settings
├── database/                  # Database layer
│   ├── __init__.py
│   ├── models.py             # Database models
│   └── operations.py         # Database operations
├── middleware/                # Custom middleware
│   ├── __init__.py
│   ├── error_handling.py     # Error handling middleware
│   └── security.py           # Security & rate limiting
├── models/                    # AI models & schemas
│   ├── __init__.py
│   ├── schemas.py            # Pydantic schemas
│   ├── checkpoints/          # Fine-tuned model checkpoints
│   └── knowledge_base/       # RAG knowledge base
├── routes/                    # API endpoints
│   ├── __init__.py
│   ├── analytics_routes.py   # Analytics endpoints
│   ├── auth_routes.py        # Authentication
│   ├── backup_routes.py      # Data export/backup
│   ├── booking_routes.py     # Booking management
│   ├── chatbot_routes.py     # AI chat endpoints
│   ├── config_routes.py      # Configuration management
│   ├── dashboard_routes.py   # Dashboard data
│   ├── history_routes.py     # Chat history
│   ├── model_routes.py       # Model management
│   ├── notification_routes.py # Notifications
│   ├── room_routes.py        # Room management
│   └── system_routes.py      # System monitoring
├── services/                  # Business logic
│   ├── __init__.py
│   ├── analytics.py          # Analytics service
│   ├── auth.py               # Authentication service
│   ├── cache.py              # Caching service
│   ├── chatbot.py            # Chatbot orchestrator
│   ├── conversation.py       # Conversation management
│   ├── metrics.py            # Metrics collection
│   ├── ml_models.py          # ML model loading/inference
│   ├── notifications.py     # Notification service
│   └── security.py           # Security utilities
└── utils/                     # Utility functions
    ├── __init__.py
    └── logging_config.py     # Logging configuration
```

## 🚀 Quick Start

### Prerequisites

- **Python:** 3.8 or higher
- **GPU:** RTX 3050 Ti or better (4GB+ VRAM recommended)
- **RAM:** 8GB minimum (16GB recommended)
- **Storage:** 10GB free space for models

### Installation

```powershell
# Navigate to backend directory
cd backend

# Install dependencies
python -m pip install -r requirements.txt

# Setup AI models (first time only - downloads ~2GB)
python setup_models.py

# Start the server
python main.py
```

### Verification

| Endpoint | URL | Purpose |
|----------|-----|---------|
| **API Docs** | `http://localhost:8000/docs` | Interactive API documentation |
| **Health Check** | `http://localhost:8000/system/health/` | System status |
| **Model Status** | `http://localhost:8000/models/status/` | AI model loading status |

## 🔌 API Endpoints

### 🤖 **AI Chatbot**
```http
POST /chatbot/ask/                 # Send message to AI
GET /chatbot/history/              # Get conversation history
GET /chatbot/sessions/             # List chat sessions
POST /chatbot/clear_session/       # Clear conversation state
```

### 🏨 **Hotel Management**
```http
# Rooms
GET /rooms/                        # List all rooms
GET /rooms/available/              # Available rooms only
POST /rooms/                       # Create new room
PUT /rooms/{id}                    # Update room
DELETE /rooms/{id}                 # Delete room

# Bookings
GET /bookings/                     # List bookings
POST /bookings/manual/             # Create manual booking
PUT /bookings/update/              # Update booking
POST /bookings/cancel/             # Cancel booking
```

### 📊 **Analytics & Reporting**
```http
GET /analytics/chat/insights/      # Chat conversation analytics
GET /analytics/bookings/insights/  # Booking trends and patterns
GET /analytics/performance/        # System performance metrics
GET /analytics/revenue/            # Revenue analysis
```

### 💾 **Data Management**
```http
GET /backup/chat-history/export/   # Export chat history (JSON/CSV)
GET /backup/bookings/export/       # Export booking data
POST /backup/database/             # Create database backup
GET /backup/statistics/            # System statistics
```

### ⚙️ **Configuration**
```http
GET /config/                       # View current configuration
PUT /config/thresholds/            # Update AI model thresholds
PUT /config/keywords/              # Manage intent keywords
```

### 🔧 **System Management**
```http
GET /system/health/                # Comprehensive health check
GET /system/metrics/               # System performance metrics
GET /models/status/                # AI model status
POST /models/cleanup/              # Clean GPU memory
POST /models/reload/               # Reload AI models
GET /models/memory/                # Detailed memory usage
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database Configuration
DATABASE_URL=sqlite:///./hotel_booking.db

# AI Model Settings
MODEL_PATH=./models/checkpoints/sailor2-1b-vangvieng-finetuned/
KNOWLEDGE_BASE_PATH=./models/knowledge_base/knowledge_base_with_embeddings.pt
MAX_GPU_MEMORY=3500  # MB for RTX 3050 Ti Mobile
USE_4BIT_QUANTIZATION=true

# Server Configuration
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=["http://localhost:5173", "http://localhost:3000"]

# Performance Settings
CHAT_TIMEOUT=30  # seconds
MAX_CONCURRENT_CHATS=10
RATE_LIMIT_REQUESTS=100  # requests per minute
```

### Model Configuration

The system automatically detects and loads:

1. **Fine-tuned LLM:** Latest checkpoint in `models/checkpoints/sailor2-1b-vangvieng-finetuned/`
2. **Knowledge Base:** RAG embeddings from `models/knowledge_base/`
3. **Embeddings:** Additional embeddings from `models/embeddings/`

## 🔧 Development

### Development Mode

```powershell
# Run with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run with specific environment
python -m uvicorn main:app --reload --env-file .env.development
```

### Testing

```powershell
# Run tests
python -m pytest

# Run with coverage
python -m pytest --cov=.

# Test specific module
python -m pytest tests/test_chatbot.py
```

### Debugging

```powershell
# Enable debug logging
export LOG_LEVEL=DEBUG
python main.py

# Test model loading
python test_checkpoint.py

# Check GPU memory
python -c "import torch; print(torch.cuda.get_device_properties(0))"
```

## 📊 Monitoring & Analytics

### System Health Monitoring

The backend provides comprehensive monitoring:

```http
GET /system/health/
```

Returns:
- Database connectivity status
- AI model loading status
- GPU memory usage
- System resource utilization
- API response times

### Performance Metrics

```http
GET /system/metrics/
```

Provides:
- Request count and response times
- Error rates and types
- Memory and CPU usage
- Active connections
- Cache hit rates

### Business Analytics

```http
GET /analytics/chat/insights/
```

Includes:
- Message volume trends
- Common guest inquiries
- Response satisfaction ratings
- Peak usage times
- Language preferences

## 🚀 Deployment

### Production Deployment

```powershell
# Build optimized container
docker build -f Dockerfile.multi-stage -t hotel-backend:latest .

# Run in production mode
docker run -p 8000:8000 -e ENV=production hotel-backend:latest
```

### Docker Compose

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - ENV=production
      - DATABASE_URL=sqlite:///./data/hotel_booking.db
    volumes:
      - ./data:/app/data
      - ./models:/app/models
```

### Performance Optimization

1. **GPU Memory Management**
   - Automatic cleanup after chat sessions
   - 4-bit quantization for memory efficiency
   - Batch processing for multiple requests

2. **Database Optimization**
   - Connection pooling
   - Query optimization
   - Automatic indexing

3. **Caching Strategy**
   - Response caching for common queries
   - Model weight caching
   - Static content caching

## 🔍 Troubleshooting

### Common Issues

**GPU Memory Errors**
```powershell
# Check GPU availability
python -c "import torch; print(f'CUDA: {torch.cuda.is_available()}')"

# Clean GPU memory
curl -X POST http://localhost:8000/models/cleanup/
```

**Model Loading Issues**
```powershell
# Check model status
curl http://localhost:8000/models/status/

# Reload models
curl -X POST http://localhost:8000/models/reload/
```

**Database Connection Problems**
```powershell
# Check database health
curl http://localhost:8000/system/health/

# View database statistics
curl http://localhost:8000/backup/statistics/
```

### Performance Issues

1. **High Response Times**
   - Check GPU memory usage
   - Monitor system resources
   - Review error logs

2. **Memory Leaks**
   - Monitor memory usage trends
   - Use model cleanup endpoints
   - Restart services if needed

3. **Database Slowdowns**
   - Check query performance
   - Optimize database indexes
   - Monitor connection pool

## 🤝 Contributing

### Development Setup

```powershell
# Clone and setup
git clone <repository-url>
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt  # Development dependencies

# Setup pre-commit hooks
pre-commit install
```

### Code Standards

- **Style:** Follow PEP 8 guidelines
- **Type Hints:** Use type annotations
- **Documentation:** Include docstrings
- **Testing:** Write tests for new features
- **Logging:** Use structured logging

### Adding New Features

1. **Create Feature Branch**
   ```powershell
   git checkout -b feature/new-feature
   ```

2. **Implement Feature**
   - Add route in appropriate `routes/` file
   - Implement business logic in `services/`
   - Add database operations if needed
   - Write comprehensive tests

3. **Update Documentation**
   - Update API documentation
   - Add configuration options
   - Update this README if needed

4. **Submit Pull Request**
   - Ensure tests pass
   - Follow commit message conventions
   - Include feature description

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

**Built with ❤️ for intelligent hotel management**

### 🛡️ **Security**
- Rate limiting middleware
- Request/response logging
- Error handling without exposing sensitive data
- Authentication system ready for production

## API Endpoints Overview

### 🤖 **Core Chatbot** (`/`)
- `POST /ask/` - Main chatbot interaction
- `POST /clear_session/` - Clear conversation state

### 🏨 **Hotel Management**
- `GET /rooms/` - List all rooms
- `GET /rooms/available/` - Available rooms
- `GET /bookings/` - Current bookings
- `POST /bookings/manual/` - Manual booking creation
- `PUT /bookings/update/` - Update booking
- `POST /bookings/cancel/` - Cancel booking

### 📚 **History & Analytics**
- `GET /history/{session_id}` - Session history
- `GET /analytics/chat/insights/` - Chat analytics
- `GET /analytics/bookings/insights/` - Booking analytics

### 🔧 **System Management**
- `GET /system/health/` - Health check
- `GET /system/metrics/` - System metrics
- `POST /models/cleanup/` - GPU cleanup
- `GET /backup/statistics/` - System statistics

### 💾 **Data Management**
- `GET /backup/chat-history/export/` - Export conversations
- `POST /backup/database/` - Create database backup
- `PUT /config/thresholds/` - Update AI parameters

## Running the Application

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the application:**
   ```bash
   python main.py
   ```

3. **Access the API documentation:**
   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

## Configuration

The application supports runtime configuration through the `/config/` endpoints:

- **AI Model Thresholds**: Adjust confidence thresholds for better accuracy
- **Keyword Management**: Add/remove intent detection keywords
- **System Parameters**: Modify timeout and batch size settings

## Monitoring & Analytics

### Real-time Monitoring
- System health and status
- GPU memory usage
- Database performance
- API response times

### Business Analytics
- Chat conversation patterns
- Booking trends and forecasts
- Room utilization rates
- Customer interaction insights

## Migration Notes

The original `app.py` file (850+ lines) has been transformed into a clean, modular architecture that:

✅ **Maintains API Compatibility**: Existing frontends work without changes  
✅ **Adds New Features**: Analytics, backups, monitoring, and more  
✅ **Improves Performance**: Better error handling and resource management  
✅ **Enhances Security**: Rate limiting and secure error responses  
✅ **Enables Scaling**: Modular architecture supports team development  

This enhanced version provides a production-ready hotel management system with comprehensive monitoring, analytics, and administrative capabilities! 🎉
