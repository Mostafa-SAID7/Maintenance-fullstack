# Use the official .NET 8 SDK image to build the application
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj files and restore dependencies
COPY ["src/CarMaintenance.Api/CarMaintenance.Api.csproj", "src/CarMaintenance.Api/"]
COPY ["src/CarMaintenance.Application/CarMaintenance.Application.csproj", "src/CarMaintenance.Application/"]
COPY ["src/CarMaintenance.Domain/CarMaintenance.Domain.csproj", "src/CarMaintenance.Domain/"]
COPY ["src/CarMaintenance.Infrastructure/CarMaintenance.Infrastructure.csproj", "src/CarMaintenance.Infrastructure/"]
COPY ["src/CarMaintenance.Shared/CarMaintenance.Shared.csproj", "src/CarMaintenance.Shared/"]

RUN dotnet restore "src/CarMaintenance.Api/CarMaintenance.Api.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/src/CarMaintenance.Api"
RUN dotnet build "CarMaintenance.Api.csproj" -c Release -o /app/build

# Publish the application
FROM build AS publish
RUN dotnet publish "CarMaintenance.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Use the official .NET 8 runtime image to run the application
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Expose port 80
EXPOSE 80

# Set the entry point
ENTRYPOINT ["dotnet", "CarMaintenance.Api.dll"]