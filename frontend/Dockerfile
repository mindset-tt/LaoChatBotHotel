# Optimized Frontend Dockerfile
# Multi-stage build with aggressive optimization

# Stage 1: Dependencies
FROM node:18-alpine as deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies with optimization
RUN npm ci --only=production --frozen-lockfile \
    && npm cache clean --force

# Stage 2: Build
FROM node:18-alpine as build
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* ./

# Install all dependencies (including dev)
RUN npm ci --frozen-lockfile

# Copy source code
COPY . .

# Build with optimizations
ENV NODE_ENV=production
RUN npm run build \
    && npm prune --production

# Stage 3: Optimized nginx
FROM nginx:alpine as production

# Install curl for health checks and remove unnecessary packages
RUN apk add --no-cache curl \
    && rm -rf /var/cache/apk/* \
    && addgroup -g 1001 -S nginx \
    && adduser -S nginx -u 1001

# Copy built assets with proper ownership
COPY --from=build --chown=nginx:nginx /app/dist /usr/share/nginx/html

# Copy optimized nginx configuration
COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf.orig 2>/dev/null || true

# Create nginx cache directory
RUN mkdir -p /var/cache/nginx \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /var/log/nginx \
    && chown -R nginx:nginx /etc/nginx/conf.d \
    && touch /var/run/nginx.pid \
    && chown -R nginx:nginx /var/run/nginx.pid

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 8080

# Optimized health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start nginx with optimized settings
CMD ["nginx", "-g", "daemon off;"]
