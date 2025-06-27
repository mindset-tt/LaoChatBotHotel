# deploy-ultimate.ps1 - Ultimate deployment script with all optimizations
param(
    [string]$Environment = "production",
    [string]$Version = "latest",
    [string]$Registry = "",
    [switch]$SecurityScan = $false,
    [switch]$OptimizeModels = $false,
    [switch]$EnableMonitoring = $false,
    [switch]$Push = $false,
    [switch]$SkipTests = $false
)

$ErrorActionPreference = "Stop"

# Colors
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"

Write-Host "🚀 Ultimate Hotel Booking Deployment" -ForegroundColor $Green
Write-Host "Environment: $Environment" -ForegroundColor $Cyan
Write-Host "Version: $Version" -ForegroundColor $Cyan

# Enable advanced Docker features
$env:DOCKER_BUILDKIT = "1"
$env:COMPOSE_DOCKER_CLI_BUILD = "1"

function Test-Prerequisites {
    Write-Host "🔍 Checking prerequisites..." -ForegroundColor $Yellow
    
    # Check Docker
    try {
        docker --version | Out-Null
        Write-Host "✅ Docker is available" -ForegroundColor $Green
    } catch {
        Write-Host "❌ Docker is not available" -ForegroundColor $Red
        exit 1
    }
    
    # Check Docker Compose
    try {
        docker-compose --version | Out-Null
        Write-Host "✅ Docker Compose is available" -ForegroundColor $Green
    } catch {
        Write-Host "❌ Docker Compose is not available" -ForegroundColor $Red
        exit 1
    }
    
    # Check available disk space (minimum 10GB)
    $freeSpace = (Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'").FreeSpace / 1GB
    if ($freeSpace -lt 10) {
        Write-Host "⚠️  Warning: Low disk space ($([math]::Round($freeSpace, 1))GB free). Minimum 10GB recommended." -ForegroundColor $Yellow
    } else {
        Write-Host "✅ Sufficient disk space ($([math]::Round($freeSpace, 1))GB free)" -ForegroundColor $Green
    }
}

function Optimize-Models {
    if (-not $OptimizeModels) { return }
    
    Write-Host "🧠 Optimizing AI models..." -ForegroundColor $Yellow
    
    # Run model optimization
    try {
        docker run --rm -v "${PWD}/backend:/app" python:3.11-slim python /app/optimize_models.py
        Write-Host "✅ Models optimized successfully" -ForegroundColor $Green
    } catch {
        Write-Host "⚠️  Model optimization failed: $_" -ForegroundColor $Yellow
    }
}

function Build-Images {
    Write-Host "🏗️  Building optimized images..." -ForegroundColor $Yellow
    
    $composeFile = switch ($Environment) {
        "development" { "docker-compose.dev.yml" }
        "production" { "docker-compose.prod.yml" }
        "monitoring" { "docker-compose.monitoring.yml" }
        default { "docker-compose.yml" }
    }
    
    # Build with specific optimizations per environment
    if ($Environment -eq "production") {
        # Use distroless and secure images for production
        docker build -t "hotel-booking-backend:$Version" -f backend/Dockerfile.distroless backend/
        docker build -t "hotel-booking-frontend:$Version" -f frontend/Dockerfile.secure frontend/
    } else {
        # Use standard optimized images for dev
        docker-compose -f $composeFile build --parallel
    }
    
    Write-Host "✅ Images built successfully" -ForegroundColor $Green
}

function Run-SecurityScan {
    if (-not $SecurityScan) { return }
    
    Write-Host "🔒 Running security scan..." -ForegroundColor $Yellow
    
    # Install security tools if needed
    if (-not (Get-Command "trivy" -ErrorAction SilentlyContinue)) {
        Write-Host "Installing Trivy security scanner..." -ForegroundColor $Yellow
        # Download and install Trivy for Windows
        $trivyUrl = "https://github.com/aquasecurity/trivy/releases/latest/download/trivy_Windows-64bit.zip"
        Invoke-WebRequest -Uri $trivyUrl -OutFile "trivy.zip"
        Expand-Archive -Path "trivy.zip" -DestinationPath "." -Force
        Remove-Item "trivy.zip"
    }
    
    # Scan images
    $images = @("hotel-booking-backend:$Version", "hotel-booking-frontend:$Version")
    foreach ($image in $images) {
        Write-Host "Scanning $image..." -ForegroundColor $Yellow
        try {
            ./trivy.exe image --severity HIGH,CRITICAL $image
        } catch {
            Write-Host "⚠️  Security scan failed for $image" -ForegroundColor $Yellow
        }
    }
}

function Run-Tests {
    if ($SkipTests) { return }
    
    Write-Host "🧪 Running tests..." -ForegroundColor $Yellow
    
    try {
        # Backend tests
        docker run --rm -v "${PWD}/backend:/app" -w /app python:3.11-slim sh -c "pip install pytest && python -m pytest"
        
        # Frontend tests (if available)
        if (Test-Path "frontend/package.json") {
            docker run --rm -v "${PWD}/frontend:/app" -w /app node:20-alpine sh -c "npm ci && npm test"
        }
        
        Write-Host "✅ All tests passed" -ForegroundColor $Green
    } catch {
        Write-Host "❌ Tests failed: $_" -ForegroundColor $Red
        exit 1
    }
}

function Deploy-Services {
    Write-Host "🚀 Deploying services..." -ForegroundColor $Yellow
    
    $composeFile = switch ($Environment) {
        "development" { "docker-compose.dev.yml" }
        "production" { "docker-compose.prod.yml" }
        "monitoring" { "docker-compose.monitoring.yml" }
        default { "docker-compose.yml" }
    }
    
    try {
        # Stop existing services
        docker-compose -f $composeFile down
        
        # Start services
        if ($EnableMonitoring) {
            docker-compose -f $composeFile -f docker-compose.monitoring.yml up -d
        } else {
            docker-compose -f $composeFile up -d
        }
        
        # Wait for services to be healthy
        Write-Host "⏳ Waiting for services to be healthy..." -ForegroundColor $Yellow
        Start-Sleep -Seconds 30
        
        # Check service health
        $services = docker-compose -f $composeFile ps --services
        foreach ($service in $services) {
            $health = docker-compose -f $composeFile ps $service --format "{{.Health}}"
            if ($health -eq "healthy" -or $health -eq "") {
                Write-Host "✅ $service is running" -ForegroundColor $Green
            } else {
                Write-Host "⚠️  $service health: $health" -ForegroundColor $Yellow
            }
        }
        
    } catch {
        Write-Host "❌ Deployment failed: $_" -ForegroundColor $Red
        exit 1
    }
}

function Push-Images {
    if (-not $Push -or -not $Registry) { return }
    
    Write-Host "📤 Pushing images to registry..." -ForegroundColor $Yellow
    
    $images = @("hotel-booking-backend", "hotel-booking-frontend")
    foreach ($image in $images) {
        $fullTag = "$Registry/$image`:$Version"
        docker tag "$image`:$Version" $fullTag
        docker push $fullTag
        Write-Host "✅ Pushed $fullTag" -ForegroundColor $Green
    }
}

function Show-DeploymentInfo {
    Write-Host "`n🎉 Deployment completed successfully!" -ForegroundColor $Green
    Write-Host "`n📋 Service Information:" -ForegroundColor $Cyan
    
    # Show service URLs
    switch ($Environment) {
        "development" {
            Write-Host "Frontend: http://localhost:3000" -ForegroundColor $Green
            Write-Host "Backend API: http://localhost:8000" -ForegroundColor $Green
            Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor $Green
        }
        "production" {
            Write-Host "Frontend: http://localhost:80" -ForegroundColor $Green
            Write-Host "Backend API: http://localhost:8000" -ForegroundColor $Green
            Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor $Green
        }
    }
    
    if ($EnableMonitoring) {
        Write-Host "`n📊 Monitoring Services:" -ForegroundColor $Cyan
        Write-Host "Grafana: http://localhost:3000 (admin/admin123)" -ForegroundColor $Green
        Write-Host "Prometheus: http://localhost:9090" -ForegroundColor $Green
        Write-Host "Jaeger: http://localhost:16686" -ForegroundColor $Green
    }
    
    # Show resource usage
    Write-Host "`n💾 Resource Usage:" -ForegroundColor $Cyan
    try {
        $containers = docker ps --format "table {{.Names}}\t{{.CPUPerc}}\t{{.MemUsage}}"
        Write-Host $containers
    } catch {
        Write-Host "Unable to fetch resource usage" -ForegroundColor $Yellow
    }
    
    Write-Host "`n🛠️  Management Commands:" -ForegroundColor $Cyan
    Write-Host "View logs: docker-compose logs -f" -ForegroundColor $Green
    Write-Host "Scale services: docker-compose up --scale backend=2" -ForegroundColor $Green
    Write-Host "Update models: docker-compose exec backend python optimize_models.py" -ForegroundColor $Green
    Write-Host "Security scan: ./security-scan.sh" -ForegroundColor $Green
}

# Main execution flow
try {
    Test-Prerequisites
    Optimize-Models
    Build-Images
    Run-SecurityScan
    Run-Tests
    Deploy-Services
    Push-Images
    Show-DeploymentInfo
    
} catch {
    Write-Host "`n❌ Deployment failed: $_" -ForegroundColor $Red
    Write-Host "Check logs with: docker-compose logs" -ForegroundColor $Yellow
    exit 1
}
