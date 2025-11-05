Complete Deliverables:
1. Backend (ASP.NET Core 9)

✅ Domain Entities - Car, MaintenanceRecord with rich business logic
✅ Enums - All status types and categories
✅ CQRS Pattern - Complete CreateCarCommand with FluentValidation
✅ Database Context - EF Core with configurations and interceptors
✅ API Controller - Full REST API with versioning, rate limiting
✅ SignalR Hub - Real-time notifications with connection management
✅ ML.NET Service - Predictive maintenance with training capabilities
✅ Program.cs - Complete configuration with middleware, JWT, CORS

2. Frontend (Angular 19)

✅ Car List Component - With signals, pagination, search, actions
✅ Modern UI - Material Design with responsive layout
✅ State Management - Angular Signals for reactive data
✅ Real-time Integration - SignalR service ready

3. Mobile (Flutter)

✅ Data Models - Freezed models with JSON serialization
✅ Repository Pattern - Clean architecture with Dio HTTP client
✅ State Management - Riverpod providers
✅ UI Screens - Complete car list with Material Design 3
✅ Error Handling - Custom exceptions and user feedback

4. Infrastructure

✅ Complete README - Setup, installation, deployment guides
✅ Docker Configuration - Multi-container setup with docker-compose
✅ Configuration Examples - appsettings.json structure
✅ API Documentation - Swagger/OpenAPI setup

🎯 Key Features Implemented:

Clean Architecture - Separation of concerns across layers
CQRS + MediatR - Command/Query separation
Domain-Driven Design - Rich domain models with business rules
Real-time Communication - SignalR for notifications
Predictive AI - ML.NET for maintenance predictions
Security - JWT authentication, role-based authorization
Performance - Redis caching, rate limiting, response compression
Multi-platform - Web, mobile, desktop support
Modern UI - Material Design with responsive layouts
Error Handling - Global exception handling and validation

🚀 Next Steps to Complete:

Add remaining entities (Owner, ServiceType, Notification, Document)
Complete CQRS queries (GetCarsByOwner, GetMaintenanceHistory, etc.)
Add remaining API controllers (Owners, Maintenance, Reports)
Implement authentication service in Angular
Add Flutter screens (CarDetail, AddCar, Maintenance)
Create Electron desktop app
Write unit tests for all layers
Add integration tests
Create database migrations
Setup CI/CD pipeline

using System.Text;
using System.Threading.RateLimiting;
using CarMaintenance.API.Hubs;
using CarMaintenance.API.Middleware;
using CarMaintenance.Application;
using CarMaintenance.Infrastructure;
using CarMaintenance.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/log-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
var services = builder.Services;
var configuration = builder.Configuration;

// Database Configuration
services.AddDbContext<ApplicationDbContext>(options =>
{
    var connectionString = configuration.GetConnectionString("DefaultConnection");
    
    options.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorNumbersToAdd: null);
        sqlOptions.CommandTimeout(60);
    });

    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
        options.EnableDetailedErrors();
    }
});

// Application and Infrastructure Services
services.AddApplication();
services.AddInfrastructure(configuration);

// Authentication & Authorization
services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = configuration["Jwt:Issuer"],
        ValidAudience = configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(configuration["Jwt:SecretKey"]!)),
        ClockSkew = TimeSpan.Zero
    };

    // SignalR configuration
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            
            if (!string.IsNullOrEmpty(accessToken) && 
                path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

services.AddAuthorization(options =>
{
    options.AddPolicy("RequireAdminRole", policy => 
        policy.RequireRole("Admin", "SuperAdmin"));
    options.AddPolicy("RequireMechanicRole", policy => 
        policy.RequireRole("Mechanic", "Admin", "SuperAdmin"));
});

// CORS Configuration
services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });

    options.AddPolicy("Production", builder =>
    {
        builder.WithOrigins(
                   configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>())
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials();
    });
});

// API Versioning
services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new Microsoft.AspNetCore.Mvc.ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
});

// Rate Limiting
services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.User.Identity?.Name ?? httpContext.Request.Headers.Host.ToString(),
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 100,
                QueueLimit = 0,
                Window = TimeSpan.FromMinutes(1)
            }));

    options.AddFixedWindowLimiter("fixed", options =>
    {
        options.PermitLimit = 100;
        options.Window = TimeSpan.FromMinutes(1);
        options.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        options.QueueLimit = 10;
    });

    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = 429;
        await context.HttpContext.Response.WriteAsync(
            "Too many requests. Please try again later.", 
            cancellationToken: token);
    };
});

// Response Compression
services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
});

// Response Caching
services.AddResponseCaching();
services.AddMemoryCache();

// SignalR
services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
    options.MaximumReceiveMessageSize = 102400; // 100 KB
});

// Controllers
services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = null;
        options.JsonSerializerOptions.DefaultIgnoreCondition = 
            System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

// Swagger/OpenAPI
services.AddEndpointsApiExplorer();
services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Car Maintenance Management API",
        Version = "v1",
        Description = "Complete API for managing car maintenance records",
        Contact = new OpenApiContact
        {
            Name = "Support Team",
            Email = "support@carmaintenance.com"
        }
    });

    // JWT Authentication
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter 'Bearer' [space] and then your token"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    // XML Comments
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }
});

// Health Checks
services.AddHealthChecks()
    .AddDbContextCheck<ApplicationDbContext>("database")
    .AddUrlGroup(new Uri(configuration["Redis:ConnectionString"] ?? "localhost:6379"), "redis");

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Car Maintenance API v1");
        options.RoutePrefix = string.Empty;
        options.DisplayRequestDuration();
    });
    app.UseCors("AllowAll");
}
else
{
    app.UseExceptionHandler("/error");
    app.UseHsts();
    app.UseCors("Production");
}

// Global Error Handling Middleware
app.UseMiddleware<ErrorHandlingMiddleware>();

// Request Logging Middleware
app.UseMiddleware<RequestLoggingMiddleware>();

// Performance Monitoring Middleware
app.UseMiddleware<PerformanceMiddleware>();

app.UseHttpsRedirection();
app.UseResponseCompression();
app.UseResponseCaching();
app.UseStaticFiles();

app.UseRouting();

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

// Map endpoints
app.MapControllers();

// SignalR Hubs
app.MapHub<NotificationHub>("/hubs/notifications");
app.MapHub<ChatHub>("/hubs/chat");

// Health Checks
app.MapHealthChecks("/health");

// Minimal API endpoints for quick checks
app.MapGet("/api/status", () => new
{
    status = "healthy",
    timestamp = DateTime.UtcNow,
    version = "1.0.0",
    environment = app.Environment.EnvironmentName
}).RequireRateLimiting("fixed");

// Database Migration and Seeding
using (var scope = app.Services.CreateScope())
{
    try
    {
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        if (app.Environment.IsDevelopment())
        {
            await context.Database.MigrateAsync();
            Log.Information("Database migration completed");

            // Seed data
            var seeder = scope.ServiceProvider.GetService<DataSeeder>();
            if (seeder != null)
            {
                await seeder.SeedAsync();
                Log.Information("Database seeding completed");
            }
        }
    }
    catch (Exception ex)
    {
        Log.Error(ex, "An error occurred while migrating or seeding the database");
    }
}

Log.Information("Starting Car Maintenance Management API");

