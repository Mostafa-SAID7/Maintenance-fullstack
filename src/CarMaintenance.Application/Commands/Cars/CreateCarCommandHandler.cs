using MediatR;
using Microsoft.Extensions.Logging;
using CarMaintenance.Shared.Models;

namespace CarMaintenance.Application.Commands.Cars;

/// <summary>
/// MediatR command handler for creating a new car
/// </summary>
public class CreateCarCommandHandler : IRequestHandler<CreateCarCommand, CreateCarCommandResult>
{
    private readonly ICarRepository _carRepository;
    private readonly IOwnerRepository _ownerRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<CreateCarCommandHandler> _logger;
    private readonly IUnitOfWork _unitOfWork;

    /// <summary>
    /// Initializes a new instance of the CreateCarCommandHandler class
    /// </summary>
    /// <param name="carRepository">The car repository</param>
    /// <param name="ownerRepository">The owner repository</param>
    /// <param name="mapper">The AutoMapper instance</param>
    /// <param name="logger">The logger instance</param>
    /// <param name="unitOfWork">The unit of work instance</param>
    public CreateCarCommandHandler(
        ICarRepository carRepository,
        IOwnerRepository ownerRepository,
        IMapper mapper,
        ILogger<CreateCarCommandHandler> logger,
        IUnitOfWork unitOfWork)
    {
        _carRepository = carRepository ?? throw new ArgumentNullException(nameof(carRepository));
        _ownerRepository = ownerRepository ?? throw new ArgumentNullException(nameof(ownerRepository));
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    /// <summary>
    /// Handles the create car command
    /// </summary>
    /// <param name="command">The create car command</param>
    /// <param name="cancellationToken">The cancellation token</param>
    /// <returns>The result of the operation</returns>
    public async Task<CreateCarCommandResult> Handle(CreateCarCommand command, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Handling CreateCarCommand for VIN: {Vin}", command.Vin);

        try
        {
            // Validate command
            var validationResult = command.Validate();
            if (!validationResult.IsValid)
            {
                var errorMessage = $"Validation failed: {validationResult.GetErrorMessage()}";
                _logger.LogWarning("CreateCarCommand validation failed: {ErrorMessage}", errorMessage);
                return CreateCarCommandResult.Failure(errorMessage);
            }

            // Check if car with this VIN already exists
            var existingCar = await _carRepository.GetByVinAsync(command.Vin, cancellationToken);
            if (existingCar != null)
            {
                var errorMessage = $"Car with VIN {command.Vin} already exists";
                _logger.LogWarning("CreateCarCommand failed: {ErrorMessage}", errorMessage);
                return CreateCarCommandResult.Failure(errorMessage);
            }

            // Verify owner exists
            var owner = await _ownerRepository.GetByIdAsync(command.OwnerId, cancellationToken);
            if (owner == null)
            {
                var errorMessage = $"Owner with ID {command.OwnerId} not found";
                _logger.LogWarning("CreateCarCommand failed: {ErrorMessage}", errorMessage);
                return CreateCarCommandResult.Failure(errorMessage);
            }

            // Create the car entity
            var car = new Car
            {
                Id = Guid.NewGuid(),
                Vin = command.Vin.Trim().ToUpperInvariant(),
                Make = command.Make.Trim(),
                Model = command.Model.Trim(),
                Year = command.Year,
                LicensePlate = command.LicensePlate.Trim().ToUpperInvariant(),
                Color = command.Color.Trim(),
                Mileage = command.Mileage,
                OwnerId = command.OwnerId,
                Notes = command.Notes?.Trim(),
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = command.UserId ?? "System",
                UpdatedAt = DateTime.UtcNow,
                UpdatedBy = command.UserId ?? "System"
            };

            // Add the car to the repository
            _carRepository.Add(car);

            // Save changes using unit of work
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Map to DTO
            var carDto = _mapper.Map<CarDto>(car);

            _logger.LogInformation("Successfully created car with ID: {CarId}, VIN: {Vin}", car.Id, car.Vin);

            return CreateCarCommandResult.Success(carDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while creating car with VIN: {Vin}", command.Vin);
            return CreateCarCommandResult.Failure($"An error occurred while creating the car: {ex.Message}");
        }
    }
}

/// <summary>
/// Interface for car repository operations
/// </summary>
public interface ICarRepository
{
    /// <summary>
    /// Gets a car by VIN
    /// </summary>
    /// <param name="vin">The VIN to search for</param>
    /// <param name="cancellationToken">The cancellation token</param>
    /// <returns>The car if found, null otherwise</returns>
    Task<Car?> GetByVinAsync(string vin, CancellationToken cancellationToken = default);

    /// <summary>
    /// Adds a new car
    /// </summary>
    /// <param name="car">The car to add</param>
    void Add(Car car);
}

/// <summary>
/// Interface for owner repository operations
/// </summary>
public interface IOwnerRepository
{
    /// <summary>
    /// Gets an owner by ID
    /// </summary>
    /// <param name="id">The owner ID</param>
    /// <param name="cancellationToken">The cancellation token</param>
    /// <returns>The owner if found, null otherwise</returns>
    Task<Owner?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
}

/// <summary>
/// Interface for unit of work pattern
/// </summary>
public interface IUnitOfWork
{
    /// <summary>
    /// Saves all changes made in this context to the database
    /// </summary>
    /// <param name="cancellationToken">The cancellation token</param>
    /// <returns>The number of state entries written to the database</returns>
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}