using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using CarMaintenance.Api.DTOs;
using CarMaintenance.Api.Models;
using CarMaintenance.Application.Commands.Cars;
using CarMaintenance.Application.Queries.Cars;
using MediatR;
using CarMaintenance.Shared.Models;

namespace CarMaintenance.Api.Controllers;

/// <summary>
/// Enhanced cars controller with CQRS integration and advanced features
/// Supports full CRUD operations, advanced filtering, pagination, and predictive analytics
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/cars")]
[Produces("application/json")]
[Authorize]
public class CarsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<CarsController> _logger;
    private readonly ICacheService _cacheService;
    private readonly IMapper _mapper;

    public CarsController(
        IMediator mediator,
        ILogger<CarsController> logger,
        ICacheService cacheService,
        IMapper mapper)
    {
        _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _cacheService = cacheService ?? throw new ArgumentNullException(nameof(cacheService));
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
    }

    /// <summary>
    /// Get paginated list of cars with advanced filtering
    /// </summary>
    /// <param name="request">Pagination and filter parameters</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Paginated list of cars</returns>
    [HttpGet]
    [RateLimiting("fixed")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<CarDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetCars([FromQuery] GetCarsQuery request, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Getting cars with filters: {Filters}", 
                new { request.PageNumber, request.PageSize, request.VinFilter, request.MakeFilter, request.SearchText });

            // Check cache first
            var cacheKey = $"cars_{request.GetCacheKey()}";
            var cachedResult = await _cacheService.GetAsync<PagedResult<CarDto>>(cacheKey, cancellationToken);
            
            if (cachedResult != null)
            {
                _logger.LogDebug("Returning cached cars result");
                return Ok(ApiResponse<PagedResult<CarDto>>.Success(cachedResult, "Cars retrieved from cache"));
            }

            // Execute CQRS query
            var query = new GetCarsQuery
            {
                PageNumber = request.PageNumber,
                PageSize = request.PageSize,
                VinFilter = request.VinFilter,
                MakeFilter = request.MakeFilter,
                ModelFilter = request.ModelFilter,
                YearFrom = request.YearFrom,
                YearTo = request.YearTo,
                OwnerId = request.OwnerId,
                IncludeInactive = request.IncludeInactive,
                SearchText = request.SearchText,
                SortBy = request.SortBy,
                SortOrder = request.SortOrder,
                IncludeTotalCount = true
            };

            var result = await _mediator.Send(query, cancellationToken);

            if (!result.IsSuccess)
            {
                return BadRequest(ApiResponse<object>.Failure(result.ErrorMessage));
            }

            // Cache successful results for 5 minutes
            await _cacheService.SetAsync(cacheKey, result.Cars, TimeSpan.FromMinutes(5), cancellationToken);

            return Ok(ApiResponse<PagedResult<CarDto>>.Success(result.Cars, "Cars retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cars");
            return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse<object>.Failure("Failed to retrieve cars"));
        }
    }

    /// <summary>
    /// Get specific car by ID with related data
    /// </summary>
    /// <param name="id">Car ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Car details with related information</returns>
    [HttpGet("{id}")]
    [RateLimiting("fixed")]
    [ProducesResponseType(typeof(ApiResponse<CarDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCar(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Getting car with ID: {CarId}", id);

            // Check cache first
            var cacheKey = $"car_{id}";
            var cachedResult = await _cacheService.GetAsync<CarDto>(cacheKey, cancellationToken);
            
            if (cachedResult != null)
            {
                _logger.LogDebug("Returning cached car result for ID: {CarId}", id);
                return Ok(ApiResponse<CarDto>.Success(cachedResult, "Car retrieved from cache"));
            }

            // Execute CQRS query to get single car
            var query = new GetCarByIdQuery { CarId = id, IncludeRelatedData = true };
            var result = await _mediator.Send(query, cancellationToken);

            if (!result.IsSuccess)
            {
                if (result.ErrorMessage?.Contains("not found", StringComparison.OrdinalIgnoreCase) == true)
                {
                    return NotFound(ApiResponse<object>.Failure(result.ErrorMessage));
                }
                return BadRequest(ApiResponse<object>.Failure(result.ErrorMessage));
            }

            // Cache for 10 minutes
            await _cacheService.SetAsync(cacheKey, result.Car, TimeSpan.FromMinutes(10), cancellationToken);

            return Ok(ApiResponse<CarDto>.Success(result.Car, "Car retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting car with ID: {CarId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse<object>.Failure("Failed to retrieve car"));
        }
    }

    /// <summary>
    /// Create new car using CQRS command
    /// </summary>
    /// <param name="request">Car creation request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Created car details</returns>
    [HttpPost]
    [RateLimiting("fixed")]
    [ProducesResponseType(typeof(ApiResponse<CarDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateCar([FromBody] CreateCarRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Creating new car with VIN: {Vin}", request.Vin);

            // Validate request
            var validationResult = ValidateCreateCarRequest(request);
            if (!validationResult.IsValid)
            {
                return BadRequest(ApiResponse<object>.Failure(validationResult.GetErrorMessage()));
            }

            // Execute CQRS command
            var command = new CreateCarCommand
            {
                Vin = request.Vin,
                Make = request.Make,
                Model = request.Model,
                Year = request.Year,
                LicensePlate = request.LicensePlate,
                Color = request.Color,
                Mileage = request.Mileage,
                OwnerId = request.OwnerId,
                Notes = request.Notes,
                UserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "System"
            };

            var result = await _mediator.Send(command, cancellationToken);

            if (!result.IsSuccess)
            {
                return BadRequest(ApiResponse<object>.Failure(result.ErrorMessage));
            }

            // Clear relevant caches
            await ClearCarsCacheAsync(cancellationToken);

            _logger.LogInformation("Car created successfully with ID: {CarId}, VIN: {Vin}", result.Id, result.Vin);

            var carDto = new CarDto
            {
                Id = result.Id,
                Vin = result.Vin,
                Make = result.Make,
                Model = result.Model,
                Year = result.Year,
                LicensePlate = result.LicensePlate,
                Color = result.Color,
                Mileage = result.Mileage,
                OwnerId = result.OwnerId,
                IsActive = true,
                CreatedAt = result.CreatedAt,
                UpdatedAt = DateTime.UtcNow
            };

            return CreatedAtAction(nameof(GetCar), new { id = result.Id }, ApiResponse<CarDto>.Success(carDto, "Car created successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating car with VIN: {Vin}", request.Vin);
            return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse<object>.Failure("Failed to create car"));
        }
    }

    /// <summary>
    /// Update existing car using CQRS command
    /// </summary>
    /// <param name="id">Car ID</param>
    /// <param name="request">Car update request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated car details</returns>
    [HttpPut("{id}")]
    [RateLimiting("fixed")]
    [ProducesResponseType(typeof(ApiResponse<CarDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateCar(Guid id, [FromBody] UpdateCarRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Updating car with ID: {CarId}", id);

            // Validate request
            var validationResult = ValidateUpdateCarRequest(request);
            if (!validationResult.IsValid)
            {
                return BadRequest(ApiResponse<object>.Failure(validationResult.GetErrorMessage()));
            }

            // Execute CQRS command
            var command = new UpdateCarCommand
            {
                CarId = id,
                Make = request.Make,
                Model = request.Model,
                Year = request.Year,
                LicensePlate = request.LicensePlate,
                Color = request.Color,
                Mileage = request.Mileage,
                Notes = request.Notes,
                UserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "System"
            };

            var result = await _mediator.Send(command, cancellationToken);

            if (!result.IsSuccess)
            {
                if (result.ErrorMessage?.Contains("not found", StringComparison.OrdinalIgnoreCase) == true)
                {
                    return NotFound(ApiResponse<object>.Failure(result.ErrorMessage));
                }
                return BadRequest(ApiResponse<object>.Failure(result.ErrorMessage));
            }

            // Clear relevant caches
            await ClearCarCacheAsync(id, cancellationToken);
            await ClearCarsCacheAsync(cancellationToken);

            _logger.LogInformation("Car updated successfully with ID: {CarId}", result.Id);

            var carDto = new CarDto
            {
                Id = result.Id,
                Vin = result.Vin,
                Make = result.Make,
                Model = result.Model,
                Year = result.Year,
                LicensePlate = result.LicensePlate,
                Color = result.Color,
                Mileage = result.Mileage,
                OwnerId = result.OwnerId,
                IsActive = true,
                CreatedAt = result.CreatedAt,
                UpdatedAt = DateTime.UtcNow
            };

            return Ok(ApiResponse<CarDto>.Success(carDto, "Car updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating car with ID: {CarId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse<object>.Failure("Failed to update car"));
        }
    }

    /// <summary>
    /// Soft delete car (deactivate)
    /// </summary>
    /// <param name="id">Car ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Deletion result</returns>
    [HttpDelete("{id}")]
    [RateLimiting("fixed")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteCar(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Deleting car with ID: {CarId}", id);

            // Execute CQRS command
            var command = new DeleteCarCommand
            {
                CarId = id,
                UserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "System"
            };

            var result = await _mediator.Send(command, cancellationToken);

            if (!result.IsSuccess)
            {
                if (result.ErrorMessage?.Contains("not found", StringComparison.OrdinalIgnoreCase) == true)
                {
                    return NotFound(ApiResponse<object>.Failure(result.ErrorMessage));
                }
                return BadRequest(ApiResponse<object>.Failure(result.ErrorMessage));
            }

            // Clear relevant caches
            await ClearCarCacheAsync(id, cancellationToken);
            await ClearCarsCacheAsync(cancellationToken);

            _logger.LogInformation("Car deleted successfully with ID: {CarId}", result.CarId);

            return Ok(ApiResponse<object>.Success(null, "Car deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting car with ID: {CarId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse<object>.Failure("Failed to delete car"));
        }
    }

    /// <summary>
    /// Get cars by owner ID
    /// </summary>
    /// <param name="ownerId">Owner ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of cars owned by the specified owner</returns>
    [HttpGet("owner/{ownerId}")]
    [RateLimiting("fixed")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<CarDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCarsByOwner(Guid ownerId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Getting cars for owner: {OwnerId}", ownerId);

            // Check cache first
            var cacheKey = $"cars_owner_{ownerId}";
            var cachedResult = await _cacheService.GetAsync<IEnumerable<CarDto>>(cacheKey, cancellationToken);
            
            if (cachedResult != null)
            {
                return Ok(ApiResponse<IEnumerable<CarDto>>.Success(cachedResult, "Cars retrieved from cache"));
            }

            // Execute CQRS query
            var query = new GetCarsByOwnerQuery { OwnerId = ownerId, IncludeInactive = false };
            var result = await _mediator.Send(query, cancellationToken);

            if (!result.IsSuccess)
            {
                return BadRequest(ApiResponse<object>.Failure(result.ErrorMessage));
            }

            // Cache for 15 minutes
            await _cacheService.SetAsync(cacheKey, result.Cars, TimeSpan.FromMinutes(15), cancellationToken);

            return Ok(ApiResponse<IEnumerable<CarDto>>.Success(result.Cars, "Cars retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cars for owner: {OwnerId}", ownerId);
            return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse<object>.Failure("Failed to retrieve cars"));
        }
    }

    /// <summary>
    /// Get cars maintenance history
    /// </summary>
    /// <param name="id">Car ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Maintenance history for the car</returns>
    [HttpGet("{id}/maintenance")]
    [RateLimiting("fixed")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<MaintenanceRecordDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMaintenanceHistory(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Getting maintenance history for car: {CarId}", id);

            // Execute CQRS query
            var query = new GetCarMaintenanceHistoryQuery { CarId = id };
            var result = await _mediator.Send(query, cancellationToken);

            if (!result.IsSuccess)
            {
                return BadRequest(ApiResponse<object>.Failure(result.ErrorMessage));
            }

            return Ok(ApiResponse<IEnumerable<MaintenanceRecordDto>>.Success(result.MaintenanceRecords, "Maintenance history retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting maintenance history for car: {CarId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse<object>.Failure("Failed to retrieve maintenance history"));
        }
    }

    /// <summary>
    /// Get predictive maintenance analytics for a car
    /// </summary>
    /// <param name="id">Car ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Predictive maintenance analytics</returns>
    [HttpGet("{id}/predictive-maintenance")]
    [RateLimiting("fixed")]
    [ProducesResponseType(typeof(ApiResponse<PredictiveMaintenanceDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPredictiveMaintenance(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Getting predictive maintenance for car: {CarId}", id);

            // Execute CQRS query
            var query = new GetPredictiveMaintenanceQuery { CarId = id };
            var result = await _mediator.Send(query, cancellationToken);

            if (!result.IsSuccess)
            {
                return BadRequest(ApiResponse<object>.Failure(result.ErrorMessage));
            }

            return Ok(ApiResponse<PredictiveMaintenanceDto>.Success(result.Prediction, "Predictive maintenance retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting predictive maintenance for car: {CarId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse<object>.Failure("Failed to retrieve predictive maintenance"));
        }
    }

    #region Private Methods

    /// <summary>
    /// Validates create car request
    /// </summary>
    /// <param name="request">The request to validate</param>
    /// <returns>Validation result</returns>
    private ValidationResult ValidateCreateCarRequest(CreateCarRequest request)
    {
        var result = new ValidationResult();

        if (string.IsNullOrWhiteSpace(request.Vin))
            result.AddError(nameof(request.Vin), "VIN is required");
        else if (request.Vin.Length != 17)
            result.AddError(nameof(request.Vin), "VIN must be exactly 17 characters");

        if (string.IsNullOrWhiteSpace(request.Make))
            result.AddError(nameof(request.Make), "Make is required");

        if (string.IsNullOrWhiteSpace(request.Model))
            result.AddError(nameof(request.Model), "Model is required");

        if (request.Year < 1886 || request.Year > DateTime.UtcNow.Year + 1)
            result.AddError(nameof(request.Year), "Invalid year");

        if (string.IsNullOrWhiteSpace(request.LicensePlate))
            result.AddError(nameof(request.LicensePlate), "License plate is required");

        if (request.Mileage < 0)
            result.AddError(nameof(request.Mileage), "Mileage cannot be negative");

        if (request.OwnerId == Guid.Empty)
            result.AddError(nameof(request.OwnerId), "Owner ID is required");

        return result;
    }

    /// <summary>
    /// Validates update car request
    /// </summary>
    /// <param name="request">The request to validate</param>
    /// <returns>Validation result</returns>
    private ValidationResult ValidateUpdateCarRequest(UpdateCarRequest request)
    {
        var result = new ValidationResult();

        if (string.IsNullOrWhiteSpace(request.Make))
            result.AddError(nameof(request.Make), "Make is required");

        if (string.IsNullOrWhiteSpace(request.Model))
            result.AddError(nameof(request.Model), "Model is required");

        if (request.Year < 1886 || request.Year > DateTime.UtcNow.Year + 1)
            result.AddError(nameof(request.Year), "Invalid year");

        if (string.IsNullOrWhiteSpace(request.LicensePlate))
            result.AddError(nameof(request.LicensePlate), "License plate is required");

        if (request.Mileage < 0)
            result.AddError(nameof(request.Mileage), "Mileage cannot be negative");

        return result;
    }

    /// <summary>
    /// Clears car-specific cache
    /// </summary>
    /// <param name="carId">Car ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>A task representing the operation</returns>
    private async Task ClearCarCacheAsync(Guid carId, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"car_{carId}";
        await _cacheService.RemoveAsync(cacheKey, cancellationToken);
    }

    /// <summary>
    /// Clears cars list cache
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>A task representing the operation</returns>
    private async Task ClearCarsCacheAsync(CancellationToken cancellationToken = default)
    {
        await _cacheService.RemoveByPatternAsync("cars_", cancellationToken);
    }

    #endregion

    #region DTOs

    /// <summary>
    /// Car creation request DTO
    /// </summary>
    public class CreateCarRequest
    {
        public string Vin { get; set; } = string.Empty;
        public string Make { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public int Year { get; set; }
        public string LicensePlate { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public int Mileage { get; set; }
        public Guid OwnerId { get; set; }
        public string? Notes { get; set; }
    }

    /// <summary>
    /// Car update request DTO
    /// </summary>
    public class UpdateCarRequest
    {
        public string Make { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public int Year { get; set; }
        public string LicensePlate { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public int Mileage { get; set; }
        public string? Notes { get; set; }
    }

    /// <summary>
    /// Cars query request DTO (extends the CQRS query)
    /// </summary>
    public class GetCarsQuery : GetCarsQuery
    {
        // Additional properties can be added here if needed
    }

    #endregion
}
