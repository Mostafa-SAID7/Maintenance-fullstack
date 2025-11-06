# Deployment Guide

This guide covers deploying the CarCommun application to various environments.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Local Development Deployment](#local-development-deployment)
- [Production Deployment](#production-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Cloud Deployment](#cloud-deployment)
- [Monitoring and Logging](#monitoring-and-logging)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software
- Docker 24.x or higher
- Docker Compose 2.x or higher
- kubectl (for Kubernetes deployment)
- SSL certificates (for production)

### Environment Variables
Create `.env` file with the following variables:

```bash
# Database
POSTGRES_USER=carmaintenance_user
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=carmaintenance

# Redis
REDIS_PASSWORD=your-redis-password

# JWT
JWT_SECRET_KEY=your-jwt-secret-key

# API Configuration
API_PORT=80
FRONTEND_PORT=80

# Azure Storage (optional)
AZURE_STORAGE_CONNECTION_STRING=your-connection-string

# Application Insights (optional)
APPLICATIONINSIGHTS_CONNECTION_STRING=your-key

# Email Configuration
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USERNAME=your-email
SMTP_PASSWORD=your-password

# SSL Configuration
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem
```

## Local Development Deployment

### Quick Start
```bash
# Clone the repository
git clone https://github.com/your-username/CarCommun.git
cd CarCommun

# Run setup script
./scripts/setup-development.sh

# Or manually
docker-compose up -d
```

### Services URLs
- **API**: http://localhost:5000 (Swagger: http://localhost:5000/swagger)
- **Frontend**: http://localhost:4200
- **Database**: localhost:5432
- **pgAdmin**: http://localhost:8080
- **MailHog**: http://localhost:8025
- **Redis**: localhost:6379

### Development Commands
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and start
docker-compose up -d --build

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

## Production Deployment

### Using Docker Compose
```bash
# Set production environment variables
export POSTGRES_PASSWORD="your-secure-password"
export JWT_SECRET_KEY="your-jwt-secret"
export REDIS_PASSWORD="redis-password"

# Deploy production environment
docker-compose -f docker-compose.prod.yml up -d

# Check deployment status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Using Docker Swarm
```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.prod.yml carcommun

# Check services
docker service ls

# View logs
docker service logs carcommun_api
```

### SSL/TLS Configuration
1. Obtain SSL certificates (Let's Encrypt, commercial CA)
2. Place certificates in `nginx/ssl/` directory
3. Update `nginx/nginx.conf` with certificate paths
4. Restart nginx service

## Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (1.20+)
- kubectl configured
- Helm 3.x (optional)

### Using Helm
```bash
# Add Helm repository
helm repo add carcommun https://your-helm-repo.github.io/charts
helm repo update

# Install with custom values
helm install carcommun carcommun/carmaintenance \
  --set postgresql.auth.password=your-password \
  --set redis.auth.password=redis-password \
  --set jwt.secretKey=your-jwt-secret
```

### Manual Kubernetes Deployment
```bash
# Apply configurations
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/api.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/nginx.yaml

# Check deployment status
kubectl get pods -n carcommun
kubectl get services -n carcommun
```

### Kubernetes Configuration Files
Create the following files in `k8s/` directory:

#### namespace.yaml
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: carcommun
```

#### postgres.yaml
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: carcommun
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:16
        env:
        - name: POSTGRES_DB
          value: carmaintenance
        - name: POSTGRES_USER
          value: caruser
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: carcommun
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
  type: ClusterIP
```

## Cloud Deployment

### Azure Container Instances
```bash
# Create resource group
az group create --name carcommun-rg --location eastus

# Deploy container group
az container create \
  --resource-group carcommun-rg \
  --name carcommun-app \
  --image ghcr.io/your-username/carmaintenance-api:latest \
  --dns-name-label carcommun \
  --ports 80
```

### AWS ECS
```bash
# Create cluster
aws ecs create-cluster --cluster-name carcommun

# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create service
aws ecs create-service \
  --cluster carcommun \
  --service-name carcommun-api \
  --task-definition carcommun:1 \
  --desired-count 1
```

### Google Cloud Run
```bash
# Build and push image
docker build -t gcr.io/PROJECT_ID/carmaintenance-api .
docker push gcr.io/PROJECT_ID/carmaintenance-api

# Deploy to Cloud Run
gcloud run deploy carcommun-api \
  --image gcr.io/PROJECT_ID/carmaintenance-api \
  --platform managed \
  --region us-central1
```

## Database Migration

### Before Deployment
```bash
# Backup existing database
pg_dump -h localhost -U caruser carmaintenance > backup.sql

# Run migrations
cd src/CarMaintenance.Api
dotnet ef database update
```

### After Deployment
```bash
# Apply migrations to production database
docker-compose exec api dotnet ef database update

# Or using migration script
./scripts/migrate-database.sh
```

## Monitoring and Logging

### Health Checks
```bash
# API health check
curl http://localhost:5000/health

# Database connectivity
docker-compose exec postgres pg_isready -U caruser

# Redis connectivity
docker-compose exec redis redis-cli ping
```

### Log Management
```bash
# View application logs
docker-compose logs -f api

# View database logs
docker-compose logs -f postgres

# View nginx logs
docker-compose logs -f nginx
```

### Monitoring Stack (Optional)
Deploy Prometheus and Grafana for monitoring:

```bash
# Add monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d

# Access Grafana
# http://localhost:3000 (admin/admin)
```

## Troubleshooting

### Common Issues

#### Container won't start
```bash
# Check container logs
docker-compose logs container-name

# Check resource usage
docker stats

# Restart specific service
docker-compose restart service-name
```

#### Database connection failed
```bash
# Check database status
docker-compose exec postgres pg_isready

# Check network connectivity
docker-compose exec api ping postgres

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

#### SSL certificate issues
```bash
# Check certificate validity
openssl x509 -in /path/to/cert.pem -text -noout

# Test SSL connection
openssl s_client -connect yourdomain.com:443
```

#### Performance issues
```bash
# Check resource usage
docker stats --no-stream

# Scale services
docker-compose up -d --scale api=3

# Check database performance
docker-compose exec postgres psql -U caruser -d carmaintenance -c "SELECT * FROM pg_stat_activity;"
```

### Rollback
```bash
# Rollback to previous version
docker-compose down
docker-compose up -d --force-recreate

# Rollback database
psql -h localhost -U caruser carmaintenance < backup.sql
```

### Support
- Check logs: `docker-compose logs`
- Review health checks: `curl http://localhost:5000/health`
- Monitor resource usage: `docker stats`
- Check GitHub Issues for known problems

---

For more information:
- [API Documentation](api-documentation.md)
- [Development Setup](development-setup.md)
- [Architecture Documentation](architecture.md)