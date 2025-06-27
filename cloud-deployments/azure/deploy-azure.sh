#!/bin/bash

# Microsoft Azure Deployment Script
# Hotel AI Assistant - Complete Azure Setup using AZD

set -e

# Configuration
ENVIRONMENT_NAME="hotel-ai-prod"
LOCATION="eastus"

echo "🚀 Starting Azure deployment for Hotel AI Assistant..."

# Check prerequisites
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI not found. Please install it first:"
    echo "https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

if ! command -v azd &> /dev/null; then
    echo "❌ Azure Developer CLI not found. Please install it first:"
    echo "https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/install-azd"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker Desktop first"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop"
    exit 1
fi

echo "✅ All prerequisites found"

# 1. Login to Azure
echo "🔐 Logging into Azure..."
if ! az account show &>/dev/null; then
    echo "Please login to Azure CLI..."
    az login
fi

if ! azd auth login --check-status &>/dev/null; then
    echo "Please login to Azure Developer CLI..."
    azd auth login
fi

# 2. Initialize AZD (if not already done)
echo "📋 Initializing Azure Developer CLI..."
if [ ! -f "azure.yaml" ]; then
    echo "❌ azure.yaml not found in current directory"
    exit 1
fi

# 3. Set environment variables
echo "🔧 Setting up environment..."
export AZURE_ENV_NAME=$ENVIRONMENT_NAME
export AZURE_LOCATION=$LOCATION

# 4. Provision and deploy
echo "🚀 Deploying to Azure..."
azd up --environment $ENVIRONMENT_NAME --location $LOCATION

# 5. Get deployment URLs
echo "📍 Getting deployment information..."
BACKEND_URI=$(azd env get-values | grep BACKEND_URI | cut -d'=' -f2 | tr -d '"')
FRONTEND_URI=$(azd env get-values | grep FRONTEND_URI | cut -d'=' -f2 | tr -d '"')
RESOURCE_GROUP=$(azd env get-values | grep AZURE_RESOURCE_GROUP | cut -d'=' -f2 | tr -d '"')

echo ""
echo "✅ Azure Deployment Complete!"
echo "📍 Backend URL: $BACKEND_URI"
echo "📍 Frontend URL: $FRONTEND_URI"
echo "📍 Resource Group: $RESOURCE_GROUP"
echo "📍 Environment: $ENVIRONMENT_NAME"
echo ""
echo "💰 Estimated monthly cost: $53-88"
echo "⚡ Features: Container Apps, Static Web Apps, Auto-scaling, Managed Identity"
echo ""
echo "🎯 Next Steps:"
echo "1. Upload your AI models to the storage account"
echo "2. Configure custom domains if needed"
echo "3. Set up monitoring alerts in Azure Monitor"
echo "4. Configure GitHub Actions for CI/CD"

# 6. Show monitoring information
echo ""
echo "📊 Monitoring & Management:"
echo "• Azure Portal: https://portal.azure.com"
echo "• Application Insights: Search for 'appi-' in your resource group"
echo "• Container Apps: Search for 'ca-backend-' in your resource group"
echo "• Static Web Apps: Search for 'swa-' in your resource group"
echo ""
echo "🔍 Useful Commands:"
echo "• Check deployment status: azd env list"
echo "• View logs: azd logs"
echo "• Redeploy: azd deploy"
echo "• Clean up: azd down"
