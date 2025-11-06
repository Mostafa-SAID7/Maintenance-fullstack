# Architecture Documentation

This document outlines the architecture, design patterns, and technical decisions for the CarCommun car maintenance management system.

## Table of Contents
- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Clean Architecture](#clean-architecture)
- [Design Patterns](#design-patterns)
- [Data Flow](#data-flow)
- [Security Architecture](#security-architecture)
- [Scalability Considerations](#scalability-considerations)
- [Performance Optimization](#performance-optimization)
- [Development Guidelines](#development-guidelines)

## Overview

CarCommun is a comprehensive car maintenance management system built using modern technologies and clean architecture principles. The system provides a complete solution for tracking vehicle maintenance, predictive analytics, and multi-platform access.

### Key Features
- **Multi-platform**: Web (Angular), iOS & Android (Flutter)
- **Real-time communication**: SignalR for live updates
- **Predictive maintenance**: ML-powered maintenance predictions
- **Scalable architecture**: Microservices-ready design
- **Security-first**: JWT authentication and role-based access

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                        │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Angular Web   │  Flutter iOS    │    Flutter Android      │
│   (Port 4200)   │   (Mobile)      │      (Mobile)           │
└─────────────────┴─────────────────┴─────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (Nginx)                       │
│                  (Port 80/443)                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                          │
├─────────────────┬─────────────────┬─────────────────────────┤
│   .NET API      │   SignalR Hub   │    Health Checks       │
│  (Port 5000)    │   (WebSocket)   │    (Monitoring)        │
└─────────────────┴─────────────────┴─────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Business Logic Layer                        │
├─────────────────┬─────────────────┬─────────────────────────┤
│     CQRS        │   MediatR       │    AutoMapper           │
│   (Commands/    │   (Behaviors)   │    (DTO Mapping)        │
│    Queries)     │                 │                         │
└─────────────────┴─────────────────┴─────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Access Layer                          │
├─────────────────┬─────────────────┬─────────────────────────┤
│  Entity Framework│    Repository   │     In-Memory Cache    │
│      Core        │     Pattern     │     (Redis)            │
└─────────────────┴─────────────────┴─────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Infrastructure                            │
├─────────────────┬─────────────────┬─────────────────────────┤
│   PostgreSQL    │     Redis       │     Azure Storage      │
│   (Database)    │   (Cache)       │    (File Storage)      │
└─────────────────┴─────────────────┴─────────────────────────┘
```

## Technology Stack

### Backend (.NET 9)
- **Framework**: ASP.NET Core 9.0
- **ORM**: Entity Framework Core
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Authentication**: JWT + Identity
- **Real-time**: SignalR
- **API Documentation**: Swagger/OpenAPI 3.0
- **Testing**: xUnit, Moq, FluentAssertions
- **Logging**: Serilog
- **Validation**: FluentValidation

### Frontend (Angular 20)
- **Framework**: Angular 20 with TypeScript
- **State Management**: NgRx (optional)
- **HTTP Client**: HttpClient with interceptors
- **UI Components**: Angular Material / Custom components
- **Routing**: Angular Router
- **Build Tool**: Webpack (Angular CLI)
- **Testing**: Jasmine, Karma, Cypress

### Mobile (Flutter 3.19)
- **Framework**: Flutter 3.19
- **Language**: Dart
- **State Management**: Provider / Bloc
- **HTTP Client**: Dio
- **Local Storage**: SharedPreferences / SQLite
- **Real-time**: WebSocket connections
- **Testing**: Flutter Test

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Orchestration**: Kubernetes (optional)
- **Load Balancer**: Nginx
- **CI/CD**: GitHub Actions
- **Cloud**: Azure / AWS / Google Cloud
- **Monitoring**: Application Insights / Grafana

## Clean Architecture

The project follows Clean Architecture principles with clear separation of concerns:

### Project Structure
```
src/
├── CarMaintenance.Api/          # Web API Layer
│   ├── Controllers/            # API Controllers
│   ├── DTOs/                   # Data Transfer Objects
│   ├── Middleware/             # Custom Middleware
│   ├── Hubs/                   # SignalR Hubs
│   └── Profiles/               # AutoMapper Profiles
├── CarMaintenance.Application/ # Application Layer
│   ├── Commands/               # CQRS Commands
│   ├── Queries/                # CQRS Queries
│   ├── Behaviors/              # MediatR Behaviors
│   └── Validators/             # FluentValidation
├── CarMaintenance.Domain/      # Domain Layer
│   ├── Entities/               # Domain Entities
│   ├── Interfaces/             # Domain Interfaces
│   ├── ValueObjects/           # Value Objects
│   └── Events/                 # Domain Events
└── CarMaintenance.Infrastructure/ # Infrastructure Layer
    ├── Data/                   # Database Context
    ├── Repositories/           # Repository Implementations
    ├── Services/               # External Services
    └── Configuration/          # Configuration Classes
```

### Layer Dependencies
```
┌─────────────────────────────────────┐
│           Presentation Layer         │  (Web API)
├─────────────────────────────────────┤
│          Application Layer           │  (Commands/Queries)
├─────────────────────────────────────┤
│            Domain Layer              │  (Business Logic)
├─────────────────────────────────────┤
│        Infrastructure Layer          │  (External Concerns)
└─────────────────────────────────────┘
```

## Design Patterns

### 1. Clean Architecture
- **Separation of concerns**: Each layer has a specific responsibility
- **Dependency Inversion**: Dependencies flow inward toward the domain
- **Testability**: Business logic can be tested without external dependencies

### 2. Repository Pattern
```csharp
// Interface
public interface IRepository<T> where T : BaseEntity
{
    Task<T> GetByIdAsync(int id);
    Task<IEnumerable<T>> GetAllAsync();
    Task<T> AddAsync(T entity);
    Task<T> UpdateAsync(T entity);
    Task DeleteAsync(int id);
}

// Implementation
public class Repository<T> : IRepository<T> where T : BaseEntity
{
    private readonly AppDbContext _context;
    private readonly DbSet<T> _dbSet;
    
    public async Task<T> GetByIdAsync(int id)
    {
        return await _dbSet.FindAsync(id);
    }
}
```

### 3. CQRS (Command Query Responsibility Segregation)
```csharp
// Command
public class CreateCarCommand : IRequest<int>
{
    public string Make { get; set; }
    public string Model { get; set; }
    public int Year { get; set; }
}

// Command Handler
public class CreateCarCommandHandler : IRequestHandler<CreateCarCommand, int>
{
    private readonly ICarService _carService;
    
    public async Task<int> Handle(CreateCarCommand request)
    {
        var car = new Car(request.Make, request.Model, request.Year);
        return await _carService.CreateCarAsync(car);
    }
}
```

### 4. Mediator Pattern
```csharp
// MediatR Pipeline
public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;
    
    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next)
    {
        var context = new ValidationContext<TRequest>(request);
        var failures = _validators
            .Select(v => v.Validate(context))
            .SelectMany(result => result.Errors)
            .Where(f => f != null)
            .ToList();
        
        if (failures.Any())
            throw new ValidationException(failures);
        
        return await next();
    }
}
```

### 5. Factory Pattern
```csharp
public interface IMaintenanceRecordFactory
{
    MaintenanceRecord Create(Car car, ServiceType serviceType, DateTime date);
}

public class MaintenanceRecordFactory : IMaintenanceRecordFactory
{
    public MaintenanceRecord Create(Car car, ServiceType serviceType, DateTime date)
    {
        return new MaintenanceRecord
        {
            CarId = car.Id,
            ServiceTypeId = serviceType.Id,
            ServiceDate = date,
            Status = MaintenanceStatus.Scheduled
        };
    }
}
```

## Data Flow

### Request Flow
```
Client Request
    ↓
API Controller
    ↓
MediatR Command/Query
    ↓
Validation Behavior
    ↓
Authentication/Authorization
    ↓
Handler (Business Logic)
    ↓
Repository
    ↓
Database
    ↓
Response
    ↓
Mapping (AutoMapper)
    ↓
DTO
    ↓
Client
```

### Real-time Communication
```
Client
    ↓
SignalR Hub
    ↓
Background Service
    ↓
Database Changes
    ↓
Domain Events
    ↓
Hub Context
    ↓
Connected Clients
```

## Security Architecture

### Authentication Flow
```
User Login
    ↓
Credentials Validation
    ↓
JWT Token Generation
    ↓
Token Storage (Client)
    ↓
API Request with Token
    ↓
Token Validation
    ↓
User Authorization
    ↓
Resource Access
```

### Security Layers
1. **Transport Security**: HTTPS/TLS 1.3
2. **API Security**: JWT tokens with short expiration
3. **Authorization**: Role-based access control (RBAC)
4. **Data Validation**: Input sanitization and validation
5. **CORS**: Cross-origin request policy
6. **Security Headers**: XSS, CSRF protection

### Data Protection
- **Encryption at rest**: Database encryption
- **Encryption in transit**: HTTPS only
- **Password hashing**: BCrypt with salt
- **Sensitive data**: Environment variables

## Scalability Considerations

### Horizontal Scaling
- **Stateless API**: No session state in application
- **Load balancing**: Nginx reverse proxy
- **Database scaling**: Read replicas, connection pooling
- **Caching strategy**: Redis for session and data caching

### Vertical Scaling
- **Resource optimization**: Efficient memory usage
- **Async operations**: Non-blocking I/O operations
- **Lazy loading**: On-demand data loading
- **Caching layers**: Multi-level caching strategy

### Microservices Readiness
- **Service boundaries**: Clear domain boundaries
- **Database per service**: Separate databases
- **API gateway**: Centralized API management
- **Service discovery**: Consul/Eureka (future)

## Performance Optimization

### Database Optimization
- **Indexing**: Proper database indexes
- **Query optimization**: Efficient LINQ queries
- **Connection pooling**: Entity Framework connection management
- **Read replicas**: Separate read and write operations

### Caching Strategy
```
Client Cache (Browser) → CDN → Redis Cache → Database
```

### API Optimization
- **Response compression**: Gzip compression
- **Pagination**: Large dataset handling
- **Efficient serialization**: System.Text.Json
- **Async/await**: Non-blocking operations

### Frontend Optimization
- **Lazy loading**: Route-based code splitting
- **AOT compilation**: Ahead-of-time compilation
- **Tree shaking**: Unused code elimination
- **Service workers**: Offline capabilities

## Development Guidelines

### Code Organization
- **SOLID Principles**: Single responsibility, open/closed
- **DRY (Don't Repeat Yourself)**: Code reusability
- **KISS (Keep It Simple, Stupid)**: Simplicity over complexity
- **YAGNI (You Aren't Gonna Need It)**: Feature-driven development

### Naming Conventions
- **C#**: PascalCase for classes/methods, camelCase for variables
- **TypeScript**: camelCase for variables/functions, PascalCase for classes
- **Dart**: camelCase for variables/functions, PascalCase for classes
- **Database**: snake_case for tables/columns

### Testing Strategy
- **Unit Tests**: Business logic testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: User workflow testing
- **Performance Tests**: Load and stress testing

### Error Handling
- **Global exception handling**: Custom middleware
- **Logging**: Structured logging with Serilog
- **Monitoring**: Application Insights integration
- **Graceful degradation**: Fallback mechanisms

### API Design Principles
- **RESTful**: HTTP verbs and status codes
- **Consistency**: Uniform response format
- **Documentation**: OpenAPI/Swagger specification
- **Versioning**: URL versioning strategy

---

This architecture provides a solid foundation for building a scalable, maintainable, and secure car maintenance management system. The clean architecture ensures that the business logic remains independent of external concerns, making the system robust and testable.