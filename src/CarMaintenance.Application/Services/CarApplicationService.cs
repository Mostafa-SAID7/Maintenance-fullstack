using MediatR;
using Microsoft.Extensions.Logging;
using CarMaintenance.Application.DTOs;
using CarMaintenance.Domain.Entities;
using CarMaintenance.Domain.ValueObjects;
using CarMaintenance.Shared.Models;

namespace CarMaintenance.Application.Services;

/// <summary>
/// Application service for car-related operations following Clean Code principles
/// Encapsulates business logic and orchestrates domain entities with single responsibility methods
/// </summary>
public class CarApplicationService
{
    private readonly ICarRepository _carRepository;
    private readonly IOwnerRepository _ownerRepository;
    private readonly IServiceTypeRepository _serviceTypeRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<CarApplicationService> _logger;
    private readonly CarValidationService _validationService;

    public CarApplicationService(
        ICarRepository carRepository,
        IOwnerRepository ownerRepository,
        IServiceTypeRepository serviceTypeRepository,
        IMapper mapper,
        ILogger<CarApplicationService> logger)
    {
        _carRepository = carRepository ?? throw new ArgumentNullException(nameof(carRepository));
        _ownerRepository = ownerRepository ?? throw new ArgumentNullException(nameof(ownerRepository));
        _serviceTypeRepository = serviceTypeRepository ?? throw new ArgumentNullException(nameof(serviceTypeRepository));
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _validationService = new CarValidationService();
    }

    #region Public API Methods

    public async Task<CarDto> CreateCarAsync(CreateCarRequest request, CancellationToken cancellationToken = default)
    {
        return await CreateCarInternalAsync(request, cancellationToken);
    }

    public async Task<CarDto> UpdateCarAsync(int carId, UpdateCarRequest request, CancellationToken cancellationToken = default)
    {
        return await UpdateCarInternalAsync(carId, request, cancellationToken);
    }

    public async Task<CarDto?> GetCarByIdAsync(int carId, CancellationToken cancellationToken = default)
    {
        return await GetCarInternalAsync(carId, cancellationToken);
    }

    public async Task<CarDtoResult> GetCarsAsync(GetCarsRequest request, CancellationToken cancellationToken = default)
    {
        return await GetCarsInternalAsync(request, cancellationToken);
    }

    public async Task<CarDto> TransferOwnershipAsync(int carId, int newOwnerId, string reason, CancellationToken cancellationToken = default)
    {
        return await TransferOwnershipInternalAsync(carId, newOwnerId, reason, cancellationToken);
    }

    public async Task<MaintenanceRecordDto> RecordMaintenanceAsync(int carId, RecordMaintenanceRequest request, CancellationToken cancellationToken = default)
    {
        return await RecordMaintenanceInternalAsync(carId, request, cancellationToken);
    }

    public async Task<CarDto> DeactivateCarAsync(int carId, string reason, CancellationToken cancellationToken = default)
    {
        return await DeactivateCarInternalAsync(carId, reason, cancellationToken);
    }

    #endregion

    #region Private Implementation Methods

    private async Task<CarDto> CreateCarInternalAsync(CreateCarRequest request, CancellationToken cancellationToken)
    {
        LogCreatingCar(request);

        var validationResult = _validationService.ValidateCreateRequest(request);
        ThrowIfInvalid(validationResult);

        var (owner, car) = await PrepareNewCarAsync(request, cancellationToken);
        var createdCar = await SaveNewCarAsync(car, cancellationToken);
        
        LogCarCreated(createdCar);

        return MapToDto(createdCar);
    }

    private async Task<CarDto> UpdateCarInternalAsync(int carId, UpdateCarRequest request, CancellationToken cancellationToken)
    {
        LogUpdatingCar(carId);

        var car = await GetExistingCarAsync(carId, cancellationToken);
        
        var validationResult = _validationService.ValidateUpdateRequest(request);
        ThrowIfInvalid(validationResult);
        
        UpdateCarWithRequest(car, request);
        var updatedCar = await SaveCarAsync(car, cancellationToken);
        
        LogCarUpdated(carId);

        return MapToDto(updatedCar);
    }

