# PowerShell script for Azure deployment on Windows
# Hotel AI Assistant - Azure Cloud Setup

param(
    [Parameter(Mandatory=$false)]
    [string]$EnvironmentName = "hotel-ai-prod",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "eastus"
)

Write-Host "🔵 Hotel AI Assistant - Azure Deployment" -ForegroundColor Blue
Write-Host "=========================================" -ForegroundColor Blue

function Test-AzurePrerequisites {
    Write-Host "🔍 Checking Azure prerequisites..." -ForegroundColor Yellow
    
    $tools = @{
        "az" = "Azure CLI"
        "azd" = "Azure Developer CLI" 
        "docker" = "Docker Desktop"
    }
    
    $allFound = $true
    foreach ($tool in $tools.Keys) {
        try {
            $null = Get-Command $tool -ErrorAction Stop
            Write-Host "✅ $($tools[$tool]) found" -ForegroundColor Green
        }
        catch {
            Write-Host "❌ $($tools[$tool]) not found" -ForegroundColor Red
            $allFound = $false
            
            switch ($tool) {
                "az" { 
                    Write-Host "   Install: winget install Microsoft.AzureCLI" -ForegroundColor Yellow 
                }
                "azd" { 
                    Write-Host "   Install: winget install Microsoft.Azd" -ForegroundColor Yellow 
                }
                "docker" { 
                    Write-Host "   Install: Download from https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow 
                }
            }
        }
    }
    
    # Check if Docker is running
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        try {
            docker info | Out-Null
            Write-Host "✅ Docker is running" -ForegroundColor Green
        }
        catch {
            Write-Host "❌ Docker is not running. Please start Docker Desktop" -ForegroundColor Red
            $allFound = $false
        }
    }
    
    return $allFound
}

function Test-AzureAuthentication {
    Write-Host "🔐 Checking Azure authentication..." -ForegroundColor Yellow
    
    # Check Azure CLI login
    try {
        az account show | Out-Null
        Write-Host "✅ Azure CLI authenticated" -ForegroundColor Green
    }
    catch {
        Write-Host "🔑 Please login to Azure CLI..." -ForegroundColor Yellow
        az login
    }
    
    # Check AZD authentication
    try {
        azd auth login --check-status | Out-Null
        Write-Host "✅ Azure Developer CLI authenticated" -ForegroundColor Green
    }
    catch {
        Write-Host "🔑 Please login to Azure Developer CLI..." -ForegroundColor Yellow
        azd auth login
    }
}

function Deploy-ToAzure {
    Write-Host "🚀 Starting Azure deployment..." -ForegroundColor Blue
    
    # Set environment variables
    $env:AZURE_ENV_NAME = $EnvironmentName
    $env:AZURE_LOCATION = $Location
    
    Write-Host "📋 Environment: $EnvironmentName" -ForegroundColor Cyan
    Write-Host "📍 Location: $Location" -ForegroundColor Cyan
    
    # Check if azure.yaml exists
    if (!(Test-Path "azure.yaml")) {
        Write-Host "❌ azure.yaml not found in current directory" -ForegroundColor Red
        Write-Host "   Make sure you're in the cloud-deployments/azure folder" -ForegroundColor Yellow
        return $false
    }
    
    try {
        Write-Host "🏗️ Provisioning Azure resources and deploying application..." -ForegroundColor Yellow
        azd up --environment $EnvironmentName --location $Location
        
        Write-Host "✅ Azure deployment completed successfully!" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Azure deployment failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Get-DeploymentInfo {
    Write-Host "📊 Getting deployment information..." -ForegroundColor Cyan
    
    try {
        # Get environment values
        $envValues = azd env get-values | ConvertFrom-StringData -Delimiter "="
        
        $backendUri = $envValues["BACKEND_URI"]
        $frontendUri = $envValues["FRONTEND_URI"] 
        $resourceGroup = $envValues["RESOURCE_GROUP_NAME"]
        $containerRegistry = $envValues["AZURE_CONTAINER_REGISTRY_NAME"]
        
        Write-Host ""
        Write-Host "🎉 Deployment Summary" -ForegroundColor Green
        Write-Host "=====================" -ForegroundColor Green
        Write-Host "📍 Backend URL: $backendUri" -ForegroundColor White
        Write-Host "📍 Frontend URL: $frontendUri" -ForegroundColor White
        Write-Host "📍 Resource Group: $resourceGroup" -ForegroundColor White
        Write-Host "📍 Container Registry: $containerRegistry" -ForegroundColor White
        Write-Host "📍 Environment: $EnvironmentName" -ForegroundColor White
        
        Write-Host ""
        Write-Host "💰 Estimated monthly cost: `$53-88" -ForegroundColor Yellow
        Write-Host "⚡ Features: Container Apps, Static Web Apps, Auto-scaling, Managed Identity" -ForegroundColor Yellow
        
        Write-Host ""
        Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
        Write-Host "1. Upload your AI models to the storage account" -ForegroundColor White
        Write-Host "2. Configure custom domains if needed" -ForegroundColor White  
        Write-Host "3. Set up monitoring alerts in Azure Monitor" -ForegroundColor White
        Write-Host "4. Configure GitHub Actions for CI/CD" -ForegroundColor White
        
        Write-Host ""
        Write-Host "📊 Monitoring & Management:" -ForegroundColor Cyan
        Write-Host "• Azure Portal: https://portal.azure.com" -ForegroundColor White
        Write-Host "• Application Insights: Search for 'appi-' in your resource group" -ForegroundColor White
        Write-Host "• Container Apps: Search for 'ca-backend-' in your resource group" -ForegroundColor White
        Write-Host "• Static Web Apps: Search for 'swa-' in your resource group" -ForegroundColor White
        
        Write-Host ""
        Write-Host "🔍 Useful Commands:" -ForegroundColor Cyan
        Write-Host "• Check status: azd env list" -ForegroundColor White
        Write-Host "• View logs: azd logs" -ForegroundColor White
        Write-Host "• Redeploy: azd deploy" -ForegroundColor White
        Write-Host "• Clean up: azd down" -ForegroundColor White
    }
    catch {
        Write-Host "⚠️ Could not retrieve all deployment information" -ForegroundColor Yellow
        Write-Host "   You can check the Azure Portal for resource details" -ForegroundColor Yellow
    }
}

# Main execution
try {
    if (!(Test-AzurePrerequisites)) {
        Write-Host ""
        Write-Host "❌ Prerequisites check failed. Please install missing tools and try again." -ForegroundColor Red
        exit 1
    }
    
    Test-AzureAuthentication
    
    if (Deploy-ToAzure) {
        Get-DeploymentInfo
        Write-Host ""
        Write-Host "🎉 Azure deployment completed successfully!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Azure deployment failed. Check the error messages above." -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "❌ Deployment script failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
