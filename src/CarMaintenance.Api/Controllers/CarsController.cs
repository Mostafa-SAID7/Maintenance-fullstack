using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using CarMaintenance.Api.DTOs;
using CarMaintenance.Domain.Entities;
using MediatR;
using CarMaintenance.Shared.Models;

namespace CarMaintenance.Api.Controllers;

/// <summary>
/// Cars controller following clean architecture principles
/// Manages car-related operations with proper separation of concerns
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

    public CarsController(
        IMediator mediator,
        ILogger<CarsController> logger)
    {
        _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Get paginated list of cars using CQRS
    /// </summary>
    /// <param name="query">Query parameters for filtering and pagination</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Paginated list of cars</returns>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<CarDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetCars([FromQuery] GetCarsQuery query, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Getting cars with filters: {Filters}", 
                new { query.PageNumber, query.PageSize, query.SearchText });

            var result = await _mediator.Send(query, cancellationToken);

            if (result == null)
            {
                return BadRequest(new { message = "Failed to retrieve cars" });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cars");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Failed to retrieve cars" });
        }
    }

    /// <summary>
    /// Get specific car by ID
    /// </summary>
    /// <param name="id">Car ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Car details</returns>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(CarDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCar(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Getting car with ID: {CarId}", id);

            var query = new GetCarByIdQuery { CarId = id };
            var result = await _mediator.Send(query, cancellationToken);

            if (result == null)
            {
                return NotFound(new { message = "Car not found" });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting car with ID: {CarId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Failed to retrieve car" });
        }
    }

    /// <summary>
    /// Create new car using CQRS command
    /// </summary>
    /// <param name="request">Car creation request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Created car details</returns>
    [HttpPost]
    [ProducesResponseType(typeof(CarDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateCar([FromBody] CreateCarRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Creating new car with VIN: {Vin}", request.Vin);

            // Validate request
            var validationResult = ValidateCreateCarRequest(request);
            if (!validationResult.IsValid)
            {
                return BadRequest(validationResult);
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
                UserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "System"
            };

            var result = await _mediator.Send(command, cancellationToken);

            if (!result.IsSuccess)
            {
                return BadRequest(new { message = result.ErrorMessage });
            }

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

            _logger.LogInformation("Car created successfully with ID: {CarId}, VIN: {Vin}", result.Id, result.Vin);

            return CreatedAtAction(nameof(GetCar), new { id = result.Id }, carDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating car with VIN: {Vin}", request.Vin);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Failed to create car" });
        }
    }

    /// <summary>
    /// Update existing car using CQRS command
    /// </summary>
    /// <param name="id">Car ID</param>
    /// <param name="request">Car update request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated car details</returns>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(CarDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateCar(Guid id, [FromBody] UpdateCarRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Updating car with ID: {CarId}", id);

            // Validate request
            var validationResult = ValidateUpdateCarRequest(request);
            if (!validationResult.IsValid)
            {
                return BadRequest(validationResult);
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
                UserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "System"
            };

            var result = await _mediator.Send(command, cancellationToken);

            if (!result.IsSuccess)
            {
                if (result.ErrorMessage?.Contains("not found", StringComparison.OrdinalIgnoreCase) == true)
                {
                    return NotFound(new { message = result.ErrorMessage });
                }
                return BadRequest(new { message = result.ErrorMessage });
            }

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

            _logger.LogInformation("Car updated successfully with ID: {CarId}", result.Id);

            return Ok(carDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating car with ID: {CarId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Failed to update car" });
        }
    }

    /// <summary>
    /// Soft delete car (deactivate)
    /// </summary>
    /// <param name="id">Car ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Deletion result</returns>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
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
                    return NotFound(new { message = result.ErrorMessage });
                }
                return BadRequest(new { message = result.ErrorMessage });
            }

            _logger.LogInformation("Car deleted successfully with ID: {CarId}", result.CarId);

            return Ok(new { message = "Car deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting car with ID: {CarId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Failed to delete car" });
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
    }

    #endregion
}