    private async Task<CarDto?> GetCarInternalAsync(int carId, CancellationToken cancellationToken)
    {
        LogGettingCar(carId);

        var car = await _carRepository.GetByIdAsync(carId, cancellationToken);
        
        return car != null ? MapToDto(car) : null;
    }

    private async Task<CarDtoResult> GetCarsInternalAsync(GetCarsRequest request, CancellationToken cancellationToken)
    {
        LogGettingCars(request);

        var validatedRequest = _validationService.ValidatePagedRequest(request);
        var (cars, totalCount) = await _carRepository.GetCarsAsync(validatedRequest, cancellationToken);
        var carDtos = MapToDtoList(cars);

        return new CarDtoResult
        {
            Items = carDtos,
            TotalCount = totalCount,
            PageNumber = validatedRequest.PageNumber,
            PageSize = validatedRequest.PageSize,
            TotalPages = (int)Math.Ceiling((double)totalCount / validatedRequest.PageSize)
        };
    }

    private async Task<CarDto> TransferOwnershipInternalAsync(int carId, int newOwnerId, string reason, CancellationToken cancellationToken)
    {
        LogTransferringOwnership(carId, newOwnerId);

        var (car, newOwner) = await PrepareOwnershipTransferAsync(carId, newOwnerId, cancellationToken);
        
        car.TransferOwnership(newOwnerId, reason);
        var updatedCar = await SaveCarAsync(car, cancellationToken);
        
        LogOwnershipTransferred(carId, newOwnerId);

        return MapToDto(updatedCar);
    }

    private async Task<MaintenanceRecordDto> RecordMaintenanceInternalAsync(int carId, RecordMaintenanceRequest request, CancellationToken cancellationToken)
    {
        LogRecordingMaintenance(carId);

        var (car, serviceType) = await PrepareMaintenanceRecordingAsync(carId, request.ServiceTypeId, cancellationToken);
        
        var maintenanceRecord = car.RecordMaintenance(
            request.ServiceTypeId,
            request.ServiceDate,
            request.Mileage,
            request.Description,
            request.Cost,
            request.Notes);

        await SaveCarAsync(car, cancellationToken);
        LogMaintenanceRecorded(carId, maintenanceRecord.Id);

        return MapToDto(maintenanceRecord);
    }

    private async Task<CarDto> DeactivateCarInternalAsync(int carId, string reason, CancellationToken cancellationToken)
    {
        LogDeactivatingCar(carId, reason);

        var car = await GetExistingCarAsync(carId, cancellationToken);
        
        if (IsAlreadyDeactivated(car))
        {
            LogCarAlreadyDeactivated(carId);
            return MapToDto(car);
        }

        car.Deactivate(reason);
        var updatedCar = await SaveCarAsync(car, cancellationToken);
        
        LogCarDeactivated(carId);

        return MapToDto(updatedCar);
    }

    #endregion

    #region Helper Methods

    private async Task<(Owner owner, Car car)> PrepareNewCarAsync(CreateCarRequest request, CancellationToken cancellationToken)
    {
        var owner = await _ownerRepository.GetByIdAsync(request.OwnerId, cancellationToken)
            ?? throw new NotFoundException($"Owner with ID {request.OwnerId} not found");

        await EnsureVinIsUniqueAsync(request.Vin, cancellationToken);

        var vin = Vin.Create(request.Vin);
        var car = new Car(
            request.Make,
            request.Model,
            request.Year,
            vin,
            request.OwnerId,
            request.Color,
            request.LicensePlate,
            request.Mileage);

        await SetPreferredServiceTypeIfSpecifiedAsync(car, request.PreferredServiceTypeId, cancellationToken);

        return (owner, car);
    }

    private async Task<Car> SaveNewCarAsync(Car car, CancellationToken cancellationToken)
    {
        return await _carRepository.AddAsync(car, cancellationToken);
    }

    private async Task<Car> SaveCarAsync(Car car, CancellationToken cancellationToken)
    {
        return await _carRepository.UpdateAsync(car, cancellationToken);
    }