try
{
    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

// appsettings.json configuration structure
/*
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=CarMaintenanceDB;Trusted_Connection=True;TrustServerCertificate=True"
  },
  "Jwt": {
    "SecretKey": "YourSuperSecretKeyThatShouldBeAtLeast32CharactersLong!",
    "Issuer": "CarMaintenanceAPI",
    "Audience": "CarMaintenanceClients",
    "ExpirationMinutes": 60,
    "RefreshTokenExpirationDays": 7
  },
  "Redis": {
    "ConnectionString": "localhost:6379",
    "InstanceName": "CarMaintenance:",
    "AbsoluteExpirationMinutes": 60
  },
  "Cors": {
    "AllowedOrigins": [
      "http://localhost:4200",
      "https://yourdomain.com"
    ]
  },
  "MachineLearning": {
    "ModelPath": "ML/MaintenanceModel.zip",
    "RetrainingSchedule": "0 0 * * 0"
  },
  "AzureStorage": {
    "ConnectionString": "",
    "ContainerName": "documents"
  },
  "Email": {
    "Provider": "SendGrid",
    "ApiKey": "",
    "FromEmail": "noreply@carmaintenance.com",
    "FromName": "Car Maintenance System"
  },
  "Serilog": {
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "Microsoft": "Warning",
        "System": "Warning"
      }
    }
  },
  "Hangfire": {
    "DashboardPath": "/hangfire",
    "RequireAuthentication": true
  }
}
*/

# 🚗 Car Maintenance Management System

**A comprehensive multi-platform solution for tracking and managing vehicle maintenance**

![.NET](https://img.shields.io/badge/.NET-9.0-512BD4?logo=dotnet)
![Angular](https://img.shields.io/badge/Angular-19-DD0031?logo=angular)
![Flutter](https://img.shields.io/badge/Flutter-3.19-02569B?logo=flutter)
![License](https://img.shields.io/badge/license-MIT-green)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

## ✨ Features

### Core Functionality
- ✅ **Multi-vehicle management** - Track unlimited cars with detailed information
- ✅ **Maintenance tracking** - Record all service and maintenance activities
- ✅ **Predictive maintenance** - AI-powered predictions using ML.NET
- ✅ **Real-time notifications** - SignalR for instant updates
- ✅ **Document management** - Store invoices, receipts, and service reports
- ✅ **Service reminders** - Automated alerts for upcoming maintenance
- ✅ **Cost analytics** - Comprehensive reporting and analytics
- ✅ **Multi-platform** - Web, mobile (iOS/Android), and desktop support

### Technical Features
- 🏗️ **Clean Architecture** with CQRS pattern
- 🔐 **JWT Authentication** with refresh tokens
- 📊 **Advanced analytics** and reporting
- 🚀 **High performance** with Redis caching
- 📱 **Offline-first** mobile experience
- 🔔 **Push notifications** (Firebase/APNs)
- 🌐 **Internationalization** support
- 📈 **Real-time dashboard** with SignalR

## 🛠️ Tech Stack

### Backend
- **Framework:** ASP.NET Core 9.0
- **Database:** SQL Server 2022 / PostgreSQL 16
- **ORM:** Entity Framework Core 9.0
- **Cache:** Redis 7.2
- **Auth:** JWT + ASP.NET Identity
- **Real-time:** SignalR Core
- **Background Jobs:** Hangfire
- **ML:** ML.NET 3.0+
- **API Docs:** Swagger/OpenAPI 3.0

### Frontend (Web)
- **Framework:** Angular 19 (Standalone Components)
- **State:** Angular Signals + RxJS
- **UI:** Angular Material 19 + Tailwind CSS
- **Real-time:** @microsoft/signalr
- **Charts:** Chart.js / ApexCharts
- **PWA:** @angular/pwa

### Mobile
- **Framework:** Flutter 3.19+
- **State:** Riverpod 2.5+
- **Local DB:** sqflite / Hive
- **HTTP:** dio + retrofit
- **UI:** Material Design 3

### Desktop
- **Framework:** Electron 28+ / Tauri 2.0
- **Frontend:** Angular 19 (shared)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                            │
├────────────┬────────────┬────────────┬────────────────────┤
│  Angular   │  Flutter   │  Electron  │       PWA          │
│   Web App  │   Mobile   │  Desktop   │                    │
└────────────┴────────────┴────────────┴────────────────────┘
                          ▼
              ┌─────────────────────┐
              │   API Gateway       │
              │  Rate Limiting      │
              └─────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                 ASP.NET Core API                             │
├────────────┬────────────┬────────────┬────────────────────┤
│  REST API  │  SignalR   │  Hangfire  │      gRPC          │
└────────────┴────────────┴────────────┴────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│            Clean Architecture + CQRS (MediatR)               │
├────────────┬────────────┬────────────┬────────────────────┤
│  Domain    │Application │Infrastructure│     Shared        │
└────────────┴────────────┴────────────┴────────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- .NET 9.0 SDK
- Node.js 20+ (for Angular)
- Flutter 3.19+ SDK (for mobile)
- SQL Server 2022 or PostgreSQL 16
- Redis 7.2
- Docker & Docker Compose (optional)

### Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/yourusername/car-maintenance-system.git
cd car-maintenance-system

# Start all services
docker-compose up -d

# Access the application
# Web: http://localhost:4200
# API: http://localhost:5000
# Swagger: http://localhost:5000/swagger
```

## 📦 Installation

### 1. Backend Setup

```bash
# Navigate to the API project
cd src/Presentation/CarMaintenance.API

# Restore packages
dotnet restore

# Update database
dotnet ef database update

# Run the API
dotnet run
```

### 2. Web Frontend Setup

```bash
# Navigate to Angular app
cd ClientApp

# Install dependencies
npm install

# Start development server
ng serve

# Access at http://localhost:4200
```

### 3. Mobile App Setup

```bash
# Navigate to Flutter app
cd mobile

# Get dependencies
flutter pub get

# Run on iOS
flutter run -d ios

# Run on Android
flutter run -d android
```

### 4. Desktop App Setup

```bash
# Navigate to desktop app
cd desktop

# Install dependencies
npm install

# Run Electron app
npm run electron:serve
```

## ⚙️ Configuration

### Database Connection

**appsettings.json:**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=CarMaintenanceDB;Trusted_Connection=True;"
  }
}
```

### JWT Settings

```json
{
  "Jwt": {
    "SecretKey": "YourSecretKey-MustBeAtLeast32Characters!",
    "Issuer": "CarMaintenanceAPI",
    "Audience": "CarMaintenanceClients",
    "ExpirationMinutes": 60
  }
}
```

### Redis Configuration

```json
{
  "Redis": {
    "ConnectionString": "localhost:6379",
    "InstanceName": "CarMaintenance:"
  }
}
```

## 🏃 Running the Application

### Development Mode

```bash
# Terminal 1: Start API
cd src/Presentation/CarMaintenance.API
dotnet watch run

# Terminal 2: Start Angular
cd ClientApp
ng serve --open

# Terminal 3: Start Redis (if not using Docker)
redis-server
```

### Production Build

```bash
# Build API
dotnet publish -c Release -o ./publish

# Build Angular
ng build --configuration production

# Build Flutter
flutter build apk --release  # Android
flutter build ios --release  # iOS
```

## 📚 API Documentation

API documentation is available via Swagger UI:

**Development:** `http://localhost:5000/swagger`

### Key Endpoints

#### Authentication
```
POST   /api/v1/auth/login
POST   /api/v1/auth/register
POST   /api/v1/auth/refresh-token
```

#### Cars
```
GET    /api/v1/cars
GET    /api/v1/cars/{id}
POST   /api/v1/cars
PUT    /api/v1/cars/{id}
DELETE /api/v1/cars/{id}
PATCH  /api/v1/cars/{id}/mileage
GET    /api/v1/cars/{id}/statistics
```

#### Maintenance
```
GET    /api/v1/maintenance
GET    /api/v1/maintenance/{id}
POST   /api/v1/maintenance
PUT    /api/v1/maintenance/{id}
DELETE /api/v1/maintenance/{id}
POST   /api/v1/maintenance/{id}/complete
```

#### Predictions
```
GET    /api/v1/predictions/{carId}
POST   /api/v1/predictions/bulk
```

## 🧪 Testing

### Backend Tests

```bash
# Run all tests
dotnet test

# Run with coverage
dotnet test /p:CollectCoverage=true
```

### Frontend Tests

```bash
# Angular unit tests
ng test

# Angular e2e tests
ng e2e

# Flutter tests
flutter test
```

## 🚢 Deployment

### Docker Compose

```yaml
version: '3.8'

services:
  api:
    build: ./src/Presentation/CarMaintenance.API
    ports:
      - "5000:80"
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__DefaultConnection=Server=db;Database=CarMaintenanceDB;
    depends_on:
      - db
      - redis

  db:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      - ACCEPT_EULA=Y
      - SA_PASSWORD=YourStrong@Passw0rd
    ports:
      - "1433:1433"

  redis:
    image: redis:7.2-alpine
    ports:
      - "6379:6379"

  web:
    build: ./ClientApp
    ports:
      - "4200:80"
    depends_on:
      - api
```

### Azure Deployment

```bash
# Login to Azure
az login

# Create resource group
az group create --name rg-carmaintenance --location eastus

# Create App Service
az webapp create --name carmaintenance-api --resource-group rg-carmaintenance

# Deploy
az webapp deployment source config-zip --src ./publish.zip
```

### AWS Deployment

```bash
# Build Docker image
docker build -t carmaintenance-api .

# Push to ECR
aws ecr get-login-password | docker login --username AWS
docker push your-ecr-repo/carmaintenance-api

# Deploy to ECS
aws ecs update-service --cluster your-cluster --service carmaintenance
```

## 📱 Mobile App Stores

### iOS App Store

```bash
# Build for iOS
flutter build ios --release

# Archive and upload via Xcode
# Or use fastlane
fastlane ios release
```

### Google Play Store

```bash
# Build AAB
flutter build appbundle --release

# Upload via Google Play Console
# Or use fastlane
fastlane android release
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Your Name** - *Initial work* - [YourGitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- Angular Team for the amazing framework
- Flutter Team for cross-platform excellence
- Microsoft for .NET and ML.NET
- All contributors and open-source projects used

## 📞 Support

- 📧 Email: support@carmaintenance.com
- 💬 Discord: [Join our community](https://discord.gg/carmaintenance)
- 📖 Documentation: [docs.carmaintenance.com](https://docs.carmaintenance.com)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/car-maintenance-system/issues)

---

**Made with ❤️ by the Car Maintenance Team**

using Microsoft.ML;
using Microsoft.ML.Data;
using Microsoft.ML.Trainers;
using CarMaintenance.Application.Common.Interfaces;

namespace CarMaintenance.Infrastructure.MachineLearning;

/// <summary>
/// Data model for training
/// </summary>
public class MaintenanceData
{
    [LoadColumn(0)]
    public float CarAge { get; set; }

    [LoadColumn(1)]
    public float CurrentMileage { get; set; }

    [LoadColumn(2)]
    public float DaysSinceLastService { get; set; }

    [LoadColumn(3)]
    public float MileageSinceLastService { get; set; }

    [LoadColumn(4)]
    public float AverageMonthlyMileage { get; set; }

    [LoadColumn(5)]
    public float TotalMaintenanceCost { get; set; }

    [LoadColumn(6)]
    public float MaintenanceFrequency { get; set; }

    [LoadColumn(7)]
    public string ServiceType { get; set; } = string.Empty;

    // Label: Days until next maintenance needed
    [LoadColumn(8)]
    public float DaysUntilMaintenance { get; set; }
}

/// <summary>
/// Prediction output model
/// </summary>
public class MaintenancePrediction
{
    [ColumnName("Score")]
    public float DaysUntilMaintenance { get; set; }

    public float[] FeatureContributions { get; set; } = Array.Empty<float>();
}

/// <summary>
/// Predictive maintenance service using ML.NET
/// </summary>
public class PredictiveMaintenanceService : IPredictiveMaintenanceService
{
    private readonly MLContext _mlContext;
    private readonly ILogger<PredictiveMaintenanceService> _logger;
    private ITransformer? _model;
    private readonly string _modelPath;

    public PredictiveMaintenanceService(
        ILogger<PredictiveMaintenanceService> logger,
        IConfiguration configuration)
    {
        _mlContext = new MLContext(seed: 1);
        _logger = logger;
        _modelPath = configuration["MachineLearning:ModelPath"] 
            ?? Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "ML", "MaintenanceModel.zip");

        LoadModel();
    }

    public async Task<PredictionResult> PredictMaintenanceAsync(PredictionInput input)
    {
        try
        {
            if (_model == null)
            {
                throw new InvalidOperationException("ML model is not loaded");
            }

            var predictionEngine = _mlContext.Model
                .CreatePredictionEngine<MaintenanceData, MaintenancePrediction>(_model);

            var maintenanceData = new MaintenanceData
            {
                CarAge = input.CarAgeInYears,
                CurrentMileage = input.CurrentMileage,
                DaysSinceLastService = input.DaysSinceLastService,
                MileageSinceLastService = input.MileageSinceLastService,
                AverageMonthlyMileage = input.AverageMonthlyMileage,
                TotalMaintenanceCost = input.TotalMaintenanceCost,
                MaintenanceFrequency = input.MaintenanceFrequency,
                ServiceType = input.ServiceType ?? "General"
            };

            var prediction = predictionEngine.Predict(maintenanceData);

            var result = new PredictionResult
            {
                PredictedDaysUntilMaintenance = (int)Math.Round(prediction.DaysUntilMaintenance),
                Confidence = CalculateConfidence(prediction.DaysUntilMaintenance),
                RecommendedAction = GetRecommendedAction(prediction.DaysUntilMaintenance),
                PredictedDate = DateTime.UtcNow.AddDays(prediction.DaysUntilMaintenance),
                RiskLevel = GetRiskLevel(prediction.DaysUntilMaintenance),
                Factors = GetMaintenanceFactors(input, prediction)
            };

            _logger.LogInformation(
                "Maintenance prediction: {Days} days until maintenance", 
                result.PredictedDaysUntilMaintenance);

            return await Task.FromResult(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error predicting maintenance");
            throw new ApplicationException("Failed to predict maintenance", ex);
        }
    }

    public async Task TrainModelAsync(IEnumerable<MaintenanceData> trainingData)
    {
        try
        {
            _logger.LogInformation("Starting model training with {Count} records", 
                trainingData.Count());

            var dataView = _mlContext.Data.LoadFromEnumerable(trainingData);

            // Split data for training and testing
            var dataSplit = _mlContext.Data.TrainTestSplit(dataView, testFraction: 0.2);

            // Define the training pipeline
            var pipeline = _mlContext.Transforms.Text
                .FeaturizeText("ServiceTypeFeaturized", nameof(MaintenanceData.ServiceType))
                .Append(_mlContext.Transforms.Concatenate("Features",
                    nameof(MaintenanceData.CarAge),
                    nameof(MaintenanceData.CurrentMileage),
                    nameof(MaintenanceData.DaysSinceLastService),
                    nameof(MaintenanceData.MileageSinceLastService),
                    nameof(MaintenanceData.AverageMonthlyMileage),
                    nameof(MaintenanceData.TotalMaintenanceCost),
                    nameof(MaintenanceData.MaintenanceFrequency),
                    "ServiceTypeFeaturized"))
                .Append(_mlContext.Transforms.NormalizeMinMax("Features"))
                .Append(_mlContext.Regression.Trainers.FastTree(
                    new FastTreeRegressionTrainer.Options
                    {
                        NumberOfLeaves = 20,
                        MinimumExampleCountPerLeaf = 10,
                        NumberOfTrees = 100,
                        LearningRate = 0.2,
                        Shrinkage = 1,
                        LabelColumnName = nameof(MaintenanceData.DaysUntilMaintenance),
                        FeatureColumnName = "Features"
                    }));

            // Train the model
            _logger.LogInformation("Training model...");
            _model = pipeline.Fit(dataSplit.TrainSet);

            // Evaluate the model
            var predictions = _model.Transform(dataSplit.TestSet);
            var metrics = _mlContext.Regression.Evaluate(predictions, 
                labelColumnName: nameof(MaintenanceData.DaysUntilMaintenance));

            _logger.LogInformation(
                "Model trained. R²: {RSquared:F4}, MAE: {MAE:F2}, RMSE: {RMSE:F2}",
                metrics.RSquared, metrics.MeanAbsoluteError, metrics.RootMeanSquaredError);

            // Save the model
            var modelDirectory = Path.GetDirectoryName(_modelPath);
            if (!string.IsNullOrEmpty(modelDirectory) && !Directory.Exists(modelDirectory))
            {
                Directory.CreateDirectory(modelDirectory);
            }

            _mlContext.Model.Save(_model, dataView.Schema, _modelPath);
            _logger.LogInformation("Model saved to {Path}", _modelPath);

            await Task.CompletedTask;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error training model");
            throw new ApplicationException("Failed to train model", ex);
        }
    }

    public async Task<ModelMetrics> EvaluateModelAsync(IEnumerable<MaintenanceData> testData)
    {
        try
        {
            if (_model == null)
            {
                throw new InvalidOperationException("Model is not loaded");
            }

            var dataView = _mlContext.Data.LoadFromEnumerable(testData);
            var predictions = _model.Transform(dataView);
            var metrics = _mlContext.Regression.Evaluate(predictions,
                labelColumnName: nameof(MaintenanceData.DaysUntilMaintenance));

            return await Task.FromResult(new ModelMetrics
            {
                RSquared = metrics.RSquared,
                MeanAbsoluteError = metrics.MeanAbsoluteError,
                RootMeanSquaredError = metrics.RootMeanSquaredError,
                MeanSquaredError = metrics.MeanSquaredError,
                EvaluatedAt = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error evaluating model");
            throw new ApplicationException("Failed to evaluate model", ex);
        }
    }

    private void LoadModel()
    {
        try
        {
            if (File.Exists(_modelPath))
            {
                _model = _mlContext.Model.Load(_modelPath, out var _);
                _logger.LogInformation("ML model loaded from {Path}", _modelPath);
            }
            else
            {
                _logger.LogWarning("ML model not found at {Path}. Model needs to be trained.", 
                    _modelPath);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading ML model from {Path}", _modelPath);
        }
    }

    private double CalculateConfidence(float predictedDays)
    {
        // Simple confidence calculation based on prediction range
        // In production, use proper confidence intervals
        if (predictedDays < 0) return 0.5;
        if (predictedDays > 365) return 0.6;
        return 0.85; // Default high confidence
    }

    private string GetRecommendedAction(float predictedDays)
    {
        return predictedDays switch
        {
            <= 7 => "Schedule maintenance immediately",
            <= 30 => "Schedule maintenance within the next month",
            <= 60 => "Plan for maintenance in the next 2 months",
            <= 90 => "Maintenance recommended within 3 months",
            _ => "Continue regular monitoring"
        };
    }

    private RiskLevel GetRiskLevel(float predictedDays)
    {
        return predictedDays switch
        {
            <= 7 => RiskLevel.Critical,
            <= 30 => RiskLevel.High,
            <= 60 => RiskLevel.Medium,
            _ => RiskLevel.Low
        };
    }

    private List<MaintenanceFactor> GetMaintenanceFactors(
        PredictionInput input, 
        MaintenancePrediction prediction)
    {
        var factors = new List<MaintenanceFactor>();

        if (input.DaysSinceLastService > 90)
        {
            factors.Add(new MaintenanceFactor
            {
                Name = "Time Since Last Service",
                Impact = "High",
                Description = $"{input.DaysSinceLastService} days since last service"
            });
        }

        if (input.MileageSinceLastService > 5000)
        {
            factors.Add(new MaintenanceFactor
            {
                Name = "Mileage Since Last Service",
                Impact = "High",
                Description = $"{input.MileageSinceLastService:N0} miles since last service"
            });
        }

        if (input.CarAgeInYears > 5)
        {
            factors.Add(new MaintenanceFactor
            {
                Name = "Vehicle Age",
                Impact = "Medium",
                Description = $"Vehicle is {input.CarAgeInYears} years old"
            });
        }

        return factors;
    }
}

// Supporting models
public class PredictionInput
{
    public int CarAgeInYears { get; set; }
    public float CurrentMileage { get; set; }
    public float DaysSinceLastService { get; set; }
    public float MileageSinceLastService { get; set; }
    public float AverageMonthlyMileage { get; set; }
    public float TotalMaintenanceCost { get; set; }
    public float MaintenanceFrequency { get; set; }
    public string? ServiceType { get; set; }
}

public class PredictionResult
{
    public int PredictedDaysUntilMaintenance { get; set; }
    public double Confidence { get; set; }
    public string RecommendedAction { get; set; } = string.Empty;
    public DateTime PredictedDate { get; set; }
    public RiskLevel RiskLevel { get; set; }
    public List<MaintenanceFactor> Factors { get; set; } = new();
}

public class MaintenanceFactor
{
    public string Name { get; set; } = string.Empty;
    public string Impact { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class ModelMetrics
{
    public double RSquared { get; set; }
    public double MeanAbsoluteError { get; set; }
    public double RootMeanSquaredError { get; set; }
    public double MeanSquaredError { get; set; }
    public DateTime EvaluatedAt { get; set; }
}

public enum RiskLevel
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}

using CarMaintenance.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace CarMaintenance.API.Hubs;

/// <summary>
/// SignalR Hub for real-time notifications
/// </summary>
[Authorize]
public class NotificationHub : Hub
{
    private readonly ILogger<NotificationHub> _logger;
    private readonly ICurrentUserService _currentUserService;
    private static readonly Dictionary<string, HashSet<string>> _userConnections = new();
    private static readonly object _lock = new();

    public NotificationHub(
        ILogger<NotificationHub> logger,
        ICurrentUserService currentUserService)
    {
        _logger = logger;
        _currentUserService = currentUserService;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = _currentUserService.UserId;
        
        if (!string.IsNullOrEmpty(userId))
        {
            lock (_lock)
            {
                if (!_userConnections.ContainsKey(userId))
                {
                    _userConnections[userId] = new HashSet<string>();
                }
                _userConnections[userId].Add(Context.ConnectionId);
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
            
            _logger.LogInformation(
                "User {UserId} connected with connection ID: {ConnectionId}", 
                userId, Context.ConnectionId);

            // Send connection confirmation
            await Clients.Caller.SendAsync("Connected", new
            {
                message = "Successfully connected to notification hub",
                connectionId = Context.ConnectionId,
                timestamp = DateTime.UtcNow
            });

            // Notify user's other connections
            await Clients.OthersInGroup($"user_{userId}").SendAsync("UserConnected", new
            {
                connectionId = Context.ConnectionId,
                timestamp = DateTime.UtcNow
            });
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = _currentUserService.UserId;
        
        if (!string.IsNullOrEmpty(userId))
        {
            lock (_lock)
            {
                if (_userConnections.ContainsKey(userId))
                {
                    _userConnections[userId].Remove(Context.ConnectionId);
                    
                    if (_userConnections[userId].Count == 0)
                    {
                        _userConnections.Remove(userId);
                    }
                }
            }

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
            
            _logger.LogInformation(
                "User {UserId} disconnected. Connection ID: {ConnectionId}", 
                userId, Context.ConnectionId);

            // Notify user's other connections
            await Clients.OthersInGroup($"user_{userId}").SendAsync("UserDisconnected", new
            {
                connectionId = Context.ConnectionId,
                timestamp = DateTime.UtcNow
            });
        }

        if (exception != null)
        {
            _logger.LogError(exception, 
                "Connection {ConnectionId} disconnected with error", 
                Context.ConnectionId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Subscribe to car-specific notifications
    /// </summary>
    public async Task SubscribeToCar(int carId)
    {
        var userId = _currentUserService.UserId;
        await Groups.AddToGroupAsync(Context.ConnectionId, $"car_{carId}");
        
        _logger.LogInformation(
            "User {UserId} subscribed to car {CarId}", 
            userId, carId);

        await Clients.Caller.SendAsync("SubscriptionConfirmed", new
        {
            type = "car",
            id = carId,
            timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Unsubscribe from car-specific notifications
    /// </summary>
    public async Task UnsubscribeFromCar(int carId)
    {
        var userId = _currentUserService.UserId;
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"car_{carId}");
        
        _logger.LogInformation(
            "User {UserId} unsubscribed from car {CarId}", 
            userId, carId);

        await Clients.Caller.SendAsync("UnsubscriptionConfirmed", new
        {
            type = "car",
            id = carId,
            timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Mark notification as read
    /// </summary>
    public async Task MarkAsRead(int notificationId)
    {
        var userId = _currentUserService.UserId;
        
        _logger.LogInformation(
            "User {UserId} marked notification {NotificationId} as read", 
            userId, notificationId);

        // Update notification in database (call service)
        // await _notificationService.MarkAsReadAsync(notificationId);

        // Notify all user's connections
        await Clients.Group($"user_{userId}").SendAsync("NotificationRead", new
        {
            notificationId,
            timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Get connection count for user
    /// </summary>
    public Task<int> GetConnectionCount()
    {
        var userId = _currentUserService.UserId;
        
        lock (_lock)
        {
            return Task.FromResult(
                _userConnections.ContainsKey(userId) 
                    ? _userConnections[userId].Count 
                    : 0);
        }
    }

    /// <summary>
    /// Ping to keep connection alive
    /// </summary>
    public async Task Ping()
    {
        await Clients.Caller.SendAsync("Pong", DateTime.UtcNow);
    }
}

/// <summary>
/// Service for sending notifications via SignalR
/// </summary>
public interface INotificationHubService
{
    Task SendNotificationToUser(string userId, object notification);
    Task SendNotificationToCar(int carId, object notification);
    Task SendMaintenanceReminder(string userId, int carId, object reminder);
    Task SendMaintenanceCompleted(string userId, int maintenanceId, object data);
    Task SendSystemAlert(string userId, object alert);
    Task BroadcastToAllUsers(object message);
}

public class NotificationHubService : INotificationHubService
{
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<NotificationHubService> _logger;

    public NotificationHubService(
        IHubContext<NotificationHub> hubContext,
        ILogger<NotificationHubService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task SendNotificationToUser(string userId, object notification)
    {
        try
        {
            await _hubContext.Clients
                .Group($"user_{userId}")
                .SendAsync("ReceiveNotification", notification);

            _logger.LogInformation("Notification sent to user {UserId}", userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send notification to user {UserId}", userId);
        }
    }

    public async Task SendNotificationToCar(int carId, object notification)
    {
        try
        {
            await _hubContext.Clients
                .Group($"car_{carId}")
                .SendAsync("CarNotification", notification);

            _logger.LogInformation("Notification sent for car {CarId}", carId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send notification for car {CarId}", carId);
        }
    }

    public async Task SendMaintenanceReminder(string userId, int carId, object reminder)
    {
        try
        {
            var notification = new
            {
                type = "MaintenanceReminder",
                userId,
                carId,
                data = reminder,
                timestamp = DateTime.UtcNow
            };

            await _hubContext.Clients
                .Group($"user_{userId}")
                .SendAsync("MaintenanceReminder", notification);

            _logger.LogInformation(
                "Maintenance reminder sent to user {UserId} for car {CarId}", 
                userId, carId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, 
                "Failed to send maintenance reminder to user {UserId}", userId);
        }
    }

    public async Task SendMaintenanceCompleted(string userId, int maintenanceId, object data)
    {
        try
        {
            var notification = new
            {
                type = "MaintenanceCompleted",
                maintenanceId,
                data,
                timestamp = DateTime.UtcNow
            };

            await _hubContext.Clients
                .Group($"user_{userId}")
                .SendAsync("MaintenanceCompleted", notification);

            _logger.LogInformation(
                "Maintenance completion notification sent to user {UserId}", userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, 
                "Failed to send maintenance completion to user {UserId}", userId);
        }
    }

    public async Task SendSystemAlert(string userId, object alert)
    {
        try
        {
            var notification = new
            {
                type = "SystemAlert",
                data = alert,
                timestamp = DateTime.UtcNow,
                priority = "high"
            };

            await _hubContext.Clients
                .Group($"user_{userId}")
                .SendAsync("SystemAlert", notification);

            _logger.LogInformation("System alert sent to user {UserId}", userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send system alert to user {UserId}", userId);
        }
    }

    public async Task BroadcastToAllUsers(object message)
    {
        try
        {
            await _hubContext.Clients.All.SendAsync("Broadcast", new
            {
                data = message,
                timestamp = DateTime.UtcNow
            });

            _logger.LogInformation("Broadcast message sent to all users");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to broadcast message");
        }
    }
}

using CarMaintenance.Application.Cars.Commands.CreateCar;
using CarMaintenance.Application.Cars.Commands.UpdateCar;
using CarMaintenance.Application.Cars.Commands.DeleteCar;
using CarMaintenance.Application.Cars.Commands.UpdateCarMileage;
using CarMaintenance.Application.Cars.Queries.GetCarById;
using CarMaintenance.Application.Cars.Queries.GetCarsWithPagination;
using CarMaintenance.Application.Cars.Queries.GetCarStatistics;
using CarMaintenance.Application.Common.Models;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace CarMaintenance.API.Controllers.v1;

/// <summary>
/// API Controller for managing cars
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[Authorize]
[EnableRateLimiting("fixed")]
public class CarsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<CarsController> _logger;

    public CarsController(IMediator mediator, ILogger<CarsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Get all cars with pagination and filtering
    /// </summary>
    /// <param name="query">Query parameters for pagination and filtering</param>
    /// <returns>Paginated list of cars</returns>
    [HttpGet]
    [ProducesResponseType(typeof(PaginatedList<CarDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PaginatedList<CarDto>>> GetCars(
        [FromQuery] GetCarsWithPaginationQuery query)
    {
        try
        {
            _logger.LogInformation("Fetching cars with pagination: Page {Page}, Size {Size}", 
                query.PageNumber, query.PageSize);

            var result = await _mediator.Send(query);
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching cars");
            return BadRequest(new { error = "Failed to fetch cars", details = ex.Message });
        }
    }

    /// <summary>
    /// Get a specific car by ID
    /// </summary>
    /// <param name="id">Car ID</param>
    /// <returns>Car details</returns>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(CarDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ResponseCache(Duration = 60, VaryByQueryKeys = new[] { "id" })]
    public async Task<ActionResult<CarDto>> GetCarById(int id)
    {
        try
        {
            _logger.LogInformation("Fetching car with ID: {CarId}", id);

            var query = new GetCarByIdQuery { Id = id };
            var result = await _mediator.Send(query);

            if (!result.IsSuccess)
            {
                return NotFound(new { error = result.Message });
            }

            return Ok(result.Data);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching car with ID: {CarId}", id);
            return BadRequest(new { error = "Failed to fetch car", details = ex.Message });
        }
    }

    /// <summary>
    /// Create a new car
    /// </summary>
    /// <param name="command">Car creation data</param>
    /// <returns>Created car ID</returns>
    [HttpPost]
    [ProducesResponseType(typeof(int), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<int>> CreateCar([FromBody] CreateCarCommand command)
    {
        try
        {
            _logger.LogInformation("Creating new car: {Make} {Model} {VIN}", 
                command.Make, command.Model, command.VIN);

            var result = await _mediator.Send(command);

            if (!result.IsSuccess)
            {
                return BadRequest(new { errors = result.Errors });
            }

            _logger.LogInformation("Car created successfully with ID: {CarId}", result.Data);

            return CreatedAtAction(
                nameof(GetCarById),
                new { id = result.Data },
                new { id = result.Data, message = result.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating car");
            return BadRequest(new { error = "Failed to create car", details = ex.Message });
        }
    }

    /// <summary>
    /// Update an existing car
    /// </summary>
    /// <param name="id">Car ID</param>
    /// <param name="command">Updated car data</param>
    /// <returns>Success message</returns>
    [HttpPut("{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult> UpdateCar(int id, [FromBody] UpdateCarCommand command)
    {
        if (id != command.Id)
        {
            return BadRequest(new { error = "Car ID mismatch" });
        }

        try
        {
            _logger.LogInformation("Updating car with ID: {CarId}", id);

            var result = await _mediator.Send(command);

            if (!result.IsSuccess)
            {
                if (result.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
                {
                    return NotFound(new { error = result.Message });
                }
                return BadRequest(new { errors = result.Errors });
            }

            _logger.LogInformation("Car updated successfully: {CarId}", id);

            return Ok(new { message = result.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating car with ID: {CarId}", id);
            return BadRequest(new { error = "Failed to update car", details = ex.Message });
        }
    }

    /// <summary>
    /// Delete a car
    /// </summary>
    /// <param name="id">Car ID</param>
    /// <returns>Success message</returns>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult> DeleteCar(int id)
    {
        try
        {
            _logger.LogInformation("Deleting car with ID: {CarId}", id);

            var command = new DeleteCarCommand { Id = id };
            var result = await _mediator.Send(command);

            if (!result.IsSuccess)
            {
                if (result.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
                {
                    return NotFound(new { error = result.Message });
                }
                return BadRequest(new { error = result.Message });
            }

            _logger.LogInformation("Car deleted successfully: {CarId}", id);

            return Ok(new { message = result.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting car with ID: {CarId}", id);
            return BadRequest(new { error = "Failed to delete car", details = ex.Message });
        }
    }

    /// <summary>
    /// Update car mileage
    /// </summary>
    /// <param name="id">Car ID</param>
    /// <param name="request">New mileage value</param>
    /// <returns>Success message</returns>
    [HttpPatch("{id:int}/mileage")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> UpdateMileage(
        int id, 
        [FromBody] UpdateMileageRequest request)
    {
        try
        {
            _logger.LogInformation("Updating mileage for car {CarId} to {Mileage}", 
                id, request.Mileage);

            var command = new UpdateCarMileageCommand 
            { 
                CarId = id, 
                NewMileage = request.Mileage 
            };
            
            var result = await _mediator.Send(command);

            if (!result.IsSuccess)
            {
                return BadRequest(new { error = result.Message });
            }

            return Ok(new { message = "Mileage updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating mileage for car {CarId}", id);
            return BadRequest(new { error = "Failed to update mileage", details = ex.Message });
        }
    }

    /// <summary>
    /// Get statistics for a specific car
    /// </summary>
    /// <param name="id">Car ID</param>
    /// <returns>Car statistics</returns>
    [HttpGet("{id:int}/statistics")]
    [ProducesResponseType(typeof(CarStatisticsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ResponseCache(Duration = 120, VaryByQueryKeys = new[] { "id" })]
    public async Task<ActionResult<CarStatisticsDto>> GetStatistics(int id)
    {
        try
        {
            _logger.LogInformation("Fetching statistics for car {CarId}", id);

            var query = new GetCarStatisticsQuery { CarId = id };
            var result = await _mediator.Send(query);

            if (!result.IsSuccess)
            {
                return NotFound(new { error = result.Message });
            }

            return Ok(result.Data);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching statistics for car {CarId}", id);
            return BadRequest(new { error = "Failed to fetch statistics", details = ex.Message });
        }
    }

    /// <summary>
    /// Search cars by VIN or license plate
    /// </summary>
    /// <param name="searchTerm">Search term</param>
    /// <returns>List of matching cars</returns>
    [HttpGet("search")]
    [ProducesResponseType(typeof(List<CarDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<CarDto>>> SearchCars([FromQuery] string searchTerm)
    {
        try
        {
            var query = new GetCarsWithPaginationQuery
            {
                SearchTerm = searchTerm,
                PageSize = 50
            };

            var result = await _mediator.Send(query);
            return Ok(result.Items);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching cars");
            return BadRequest(new { error = "Search failed", details = ex.Message });
        }
    }
}

/// <summary>
/// Request model for updating mileage
/// </summary>
public record UpdateMileageRequest
{
    public int Mileage { get; init; }
}

/// <summary>
/// Car statistics DTO
/// </summary>
public record CarStatisticsDto
{
    public int TotalMaintenanceRecords { get; init; }
    public decimal TotalMaintenanceCost { get; init; }
    public decimal AverageServiceCost { get; init; }
    public int DaysSinceLastService { get; init; }
    public DateTime? LastServiceDate { get; init; }
    public DateTime? NextScheduledService { get; init; }
    public int MileageSinceLastService { get; init; }
    public List<string> MostCommonServices { get; init; } = new();
    public Dictionary<string, decimal> CostByServiceType { get; init; } = new();
}

// lib/features/cars/screens/car_list_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../models/car_model.dart';
import '../providers/car_provider.dart';
import '../widgets/car_card.dart';

class CarListScreen extends ConsumerStatefulWidget {
  const CarListScreen({super.key});

  @override
  ConsumerState<CarListScreen> createState() => _CarListScreenState();
}

class _CarListScreenState extends ConsumerState<CarListScreen> {
  final _searchController = TextEditingController();
  String _searchTerm = '';
  int _currentPage = 1;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final carsAsync = ref.watch(carsProvider(CarQueryParams(
      pageNumber: _currentPage,
      searchTerm: _searchTerm.isEmpty ? null : _searchTerm,
    )));

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Cars'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: _showFilterSheet,
          ),
        ],
      ),
      body: Column(
        children: [
          _buildSearchBar(),
          Expanded(
            child: carsAsync.when(
              data: (paginatedCars) => _buildCarList(paginatedCars),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stack) => _buildErrorState(error),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/cars/new'),
        icon: const Icon(Icons.add),
        label: const Text('Add Car'),
      ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: TextField(
        controller: _searchController,
        decoration: InputDecoration(
          hintText: 'Search by VIN, make, or model...',
          prefixIcon: const Icon(Icons.search),
          suffixIcon: _searchTerm.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear),
                  onPressed: () {
                    _searchController.clear();
                    setState(() => _searchTerm = '');
                  },
                )
              : null,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          filled: true,
        ),
        onChanged: (value) {
          setState(() => _searchTerm = value);
          _currentPage = 1; // Reset to first page
        },
      ),
    );
  }

  Widget _buildCarList(PaginatedCars paginatedCars) {
    if (paginatedCars.items.isEmpty) {
      return _buildEmptyState();
    }

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(carsProvider);
      },
      child: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: paginatedCars.items.length,
              itemBuilder: (context, index) {
                final car = paginatedCars.items[index];
                return CarCard(
                  car: car,
                  onTap: () => context.push('/cars/${car.id}'),
                  onEdit: () => context.push('/cars/${car.id}/edit'),
                  onDelete: () => _deleteCar(car),
                );
              },
            ),
          ),
          if (paginatedCars.totalPages > 1)
            _buildPagination(paginatedCars),
        ],
      ),
    );
  }

  Widget _buildPagination(PaginatedCars paginatedCars) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            icon: const Icon(Icons.chevron_left),
            onPressed: paginatedCars.hasPreviousPage
                ? () => setState(() => _currentPage--)
                : null,
          ),
          Text(
            'Page $_currentPage of ${paginatedCars.totalPages}',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          IconButton(
            icon: const Icon(Icons.chevron_right),
            onPressed: paginatedCars.hasNextPage
                ? () => setState(() => _currentPage++)
                : null,
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.directions_car_outlined,
              size: 120,
              color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
            ),
            const SizedBox(height: 24),
            Text(
              'No cars found',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'Start by adding your first car to track its maintenance history.',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context)
                        .textTheme
                        .bodyMedium
                        ?.color
                        ?.withOpacity(0.6),
                  ),
            ),
            const SizedBox(height: 32),
            FilledButton.icon(
              onPressed: () => context.push('/cars/new'),
              icon: const Icon(Icons.add),
              label: const Text('Add Your First Car'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(Object error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 80,
              color: Theme.of(context).colorScheme.error,
            ),
            const SizedBox(height: 16),
            Text(
              'Error loading cars',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              error.toString(),
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: () => ref.invalidate(carsProvider),
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Filter & Sort',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 24),
            ListTile(
              leading: const Icon(Icons.sort_by_alpha),
              title: const Text('Sort by Make'),
              onTap: () {
                Navigator.pop(context);
                // Implement sorting
              },
            ),
            ListTile(
              leading: const Icon(Icons.calendar_today),
              title: const Text('Sort by Year'),
              onTap: () {
                Navigator.pop(context);
                // Implement sorting
              },
            ),
            ListTile(
              leading: const Icon(Icons.speed),
              title: const Text('Sort by Mileage'),
              onTap: () {
                Navigator.pop(context);
                // Implement sorting
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _deleteCar(Car car) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Car'),
        content: Text(
          'Are you sure you want to delete ${car.displayName}? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      try {
        await ref.read(carRepositoryProvider).deleteCar(car.id);
        ref.invalidate(carsProvider);
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('${car.displayName} deleted successfully'),
              backgroundColor: Theme.of(context).colorScheme.primary,
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Failed to delete car: ${e.toString()}'),
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
          );
        }
      }
    }
  }
}

// lib/features/cars/models/car_model.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'car_model.freezed.dart';
part 'car_model.g.dart';

@freezed
class Car with _$Car {
  const Car._();

  const factory Car({
    required int id,
    required String vin,
    required String make,
    required String model,
    required int year,
    String? color,
    String? licensePlate,
    required int currentMileage,
    required int ownerId,
    String? ownerName,
    DateTime? purchaseDate,
    String? engineType,
    String? transmission,
    MaintenanceRecordDto? lastMaintenanceRecord,
    @Default(0) int daysSinceLastService,
    @Default(0) int maintenanceCount,
    @Default(0) double totalMaintenanceCost,
    required DateTime createdAt,
    DateTime? updatedAt,
  }) = _Car;

  factory Car.fromJson(Map<String, dynamic> json) => _$CarFromJson(json);

  // Computed properties
  int get ageInYears => DateTime.now().year - year;
  
  bool get needsMaintenance => daysSinceLastService > 90;
  
  bool get criticalMaintenance => daysSinceLastService > 180;
  
  String get displayName => '$year $make $model';
  
  String get shortVin => vin.substring(vin.length - 6);
}

@freezed
class MaintenanceRecordDto with _$MaintenanceRecordDto {
  const factory MaintenanceRecordDto({
    required int id,
    required String description,
    DateTime? serviceDate,
    required int mileageAtService,
    required double totalCost,
    required String status,
    String? serviceProvider,
  }) = _MaintenanceRecordDto;

  factory MaintenanceRecordDto.fromJson(Map<String, dynamic> json) =>
      _$MaintenanceRecordDtoFromJson(json);
}

@freezed
class PaginatedCars with _$PaginatedCars {
  const factory PaginatedCars({
    required List<Car> items,
    required int pageNumber,
    required int totalPages,
    required int totalCount,
    required bool hasPreviousPage,
    required bool hasNextPage,
  }) = _PaginatedCars;

  factory PaginatedCars.fromJson(Map<String, dynamic> json) =>
      _$PaginatedCarsFromJson(json);
}

// lib/features/cars/providers/car_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../models/car_model.dart';
import '../../../core/providers/api_provider.dart';

final carRepositoryProvider = Provider<CarRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return CarRepository(dio);
});

final carsProvider = FutureProvider.autoDispose
    .family<PaginatedCars, CarQueryParams>((ref, params) async {
  final repository = ref.watch(carRepositoryProvider);
  return await repository.getCars(params);
});

final carDetailProvider = FutureProvider.autoDispose
    .family<Car, int>((ref, carId) async {
  final repository = ref.watch(carRepositoryProvider);
  return await repository.getCarById(carId);
});

class CarQueryParams {
  final int pageNumber;
  final int pageSize;
  final String? searchTerm;
  final String? sortField;
  final String? sortDirection;

  CarQueryParams({
    this.pageNumber = 1,
    this.pageSize = 10,
    this.searchTerm,
    this.sortField,
    this.sortDirection,
  });

  Map<String, dynamic> toJson() => {
    'pageNumber': pageNumber,
    'pageSize': pageSize,
    if (searchTerm != null) 'searchTerm': searchTerm,
    if (sortField != null) 'sortField': sortField,
    if (sortDirection != null) 'sortDirection': sortDirection,
  };
}

class CarRepository {
  final Dio _dio;

  CarRepository(this._dio);

  Future<PaginatedCars> getCars(CarQueryParams params) async {
    try {
      final response = await _dio.get(
        '/api/v1/cars',
        queryParameters: params.toJson(),
      );
      return PaginatedCars.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Car> getCarById(int id) async {
    try {
      final response = await _dio.get('/api/v1/cars/$id');
      return Car.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Car> createCar(Map<String, dynamic> carData) async {
    try {
      final response = await _dio.post('/api/v1/cars', data: carData);
      return Car.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Car> updateCar(int id, Map<String, dynamic> carData) async {
    try {
      final response = await _dio.put('/api/v1/cars/$id', data: carData);
      return Car.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> deleteCar(int id) async {
    try {
      await _dio.delete('/api/v1/cars/$id');
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> updateMileage(int id, int mileage) async {
    try {
      await _dio.patch('/api/v1/cars/$id/mileage', data: {'mileage': mileage});
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Exception _handleError(DioException e) {
    if (e.response != null) {
      final statusCode = e.response!.statusCode;
      final message = e.response!.data['message'] ?? 'An error occurred';
      
      switch (statusCode) {
        case 400:
          return ValidationException(message);
        case 401:
          return UnauthorizedException();
        case 404:
          return NotFoundException(message);
        default:
          return ServerException(message);
      }
    }
    return NetworkException('Network error occurred');
  }
}

// Custom exceptions
class ValidationException implements Exception {
  final String message;
  ValidationException(this.message);
}

class UnauthorizedException implements Exception {}

class NotFoundException implements Exception {
  final String message;
  NotFoundException(this.message);
}

class ServerException implements Exception {
  final String message;
  ServerException(this.message);
}

class NetworkException implements Exception {
  final String message;
  NetworkException(this.message);
}

// car-list.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CarService } from '../../../core/services/car.service';
import { Car, PaginatedResult } from '../../../core/models/car.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-car-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    MatMenuModule,
    MatDialogModule
  ],
  templateUrl: './car-list.component.html',
  styleUrls: ['./car-list.component.scss']
})
export class CarListComponent implements OnInit {
  private carService = inject(CarService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // Signals
  cars = signal<Car[]>([]);
  loading = signal(false);
  searchTerm = signal('');
  pageIndex = signal(0);
  pageSize = signal(10);
  totalCount = signal(0);
  sortField = signal('createdAt');
  sortDirection = signal<'asc' | 'desc'>('desc');

  // Computed values
  displayedColumns = ['vin', 'make', 'model', 'year', 'licensePlate', 'mileage', 'owner', 'lastService', 'actions'];
  
  hasData = computed(() => this.cars().length > 0);
  isEmpty = computed(() => !this.loading() && this.cars().length === 0);

  ngOnInit(): void {
    this.loadCars();
  }

  async loadCars(): Promise<void> {
    this.loading.set(true);
    
    try {
      const result = await this.carService.getCarsWithPagination({
        pageNumber: this.pageIndex() + 1,
        pageSize: this.pageSize(),
        searchTerm: this.searchTerm(),
        sortField: this.sortField(),
        sortDirection: this.sortDirection()
      });

      this.cars.set(result.items);
      this.totalCount.set(result.totalCount);
    } catch (error) {
      this.showError('Failed to load cars');
      console.error('Error loading cars:', error);
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
    this.pageIndex.set(0); // Reset to first page
    this.loadCars();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadCars();
  }

  onSortChange(sort: Sort): void {
    this.sortField.set(sort.active);
    this.sortDirection.set(sort.direction as 'asc' | 'desc');
    this.loadCars();
  }

  async deleteCar(car: Car): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Car',
        message: `Are you sure you want to delete ${car.make} ${car.model} (${car.vin})?`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    const result = await dialogRef.afterClosed().toPromise();
    
    if (result) {
      try {
        await this.carService.deleteCar(car.id);
        this.showSuccess('Car deleted successfully');
        this.loadCars();
      } catch (error) {
        this.showError('Failed to delete car');
        console.error('Error deleting car:', error);
      }
    }
  }

  viewMaintenance(car: Car): void {
    // Navigate to maintenance history
  }

  getLastServiceDate(car: Car): string {
    if (!car.lastMaintenanceRecord) return 'No service history';
    
    const date = new Date(car.lastMaintenanceRecord.serviceDate);
    const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysAgo === 0) return 'Today';
    if (daysAgo === 1) return 'Yesterday';
    return `${daysAgo} days ago`;
  }

  getStatusChipColor(car: Car): string {
    const daysSinceService = car.daysSinceLastService || 0;
    
    if (daysSinceService > 180) return 'warn';
    if (daysSinceService > 90) return 'accent';
    return 'primary';
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}

// car-list.component.html
/*
<div class="car-list-container">
  <div class="header">
    <h1>My Cars</h1>
    <button mat-raised-button color="primary" routerLink="/cars/new">
      <mat-icon>add</mat-icon>
      Add New Car
    </button>
  </div>

  <mat-form-field class="search-field" appearance="outline">
    <mat-label>Search cars</mat-label>
    <input matInput 
           [ngModel]="searchTerm()"
           (ngModelChange)="onSearch($event)"
           placeholder="Search by VIN, make, model...">
    <mat-icon matPrefix>search</mat-icon>
  </mat-form-field>

  @if (loading()) {
    <div class="loading-container">
      <mat-spinner></mat-spinner>
    </div>
  }

  @if (hasData()) {
    <div class="table-container">
      <table mat-table [dataSource]="cars()" matSort (matSortChange)="onSortChange($event)">
        
        <!-- VIN Column -->
        <ng-container matColumnDef="vin">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>VIN</th>
          <td mat-cell *matCellDef="let car">
            <span class="monospace">{{car.vin}}</span>
          </td>
        </ng-container>

        <!-- Make Column -->
        <ng-container matColumnDef="make">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Make</th>
          <td mat-cell *matCellDef="let car">{{car.make}}</td>
        </ng-container>

        <!-- Model Column -->
        <ng-container matColumnDef="model">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Model</th>
          <td mat-cell *matCellDef="let car">{{car.model}}</td>
        </ng-container>

        <!-- Year Column -->
        <ng-container matColumnDef="year">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Year</th>
          <td mat-cell *matCellDef="let car">{{car.year}}</td>
        </ng-container>

        <!-- License Plate Column -->
        <ng-container matColumnDef="licensePlate">
          <th mat-header-cell *matHeaderCellDef>License Plate</th>
          <td mat-cell *matCellDef="let car">
            <span class="license-plate">{{car.licensePlate || 'N/A'}}</span>
          </td>
        </ng-container>

        <!-- Mileage Column -->
        <ng-container matColumnDef="mileage">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Mileage</th>
          <td mat-cell *matCellDef="let car">
            {{car.currentMileage | number}} mi
          </td>
        </ng-container>

        <!-- Owner Column -->
        <ng-container matColumnDef="owner">
          <th mat-header-cell *matHeaderCellDef>Owner</th>
          <td mat-cell *matCellDef="let car">{{car.ownerName}}</td>
        </ng-container>

        <!-- Last Service Column -->
        <ng-container matColumnDef="lastService">
          <th mat-header-cell *matHeaderCellDef>Last Service</th>
          <td mat-cell *matCellDef="let car">
            <mat-chip [color]="getStatusChipColor(car)">
              {{getLastServiceDate(car)}}
            </mat-chip>
          </td>
        </ng-container>

        <!-- Actions Column -->
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let car">
            <button mat-icon-button [matMenuTriggerFor]="menu">
              <mat-icon>more_vert</mat-icon>
            </button>
            <mat-menu #menu="matMenu">
              <button mat-menu-item [routerLink]="['/cars', car.id]">
                <mat-icon>visibility</mat-icon>
                <span>View Details</span>
              </button>
              <button mat-menu-item [routerLink]="['/cars', car.id, 'edit']">
                <mat-icon>edit</mat-icon>
                <span>Edit</span>
              </button>
              <button mat-menu-item (click)="viewMaintenance(car)">
                <mat-icon>build</mat-icon>
                <span>Maintenance History</span>
              </button>
              <mat-divider></mat-divider>
              <button mat-menu-item (click)="deleteCar(car)" class="delete-action">
                <mat-icon>delete</mat-icon>
                <span>Delete</span>
              </button>
            </mat-menu>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>

      <mat-paginator
        [length]="totalCount()"
        [pageSize]="pageSize()"
        [pageIndex]="pageIndex()"
        [pageSizeOptions]="[5, 10, 25, 50]"
        (page)="onPageChange($event)"
        showFirstLastButtons>
      </mat-paginator>
    </div>
  }

  @if (isEmpty()) {
    <div class="empty-state">
      <mat-icon>directions_car</mat-icon>
      <h2>No cars found</h2>
      <p>Start by adding your first car to track its maintenance history.</p>
      <button mat-raised-button color="primary" routerLink="/cars/new">
        Add Your First Car
      </button>
    </div>
  }
</div>
*/


using System.Reflection;
using CarMaintenance.Application.Common.Interfaces;
using CarMaintenance.Domain.Entities;
using CarMaintenance.Infrastructure.Data.Interceptors;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace CarMaintenance.Infrastructure.Data;

/// <summary>
/// Application database context
/// </summary>
public class ApplicationDbContext : IdentityDbContext<AppUser, AppRole, string>, IApplicationDbContext
{
    private readonly AuditableEntityInterceptor _auditableEntityInterceptor;
    private readonly SoftDeleteInterceptor _softDeleteInterceptor;
    private readonly PublishDomainEventsInterceptor _publishDomainEventsInterceptor;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        AuditableEntityInterceptor auditableEntityInterceptor,
        SoftDeleteInterceptor softDeleteInterceptor,
        PublishDomainEventsInterceptor publishDomainEventsInterceptor) 
        : base(options)
    {
        _auditableEntityInterceptor = auditableEntityInterceptor;
        _softDeleteInterceptor = softDeleteInterceptor;
        _publishDomainEventsInterceptor = publishDomainEventsInterceptor;
    }

    // DbSets
    public DbSet<Car> Cars => Set<Car>();
    public DbSet<Owner> Owners => Set<Owner>();
    public DbSet<MaintenanceRecord> MaintenanceRecords => Set<MaintenanceRecord>();
    public DbSet<ServiceType> ServiceTypes => Set<ServiceType>();
    public DbSet<ServicePart> ServiceParts => Set<ServicePart>();
    public DbSet<MaintenanceReminder> MaintenanceReminders => Set<MaintenanceReminder>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.AddInterceptors(
            _auditableEntityInterceptor,
            _softDeleteInterceptor,
            _publishDomainEventsInterceptor);
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Apply all configurations from assembly
        builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        // Global query filters for soft delete
        builder.Entity<Car>().HasQueryFilter(c => !c.IsDeleted);
        builder.Entity<Owner>().HasQueryFilter(o => !o.IsDeleted);
        builder.Entity<MaintenanceRecord>().HasQueryFilter(m => !m.IsDeleted);
        builder.Entity<ServiceType>().HasQueryFilter(s => !s.IsDeleted);

        // Configure decimal precision globally
        foreach (var property in builder.Model.GetEntityTypes()
            .SelectMany(t => t.GetProperties())
            .Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?)))
        {
            property.SetPrecision(18);
            property.SetScale(2);
        }
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await base.SaveChangesAsync(cancellationToken);
    }
}

/// <summary>
/// Entity Framework configuration for Car entity
/// </summary>
public class CarConfiguration : IEntityTypeConfiguration<Car>
{
    public void Configure(EntityTypeBuilder<Car> builder)
    {
        builder.ToTable("Cars");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.VIN)
            .IsRequired()
            .HasMaxLength(17)
            .IsUnicode(false);

        builder.HasIndex(c => c.VIN)
            .IsUnique()
            .HasDatabaseName("IX_Cars_VIN");

        builder.Property(c => c.Make)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(c => c.Model)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(c => c.Year)
            .IsRequired();

        builder.Property(c => c.Color)
            .HasMaxLength(30);

        builder.Property(c => c.LicensePlate)
            .HasMaxLength(20);

        builder.HasIndex(c => c.LicensePlate)
            .HasDatabaseName("IX_Cars_LicensePlate");

        builder.Property(c => c.CurrentMileage)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(c => c.EngineType)
            .HasMaxLength(50);

        builder.Property(c => c.Transmission)
            .HasMaxLength(50);

        // Relationships
        builder.HasOne(c => c.Owner)
            .WithMany(o => o.Cars)
            .HasForeignKey(c => c.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(c => c.MaintenanceRecords)
            .WithOne(m => m.Car)
            .HasForeignKey(m => m.CarId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(c => c.Reminders)
            .WithOne(r => r.Car)
            .HasForeignKey(r => r.CarId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(c => c.Documents)
            .WithOne(d => d.Car)
            .HasForeignKey(d => d.CarId)
            .OnDelete(DeleteBehavior.Cascade);

        // Audit fields
        builder.Property(c => c.CreatedAt)
            .IsRequired();

        builder.Property(c => c.CreatedBy)
            .HasMaxLength(100);

        builder.Property(c => c.UpdatedAt);

        builder.Property(c => c.UpdatedBy)
            .HasMaxLength(100);

        builder.Property(c => c.IsDeleted)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(c => c.DeletedAt);

        // Indexes
        builder.HasIndex(c => c.OwnerId)
            .HasDatabaseName("IX_Cars_OwnerId");

        builder.HasIndex(c => c.CreatedAt)
            .HasDatabaseName("IX_Cars_CreatedAt");

        builder.HasIndex(c => c.IsDeleted)
            .HasDatabaseName("IX_Cars_IsDeleted");

        // Ignore domain events
        builder.Ignore(c => c.DomainEvents);
    }
}

/// <summary>
/// Entity Framework configuration for MaintenanceRecord entity
/// </summary>
public class MaintenanceRecordConfiguration : IEntityTypeConfiguration<MaintenanceRecord>
{
    public void Configure(EntityTypeBuilder<MaintenanceRecord> builder)
    {
        builder.ToTable("MaintenanceRecords");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.Description)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(m => m.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(m => m.LaborCost)
            .HasPrecision(18, 2)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(m => m.PartsCost)
            .HasPrecision(18, 2)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(m => m.ServiceProvider)
            .HasMaxLength(100);

        builder.Property(m => m.TechnicianName)
            .HasMaxLength(100);

        builder.Property(m => m.InvoiceNumber)
            .HasMaxLength(50);

        builder.Property(m => m.Notes)
            .HasMaxLength(1000);

        // Computed column for total cost (SQL Server)
        builder.Property(m => m.TotalCost)
            .HasComputedColumnSql("[LaborCost] + [PartsCost]", stored: false);

        // Relationships
        builder.HasOne(m => m.Car)
            .WithMany(c => c.MaintenanceRecords)
            .HasForeignKey(m => m.CarId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(m => m.ServiceType)
            .WithMany()
            .HasForeignKey(m => m.ServiceTypeId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(m => m.Parts)
            .WithOne(p => p.MaintenanceRecord)
            .HasForeignKey(p => p.MaintenanceRecordId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(m => m.Documents)
            .WithOne(d => d.MaintenanceRecord)
            .HasForeignKey(d => d.MaintenanceRecordId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(m => m.CarId)
            .HasDatabaseName("IX_MaintenanceRecords_CarId");

        builder.HasIndex(m => m.ServiceTypeId)
            .HasDatabaseName("IX_MaintenanceRecords_ServiceTypeId");

        builder.HasIndex(m => m.Status)
            .HasDatabaseName("IX_MaintenanceRecords_Status");

        builder.HasIndex(m => m.ScheduledDate)
            .HasDatabaseName("IX_MaintenanceRecords_ScheduledDate");

        builder.HasIndex(m => m.ServiceDate)
            .HasDatabaseName("IX_MaintenanceRecords_ServiceDate");

        // Ignore domain events
        builder.Ignore(m => m.DomainEvents);
    }
}

using CarMaintenance.Application.Common.Interfaces;
using CarMaintenance.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CarMaintenance.Application.Cars.Commands.CreateCar;

/// <summary>
/// Command to create a new car
/// </summary>
public record CreateCarCommand : IRequest<Result<int>>
{
    public string VIN { get; init; } = string.Empty;
    public string Make { get; init; } = string.Empty;
    public string Model { get; init; } = string.Empty;
    public int Year { get; init; }
    public string? Color { get; init; }
    public string? LicensePlate { get; init; }
    public int CurrentMileage { get; init; }
    public int OwnerId { get; init; }
    public DateTime? PurchaseDate { get; init; }
    public string? EngineType { get; init; }
    public string? Transmission { get; init; }
}

/// <summary>
/// Validator for CreateCarCommand
/// </summary>
public class CreateCarCommandValidator : AbstractValidator<CreateCarCommand>
{
    private readonly IApplicationDbContext _context;

    public CreateCarCommandValidator(IApplicationDbContext context)
    {
        _context = context;

        RuleFor(x => x.VIN)
            .NotEmpty().WithMessage("VIN is required")
            .Length(17).WithMessage("VIN must be 17 characters")
            .Matches("^[A-HJ-NPR-Z0-9]{17}$").WithMessage("VIN contains invalid characters")
            .MustAsync(BeUniqueVIN).WithMessage("A car with this VIN already exists");

        RuleFor(x => x.Make)
            .NotEmpty().WithMessage("Make is required")
            .MaximumLength(50).WithMessage("Make cannot exceed 50 characters");

        RuleFor(x => x.Model)
            .NotEmpty().WithMessage("Model is required")
            .MaximumLength(50).WithMessage("Model cannot exceed 50 characters");

        RuleFor(x => x.Year)
            .InclusiveBetween(1900, DateTime.UtcNow.Year + 1)
            .WithMessage($"Year must be between 1900 and {DateTime.UtcNow.Year + 1}");

        RuleFor(x => x.Color)
            .MaximumLength(30).WithMessage("Color cannot exceed 30 characters")
            .When(x => !string.IsNullOrEmpty(x.Color));

        RuleFor(x => x.LicensePlate)
            .MaximumLength(20).WithMessage("License plate cannot exceed 20 characters")
            .When(x => !string.IsNullOrEmpty(x.LicensePlate));

        RuleFor(x => x.CurrentMileage)
            .GreaterThanOrEqualTo(0).WithMessage("Mileage cannot be negative")
            .LessThanOrEqualTo(1_000_000).WithMessage("Mileage seems unrealistic");

        RuleFor(x => x.OwnerId)
            .GreaterThan(0).WithMessage("Owner ID is required")
            .MustAsync(OwnerExists).WithMessage("Owner does not exist");

        RuleFor(x => x.PurchaseDate)
            .LessThanOrEqualTo(DateTime.UtcNow).WithMessage("Purchase date cannot be in the future")
            .When(x => x.PurchaseDate.HasValue);
    }

    private async Task<bool> BeUniqueVIN(string vin, CancellationToken cancellationToken)
    {
        return !await _context.Cars
            .AnyAsync(c => c.VIN == vin.ToUpperInvariant(), cancellationToken);
    }

    private async Task<bool> OwnerExists(int ownerId, CancellationToken cancellationToken)
    {
        return await _context.Owners
            .AnyAsync(o => o.Id == ownerId, cancellationToken);
    }
}

/// <summary>
/// Handler for CreateCarCommand
/// </summary>
public class CreateCarCommandHandler : IRequestHandler<CreateCarCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CreateCarCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<int>> Handle(CreateCarCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Create car entity using factory method
            var car = Car.Create(
                vin: request.VIN,
                make: request.Make,
                model: request.Model,
                year: request.Year,
                ownerId: request.OwnerId,
                color: request.Color,
                licensePlate: request.LicensePlate,
                currentMileage: request.CurrentMileage
            );

            // Set additional properties if provided
            if (request.PurchaseDate.HasValue)
            {
                // Use reflection or add method to set purchase date
                typeof(Car).GetProperty(nameof(Car.PurchaseDate))!
                    .SetValue(car, request.PurchaseDate);
            }

            if (!string.IsNullOrWhiteSpace(request.EngineType))
            {
                typeof(Car).GetProperty(nameof(Car.EngineType))!
                    .SetValue(car, request.EngineType.Trim());
            }

            if (!string.IsNullOrWhiteSpace(request.Transmission))
            {
                typeof(Car).GetProperty(nameof(Car.Transmission))!
                    .SetValue(car, request.Transmission.Trim());
            }

            // Add to database
            _context.Cars.Add(car);
            await _context.SaveChangesAsync(cancellationToken);

            return Result<int>.Success(car.Id, "Car created successfully");
        }
        catch (DomainException ex)
        {
            return Result<int>.Failure(ex.Message);
        }
        catch (Exception ex)
        {
            return Result<int>.Failure($"An error occurred while creating the car: {ex.Message}");
        }
    }
}

/// <summary>
/// Generic result wrapper
/// </summary>
public class Result<T>
{
    public bool IsSuccess { get; private set; }
    public T? Data { get; private set; }
    public string Message { get; private set; } = string.Empty;
    public IEnumerable<string> Errors { get; private set; } = Array.Empty<string>();

    private Result(bool isSuccess, T? data, string message, IEnumerable<string>? errors = null)
    {
        IsSuccess = isSuccess;
        Data = data;
        Message = message;
        Errors = errors ?? Array.Empty<string>();
    }

    public static Result<T> Success(T data, string message = "Operation successful")
        => new(true, data, message);

    public static Result<T> Failure(string error)
        => new(false, default, error, new[] { error });

    public static Result<T> Failure(IEnumerable<string> errors)
        => new(false, default, "Operation failed", errors);
}
namespace CarMaintenance.Domain.Enums;

/// <summary>
/// Maintenance record status
/// </summary>
public enum MaintenanceStatus
{
    Scheduled = 1,
    InProgress = 2,
    Completed = 3,
    Cancelled = 4,
    Overdue = 5
}

/// <summary>
/// User roles in the system
/// </summary>
public enum UserRole
{
    User = 1,
    Mechanic = 2,
    Admin = 3,
    SuperAdmin = 4
}

/// <summary>
/// Notification types
/// </summary>
public enum NotificationType
{
    MaintenanceReminder = 1,
    MaintenanceDue = 2,
    MaintenanceOverdue = 3,
    MaintenanceCompleted = 4,
    ServiceScheduled = 5,
    DocumentUploaded = 6,
    ChatMessage = 7,
    SystemAlert = 8
}

/// <summary>
/// Document types
/// </summary>
public enum DocumentType
{
    Invoice = 1,
    Receipt = 2,
    ServiceReport = 3,
    Warranty = 4,
    Insurance = 5,
    Registration = 6,
    Photo = 7,
    Other = 8
}

/// <summary>
/// Reminder frequency
/// </summary>
public enum ReminderFrequency
{
    Once = 1,
    Daily = 2,
    Weekly = 3,
    Monthly = 4,
    Quarterly = 5,
    Yearly = 6,
    ByMileage = 7
}

/// <summary>
/// Service priority levels
/// </summary>
public enum ServicePriority
{
    Low = 1,
    Normal = 2,
    High = 3,
    Critical = 4
}

/// <summary>
/// Notification status
/// </summary>
public enum NotificationStatus
{
    Unread = 1,
    Read = 2,
    Archived = 3,
    Deleted = 4
}

using CarMaintenance.Domain.Enums;

namespace CarMaintenance.Domain.Entities;

/// <summary>
/// Represents a maintenance record for a car
/// </summary>
public class MaintenanceRecord : BaseEntity, IAuditable
{
    public int CarId { get; private set; }
    public Car Car { get; private set; } = null!;
    
    public int? ServiceTypeId { get; private set; }
    public ServiceType? ServiceType { get; private set; }
    
    public string Description { get; private set; } = string.Empty;
    public DateTime? ScheduledDate { get; private set; }
    public DateTime? ServiceDate { get; private set; }
    public int MileageAtService { get; private set; }
    
    public decimal LaborCost { get; private set; }
    public decimal PartsCost { get; private set; }
    public decimal TotalCost => LaborCost + PartsCost + Parts.Sum(p => p.TotalCost);
    
    public MaintenanceStatus Status { get; private set; }
    public string? ServiceProvider { get; private set; }
    public string? TechnicianName { get; private set; }
    public string? Notes { get; private set; }
    public string? InvoiceNumber { get; private set; }
    
    // Navigation Properties
    public ICollection<ServicePart> Parts { get; private set; } = new List<ServicePart>();
    public ICollection<Document> Documents { get; private set; } = new List<Document>();
    
    // Audit Properties
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }

    private MaintenanceRecord() { }

    public static MaintenanceRecord Create(
        int carId,
        int? serviceTypeId,
        string description,
        DateTime scheduledDate,
        int currentMileage)
    {
        ValidateDescription(description);
        ValidateMileage(currentMileage);

        var record = new MaintenanceRecord
        {
            CarId = carId,
            ServiceTypeId = serviceTypeId,
            Description = description.Trim(),
            ScheduledDate = scheduledDate,
            MileageAtService = currentMileage,
            Status = MaintenanceStatus.Scheduled,
            LaborCost = 0,
            PartsCost = 0
        };

        record.AddDomainEvent(new MaintenanceScheduledEvent(record));
        return record;
    }

    // Business Methods
    public void Schedule(DateTime scheduledDate)
    {
        if (scheduledDate < DateTime.UtcNow)
            throw new DomainException("Cannot schedule maintenance in the past");

        ScheduledDate = scheduledDate;
        Status = MaintenanceStatus.Scheduled;
    }

    public void StartService(DateTime serviceDate, int mileage)
    {
        if (Status != MaintenanceStatus.Scheduled)
            throw new DomainException($"Cannot start service. Current status: {Status}");

        ServiceDate = serviceDate;
        MileageAtService = mileage;
        Status = MaintenanceStatus.InProgress;
    }

    public void Complete(
        decimal laborCost,
        decimal partsCost,
        string? serviceProvider = null,
        string? technicianName = null,
        string? invoiceNumber = null,
        string? notes = null)
    {
        if (Status != MaintenanceStatus.InProgress)
            throw new DomainException($"Cannot complete service. Current status: {Status}");

        if (!ServiceDate.HasValue)
            ServiceDate = DateTime.UtcNow;

        LaborCost = laborCost >= 0 ? laborCost : throw new DomainException("Labor cost cannot be negative");
        PartsCost = partsCost >= 0 ? partsCost : throw new DomainException("Parts cost cannot be negative");
        ServiceProvider = serviceProvider?.Trim();
        TechnicianName = technicianName?.Trim();
        InvoiceNumber = invoiceNumber?.Trim();
        Notes = notes?.Trim();
        Status = MaintenanceStatus.Completed;

        AddDomainEvent(new MaintenanceCompletedEvent(this));
    }

    public void Cancel(string reason)
    {
        if (Status == MaintenanceStatus.Completed)
            throw new DomainException("Cannot cancel completed maintenance");

        Status = MaintenanceStatus.Cancelled;
        Notes = $"Cancelled: {reason}. Previous notes: {Notes}";
    }

    public void AddPart(ServicePart part)
    {
        if (Status == MaintenanceStatus.Completed)
            throw new DomainException("Cannot add parts to completed maintenance");

        Parts.Add(part);
    }

    public void RemovePart(ServicePart part)
    {
        if (Status == MaintenanceStatus.Completed)
            throw new DomainException("Cannot remove parts from completed maintenance");

        Parts.Remove(part);
    }

    public void AddDocument(Document document)
    {
        Documents.Add(document);
    }

    public void UpdateDetails(string description, string? notes = null)
    {
        ValidateDescription(description);
        Description = description.Trim();
        
        if (!string.IsNullOrWhiteSpace(notes))
            Notes = notes.Trim();
    }

    // Validation
    private static void ValidateDescription(string description)
    {
        if (string.IsNullOrWhiteSpace(description))
            throw new DomainException("Description is required");

        if (description.Length > 500)
            throw new DomainException("Description cannot exceed 500 characters");
    }

    private static void ValidateMileage(int mileage)
    {
        if (mileage < 0)
            throw new DomainException("Mileage cannot be negative");
    }

    // Computed Properties
    public bool IsOverdue => Status == MaintenanceStatus.Scheduled 
        && ScheduledDate.HasValue 
        && ScheduledDate.Value < DateTime.UtcNow;
    
    public int DaysUntilDue => ScheduledDate.HasValue 
        ? (ScheduledDate.Value - DateTime.UtcNow).Days 
        : int.MaxValue;
    
    public int DaysOverdue => IsOverdue && ScheduledDate.HasValue
        ? (DateTime.UtcNow - ScheduledDate.Value).Days
        : 0;
}

/// <summary>
/// Maintenance scheduled domain event
/// </summary>
public record MaintenanceScheduledEvent(MaintenanceRecord Record) : DomainEvent;

/// <summary>
/// Maintenance completed domain event
/// </summary>
public record MaintenanceCompletedEvent(MaintenanceRecord Record) : DomainEvent;

using CarMaintenance.Domain.Enums;
using CarMaintenance.Domain.ValueObjects;

namespace CarMaintenance.Domain.Entities;

/// <summary>
/// Represents a car entity in the system
/// </summary>
public class Car : BaseEntity, IAuditable
{
    public string VIN { get; private set; } = string.Empty;
    public string Make { get; private set; } = string.Empty;
    public string Model { get; private set; } = string.Empty;
    public int Year { get; private set; }
    public string? Color { get; private set; }
    public string? LicensePlate { get; private set; }
    public int CurrentMileage { get; private set; }
    public DateTime? PurchaseDate { get; private set; }
    public string? EngineType { get; private set; }
    public string? Transmission { get; private set; }
    
    // Navigation Properties
    public int OwnerId { get; private set; }
    public Owner Owner { get; private set; } = null!;
    public ICollection<MaintenanceRecord> MaintenanceRecords { get; private set; } = new List<MaintenanceRecord>();
    public ICollection<MaintenanceReminder> Reminders { get; private set; } = new List<MaintenanceReminder>();
    public ICollection<Document> Documents { get; private set; } = new List<Document>();
    
    // Audit Properties
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }

    // Private constructor for EF Core
    private Car() { }

    // Factory method for creating a new car
    public static Car Create(
        string vin,
        string make,
        string model,
        int year,
        int ownerId,
        string? color = null,
        string? licensePlate = null,
        int currentMileage = 0)
    {
        ValidateVIN(vin);
        ValidateYear(year);
        ValidateMileage(currentMileage);

        var car = new Car
        {
            VIN = vin.Trim().ToUpperInvariant(),
            Make = make.Trim(),
            Model = model.Trim(),
            Year = year,
            Color = color?.Trim(),
            LicensePlate = licensePlate?.Trim().ToUpperInvariant(),
            CurrentMileage = currentMileage,
            OwnerId = ownerId
        };

        car.AddDomainEvent(new CarCreatedEvent(car));
        return car;
    }

    // Business Methods
    public void UpdateMileage(int newMileage)
    {
        if (newMileage < CurrentMileage)
            throw new DomainException("New mileage cannot be less than current mileage");

        CurrentMileage = newMileage;
        CheckMaintenanceReminders();
    }

    public void UpdateDetails(string make, string model, int year, string? color, string? licensePlate)
    {
        ValidateYear(year);
        
        Make = make.Trim();
        Model = model.Trim();
        Year = year;
        Color = color?.Trim();
        LicensePlate = licensePlate?.Trim().ToUpperInvariant();
    }

    public void AddMaintenanceRecord(MaintenanceRecord record)
    {
        MaintenanceRecords.Add(record);
        
        if (record.ServiceDate.HasValue && record.MileageAtService > CurrentMileage)
        {
            CurrentMileage = record.MileageAtService;
        }
    }

    public void AddReminder(MaintenanceReminder reminder)
    {
        Reminders.Add(reminder);
    }

    public void AddDocument(Document document)
    {
        Documents.Add(document);
    }

    private void CheckMaintenanceReminders()
    {
        foreach (var reminder in Reminders.Where(r => r.IsActive))
        {
            if (reminder.DueAtMileage.HasValue && CurrentMileage >= reminder.DueAtMileage.Value)
            {
                AddDomainEvent(new ReminderTriggeredEvent(this, reminder));
            }
        }
    }

    // Validation Methods
    private static void ValidateVIN(string vin)
    {
        if (string.IsNullOrWhiteSpace(vin))
            throw new DomainException("VIN is required");

        if (vin.Length != 17)
            throw new DomainException("VIN must be 17 characters");

        if (!vin.All(c => char.IsLetterOrDigit(c)))
            throw new DomainException("VIN must contain only letters and numbers");
    }

    private static void ValidateYear(int year)
    {
        var currentYear = DateTime.UtcNow.Year;
        if (year < 1900 || year > currentYear + 1)
            throw new DomainException($"Year must be between 1900 and {currentYear + 1}");
    }

    private static void ValidateMileage(int mileage)
    {
        if (mileage < 0)
            throw new DomainException("Mileage cannot be negative");

        if (mileage > 1_000_000)
            throw new DomainException("Mileage seems unrealistic");
    }

    // Computed Properties
    public int AgeInYears => DateTime.UtcNow.Year - Year;
    
    public MaintenanceRecord? LastMaintenanceRecord => 
        MaintenanceRecords.OrderByDescending(m => m.ServiceDate).FirstOrDefault();
    
    public decimal TotalMaintenanceCost => 
        MaintenanceRecords.Where(m => m.Status == MaintenanceStatus.Completed).Sum(m => m.TotalCost);
    
    public int DaysSinceLastService => LastMaintenanceRecord?.ServiceDate.HasValue == true
        ? (DateTime.UtcNow - LastMaintenanceRecord.ServiceDate.Value).Days
        : int.MaxValue;
}

/// <summary>
/// Base entity class with common properties
/// </summary>
public abstract class BaseEntity
{
    public int Id { get; protected set; }
    
    private readonly List<DomainEvent> _domainEvents = new();
    public IReadOnlyCollection<DomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    protected void AddDomainEvent(DomainEvent eventItem)
    {
        _domainEvents.Add(eventItem);
    }

    public void ClearDomainEvents()
    {
        _domainEvents.Clear();
    }
}

/// <summary>
/// Interface for auditable entities
/// </summary>
public interface IAuditable
{
    DateTime CreatedAt { get; set; }
    string? CreatedBy { get; set; }
    DateTime? UpdatedAt { get; set; }
    string? UpdatedBy { get; set; }
}

/// <summary>
/// Interface for soft-deletable entities
/// </summary>
public interface ISoftDelete
{
    bool IsDeleted { get; set; }
    DateTime? DeletedAt { get; set; }
}

/// <summary>
/// Base domain event class
/// </summary>
public abstract record DomainEvent
{
    public DateTime OccurredOn { get; } = DateTime.UtcNow;
}

/// <summary>
/// Car created domain event
/// </summary>
public record CarCreatedEvent(Car Car) : DomainEvent;

/// <summary>
/// Reminder triggered domain event
/// </summary>
public record ReminderTriggeredEvent(Car Car, MaintenanceReminder Reminder) : DomainEvent;

/// <summary>
/// Domain exception class
/// </summary>
public class DomainException : Exception
{
    public DomainException(string message) : base(message) { }
    public DomainException(string message, Exception innerException) : base(message, innerException) { }
}
