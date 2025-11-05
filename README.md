# Car Maintenance API

A comprehensive car maintenance management system built with ASP.NET Core, Angular, and Flutter.

## Features

- User authentication and authorization
- Car management
- Maintenance record tracking
- Predictive maintenance using machine learning
- Real-time chat with SignalR
- Notifications
- Multi-platform support (Web, Mobile)

## Architecture

This project follows Clean Architecture principles with the following layers:

- **Domain**: Core business entities and logic
- **Application**: Application services and interfaces
- **Infrastructure**: Data access, external services, and persistence
- **Api**: RESTful API controllers and hosting
- **Shared**: Shared DTOs and utilities

## Technologies

- **Backend**: ASP.NET Core 8, Entity Framework Core, SignalR, Hangfire
- **Frontend**: Angular 18
- **Mobile**: Flutter
- **Database**: SQL Server
- **Authentication**: JWT Tokens
- **Containerization**: Docker

## Getting Started

### Prerequisites

- .NET 8 SDK
- Node.js 18+
- Flutter SDK
- Docker Desktop
- SQL Server (or use Docker container)

### Running with Docker

1. Clone the repository
2. Run `docker-compose up --build`
3. The API will be available at `http://localhost:8080`

### Manual Setup

1. **Backend Setup**:
   ```bash
   cd src/CarMaintenance.Api
   dotnet restore
   dotnet run
   ```

2. **Frontend Setup**:
   ```bash
   cd ClientApp
   npm install
   ng serve
   ```

3. **Mobile Setup**:
   ```bash
   cd mobile
   flutter pub get
   flutter run
   ```

## API Documentation

The API documentation is available via Swagger at `/swagger` when running the application.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

This project is licensed under the MIT License.