# Development Setup Guide

This guide will help you set up a complete development environment for the CarCommun project.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Project Setup](#project-setup)
- [IDE Configuration](#ide-configuration)
- [Database Setup](#database-setup)
- [Environment Configuration](#environment-configuration)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software
1. **.NET 9.0 SDK**
   ```bash
   # Download from: https://dotnet.microsoft.com/download/dotnet/9.0
   dotnet --version  # Should show 9.0.x
   ```

2. **Node.js 20.x**
   ```bash
   # Download from: https://nodejs.org/
   node --version    # Should show 20.x
   npm --version     # Should show 10.x
   ```

3. **Flutter 3.19.x**
   ```bash
   # Download from: https://flutter.dev/docs/get-started/install
   flutter --version # Should show 3.19.x
   ```

4. **Docker & Docker Compose**
   ```bash
   docker --version     # Should show 24.x or higher
   docker-compose --version # Should show 2.x or higher
   ```

5. **Git**
   ```bash
   git --version # Should show 2.x or higher
   ```

### Optional Tools
- **Visual Studio 2022** or **Visual Studio Code**
- **pgAdmin** for PostgreSQL management
- **Postman** for API testing
- **Angular CLI**: `npm install -g @angular/cli@20`
- **Flutter Doctor**: `flutter doctor`

## Project Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/CarCommun.git
cd CarCommun
```

### 2. Setup Development Environment
```bash
# Make setup script executable (Linux/Mac)
chmod +x scripts/setup-development.sh

# Run setup script
./scripts/setup-development.sh
```

### 3. Manual Setup (if script doesn't work)
```bash
# Start Docker services
docker-compose up -d

# Wait for services to be ready
docker-compose ps

# Install frontend dependencies
cd ClientApp
npm install
cd ..

# Install Flutter dependencies
cd mobile
flutter pub get
cd ..
```

## IDE Configuration

### Visual Studio Code (Recommended)
Install these extensions:
- **C#** (ms-dotnettools.csharp)
- **Angular Language Service** (angular.ng-template)
- **Flutter** (dart-code.dart-code)
- **Docker** (ms-azuretools.vscode-docker)
- **YAML** (redhat.vscode-yaml)
- **GitLens** (eamodio.gitlens)

#### Workspace Settings
Create `.vscode/settings.json`:
```json
{
  "omnisharp.enableRoslynAnalyzers": true,
  "omnisharp.enableImportCompletion": true,
  "omnisharp.enableDecompilationSupport": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "angular.enable-strict-mode-prompt": false,
  "files.exclude": {
    "**/bin": true,
    "**/obj": true,
    "**/dist": true,
    "**/.angular": true,
    "**/build": true
  }
}
```

### Visual Studio 2022
- Install .NET 9 workload
- Install ASP.NET and web development workload
- Install Node.js development workload
- Open `CarCommun.sln` solution file

## Database Setup

### Using Docker (Recommended)
```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Check if services are running
docker-compose ps

# Access pgAdmin (optional)
# Navigate to http://localhost:8080
# Email: admin@carmaintenance.local
# Password: admin123
```

### Local PostgreSQL Installation
```bash
# Install PostgreSQL 16
# Ubuntu/Debian:
sudo apt install postgresql-16

# macOS:
brew install postgresql@16

# Windows: Download from postgresql.org

# Create database and user
sudo -u postgres psql
CREATE DATABASE carmaintenance;
CREATE USER caruser WITH ENCRYPTED PASSWORD 'carpass123';
GRANT ALL PRIVILEGES ON DATABASE carmaintenance TO caruser;
\q
```

### Database Migrations
```bash
cd src/CarMaintenance.Api

# Apply migrations
dotnet ef database update

# Create new migration (if needed)
dotnet ef migrations add MigrationName

# Remove last migration
dotnet ef migrations remove

# Reset database
dotnet ef database drop --force
dotnet ef database update
```

## Environment Configuration

### Development Environment Files

#### src/CarMaintenance.Api/appsettings.Development.json
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=carmaintenance;Username=caruser;Password=carpass123"
  },
  "Redis": {
    "ConnectionString": "localhost:6379"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Information"
    }
  },
  "JWT": {
    "SecretKey": "your-dev-secret-key-for-development-only"
  }
}
```

#### ClientApp/src/environments/environment.ts
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000',
  signalRHubUrl: 'http://localhost:5000/hubs/chat',
  enableLogging: true,
  enableDevTools: true
};
```

#### mobile/lib/core/config/environment.dart
```dart
class Environment {
  static const String baseUrl = 'http://localhost:5000';
  static const bool enableLogging = true;
  static const String environment = 'development';
}
```

## Development Workflow

### Daily Development
1. **Pull latest changes**
   ```bash
   git pull origin develop
   ```

2. **Start development services**
   ```bash
   docker-compose up -d
   ```

3. **Start backend API**
   ```bash
   dotnet watch run --project src/CarMaintenance.Api
   ```

4. **Start frontend (new terminal)**
   ```bash
   cd ClientApp
   npm start
   ```

5. **Start mobile app (new terminal)**
   ```bash
   cd mobile
   flutter run
   ```

### Code Style and Quality
```bash
# Backend code formatting
dotnet format

# Frontend linting
cd ClientApp
npm run lint
npm run format

# Flutter code formatting
cd mobile
flutter format .
flutter analyze
```

### Testing
```bash
# Run all tests
dotnet test

# Run with coverage
dotnet test --collect:"XPlat Code Coverage"

# Frontend tests
cd ClientApp
npm test

# Mobile tests
cd mobile
flutter test
```

## API Development

### Swagger Documentation
- Development: http://localhost:5000/swagger
- Interactive API testing available

### API Health Check
```bash
curl http://localhost:5000/health
```

### SignalR Hub Testing
- Chat Hub: http://localhost:5000/hubs/chat
- Real-time communication testing

## Frontend Development

### Angular CLI Commands
```bash
cd ClientApp

# Generate new component
ng generate component features/cars/components/car-list

# Generate new service
ng generate service core/services/car

# Generate new module
ng generate module features/maintenance --route maintenance --module app.module

# Build for production
ng build --prod

# Run E2E tests
ng e2e
```

### Development URLs
- **Application**: http://localhost:4200
- **API Proxy**: Configured to forward to http://localhost:5000
- **Hot Reload**: Enabled for all file changes

## Mobile Development

### Flutter Commands
```bash
cd mobile

# List connected devices
flutter devices

# Run on specific device
flutter run -d <device-id>

# Run with hot reload
flutter run --hot

# Build APK
flutter build apk --debug
flutter build apk --release

# Build iOS (macOS only)
flutter build ios --debug
flutter build ios --release

# Clean build cache
flutter clean
flutter pub get
```

## Troubleshooting

### Common Issues

#### Docker Services Not Starting
```bash
# Check Docker status
docker system df
docker system prune -f

# Restart Docker service
sudo systemctl restart docker

# Check specific service logs
docker-compose logs postgres
```

#### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill process (Linux/Mac)
kill -9 <PID>

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

#### Database Connection Issues
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Test database connection
docker-compose exec postgres psql -U caruser -d carmaintenance
```

#### Frontend Build Issues
```bash
# Clear npm cache
cd ClientApp
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Clear Angular cache
ng cache clean
```

#### Mobile Build Issues
```bash
# Clean Flutter build
cd mobile
flutter clean
flutter pub get
flutter doctor -v
```

### Getting Help
- Check logs in `logs/` directory
- Review Docker container logs: `docker-compose logs`
- Use debug mode: `dotnet run --verbosity detailed`
- Check GitHub Issues for known problems

### Performance Tips
- Use Docker volumes for database persistence
- Enable Angular production optimizations
- Use Redis caching for better performance
- Monitor memory usage with `docker stats`
- Use `.dockerignore` to reduce build context

---

For more detailed information, see:
- [API Documentation](api-documentation.md)
- [Architecture Documentation](architecture.md)
- [Deployment Guide](deployment-guide.md)