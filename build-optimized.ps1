# build-optimized.ps1 - PowerShell script for Windows
# Build optimized Docker images with best practices

param(
    [string]$Version = "latest",
    [string]$Registry = "",
    [switch]$Push = $false
)

# Colors for output
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"

Write-Host "🚀 Building optimized Docker images..." -ForegroundColor $Green

# Enable BuildKit for better caching and performance
$env:DOCKER_BUILDKIT = "1"
$env:COMPOSE_DOCKER_CLI_BUILD = "1"

# Function to build with cache optimization
function Build-WithCache {
    param(
        [string]$Service,
        [string]$Context,
        [string]$Dockerfile,
        [string]$Target = ""
    )
    
    Write-Host "Building $Service..." -ForegroundColor $Yellow
    
    # Build arguments for optimization
    $buildArgs = @(
        "--build-arg", "BUILDKIT_INLINE_CACHE=1",
        "--cache-from", "$Registry$Service`:$Version",
        "--cache-from", "$Registry$Service`:latest"
    )
    
    if ($Target) {
        $buildArgs += "--target", $Target
    }
    
    # Build the image
    $buildCmd = @("docker", "build") + $buildArgs + @(
        "-t", "$Registry$Service`:$Version",
        "-t", "$Registry$Service`:latest",
        "-f", "$Context/$Dockerfile",
        $Context
    )
    
    & $buildCmd[0] $buildCmd[1..($buildCmd.Length-1)]
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to build $Service" -ForegroundColor $Red
        exit 1
    }
    
    Write-Host "✅ $Service built successfully" -ForegroundColor $Green
}

# Function to optimize image size
function Optimize-Image {
    param([string]$Image)
    
    Write-Host "Optimizing $Image..." -ForegroundColor $Yellow
    
    # Remove intermediate containers
    docker image prune -f
    
    # Show image size
    $size = docker images "$Image`:$Version" --format "{{.Size}}"
    Write-Host "📦 $Image size: $size" -ForegroundColor $Green
}

try {
    # Build backend with multi-stage optimization
    Write-Host "Building backend (production)..." -ForegroundColor $Yellow
    Build-WithCache "hotel-booking-backend" "./backend" "Dockerfile.multi-stage" "app-with-models"
    Optimize-Image "hotel-booking-backend"

    # Build backend without models (for development)
    Write-Host "Building backend (development)..." -ForegroundColor $Yellow
    Build-WithCache "hotel-booking-backend-dev" "./backend" "Dockerfile.multi-stage" "app-no-models"
    Optimize-Image "hotel-booking-backend-dev"

    # Build frontend
    Write-Host "Building frontend..." -ForegroundColor $Yellow
    Build-WithCache "hotel-booking-frontend" "./frontend" "Dockerfile"
    Optimize-Image "hotel-booking-frontend"

    # Clean up dangling images
    Write-Host "Cleaning up..." -ForegroundColor $Yellow
    docker image prune -f

    # Show final image sizes
    Write-Host "📊 Final image sizes:" -ForegroundColor $Green
    docker images | Where-Object { $_ -match "hotel-booking" } | ForEach-Object {
        $parts = $_ -split '\s+'
        Write-Host "$($parts[0]):$($parts[1]) - $($parts[6])"
    }

    # Push to registry if requested
    if ($Push -and $Registry) {
        Write-Host "Pushing images to registry..." -ForegroundColor $Yellow
        
        $images = @(
            "hotel-booking-backend",
            "hotel-booking-backend-dev", 
            "hotel-booking-frontend"
        )
        
        foreach ($image in $images) {
            docker push "$Registry$image`:$Version"
            docker push "$Registry$image`:latest"
        }
        
        Write-Host "✅ Images pushed successfully" -ForegroundColor $Green
    }

    Write-Host "🎉 All images built successfully!" -ForegroundColor $Green

    # Performance tips
    Write-Host "💡 Performance Tips:" -ForegroundColor $Yellow
    Write-Host "- Use 'docker-compose.prod.yml' for production deployment"
    Write-Host "- Use 'docker-compose.dev.yml' for development"
    Write-Host "- Models are optimized to use only best-checkpoint (saves ~50% space)"
    Write-Host "- Images use multi-stage builds for minimal size"
    Write-Host "- Non-root users for security"
    Write-Host "- Optimized caching layers"

} catch {
    Write-Host "❌ Build failed: $_" -ForegroundColor $Red
    exit 1
}