    private async Task<Car> GetExistingCarAsync(int carId, CancellationToken cancellationToken)
    {
        return await _carRepository.GetByIdAsync(carId, cancellationToken)
            ?? throw new NotFoundException($"Car with ID {carId} not found");
    }

    private async Task<(Car car, Owner newOwner)> PrepareOwnershipTransferAsync(int carId, int newOwnerId, CancellationToken cancellationToken)
    {
        var car = await GetExistingCarAsync(carId, cancellationToken);
        var newOwner = await _ownerRepository.GetByIdAsync(newOwnerId, cancellationToken)
            ?? throw new NotFoundException($"Owner with ID {newOwnerId} not found");

        if (car.OwnerId == newOwnerId)
        {
            throw new BusinessRuleViolationException("Cannot transfer ownership to the same owner");
        }

        return (car, newOwner);
    }

    private async Task<(Car car, ServiceType serviceType)> PrepareMaintenanceRecordingAsync(int carId, int serviceTypeId, CancellationToken cancellationToken)
    {
        var car = await GetExistingCarAsync(carId, cancellationToken);
        var serviceType = await _serviceTypeRepository.GetByIdAsync(serviceTypeId, cancellationToken)
            ?? throw new NotFoundException($"Service type with ID {serviceTypeId} not found");

        return (car, serviceType);
    }

    private async Task SetPreferredServiceTypeIfSpecifiedAsync(Car car, int? serviceTypeId, CancellationToken cancellationToken)
    {
        if (serviceTypeId.HasValue)
        {
            var serviceType = await _serviceTypeRepository.GetByIdAsync(serviceTypeId.Value, cancellationToken);
            if (serviceType != null)
            {
                car.ServiceTypeId = serviceType.Id;
            }
        }
    }

    private async Task EnsureVinIsUniqueAsync(string vin, CancellationToken cancellationToken)
    {
        var existingCar = await _carRepository.GetByVinAsync(vin, cancellationToken);
        if (existingCar != null)
        {
            throw new BusinessRuleViolationException($"A car with VIN {vin} already exists");
        }
    }

    private void UpdateCarWithRequest(Car car, UpdateCarRequest request)
    {
        car.Update(
            request.Make,
            request.Model,
            request.Year,
            request.Color,
            request.LicensePlate,
            request.Mileage);
    }

    private static bool IsAlreadyDeactivated(Car car) => !car.IsActive;

    private CarDto MapToDto(Car car)
    {
        return new CarDto
        {
            Id = car.Id,
            Make = car.Make,
            Model = car.Model,
            Year = car.Year,
            Color = car.Color,
            LicensePlate = car.LicensePlate,
            Vin = car.Vin.Value,
            Mileage = car.Mileage,
            OwnerId = car.OwnerId,
            IsActive = car.IsActive,
            CreatedAt = car.CreatedAt,
            UpdatedAt = car.UpdatedAt
        };
    }

    private MaintenanceRecordDto MapToDto(MaintenanceRecord record)
    {
        return new MaintenanceRecordDto
        {
            Id = record.Id,
            CarId = record.CarId,
            ServiceTypeId = record.ServiceTypeId,
            Description = record.Description,
            ServiceDate = record.ServiceDate,
            Mileage = record.Mileage,
            Cost = record.Cost ?? 0,
            Notes = record.Notes,
            IsCompleted = record.IsCompleted
        };
    }

    private List<CarDto> MapToDtoList(List<Car> cars)
    {
        return cars.Select(MapToDto).ToList();
    }

    private static void ThrowIfInvalid(ValidationResult validationResult)
    {
        if (!validationResult.IsValid)
        {
            throw new ValidationException("Validation failed", validationResult);
        }
    }

    #endregion

    #region Logging Methods

    private void LogCreatingCar(CreateCarRequest request)
    {
        _logger.LogInformation("Creating car for owner {OwnerId} with VIN {Vin}", 
            request.OwnerId, request.Vin);
    }

    private void LogCarCreated(Car car)
    {
        _logger.LogInformation("Car created successfully with ID {CarId} and VIN {Vin}", 
            car.Id, car.Vin.Value);
    }

