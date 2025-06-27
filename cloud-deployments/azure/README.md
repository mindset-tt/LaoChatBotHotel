# 🔵 Microsoft Azure Deployment

Complete deployment guide for Hotel AI Assistant on Microsoft Azure using Azure Developer CLI (AZD).

## 🎯 Architecture Overview

- **Backend**: Azure Container Apps (FastAPI + LLM)
- **Frontend**: Azure Static Web Apps (React)
- **Database**: SQLite (can be upgraded to Azure SQL)
- **Storage**: Azure Storage Account (for AI models)
- **Monitoring**: Application Insights + Log Analytics
- **Security**: Azure Key Vault + Managed Identity
- **Registry**: Azure Container Registry

## 💰 Cost Estimation

| Service | Monthly Cost |
|---------|-------------|
| Container Apps | $30-50 |
| Static Web Apps | Free |
| Storage Account | $5-10 |
| Application Insights | $10-20 |
| Key Vault | $3 |
| Container Registry | $5 |
| **Total** | **$53-88** |

## 🚀 Quick Deployment

### Prerequisites

1. **Azure CLI**: `winget install Microsoft.AzureCLI`
2. **Azure Developer CLI**: `winget install Microsoft.Azd`
3. **Docker Desktop**: Must be running
4. **Node.js**: For frontend builds

### One-Command Deployment

```powershell
# Navigate to Azure deployment folder
cd cloud-deployments/azure

# Deploy everything
.\deploy-azure.ps1
```

### Manual Step-by-Step

```powershell
# 1. Login to Azure
az login
azd auth login

# 2. Deploy infrastructure and applications
azd up --environment hotel-ai-prod --location eastus

# 3. Check deployment status
azd env list
```

## 📁 File Structure

```
azure/
├── deploy-azure.ps1          # Windows PowerShell deployment
├── deploy-azure.sh           # Linux/macOS deployment  
├── azure.yaml                # AZD configuration
├── infra/
│   ├── main.bicep            # Infrastructure as code
│   └── main.parameters.json  # Deployment parameters
└── README.md                 # This file
```

## 🔧 Configuration

### Environment Variables

Set in `main.parameters.json`:
- `ENVIRONMENT`: production
- `PYTHONPATH`: /app  
- `UVICORN_WORKERS`: 1
- `UVICORN_WORKER_CLASS`: uvicorn.workers.UvicornWorker

### Secrets (Auto-configured)

- Application Insights connection string
- Azure Storage connection string
- Container registry credentials

## 📊 Monitoring & Management

### Azure Portal Resources

After deployment, find these resources in your resource group:

- `ca-backend-*`: Container App (backend)
- `swa-*`: Static Web App (frontend)
- `appi-*`: Application Insights
- `kv-*`: Key Vault
- `st*`: Storage Account
- `cr*`: Container Registry

### Useful Commands

```powershell
# Check deployment status
azd env list

# View application logs  
azd logs

# Redeploy after changes
azd deploy

# Update infrastructure
azd provision

# Clean up resources
azd down
```

## 🔄 CI/CD with GitHub Actions

AZD can automatically set up GitHub Actions:

```bash
# Set up CI/CD pipeline
azd pipeline config
```

## 🛠️ Customization

### Scaling Configuration

Edit `infra/main.bicep` to modify:
- CPU/Memory allocation
- Min/Max replicas
- Scaling triggers

### Environment Configuration

Edit `azure.yaml` to modify:
- Build commands
- Environment variables  
- Deployment hooks

## 🔍 Troubleshooting

### Common Issues

1. **Docker not running**
   ```
   Error: Docker daemon not running
   Solution: Start Docker Desktop
   ```

2. **Authentication errors**
   ```
   Error: Authentication failed
   Solution: az login && azd auth login
   ```

3. **Resource quota exceeded**
   ```
   Error: Quota exceeded
   Solution: Change region or request quota increase
   ```

### Debug Commands

```powershell
# Check Azure account
az account show

# Check AZD authentication
azd auth login --check-status

# Validate Bicep template
az deployment group validate --resource-group <rg-name> --template-file infra/main.bicep

# Check resource group
az group list --query "[?contains(name, 'hotel-ai')]"
```

## 🌐 Custom Domains

### Add Custom Domain to Static Web App

1. Go to Azure Portal → Static Web Apps
2. Navigate to "Custom domains"
3. Add your domain
4. Configure DNS records

### Add Custom Domain to Container App

1. Go to Azure Portal → Container Apps  
2. Navigate to "Custom domains"
3. Add domain and certificate

## 📈 Performance Optimization

### Backend Optimization

- Use multiple workers for CPU-intensive tasks
- Enable HTTP/2 in Container Apps
- Configure auto-scaling rules

### Frontend Optimization

- Enable CDN for global distribution
- Configure caching headers
- Optimize bundle size

## 🔒 Security Best Practices

✅ **Implemented by default:**
- Managed Identity for authentication
- Key Vault for secrets
- HTTPS-only communication
- Network security groups

✅ **Additional recommendations:**
- Enable Azure AD authentication
- Configure custom domains with SSL
- Set up Azure Front Door for DDoS protection

## 📞 Support

- **Azure Documentation**: https://docs.microsoft.com/azure
- **AZD Documentation**: https://learn.microsoft.com/azure/developer/azure-developer-cli
- **Azure Support**: Available through Azure Portal

## 🎯 Next Steps After Deployment

1. **Upload AI Models**: Use Azure Storage Explorer or CLI
2. **Configure Monitoring**: Set up alerts in Application Insights  
3. **Set Up CI/CD**: Configure GitHub Actions pipeline
4. **Custom Domains**: Add your domain names
5. **Backup Strategy**: Configure automated backups
