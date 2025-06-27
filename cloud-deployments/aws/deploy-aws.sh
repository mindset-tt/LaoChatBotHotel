#!/bin/bash

# AWS Deployment Script for Hotel AI Assistant
# Complete setup using CloudFormation, ECS, and S3

set -e

# Configuration
STACK_NAME="hotel-ai-assistant"
REGION="us-east-1"
ENVIRONMENT_NAME="hotel-ai-prod"

echo "🚀 Starting AWS deployment for Hotel AI Assistant..."

# 1. Configure AWS CLI (assumes AWS CLI is installed)
echo "🔧 Configuring AWS CLI..."
if ! aws sts get-caller-identity &>/dev/null; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# 2. Create ECR repository
echo "📦 Creating ECR repository..."
aws ecr describe-repositories --repository-names $ENVIRONMENT_NAME-backend --region $REGION 2>/dev/null || \
aws ecr create-repository \
    --repository-name $ENVIRONMENT_NAME-backend \
    --region $REGION

# 3. Build and push backend image
echo "🏗️ Building and pushing backend container..."
cd ../../backend

# Get ECR login token
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$REGION.amazonaws.com

# Build and tag image
docker build -t $ENVIRONMENT_NAME-backend .
docker tag $ENVIRONMENT_NAME-backend:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$REGION.amazonaws.com/$ENVIRONMENT_NAME-backend:latest

# Push image
docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$REGION.amazonaws.com/$ENVIRONMENT_NAME-backend:latest

# 4. Deploy CloudFormation stack
echo "☁️ Deploying CloudFormation stack..."
cd ../cloud-deployments/aws
aws cloudformation deploy \
    --template-file cloudformation-template.yaml \
    --stack-name $STACK_NAME \
    --parameter-overrides EnvironmentName=$ENVIRONMENT_NAME \
    --capabilities CAPABILITY_IAM \
    --region $REGION

# 5. Build and deploy frontend
echo "🎨 Building and deploying frontend..."
cd ../../frontend

# Get backend URL from CloudFormation outputs
BACKEND_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`BackendURL`].OutputValue' \
    --output text)

# Build frontend with backend URL
export VITE_API_BASE_URL="$BACKEND_URL/api"
npm install
npm run build

# Get S3 bucket name from CloudFormation
BUCKET_NAME=$(aws cloudformation describe-stack-resources \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'StackResources[?ResourceType==`AWS::S3::Bucket`].PhysicalResourceId' \
    --output text)

# Upload to S3
aws s3 sync dist/ s3://$BUCKET_NAME --delete

# 6. Get final URLs
FRONTEND_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`FrontendURL`].OutputValue' \
    --output text)

echo ""
echo "✅ AWS Deployment Complete!"
echo "📍 Backend URL: $BACKEND_URL"
echo "📍 Frontend URL: https://$FRONTEND_URL"
echo "📍 Stack Name: $STACK_NAME"
echo ""
echo "💰 Estimated monthly cost: $50-90"
echo "⚡ Features: Auto-scaling ECS, CloudFront CDN, Load Balancer"

# 7. Optional: Create Route 53 hosted zone for custom domain
read -p "🌐 Do you want to set up a custom domain? (y/n): " setup_domain
if [[ $setup_domain == "y" ]]; then
    read -p "Enter your domain name: " domain_name
    aws route53 create-hosted-zone \
        --name $domain_name \
        --caller-reference $(date +%s) \
        --hosted-zone-config Comment="Hotel AI Assistant domain"
    echo "✅ Hosted zone created for $domain_name"
    echo "📝 Update your domain's nameservers with the Route 53 nameservers"
fi
