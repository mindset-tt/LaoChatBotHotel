#!/bin/bash

# Oracle Cloud Infrastructure (OCI) Deployment Script
# Hotel AI Assistant deployment using OKE and Object Storage

set -e

# Configuration
COMPARTMENT_ID=""
REGION="us-ashburn-1"
ENVIRONMENT_NAME="hotel-ai-prod"

echo "🚀 Starting OCI deployment for Hotel AI Assistant..."

# Check prerequisites
if ! command -v oci &> /dev/null; then
    echo "❌ OCI CLI not found. Please install it first:"
    echo "https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/cliinstall.htm"
    exit 1
fi

if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform not found. Please install it first:"
    echo "https://www.terraform.io/downloads.html"
    exit 1
fi

if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found. Please install it first:"
    echo "https://kubernetes.io/docs/tasks/tools/install-kubectl/"
    exit 1
fi

# Get compartment ID if not provided
if [ -z "$COMPARTMENT_ID" ]; then
    echo "🔍 Getting compartment ID..."
    COMPARTMENT_ID=$(oci iam compartment list --query 'data[0].id' --raw-output 2>/dev/null || echo "")
    if [ -z "$COMPARTMENT_ID" ]; then
        echo "❌ Could not get compartment ID. Please set COMPARTMENT_ID variable."
        echo "Run: oci iam compartment list"
        exit 1
    fi
fi

echo "📋 Using compartment: $COMPARTMENT_ID"

# 1. Deploy infrastructure with Terraform
echo "🏗️ Deploying infrastructure with Terraform..."
terraform init
terraform plan -var="compartment_id=$COMPARTMENT_ID" -var="region=$REGION" -var="environment_name=$ENVIRONMENT_NAME"
terraform apply -var="compartment_id=$COMPARTMENT_ID" -var="region=$REGION" -var="environment_name=$ENVIRONMENT_NAME" -auto-approve

# Get outputs
CLUSTER_ID=$(terraform output -raw cluster_id)
LB_IP=$(terraform output -raw load_balancer_ip)
MODELS_BUCKET=$(terraform output -raw models_bucket_name)
FRONTEND_BUCKET=$(terraform output -raw frontend_bucket_name)

# 2. Configure kubectl for OKE
echo "⚙️ Configuring kubectl for OKE..."
oci ce cluster create-kubeconfig \
    --cluster-id $CLUSTER_ID \
    --file $HOME/.kube/config \
    --region $REGION \
    --token-version 2.0.0 \
    --kube-endpoint PUBLIC_ENDPOINT

# 3. Build and push Docker image to OCIR
echo "🐳 Building and pushing Docker image..."
cd ../../backend

# Login to OCIR
echo "Logging into Oracle Container Registry..."
REGION_KEY=$(echo $REGION | cut -d'-' -f1-2)
docker login -u "${OCI_TENANCY_NAMESPACE}/${OCI_USERNAME}" $REGION_KEY.ocir.io

# Build and push
docker build -t $REGION_KEY.ocir.io/${OCI_TENANCY_NAMESPACE}/${ENVIRONMENT_NAME}/backend:latest .
docker push $REGION_KEY.ocir.io/${OCI_TENANCY_NAMESPACE}/${ENVIRONMENT_NAME}/backend:latest

# 4. Deploy Kubernetes manifests
echo "☸️ Deploying to Kubernetes..."
cd ../cloud-deployments/oci

# Create namespace
kubectl create namespace hotel-ai-prod || true

# Create deployment manifest
cat <<EOF > backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hotel-ai-backend
  namespace: hotel-ai-prod
spec:
  replicas: 2
  selector:
    matchLabels:
      app: hotel-ai-backend
  template:
    metadata:
      labels:
        app: hotel-ai-backend
    spec:
      containers:
      - name: backend
        image: $REGION_KEY.ocir.io/${OCI_TENANCY_NAMESPACE}/${ENVIRONMENT_NAME}/backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: ENVIRONMENT
          value: "production"
        - name: PYTHONPATH
          value: "/app"
        - name: UVICORN_WORKERS
          value: "1"
        - name: UVICORN_WORKER_CLASS
          value: "uvicorn.workers.UvicornWorker"
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: hotel-ai-backend-service
  namespace: hotel-ai-prod
spec:
  selector:
    app: hotel-ai-backend
  ports:
  - port: 80
    targetPort: 8000
  type: LoadBalancer
EOF

# Apply Kubernetes manifests
kubectl apply -f backend-deployment.yaml

# 5. Build and upload frontend
echo "🎨 Building and uploading frontend..."
cd ../../frontend

# Build frontend
export VITE_API_BASE_URL="http://$LB_IP/api"
npm install
npm run build

# Upload to Object Storage
echo "📤 Uploading frontend to Object Storage..."
for file in $(find dist -type f); do
    oci os object put \
        --bucket-name $FRONTEND_BUCKET \
        --file $file \
        --name ${file#dist/} \
        --content-type $(file -b --mime-type $file)
done

# 6. Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/hotel-ai-backend -n hotel-ai-prod

# Get service URLs
BACKEND_SERVICE_IP=$(kubectl get service hotel-ai-backend-service -n hotel-ai-prod -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
FRONTEND_URL="https://objectstorage.$REGION.oraclecloud.com/n/${OCI_TENANCY_NAMESPACE}/b/$FRONTEND_BUCKET/o/index.html"

echo ""
echo "✅ OCI Deployment Complete!"
echo "📍 Backend URL: http://$BACKEND_SERVICE_IP"
echo "📍 Frontend URL: $FRONTEND_URL"
echo "📍 Load Balancer IP: $LB_IP"
echo "📍 Models Bucket: $MODELS_BUCKET"
echo ""
echo "💰 Estimated monthly cost: $30-60"
echo "⚡ Features: ARM-based VMs, Kubernetes, Always-free tier eligible"

# Cleanup
rm -f backend-deployment.yaml
