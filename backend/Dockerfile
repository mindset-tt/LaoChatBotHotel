# Optimized Backend Dockerfile
# Multi-stage build for minimal production image
FROM python:3.11-slim as base

# Install system dependencies in one layer with cleanup
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean \
    && apt-get autoremove -y

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Copy and install Python dependencies first (for better caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && pip cache purge \
    && find /usr/local -name '*.pyc' -delete \
    && find /usr/local -name '__pycache__' -type d -exec rm -rf {} + \
    && rm -rf /root/.cache

# Production stage
FROM python:3.11-slim as production

# Copy Python packages from base stage
COPY --from=base /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=base /usr/local/bin /usr/local/bin

# Install only runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean \
    && useradd --create-home --shell /bin/bash app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

WORKDIR /app

# Copy application code with specific order for better caching
COPY --chown=app:app config/ ./config/
COPY --chown=app:app database/ ./database/
COPY --chown=app:app middleware/ ./middleware/
COPY --chown=app:app routes/ ./routes/
COPY --chown=app:app services/ ./services/
COPY --chown=app:app utils/ ./utils/
COPY --chown=app:app *.py ./

# Create model directories
RUN mkdir -p models/embeddings models/knowledge_base \
    && chown -R app:app models/

# Copy models (only essential ones for production)
COPY --chown=app:app models/knowledge_base/knowledge_base_with_embeddings.pt ./models/knowledge_base/
COPY --chown=app:app models/embeddings/sailor2-1b-vangvieng-finetuned/best-checkpoint/ ./models/embeddings/sailor2-1b-vangvieng-finetuned/best-checkpoint/

# Switch to non-root user
USER app

# Expose port
EXPOSE 8000

# Optimized health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Use exec form for better signal handling
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
