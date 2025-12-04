# Deployment Guide

This guide covers deploying the Secure Task Manager application to various environments.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Docker Deployment](#docker-deployment)
- [Cloud Deployment Options](#cloud-deployment-options)
- [Database Setup](#database-setup)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Monitoring & Logging](#monitoring--logging)

---

## Prerequisites

### Required Tools

- Docker & Docker Compose
- PostgreSQL 16+ (if not using Docker)
- .NET 8.0 SDK
- Node.js 18+

### Accounts Needed (Optional)

- Docker Hub account (for container registry)
- Cloud provider account (AWS/Azure/GCP)
- Domain name (for production deployment)

---

## Environment Variables

### API Configuration

Create an `appsettings.Production.json` file:
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "DefaultConnection": "Host=your-db-host;Port=5432;Database=securetaskmanager;Username=your-user;Password=your-secure-password"
  },
  "Jwt": {
    "Key": "your-production-secret-key-min-32-chars-long-keep-this-secure!"
  }
}
```

**⚠️ IMPORTANT:** Never commit this file to git! Add it to `.gitignore`.

### Frontend Configuration

Create a `.env.production` file in `src/SecureTaskManager.Web/`:
```env
REACT_APP_API_URL=https://your-api-domain.com/api
```

---

## Docker Deployment

### Local Production Build
```bash
# Build images
docker-compose -f docker/docker-compose.yml build

# Start services
docker-compose -f docker/docker-compose.yml up -d

# View logs
docker-compose -f docker/docker-compose.yml logs -f

# Stop services
docker-compose -f docker/docker-compose.yml down
```

### Production Docker Compose

Create `docker/docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  api:
    image: your-registry/securetaskmanager-api:latest
    container_name: securetaskmanager-api
    restart: always
    ports:
      - "5000:8080"
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ASPNETCORE_URLS=http://+:8080
      - ConnectionStrings__DefaultConnection=${DB_CONNECTION_STRING}
      - Jwt__Key=${JWT_SECRET_KEY}
    depends_on:
      - db
    networks:
      - app-network

  web:
    image: your-registry/securetaskmanager-web:latest
    container_name: securetaskmanager-web
    restart: always
    ports:
      - "80:3000"
      - "443:3000"
    environment:
      - REACT_APP_API_URL=${API_URL}
    depends_on:
      - api
    networks:
      - app-network

  db:
    image: postgres:16-alpine
    container_name: securetaskmanager-db
    restart: always
    environment:
      - POSTGRES_DB=${DB_NAME}
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - app-network

volumes:
  postgres-data:

networks:
  app-network:
    driver: bridge
```

---

## Cloud Deployment Options

### Option 1: AWS Deployment

#### AWS ECS (Elastic Container Service)

1. **Push images to ECR:**
```bash
# Authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag images
docker tag securetaskmanager-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/securetaskmanager-api:latest
docker tag securetaskmanager-web:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/securetaskmanager-web:latest

# Push images
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/securetaskmanager-api:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/securetaskmanager-web:latest
```

2. **Create ECS Task Definition** (see AWS console)
3. **Create ECS Service** with load balancer
4. **Set up RDS PostgreSQL** for database

#### AWS Elastic Beanstalk
```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p docker secure-task-manager

# Create environment
eb create production-env

# Deploy
eb deploy
```

---

### Option 2: Azure Deployment

#### Azure Container Instances
```bash
# Login to Azure
az login

# Create resource group
az group create --name secure-task-manager-rg --location eastus

# Create container registry
az acr create --resource-group secure-task-manager-rg --name securetaskmanageracr --sku Basic

# Push images
az acr login --name securetaskmanageracr
docker tag securetaskmanager-api:latest securetaskmanageracr.azurecr.io/api:latest
docker push securetaskmanageracr.azurecr.io/api:latest

# Create container instances
az container create \
  --resource-group secure-task-manager-rg \
  --name securetaskmanager-api \
  --image securetaskmanageracr.azurecr.io/api:latest \
  --dns-name-label securetaskmanager-api \
  --ports 80
```

---

### Option 3: Railway (Free Tier - Recommended for Portfolio)

1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select `secure-task-manager`
5. Railway auto-detects Dockerfile and deploys
6. Add PostgreSQL service from Railway marketplace
7. Set environment variables in Railway dashboard

**Estimated Cost:** FREE for hobby projects

---

### Option 4: Render (Free Tier - Alternative)

1. Go to [Render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect `secure-task-manager` repo
5. Select Docker runtime
6. Add PostgreSQL database (free tier available)
7. Set environment variables

**Estimated Cost:** FREE for hobby projects

---

## Database Setup

### PostgreSQL Production Setup
```sql
-- Create production database
CREATE DATABASE securetaskmanager;

-- Create user with limited permissions
CREATE USER taskmanager_app WITH PASSWORD 'secure-password-here';

-- Grant permissions
GRANT CONNECT ON DATABASE securetaskmanager TO taskmanager_app;
GRANT USAGE ON SCHEMA public TO taskmanager_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO taskmanager_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO taskmanager_app;

-- Enable SSL (recommended)
ALTER SYSTEM SET ssl = on;
```

### Run Migrations
```bash
# Using EF Core migrations
cd src/SecureTaskManager.API
dotnet ef database update --connection "your-connection-string"
```

---

## SSL/TLS Configuration

### Using Let's Encrypt (Free SSL)

#### With Nginx Reverse Proxy

1. **Install Certbot:**
```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
```

2. **Obtain Certificate:**
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

3. **Auto-renewal:**
```bash
sudo certbot renew --dry-run
```

#### Nginx Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Proxy to API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Proxy to frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## Monitoring & Logging

### Application Logs

Logs are written to:
- Console (stdout)
- Files: `logs/app-{date}.txt`

### Docker Logs
```bash
# View API logs
docker logs -f securetaskmanager-api

# View all services
docker-compose logs -f
```

### Health Checks

Monitor these endpoints:
- API Health: `https://yourdomain.com/api/health`
- Database: Check connection via health endpoint

### Recommended Monitoring Tools

- **Uptime Monitoring:** UptimeRobot (free)
- **Application Monitoring:** Application Insights (Azure)
- **Log Aggregation:** ELK Stack or CloudWatch

---

## Backup & Recovery

### Database Backups
```bash
# Backup
docker exec securetaskmanager-db pg_dump -U postgres securetaskmanager > backup-$(date +%Y%m%d).sql

# Restore
docker exec -i securetaskmanager-db psql -U postgres securetaskmanager < backup-20241120.sql
```

### Automated Backups

Set up cron job:
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/backup-script.sh
```

---

## Troubleshooting

### Common Issues

**Issue:** API not connecting to database

**Solution:** 
- Check connection string
- Verify database is running: `docker ps`
- Check network: `docker network inspect`

**Issue:** CORS errors

**Solution:**
- Verify `REACT_APP_API_URL` is correct
- Check CORS policy in `Program.cs`

**Issue:** JWT token errors

**Solution:**
- Ensure `Jwt__Key` is same across deployments
- Verify token expiration settings

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Use environment variables for secrets
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Set up automated backups
- [ ] Enable security headers
- [ ] Configure rate limiting
- [ ] Set up monitoring and alerts
- [ ] Review and rotate JWT secrets
- [ ] Update dependencies regularly

---

## Rollback Procedure

If deployment fails:
```bash
# Docker rollback
docker-compose down
docker-compose up -d --force-recreate

# Or use previous image tag
docker pull your-registry/securetaskmanager-api:previous-version
docker-compose up -d
```

---

**Need Help?** Contact: malusi.nkosi@icloud.com