using MediatR;
using CarMaintenance.Domain.Entities;
using CarMaintenance.Shared.Models;

namespace CarMaintenance.Application.Commands.Cars;

/// <summary>
/// Command to update an existing car
/// </summary>
public record UpdateCarCommand(
    int CarId,
    string Make,
    string Model,
    int Year,
    string? Color,
    string? LicensePlate,
    int Mileage,
    string? VIN,
    string OwnerId
) : IRequest<UpdateCarCommandResult>
{
    /// <summary>
    /// Validates the command parameters
    /// </summary>
    /// <returns>Validation result</returns>
    public ValidationResult Validate()
    {
        var result = new ValidationResult();

        if (CarId <= 0)
        {
            result.AddError(nameof(CarId), "Car ID is required");
        }

        if (string.IsNullOrWhiteSpace(Make))
        {
            result.AddError(nameof(Make), "Make is required and must not exceed 50 characters");
        }
        else if (Make.Length > 50)
        {
            result.AddError(nameof(Make), "Make must not exceed 50 characters");
        }

        if (string.IsNullOrWhiteSpace(Model))
        {
            result.AddError(nameof(Model), "Model is required and must not exceed 50 characters");
        }
        else if (Model.Length > 50)
        {
            result.AddError(nameof(Model), "Model must not exceed 50 characters");
        }

        var currentYear = DateTime.UtcNow.Year + 2;
        if (Year < 1900 || Year > currentYear)
        {
            result.AddError(nameof(Year), $"Year must be between 1900 and {currentYear}");
        }

        if (Mileage < 0)
        {
            result.AddError(nameof(Mileage), "Mileage must be greater than or equal to 0");
        }

        if (string.IsNullOrWhiteSpace(OwnerId))
        {
            result.AddError(nameof(OwnerId), "Owner ID is required");
        }

        return result;
    }
}

/// <summary>
/// Result of the update car command
/// </summary>
public class UpdateCarCommandResult
{
    /// <summary>
    /// Gets or sets the updated car ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Gets or sets the updated car VIN
    /// </summary>
    public string Vin { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the updated car make
    /// </summary>
    public string Make { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the updated car model
    /// </summary>
    public string Model { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the updated car year
    /// </summary>
    public int Year { get; set; }

    /// <summary>
    /// Gets or sets the updated car license plate
    /// </summary>
    public string LicensePlate { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the updated car color
    /// </summary>
    public string Color { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the updated car mileage
    /// </summary>
    public int Mileage { get; set; }

    /// <summary>
    /// Gets or sets the car owner ID
    /// </summary>
    public string OwnerId { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets when the car was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets whether the operation was successful
    /// </summary>
    public bool IsSuccess { get; set; }

    /// <summary>
    /// Gets or sets any error messages
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Creates a successful result
    /// </summary>
    /// <param name="car">The updated car entity</param>
    /// <returns>A successful result</returns>
    public static UpdateCarCommandResult Success(Car car)
    {
        return new UpdateCarCommandResult
        {
            Id = car.Id,
            Vin = car.VIN,
            Make = car.Make,
            Model = car.Model,
            Year = car.Year,
            LicensePlate = car.LicensePlate ?? string.Empty,
            Color = car.Color ?? string.Empty,
            Mileage = car.Mileage,
            OwnerId = car.OwnerId,
            CreatedAt = car.CreatedAt,
            IsSuccess = true
        };
    }

    /// <summary>
    /// Creates a failure result
    /// </summary>
    /// <param name="errorMessage">The error message</param>
    /// <returns>A failure result</returns>
    public static UpdateCarCommandResult Failure(string errorMessage)
    {
        return new UpdateCarCommandResult
        {
            IsSuccess = false,
            ErrorMessage = errorMessage
        };
    }
}