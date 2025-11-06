# CarCommun - Car Maintenance Management System

A comprehensive car maintenance management system built with .NET 9, Angular 20, and Flutter 3.19, featuring predictive maintenance capabilities, real-time notifications, and multi-platform support.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![.NET](https://img.shields.io/badge/.NET-9.0-purple.svg)
![Angular](https://img.shields.io/badge/Angular-20-red.svg)
![Flutter](https://img.shields.io/badge/Flutter-3.19-blue.svg)
![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)

## 🚀 Features

### 🏗️ Architecture
- **Backend**: .NET 9 Web API with Clean Architecture
- **Frontend**: Angular 20 with TypeScript
- **Mobile**: Flutter 3.19 for iOS and Android
- **Database**: PostgreSQL with Entity Framework Core
- **Cache**: Redis for performance optimization
- **Real-time**: SignalR for live updates

### 💡 Core Features
- **Vehicle Management**: Complete car information tracking
- **Maintenance Records**: Detailed maintenance history and scheduling
- **Predictive Maintenance**: AI-powered maintenance predictions
- **Service Center Network**: Integrated service center locations
- **Cost Tracking**: Expense monitoring and reporting
- **User Management**: Role-based access control
- **Real-time Chat**: SignalR-based communication
- **Multi-platform**: Web, iOS, and Android support

### 🔧 Development Features
- **Clean Architecture**: Domain-driven design with separation of concerns
- **Repository Pattern**: Data access abstraction
- **Mediator Pattern**: CQRS implementation with MediatR
- **AutoMapper**: Object-to-object mapping
- **JWT Authentication**: Secure token-based authentication
- **OpenAPI/Swagger**: Interactive API documentation
- **Unit Testing**: Comprehensive test coverage with xUnit
- **Integration Testing**: API endpoint testing

## 🏗️ Project Structure

```
CarCommun/
├── 📁 src/
│   ├── 📁 CarMaintenance.Api/          # .NET 9 Web API
│   │   ├── 📁 Controllers/             # API Controllers
│   │   ├── 📁 DTOs/                    # Data Transfer Objects
│   │   ├── 📁 Middleware/              # Custom Middleware
│   │   ├── 📁 Hubs/                    # SignalR Hubs
│   │   └── 📁 Profiles/                # AutoMapper Profiles
│   ├── 📁 CarMaintenance.Application/  # Application Layer
│   │   ├── 📁 Commands/                # CQRS Commands
│   │   ├── 📁 Queries/                 # CQRS Queries
│   │   └── 📁 Behaviors/               # MediatR Behaviors
│   ├── 📁 CarMaintenance.Domain/       # Domain Layer
│   │   └── 📁 Entities/                # Domain Entities
│   └── 📁 CarMaintenance.Infrastructure/ # Infrastructure Layer
│       └── 📁 Data/                    # Database Context
├── 📁 ClientApp/                       # Angular 20 Frontend
│   ├── 📁 src/
│   │   ├── 📁 app/
│   │   │   ├── 📁 features/            # Feature Modules
│   │   │   ├── 📁 core/                # Core Services
│   │   │   ├── 📁 shared/              # Shared Components
│   │   │   └── 📁 layout/              # Layout Components
│   │   └── 📁 environments/            # Environment Configs
├── 📁 mobile/                          # Flutter 3.19 Mobile App
│   ├── 📁 lib/
│   │   ├── 📁 core/                    # Core Services
│   │   ├── 📁 features/                # Feature Modules
│   │   └── 📁 models/                  # Data Models
├── 📁 tests/                           # Test Projects
│   ├── 📁 CarMaintenance.UnitTests/    # Unit Tests
│   └── 📁 CarMaintenance.IntegrationTests/ # Integration Tests
├── 📁 docs/                            # Documentation
├── 📁 scripts/                         # Development Scripts
├── 🐳 Docker Configuration
├── 📄 docker-compose.yml               # Development Environment
└── 📄 docker-compose.prod.yml          # Production Environment
```

## 🚀 Quick Start

### Prerequisites
- **.NET 9.0 SDK**
- **Node.js 20.x** and **npm**
- **Flutter 3.19.x**
- **Docker** and **Docker Compose**
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/CarCommun.git
cd CarCommun
```

### 2. Setup Development Environment
```bash
# Using the development setup script
./scripts/setup-development.sh

# Or manually with Docker
docker-compose up -d
```

### 3. Access the Applications
- **API**: http://localhost:5000 (Swagger UI at /swagger)
- **Frontend**: http://localhost:4200
- **Database**: localhost:5432 (pgAdmin: http://localhost:8080)
- **Mail Testing**: http://localhost:8025 (MailHog)
- **Redis**: localhost:6379

## 🐳 Docker Usage

### Development Environment
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild containers
docker-compose up -d --build
```

### Production Environment
```bash
# Set environment variables
export POSTGRES_PASSWORD="your-secure-password"
export JWT_SECRET_KEY="your-jwt-secret"
export REDIS_PASSWORD="your-redis-password"

# Start production environment
docker-compose -f docker-compose.prod.yml up -d
```

## 🛠️ Development

### Backend Development (.NET 9)
```bash
# Restore dependencies
dotnet restore

# Run the API
dotnet run --project src/CarMaintenance.Api

# Run with hot reload
dotnet watch run --project src/CarMaintenance.Api

# Run tests
dotnet test

# Run tests with coverage
dotnet test --collect:"XPlat Code Coverage"
```

### Frontend Development (Angular 20)
```bash
# Navigate to client app
cd ClientApp

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build:prod

# Run tests
npm test

# Run linting
npm run lint
```

### Mobile Development (Flutter 3.19)
```bash
# Navigate to mobile app
cd mobile

# Get dependencies
flutter pub get

# Run on connected device
flutter run

# Build APK
flutter build apk --release

# Build for iOS
flutter build ios --release
```

## 📚 API Documentation

The API follows OpenAPI 3.0 specification and includes:

- **Swagger UI**: Interactive API documentation at `/swagger`
- **ReDoc**: Alternative documentation viewer at `/redoc`
- **OpenAPI JSON**: Machine-readable specification at `/swagger/v1/swagger.json`

### Key API Endpoints
- **Authentication**: `/api/auth/*`
- **Vehicles**: `/api/cars/*`
- **Maintenance**: `/api/maintenance/*`
- **Users**: `/api/users/*`
- **Service Centers**: `/api/service-centers/*`

## 🧪 Testing

### Test Structure
- **Unit Tests**: Isolated component testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: End-to-end user workflow testing

### Running Tests
```bash
# Run all tests
dotnet test

# Run with coverage report
dotnet test --collect:"XPlat Code Coverage" -- DataCollectionRunSettings.DataCollectors.DataCollector.Configuration.Format=opencover

# Run specific test project
dotnet test tests/CarMaintenance.UnitTests/

# Frontend tests
cd ClientApp && npm test

# Mobile tests
cd mobile && flutter test
```

## 🚀 Deployment

### Production Deployment
1. **Build Docker Images**: Use CI/CD pipeline or manual build
2. **Deploy to Production**: Use production docker-compose or Kubernetes
3. **Configure Environment**: Set production environment variables
4. **Database Migration**: Run EF Core migrations
5. **SSL Certificate**: Configure HTTPS with valid certificates

### Environment Variables
```bash
# Database
POSTGRES_PASSWORD=secure_password
POSTGRES_USER=carmaintenance_user

# Authentication
JWT_SECRET_KEY=your-jwt-secret-key

# Redis
REDIS_PASSWORD=redis_password

# Storage (Optional)
AZURE_STORAGE_CONNECTION_STRING=your-connection-string

# Monitoring (Optional)
APPLICATIONINSIGHTS_CONNECTION_STRING=your-key
```

## 🔒 Security

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Granular permission system
- **HTTPS Enforcement**: SSL/TLS encryption
- **CORS Configuration**: Cross-origin request protection
- **Security Headers**: XSS, CSRF, and clickjacking protection
- **Input Validation**: Request data validation
- **Rate Limiting**: API request throttling

## 📊 Monitoring & Logging

- **Application Insights**: Azure monitoring integration
- **Serilog**: Structured logging
- **Health Checks**: API and dependency monitoring
- **Performance Metrics**: Response time and throughput tracking

## 🤝 Contributing

1. **Fork the Repository**
2. **Create Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Commit Changes**: `git commit -m 'Add amazing feature'`
4. **Push to Branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Development Guidelines
- Follow Clean Architecture principles
- Write comprehensive tests
- Update documentation
- Follow coding standards
- Use conventional commits

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.txt) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Report bugs or request features via GitHub Issues
- **Discussions**: Join the community discussions
- **Email**: Contact the maintainers

## 🎯 Roadmap

- [ ] **Mobile App**: Complete Flutter mobile application
- [ ] **Advanced Analytics**: Machine learning for maintenance predictions
- [ ] **Service Integration**: Direct service center integration
- [ ] **Multi-language**: Internationalization support
- [ ] **Offline Support**: Progressive Web App capabilities
- [ ] **IoT Integration**: Vehicle sensor data integration

---

**Built with ❤️ by the CarCommun Team**