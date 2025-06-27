# PowerShell script for multi-cloud deployment on Windows
# Hotel AI Assistant - Complete Multi-Cloud Setup

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("azure", "gcp", "aws", "oci", "all")]
    [string]$Cloud = "all",
    
    [Parameter(Mandatory=$false)]
    [string]$ProjectName = "hotel-ai-assistant"
)

Write-Host "🚀 Hotel AI Assistant Multi-Cloud Deployment" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

function Test-Prerequisites {
    Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow
    
    $tools = @{
        "docker" = "Docker Desktop"
        "node" = "Node.js"
        "npm" = "NPM"
    }
    
    foreach ($tool in $tools.Keys) {
        try {
            $null = Get-Command $tool -ErrorAction Stop
            Write-Host "✅ $($tools[$tool]) found" -ForegroundColor Green
        }
        catch {
            Write-Host "❌ $($tools[$tool]) not found" -ForegroundColor Red
            return $false
        }
    }
    return $true
}

function Deploy-Azure {
    Write-Host "🔵 Deploying to Microsoft Azure..." -ForegroundColor Blue
    
    Set-Location "cloud-deployments\azure"
    
    # Check Azure CLI and AZD
    try {
        $null = Get-Command az -ErrorAction Stop
        $null = Get-Command azd -ErrorAction Stop
    }
    catch {
        Write-Host "❌ Azure CLI or AZD not found. Installing..." -ForegroundColor Red
        
        # Install Azure CLI
        if (!(Get-Command az -ErrorAction SilentlyContinue)) {
            Write-Host "Installing Azure CLI..." -ForegroundColor Yellow
            winget install Microsoft.AzureCLI
        }
        
        # Install Azure Developer CLI
        if (!(Get-Command azd -ErrorAction SilentlyContinue)) {
            Write-Host "Installing Azure Developer CLI..." -ForegroundColor Yellow
            winget install Microsoft.Azd
        }
        
        Write-Host "⚠️ Please restart PowerShell and run the script again" -ForegroundColor Yellow
        Set-Location ".."
        return
    }
    
    # Login and deploy
    Write-Host "🔐 Logging into Azure..." -ForegroundColor Yellow
    if (!(az account show 2>$null)) {
        az login
    }
    
    if (!(azd auth login --check-status 2>$null)) {
        azd auth login
    }
    
    Write-Host "🚀 Deploying to Azure..." -ForegroundColor Yellow
    azd up --environment "hotel-ai-prod" --location "eastus"
    
    Set-Location ".."
    Write-Host "✅ Azure deployment completed!" -ForegroundColor Green
}

function Deploy-GCP {
    Write-Host "🟢 Deploying to Google Cloud Platform..." -ForegroundColor Green
    
    # Check Google Cloud SDK
    if (!(Get-Command gcloud -ErrorAction SilentlyContinue)) {
        Write-Host "❌ Google Cloud SDK not found" -ForegroundColor Red
        Write-Host "Please install from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
        return
    }
    
    Set-Location "cloud-deployments\gcp"
    
    # Convert shell script to PowerShell commands
    Write-Host "🔐 Logging into Google Cloud..." -ForegroundColor Yellow
    gcloud auth login
    
    Write-Host "📋 Setting up project..." -ForegroundColor Yellow
    $projectId = "$ProjectName-$(Get-Date -Format 'yyyyMMddHHmm')"
    gcloud projects create $projectId --name="Hotel AI Assistant"
    gcloud config set project $projectId
    
    Write-Host "🔧 Enabling APIs..." -ForegroundColor Yellow
    $apis = @(
        "run.googleapis.com",
        "cloudbuild.googleapis.com", 
        "containerregistry.googleapis.com",
        "storage-api.googleapis.com"
    )
    
    foreach ($api in $apis) {
        gcloud services enable $api
    }
    
    Write-Host "🏗️ Building and deploying..." -ForegroundColor Yellow
    Set-Location "..\..\backend"
    gcloud builds submit --tag "gcr.io/$projectId/backend:latest"
    
    gcloud run deploy "hotel-ai-backend" `
        --image "gcr.io/$projectId/backend:latest" `
        --platform managed `
        --region us-central1 `
        --allow-unauthenticated `
        --memory 4Gi `
        --cpu 2
    
    Set-Location ".."
    Write-Host "✅ GCP deployment completed!" -ForegroundColor Green
}

