# Docker Setup Instructions

This document provides instructions for building and running the Hotel Booking application using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose installed
- At least 8GB of available RAM (for ML models in backend)
- At least 10GB of free disk space

## Quick Start

### 1. Build and Run with Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up --build

# Run in detached mode (background)
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 2. Build Individual Services

#### Backend
```bash
cd backend
docker build -t hotel-booking-backend .
docker run -p 8000:8000 hotel-booking-backend
```

#### Frontend
```bash
cd frontend
docker build -t hotel-booking-frontend .
docker run -p 80:80 hotel-booking-frontend
```

## Service URLs

- Frontend: http://localhost
- Backend API: http://localhost:8000
- Backend API Documentation: http://localhost:8000/docs

## Environment Variables

### Backend
- `PYTHONPATH`: Set to `/app`
- `ENVIRONMENT`: Set to `production`

### Custom Configuration
You can override default settings by creating a `.env` file in the root directory:

```env
# Backend settings
BACKEND_PORT=8000
BACKEND_HOST=0.0.0.0

# Frontend settings
FRONTEND_PORT=80
```

## Volume Mounts

- `./backend/models:/app/models` - Persists ML models
- `backend_data:/app/data` - Persists application data

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Check what's using the port
   netstat -ano | findstr :8000
   # Kill the process or change the port in docker-compose.yml
   ```

2. **Backend fails to start**
   ```bash
   # Check backend logs
   docker-compose logs backend
   
   # Ensure models are properly loaded
   docker-compose exec backend ls -la /app/models/
   ```

3. **Frontend not loading**
   ```bash
   # Check frontend logs
   docker-compose logs frontend
   
   # Verify nginx configuration
   docker-compose exec frontend nginx -t
   ```

### Performance Optimization

1. **For development**: Use bind mounts for live code updates
2. **For production**: Use named volumes for better performance
3. **Memory**: Increase Docker memory limit if ML models fail to load

## Development Mode

For development with live reloading:

```bash
# Backend development
cd backend
docker build -f Dockerfile.dev -t hotel-booking-backend-dev .
docker run -p 8000:8000 -v $(pwd):/app hotel-booking-backend-dev

# Frontend development
cd frontend
npm run dev
```

## Production Deployment

For production deployment:

1. Set appropriate environment variables
2. Use a reverse proxy (nginx/traefik) for SSL termination
3. Implement proper logging and monitoring
4. Use secrets management for sensitive data
5. Set up backup procedures for volumes

## Health Checks

Both services include health checks:
- Backend: `curl -f http://localhost:8000/health`
- Frontend: `curl -f http://localhost/`

Monitor service health:
```bash
docker-compose ps
```

## Scaling

To scale services:
```bash
# Scale backend to 3 instances
docker-compose up --scale backend=3

# Use a load balancer for multiple frontend instances
docker-compose up --scale frontend=2
```

## Cleanup

```bash
# Stop and remove containers
docker-compose down

# Remove volumes (WARNING: This will delete all data)
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Complete cleanup
docker system prune -a
```
