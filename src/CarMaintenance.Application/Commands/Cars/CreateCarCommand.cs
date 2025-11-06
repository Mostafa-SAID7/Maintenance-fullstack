using CarMaintenance.Application.Commands;
using CarMaintenance.Application.DTOs;

namespace CarMaintenance.Application.Commands.Cars;

/// <summary>
/// Command to create a new car
/// </summary>
public class CreateCarCommand : BaseCommand<CreateCarCommandResult>
{
    /// <summary>
    /// Gets or sets the VIN (Vehicle Identification Number)
    /// </summary>
    public string Vin { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the make of the car
    /// </summary>
    public string Make { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the model of the car
    /// </summary>
    public string Model { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the year of the car
    /// </summary>
    public int Year { get; set; }

    /// <summary>
    /// Gets or sets the license plate
    /// </summary>
    public string LicensePlate { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the color of the car
    /// </summary>
    public string Color { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the mileage of the car
    /// </summary>
    public int Mileage { get; set; }

    /// <summary>
    /// Gets or sets the owner ID
    /// </summary>
    public Guid OwnerId { get; set; }

    /// <summary>
    /// Gets or sets additional notes about the car
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Validates the car creation command
    /// </summary>
    /// <returns>A validation result</returns>
    public override ValidationResult Validate()
    {
        var result = base.Validate();

        // Validate VIN
        if (string.IsNullOrWhiteSpace(Vin))
        {
            result.AddError(nameof(Vin), "VIN is required");
        }
        else if (Vin.Length != 17)
        {
            result.AddError(nameof(Vin), "VIN must be exactly 17 characters long");
        }

        // Validate make
        if (string.IsNullOrWhiteSpace(Make))
        {
            result.AddError(nameof(Make), "Make is required");
        }

        // Validate model
        if (string.IsNullOrWhiteSpace(Model))
        {
            result.AddError(nameof(Model), "Model is required");
        }

        // Validate year
        var currentYear = DateTime.UtcNow.Year + 1;
        if (Year < 1886 || Year > currentYear)
        {
            result.AddError(nameof(Year), $"Year must be between 1886 and {currentYear}");
        }

        // Validate license plate
        if (string.IsNullOrWhiteSpace(LicensePlate))
        {
            result.AddError(nameof(LicensePlate), "License plate is required");
        }

        // Validate color
        if (string.IsNullOrWhiteSpace(Color))
        {
            result.AddError(nameof(Color), "Color is required");
        }

        // Validate mileage
        if (Mileage < 0)
        {
            result.AddError(nameof(Mileage), "Mileage cannot be negative");
        }

        // Validate owner ID
        if (OwnerId == Guid.Empty)
        {
            result.AddError(nameof(OwnerId), "Owner ID is required");
        }

        return result;
    }

    /// <summary>
    /// Gets a string representation of the command
    /// </summary>
    /// <returns>A descriptive string</returns>
    public override string ToString()
    {
        return $"{base.ToString()} - CreateCar: {Year} {Make} {Model} (VIN: {Vin}, License: {LicensePlate})";
    }
}

/// <summary>
/// Result of the create car command
/// </summary>
public class CreateCarCommandResult
{
    /// <summary>
    /// Gets or sets the unique identifier of the created car
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Gets or sets the VIN of the created car
    /// </summary>
    public string Vin { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the make of the created car
    /// </summary>
    public string Make { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the model of the created car
    /// </summary>
    public string Model { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the year of the created car
    /// </summary>
    public int Year { get; set; }

    /// <summary>
    /// Gets or sets the license plate of the created car
    /// </summary>
    public string LicensePlate { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the color of the created car
    /// </summary>
    public string Color { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the current mileage of the created car
    /// </summary>
    public int Mileage { get; set; }

    /// <summary>
    /// Gets or sets the creation timestamp
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
    /// <param name="carDto">The created car data</param>
    /// <returns>A successful result</returns>
    public static CreateCarCommandResult Success(CarDto carDto)
    {
        return new CreateCarCommandResult
        {
            Id = carDto.Id,
            Vin = carDto.Vin,
            Make = carDto.Make,
            Model = carDto.Model,
            Year = carDto.Year,
            LicensePlate = carDto.LicensePlate,
            Color = carDto.Color,
            Mileage = carDto.Mileage,
            CreatedAt = carDto.CreatedAt,
            IsSuccess = true
        };
    }

    /// <summary>
    /// Creates a failure result
    /// </summary>
    /// <param name="errorMessage">The error message</param>
    /// <returns>A failure result</returns>
    public static CreateCarCommandResult Failure(string errorMessage)
    {
        return new CreateCarCommandResult
        {
            IsSuccess = false,
            ErrorMessage = errorMessage
        };
    }
}