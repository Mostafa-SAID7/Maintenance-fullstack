# Use the official .NET 9.0 runtime as base image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

# Use the official .NET 9.0 SDK as build image
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj files and restore dependencies
COPY ["CarMaintenance.Api/CarMaintenance.Api.csproj", "CarMaintenance.Api/"]
COPY ["CarMaintenance.Application/CarMaintenance.Application.csproj", "CarMaintenance.Application/"]
COPY ["CarMaintenance.Domain/CarMaintenance.Domain.csproj", "CarMaintenance.Domain/"]
COPY ["CarMaintenance.Infrastructure/CarMaintenance.Infrastructure.csproj", "CarMaintenance.Infrastructure/"]

# Restore dependencies
RUN dotnet restore "CarMaintenance.Api/CarMaintenance.Api.csproj"

# Copy source code
COPY . .

# Build the application
WORKDIR "/src/CarMaintenance.Api"
RUN dotnet build "CarMaintenance.Api.csproj" -c Release -o /app/build

# Publish the application
FROM build AS publish
RUN dotnet publish "CarMaintenance.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final stage
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Create non-root user for security
RUN adduser --disabled-password --gecos '' appuser
USER appuser

ENTRYPOINT ["dotnet", "CarMaintenance.Api.dll"]