    private void LogUpdatingCar(int carId)
    {
        _logger.LogInformation("Updating car {CarId}", carId);
    }

    private void LogCarUpdated(int carId)
    {
        _logger.LogInformation("Car {CarId} updated successfully", carId);
    }

    private void LogGettingCar(int carId)
    {
        _logger.LogDebug("Getting car by ID {CarId}", carId);
    }

    private void LogGettingCars(GetCarsRequest request)
    {
        _logger.LogDebug("Getting cars with filters: {Filters}", 
            new { request.Make, request.Model, request.YearFrom, request.YearTo });
    }

    private void LogTransferringOwnership(int carId, int newOwnerId)
    {
        _logger.LogInformation("Transferring ownership of car {CarId} to owner {NewOwnerId}", 
            carId, newOwnerId);
    }

    private void LogOwnershipTransferred(int carId, int newOwnerId)
    {
        _logger.LogInformation("Ownership of car {CarId} transferred to owner {NewOwnerId}", 
            carId, newOwnerId);
    }

    private void LogRecordingMaintenance(int carId)
    {
        _logger.LogInformation("Recording maintenance for car {CarId}", carId);
    }

    private void LogMaintenanceRecorded(int carId, int recordId)
    {
        _logger.LogInformation("Maintenance recorded for car {CarId} with record ID {RecordId}", 
            carId, recordId);
    }

    private void LogDeactivatingCar(int carId, string reason)
    {
        _logger.LogInformation("Deactivating car {CarId}: {Reason}", carId, reason);
    }

    private void LogCarDeactivated(int carId)
    {
        _logger.LogInformation("Car {CarId} deactivated successfully", carId);
    }

    private void LogCarAlreadyDeactivated(int carId)
    {
        _logger.LogWarning("Car {CarId} is already deactivated", carId);
    }

    #endregion
}

/// <summary>
/// Separate validation service to follow Single Responsibility Principle
/// </summary>
public class CarValidationService
{
    public ValidationResult ValidateCreateRequest(CreateCarRequest request)
    {
        var result = new ValidationResult();

        ValidateRequiredFields(request, result);
        ValidateBusinessRules(request, result);
        ValidateLengthConstraints(request, result);

        return result;
    }

    public ValidationResult ValidateUpdateRequest(UpdateCarRequest request)
    {
        var result = new ValidationResult();

        ValidateUpdateBusinessRules(request, result);
        ValidateUpdateLengthConstraints(request, result);

        return result;
    }

    public GetCarsRequest ValidatePagedRequest(GetCarsRequest request)
    {
        request.PageNumber = Math.Max(1, request.PageNumber);
        request.PageSize = Math.Clamp(request.PageSize, 1, 100);

        return request;
    }

    private static void ValidateRequiredFields(CreateCarRequest request, ValidationResult result)
    {
        if (string.IsNullOrWhiteSpace(request.Make))
            result.AddError(nameof(request.Make), "Make is required");

        if (string.IsNullOrWhiteSpace(request.Model))
            result.AddError(nameof(request.Model), "Model is required");

        if (string.IsNullOrWhiteSpace(request.Vin))
            result.AddError(nameof(request.Vin), "VIN is required");

        if (request.OwnerId <= 0)
            result.AddError(nameof(request.OwnerId), "Valid owner ID is required");
    }

    private static void ValidateBusinessRules(CreateCarRequest request, ValidationResult result)
    {
        var currentYear = DateTime.UtcNow.Year;

        if (request.Year < 1886 || request.Year > currentYear + 1)
            result.AddError(nameof(request.Year), $"Year must be between 1886 and {currentYear + 1}");

        if (request.Mileage < 0)
            result.AddError(nameof(request.Mileage), "Mileage cannot be negative");
    }

    private static void ValidateLengthConstraints(CreateCarRequest request, ValidationResult result)
    {
        ValidateStringLength(request.Make, 50, nameof(request.Make), "Make", result);
        ValidateStringLength(request.Model, 50, nameof(request.Model), "Model", result);
    }

