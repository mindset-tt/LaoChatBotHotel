# 🏨 Advanced Hotel Management & AI Chatbot System

[![Python](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Node.js](https://img.shields.io/badge/node.js-14+-green.svg)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-red.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A comprehensive, production-ready hotel management system with AI-powered chatbot featuring a fine-tuned Sailor2-1B model optimized for RTX 3050 Ti Mobile GPU. Built with FastAPI backend and React frontend.

## 🌟 Project Overview

This project is a full-stack hotel management application that combines:

- **AI-Powered Chatbot**: Fine-tuned Sailor2-1B model for intelligent customer service
- **Hotel Management System**: Complete booking, room management, and analytics
- **Modern Web Interface**: React-based responsive UI with TypeScript and Vite
- **GPU Optimization**: Specifically optimized for RTX 3050 Ti Mobile (4GB VRAM)
- **Production Ready**: Comprehensive error handling, logging, and monitoring

## 🚀 Key Features

### 🤖 AI Chatbot

- Fine-tuned Sailor2-1B model with LoRA adapters
- RAG (Retrieval-Augmented Generation) system
- Local knowledge base integration
- Timeout fallback mechanisms for fast responses
- GPU memory optimization for mobile GPUs

### 🏨 Hotel Management

- Real-time booking system with SQLite database
- Room management and availability tracking
- Customer analytics and insights
- Backup and export functionality
- Advanced reporting and metrics

### 📊 Analytics & Monitoring

- Chat analytics and insights
- Booking trends and utilization reports
- System performance monitoring
- GPU memory tracking
- Real-time health checks

### 🔒 Security & Performance

- Rate limiting middleware (100 requests/minute)
- Enhanced error handling and logging
- CORS configuration for secure API access
- Comprehensive input validation

## 🏗️ Project Structure

```text
TestTrainningWithSalior/
├── README.md                   # This file
├── backend.bat                 # Backend startup script
├── frontend.bat               # Frontend startup script
├── .gitignore                 # Git ignore file
├── backend/                   # FastAPI Backend
│   ├── main.py               # Main application entry point
│   ├── app_legacy.py         # Legacy application
│   ├── deploy.py             # Deployment utilities
│   ├── requirements.txt      # Python dependencies
│   ├── setup_models.py       # Model setup script
│   ├── test_checkpoint.py    # Model testing
│   ├── MODEL_SETUP.md        # Model setup documentation
│   ├── README.md             # Backend documentation
│   ├── .env.example          # Environment variables template
│   ├── config/               # Configuration management
│   │   ├── __init__.py
│   │   ├── environment.py
│   │   └── settings.py
│   ├── database/             # Database models and operations
│   │   ├── __init__.py
│   │   ├── models.py
│   │   └── operations.py
│   ├── middleware/           # Custom middleware
│   │   ├── __init__.py
│   │   ├── error_handling.py
│   │   └── security.py
│   ├── models/               # ML models and schemas
│   │   ├── __init__.py
│   │   ├── schemas.py
│   │   ├── embeddings/       # Vector embeddings
│   │   └── knowledge_base/   # RAG knowledge base
│   │       └── knowledge_base_with_embeddings.pt
│   ├── routes/               # API route handlers
│   │   ├── __init__.py
│   │   ├── analytics_routes.py
│   │   ├── auth_routes.py
│   │   ├── backup_routes.py
│   │   ├── booking_routes.py
│   │   ├── chatbot_routes.py
│   │   ├── config_routes.py
│   │   ├── dashboard_routes.py
│   │   ├── history_routes.py
│   │   ├── model_routes.py
│   │   ├── notification_routes.py
│   │   ├── room_routes.py
│   │   └── system_routes.py
│   ├── services/             # Business logic services
│   │   ├── __init__.py
│   │   ├── analytics.py
│   │   ├── auth.py
│   │   ├── cache.py
│   │   ├── chatbot.py
│   │   ├── conversation.py
│   │   ├── metrics.py
│   │   ├── ml_models.py
│   │   ├── notifications.py
│   │   └── security.py
│   └── utils/               # Utility functions
│       ├── __init__.py
│       └── logging_config.py
└── frontend/                # React Frontend
    ├── package.json         # Node.js dependencies
    ├── package-lock.json    # NPM lock file
    ├── yarn.lock           # Yarn lock file
    ├── index.html          # Main HTML file
    ├── vite.config.ts      # Vite configuration
    ├── tsconfig.json       # TypeScript configuration
    ├── tsconfig.tsbuildinfo # TypeScript build info
    ├── eslint.config.js    # ESLint configuration
    ├── README.md           # Frontend documentation
    ├── README copy.md      # Frontend documentation copy
    ├── FRONTEND_IMPLEMENTATION_SUMMARY.md # Implementation summary
    ├── .env                # Environment variables
    ├── .env.development    # Development environment
    ├── public/             # Static assets
    │   └── vite.svg
    └── src/                # React source code
        ├── App.css
        ├── App.tsx
        ├── index.css
        ├── main.tsx
        ├── vite-env.d.ts
        ├── assets/         # Static assets
        │   ├── fns-logo.png
        │   └── react.svg
        ├── components/     # Reusable components
        │   └── ErrorBoundary.tsx
        ├── constants/      # Application constants
        │   └── colors.tsx
        ├── hooks/          # Custom React hooks
        │   ├── api.ts
        │   ├── mockData.ts
        │   ├── optimizedChatHooks.ts
        │   ├── mutations/
        │   │   └── chats/
        │   └── queries/
        │       └── rooms/
        ├── layouts/        # Layout components
        │   ├── footer/
        │   │   └── Footer.tsx
        │   ├── main-layout/
        │   │   ├── mainLayout.css
        │   │   └── MainLayout.tsx
        │   └── navbar/
        │       └── Navbar.tsx
        ├── pages/          # Page components
        │   ├── analytics/
        │   │   └── Analytics.tsx
        │   ├── api-test/
        │   │   └── ApiTestPage.tsx
        │   ├── bookings/
        │   │   └── Bookings.tsx
        │   ├── dashboard/
        │   │   └── Dashboard.tsx
        │   ├── detail-chats/
        │   │   └── PageDetailChats.tsx
        │   ├── hotel/
        │   │   └── room/
        │   ├── login/
        │   │   └── Login.tsx
        │   ├── new-chats/
        │   │   ├── pageNewChats.css
        │   │   ├── PageNewChats.tsx
        │   │   └── components/
        │   └── system/
        │       └── SystemManagement.tsx
        └── routes/         # Route configuration
            └── Routes.tsx
```

## 🔧 Prerequisites

### System Requirements

- **GPU**: RTX 3050 Ti Mobile or better (4GB+ VRAM)
- **RAM**: 16GB+ recommended
- **Storage**: 10GB+ free space for models
- **OS**: Windows 10/11

### Software Requirements

- **Python**: 3.8+ with Conda
- **Node.js**: 14+ with npm/yarn
- **CUDA**: Compatible version for PyTorch
- **Git**: For cloning and version control

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd TestTrainningWithSalior
```

### 2. Backend Setup

#### Create Conda Environment

```bash
conda create -n cuda_env python=3.10
conda activate cuda_env
```

#### Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

#### Setup Models (First Time Only)

```bash
python setup_models.py
```

#### Start Backend Server

```bash
# From project root
./backend.bat
# Or manually:
cd backend
conda activate cuda_env
python main.py
```

The backend will start at `http://localhost:8000`

### 3. Frontend Setup

#### Install Frontend Dependencies

```bash
cd frontend
npm install
# or
yarn install
```

#### Start Frontend Development Server

```bash
# From project root
./frontend.bat
# Or manually:
cd frontend
npm run dev
# or
yarn dev
```

The frontend will start at `http://localhost:5173`

## 📖 API Documentation

Once the backend is running, visit:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Key API Endpoints

#### 🤖 Chatbot

- `POST /chatbot/ask/` - Send message to AI chatbot
- `GET /chatbot/history/` - Get chat history

#### 🏨 Hotel Operations

- `GET /rooms/` - List all rooms
- `POST /bookings/` - Create new booking
- `GET /bookings/` - List bookings

#### 📊 Analytics

- `GET /analytics/chat/insights/` - Chat analytics
- `GET /analytics/bookings/insights/` - Booking insights
- `GET /system/health/` - System health check

#### ⚙️ System Management

- `GET /models/status/` - Check model status
- `POST /models/cleanup/` - Clean GPU memory
- `GET /system/metrics/` - System metrics

## 🧠 AI Model Information

### Sailor2-1B Fine-tuned Model

- **Base Model**: Sailor2-1B (Vang Vieng variant)
- **Fine-tuning**: LoRA adapters for hotel domain
- **Optimization**: 4-bit quantization for mobile GPUs
- **Context Length**: Optimized for conversation context
- **Languages**: Supports multiple languages including Lao

### Model Files Location

```text
backend/models/
├── checkpoints/              # Fine-tuned model checkpoints
├── embeddings/              # Vector embeddings
└── knowledge_base/          # RAG knowledge base
    └── knowledge_base_with_embeddings.pt
```

## 🛠️ Development

### Backend Development

```bash
cd backend
conda activate cuda_env

# Run with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run tests
python test_checkpoint.py
```

### Frontend Development

```bash
cd frontend

# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Environment Configuration

Create `.env` file in backend directory based on `.env.example`:

```env
# Database
DATABASE_URL=sqlite:///./hotel_booking.db

# ML Models
MODEL_PATH=./models/checkpoints/sailor2-1b-vangvieng-finetuned/best-checkpoint
EMBEDDINGS_PATH=./models/embeddings/
KNOWLEDGE_BASE_PATH=./models/knowledge_base/knowledge_base_with_embeddings.pt

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=["http://localhost:5173", "http://localhost:3000"]

# GPU Settings
MAX_GPU_MEMORY=3500  # MB for RTX 3050 Ti Mobile
USE_4BIT_QUANTIZATION=true
```

## 📚 Documentation

### Backend Documentation

- [Model Setup Guide](backend/MODEL_SETUP.md)
- [Backend README](backend/README.md)
- API Documentation available at `/docs` when running

### Frontend Documentation

- [Frontend README](frontend/README.md)
- [Frontend Implementation Summary](frontend/FRONTEND_IMPLEMENTATION_SUMMARY.md)
- Component documentation in source files

## 🚀 Deployment

### Production Backend

```bash
# Install production dependencies
pip install gunicorn

# Run with Gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Production Frontend

```bash
# Build optimized production bundle
npm run build

# Serve with your preferred web server
# Files will be in dist/ directory
```

## 🔍 Troubleshooting

### Common Issues

#### GPU Memory Issues

```bash
# Check GPU memory
python -c "import torch; print(torch.cuda.get_device_properties(0))"

# Clean GPU memory
curl -X POST http://localhost:8000/models/cleanup/
```

#### Model Loading Issues

```bash
# Check model status
curl http://localhost:8000/models/status/

# Reload models
curl -X POST http://localhost:8000/models/reload/
```

#### Database Issues

```bash
# Backup database
curl -X POST http://localhost:8000/backup/database/

# Check database health
curl http://localhost:8000/system/health/
```

### Performance Optimization

- Adjust `MAX_GPU_MEMORY` in configuration
- Enable 4-bit quantization for lower VRAM usage
- Monitor system metrics at `/system/metrics/`

## 📊 Monitoring & Analytics

### System Health

- Real-time GPU memory monitoring
- Database performance metrics
- API response time tracking
- Error rate monitoring

### Business Analytics

- Chat interaction analytics
- Booking trends and patterns
- Room utilization reports
- Customer behavior insights

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📝 Changelog

### v1.0.0 (Current)

- Initial release with fine-tuned Sailor2-1B model
- Complete hotel management system
- React frontend with TypeScript
- Comprehensive API documentation
- Production-ready deployment configuration

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues and questions:

1. Check the troubleshooting section above
2. Review API documentation at `/docs`
3. Check system health at `/system/health/`
4. Monitor logs for detailed error information
5. Open an issue on GitHub

## 🙏 Acknowledgments

- [Sailor2 Model](https://huggingface.co/sail/Sailor2-1B-Chat) for the base language model
- FastAPI community for the excellent web framework
- React and Vite teams for the frontend tooling
- Contributors and testers who helped improve this project

---

## 📞 Contact

- **Project Maintainer**: [Your Name]
- **Email**: [your.email@example.com]
- **GitHub**: [github.com/yourusername]

---

Built with ❤️ for modern hotel management and AI integration
