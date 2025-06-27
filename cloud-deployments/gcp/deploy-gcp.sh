#!/bin/bash

# Google Cloud Platform Deployment Script
# Hotel AI Assistant - Complete GCP Setup

set -e

# Configuration
PROJECT_ID="hotel-ai-assistant-$(date +%s)"
REGION="us-central1"
SERVICE_NAME="hotel-ai-backend"
REPO_NAME="hotel-ai-repo"

echo "🚀 Starting GCP deployment for Hotel AI Assistant..."

# 1. Create and configure GCP project
echo "📋 Setting up GCP project..."
gcloud projects create $PROJECT_ID --name="Hotel AI Assistant"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable storage-api.googleapis.com
gcloud services enable monitoring.googleapis.com
gcloud services enable logging.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable firebase.googleapis.com
gcloud services enable firestore.googleapis.com

# 2. Create Artifact Registry
echo "📦 Creating Artifact Registry..."
gcloud artifacts repositories create $REPO_NAME \
    --repository-format=docker \
    --location=$REGION \
    --description="Hotel AI Assistant container images"

# 3. Create storage bucket for models
echo "💾 Creating storage bucket..."
gsutil mb -p $PROJECT_ID -c STANDARD -l $REGION gs://$PROJECT_ID-models

# 4. Create secrets
echo "🔐 Creating secrets..."
echo "dummy-secret" | gcloud secrets create app-secret --data-file=-

# 5. Build and deploy backend
echo "🏗️ Building backend container..."
cd ../../backend
gcloud builds submit --tag $REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/backend:latest

# 6. Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image $REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/backend:latest \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 4Gi \
    --cpu 2 \
    --max-instances 10 \
    --min-instances 1 \
    --port 8000 \
    --set-env-vars ENVIRONMENT=production,PYTHONPATH=/app,UVICORN_WORKERS=1

# 7. Setup Firebase for frontend
echo "🎨 Setting up Firebase hosting..."
cd ../frontend
npm install -g firebase-tools
firebase login --no-localhost
firebase init hosting --project $PROJECT_ID

# Build frontend
npm install
npm run build

# Deploy frontend
firebase deploy --project $PROJECT_ID

# 8. Get URLs
BACKEND_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')
FRONTEND_URL="https://$PROJECT_ID.web.app"

echo ""
echo "✅ GCP Deployment Complete!"
echo "📍 Backend URL: $BACKEND_URL"
echo "📍 Frontend URL: $FRONTEND_URL" 
echo "📍 Project ID: $PROJECT_ID"
echo ""
echo "💰 Estimated monthly cost: $40-70"
echo "⚡ Features: Auto-scaling, global CDN, managed infrastructure"