    private static void ValidateUpdateBusinessRules(UpdateCarRequest request, ValidationResult result)
    {
        var currentYear = DateTime.UtcNow.Year;

        if (request.Year.HasValue && (request.Year.Value < 1886 || request.Year.Value > currentYear + 1))
            result.AddError(nameof(request.Year), $"Year must be between 1886 and {currentYear + 1}");

        if (request.Mileage.HasValue && request.Mileage.Value < 0)
            result.AddError(nameof(request.Mileage), "Mileage cannot be negative");
    }

    private static void ValidateUpdateLengthConstraints(UpdateCarRequest request, ValidationResult result)
    {
        ValidateStringLength(request.Make, 50, nameof(request.Make), "Make", result);
        ValidateStringLength(request.Model, 50, nameof(request.Model), "Model", result);
    }

    private static void ValidateStringLength(string? value, int maxLength, string fieldName, string displayName, ValidationResult result)
    {
        if (!string.IsNullOrWhiteSpace(value) && value.Length > maxLength)
        {
            result.AddError(fieldName, $"{displayName} cannot exceed {maxLength} characters");
        }
    }
}

/// <summary>
/// Repository interfaces needed by the service
/// </summary>
public interface ICarRepository
{
    Task<Car?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Car?> GetByVinAsync(string vin, CancellationToken cancellationToken = default);
    Task<(List<Car> cars, int totalCount)> GetCarsAsync(GetCarsRequest request, CancellationToken cancellationToken = default);
    Task<Car> AddAsync(Car car, CancellationToken cancellationToken = default);
    Task<Car> UpdateAsync(Car car, CancellationToken cancellationToken = default);
}

public interface IOwnerRepository
{
    Task<Owner?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
}

public interface IServiceTypeRepository
{
    Task<ServiceType?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
}

/// <summary>
/// Simple interface for mapping objects (since AutoMapper might not be available)
/// </summary>
public interface IMapper
{
    TDest Map<TSource, TDest>(TSource source);
}

/// <summary>
/// Simple implementation of IMapper for basic mapping
/// </summary>
public class SimpleMapper : IMapper
{
    public TDest Map<TSource, TDest>(TSource source)
    {
        // This is a very basic implementation
        // In real code, use AutoMapper or similar library
        var destination = Activator.CreateInstance<TDest>();
        
        var sourceProperties = typeof(TSource).GetProperties();
        var destinationProperties = typeof(TDest).GetProperties();
        
        foreach (var sourceProp in sourceProperties)
        {
            var destProp = destinationProperties.FirstOrDefault(p => 
                p.Name == sourceProp.Name && 
                p.PropertyType == sourceProp.PropertyType);
            
            if (destProp != null && destProp.CanWrite)
            {
                destProp.SetValue(destination, sourceProp.GetValue(source));
            }
        }
        
        return destination;
    }
}

/// <summary>
/// Exception classes for business logic
/// </summary>
public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message) { }
}

public class BusinessRuleViolationException : Exception
{
    public BusinessRuleViolationException(string message) : base(message) { }
}

/// <summary>
/// Request/Response DTOs
/// </summary>
public class CreateCarRequest
{
    public string Make { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int Year { get; set; }
    public string Vin { get; set; } = string.Empty;
    public string? Color { get; set; }
    public string? LicensePlate { get; set; }
    public int Mileage { get; set; }
    public int OwnerId { get; set; }
    public int? PreferredServiceTypeId { get; set; }
}

public class UpdateCarRequest
{
    public string? Make { get; set; }
    public string? Model { get; set; }
    public int? Year { get; set; }
    public string? Color { get; set; }
    public string? LicensePlate { get; set; }
    public int? Mileage { get; set; }
}

public class GetCarsRequest
{
    public string? Make { get; set; }
    public string? Model { get; set; }
    public int? YearFrom { get; set; }
    public int? YearTo { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public bool IncludeInactive { get; set; } = false;
}

public class RecordMaintenanceRequest
{
    public int ServiceTypeId { get; set; }
    public DateTime ServiceDate { get; set; }
    public int Mileage { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Cost { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Paged result DTO for cars
/// </summary>
public class CarDtoResult
{
    public List<CarDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}