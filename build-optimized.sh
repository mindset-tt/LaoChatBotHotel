#!/bin/bash
# build-optimized.sh - Build optimized Docker images with best practices

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
VERSION=${VERSION:-latest}
REGISTRY=${REGISTRY:-""}
PUSH=${PUSH:-false}

echo -e "${GREEN}🚀 Building optimized Docker images...${NC}"

# Enable BuildKit for better caching and performance
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Function to build with cache optimization
build_with_cache() {
    local service=$1
    local context=$2
    local dockerfile=$3
    local target=${4:-""}
    
    echo -e "${YELLOW}Building ${service}...${NC}"
    
    # Build arguments for optimization
    build_args=(
        --build-arg BUILDKIT_INLINE_CACHE=1
        --cache-from ${REGISTRY}${service}:${VERSION}
        --cache-from ${REGISTRY}${service}:latest
    )
    
    if [ ! -z "$target" ]; then
        build_args+=(--target $target)
    fi
    
    # Build the image
    docker build \
        "${build_args[@]}" \
        -t ${REGISTRY}${service}:${VERSION} \
        -t ${REGISTRY}${service}:latest \
        -f ${context}/${dockerfile} \
        ${context}
    
    echo -e "${GREEN}✅ ${service} built successfully${NC}"
}

# Function to optimize image size
optimize_image() {
    local image=$1
    echo -e "${YELLOW}Optimizing ${image}...${NC}"
    
    # Remove intermediate containers
    docker image prune -f
    
    # Show image size
    size=$(docker images ${image}:${VERSION} --format "table {{.Size}}" | tail -n +2)
    echo -e "${GREEN}📦 ${image} size: ${size}${NC}"
}

# Build backend with multi-stage optimization
echo -e "${YELLOW}Building backend (production)...${NC}"
build_with_cache "hotel-booking-backend" "./backend" "Dockerfile.multi-stage" "app-with-models"
optimize_image "hotel-booking-backend"

# Build backend without models (for development)
echo -e "${YELLOW}Building backend (development)...${NC}"
build_with_cache "hotel-booking-backend-dev" "./backend" "Dockerfile.multi-stage" "app-no-models"
optimize_image "hotel-booking-backend-dev"

# Build frontend
echo -e "${YELLOW}Building frontend...${NC}"
build_with_cache "hotel-booking-frontend" "./frontend" "Dockerfile"
optimize_image "hotel-booking-frontend"

# Clean up dangling images
echo -e "${YELLOW}Cleaning up...${NC}"
docker image prune -f

# Show final image sizes
echo -e "${GREEN}📊 Final image sizes:${NC}"
docker images | grep hotel-booking | awk '{print $1":"$2" - "$7}'

# Push to registry if requested
if [ "$PUSH" = "true" ] && [ ! -z "$REGISTRY" ]; then
    echo -e "${YELLOW}Pushing images to registry...${NC}"
    docker push ${REGISTRY}hotel-booking-backend:${VERSION}
    docker push ${REGISTRY}hotel-booking-backend:latest
    docker push ${REGISTRY}hotel-booking-backend-dev:${VERSION}
    docker push ${REGISTRY}hotel-booking-backend-dev:latest
    docker push ${REGISTRY}hotel-booking-frontend:${VERSION}
    docker push ${REGISTRY}hotel-booking-frontend:latest
    echo -e "${GREEN}✅ Images pushed successfully${NC}"
fi

echo -e "${GREEN}🎉 All images built successfully!${NC}"

# Performance tips
echo -e "${YELLOW}💡 Performance Tips:${NC}"
echo "- Use 'docker-compose.prod.yml' for production deployment"
echo "- Use 'docker-compose.dev.yml' for development"
echo "- Models are optimized to use only best-checkpoint (saves ~50% space)"
echo "- Images use multi-stage builds for minimal size"
echo "- Non-root users for security"
echo "- Optimized caching layers"