function Deploy-AWS {
    Write-Host "🟠 Deploying to Amazon Web Services..." -ForegroundColor Red
    
    # Check AWS CLI
    if (!(Get-Command aws -ErrorAction SilentlyContinue)) {
        Write-Host "❌ AWS CLI not found" -ForegroundColor Red
        Write-Host "Please install from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
        return
    }
    
    Set-Location "cloud-deployments\aws"
    
    Write-Host "🔐 Checking AWS credentials..." -ForegroundColor Yellow
    try {
        aws sts get-caller-identity
    }
    catch {
        Write-Host "❌ AWS not configured. Please run 'aws configure'" -ForegroundColor Red
        return
    }
    
    Write-Host "☁️ Deploying CloudFormation stack..." -ForegroundColor Yellow
    $stackName = "hotel-ai-assistant"
    
    aws cloudformation deploy `
        --template-file cloudformation-template.yaml `
        --stack-name $stackName `
        --parameter-overrides EnvironmentName="hotel-ai-prod" `
        --capabilities CAPABILITY_IAM `
        --region us-east-1
    
    Set-Location ".."
    Write-Host "✅ AWS deployment completed!" -ForegroundColor Green
}

function Deploy-OCI {
    Write-Host "🔶 Deploying to Oracle Cloud Infrastructure..." -ForegroundColor DarkYellow
    
    # Check OCI CLI and Terraform
    if (!(Get-Command oci -ErrorAction SilentlyContinue)) {
        Write-Host "❌ OCI CLI not found" -ForegroundColor Red
        Write-Host "Please install from: https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/cliinstall.htm" -ForegroundColor Yellow
        return
    }
    
    if (!(Get-Command terraform -ErrorAction SilentlyContinue)) {
        Write-Host "❌ Terraform not found" -ForegroundColor Red
        Write-Host "Installing Terraform..." -ForegroundColor Yellow
        winget install Hashicorp.Terraform
        return
    }
    
    Set-Location "cloud-deployments\oci"
    
    Write-Host "🔧 Initializing Terraform..." -ForegroundColor Yellow
    terraform init
    
    # Get compartment ID
    $compartmentId = oci iam compartment list --query 'data[0].id' --raw-output
    
    Write-Host "🚀 Deploying with Terraform..." -ForegroundColor Yellow
    terraform apply -var="compartment_id=$compartmentId" -var="region=us-ashburn-1" -auto-approve
    
    Set-Location ".."
    Write-Host "✅ OCI deployment completed!" -ForegroundColor Green
}

function Show-Summary {
    Write-Host "`n📊 Deployment Summary" -ForegroundColor Cyan
    Write-Host "======================" -ForegroundColor Cyan
    
    Write-Host "`n🎯 Your Hotel AI Assistant is now deployed on:" -ForegroundColor Green
    
    if ($Cloud -eq "all" -or $Cloud -eq "azure") {
        Write-Host "🔵 Microsoft Azure - Enterprise-grade platform" -ForegroundColor Blue
    }
    
    if ($Cloud -eq "all" -or $Cloud -eq "gcp") {
        Write-Host "🟢 Google Cloud Platform - Best for AI/ML" -ForegroundColor Green  
    }
    
    if ($Cloud -eq "all" -or $Cloud -eq "aws") {
        Write-Host "🟠 Amazon Web Services - Market leader" -ForegroundColor Red
    }
    
    if ($Cloud -eq "all" -or $Cloud -eq "oci") {
        Write-Host "🔶 Oracle Cloud Infrastructure - Cost-effective" -ForegroundColor DarkYellow
    }
    
    Write-Host "`n💡 Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Test each deployment thoroughly" -ForegroundColor White
    Write-Host "2. Upload your AI models to storage" -ForegroundColor White
    Write-Host "3. Configure domain names" -ForegroundColor White
    Write-Host "4. Set up monitoring and alerts" -ForegroundColor White
    Write-Host "5. Implement CI/CD pipelines" -ForegroundColor White
    
    Write-Host "`n📈 Performance Monitoring:" -ForegroundColor Cyan
    Write-Host "• Check application logs in each cloud console" -ForegroundColor White
    Write-Host "• Monitor resource usage and costs" -ForegroundColor White
    Write-Host "• Set up health checks and uptime monitoring" -ForegroundColor White
}

# Main execution
try {
    if (!(Test-Prerequisites)) {
        Write-Host "❌ Prerequisites check failed. Please install missing tools." -ForegroundColor Red
        exit 1
    }
    
    switch ($Cloud) {
        "azure" { Deploy-Azure }
        "gcp" { Deploy-GCP }
        "aws" { Deploy-AWS }
        "oci" { Deploy-OCI }
        "all" {
            Deploy-Azure
            Deploy-GCP  
            Deploy-AWS
            Deploy-OCI
        }
    }
    
    Show-Summary
    
    Write-Host "`n🎉 Multi-cloud deployment completed successfully!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
