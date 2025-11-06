using CarMaintenance.Application.Queries;
using CarMaintenance.Shared.Models;
using CarMaintenance.Application.DTOs;

namespace CarMaintenance.Application.Queries.Cars;

/// <summary>
/// Query to get a specific car by ID
/// </summary>
public class GetCarByIdQuery : BaseQuery
{
    /// <summary>
    /// Gets or sets the car ID to retrieve
    /// </summary>
    public Guid CarId { get; set; }

    /// <summary>
    /// Validates the query parameters
    /// </summary>
    /// <returns>A validation result</returns>
    public override ValidationResult Validate()
    {
        var result = base.Validate();

        if (CarId == Guid.Empty)
        {
            result.AddError(nameof(CarId), "Car ID is required");
        }

        return result;
    }

    /// <summary>
    /// Gets a string representation of the query
    /// </summary>
    /// <returns>A descriptive string</returns>
    public override string ToString()
    {
        return $"{base.ToString()} - GetCarById: ID {CarId}";
    }
}

/// <summary>
/// Result of the get car by ID query
/// </summary>
public class GetCarByIdQueryResult
{
    /// <summary>
    /// Gets or sets the car result
    /// </summary>
    public CarDto? Car { get; set; }

    /// <summary>
    /// Gets or sets whether the query was successful
    /// </summary>
    public bool IsSuccess { get; set; }

    /// <summary>
    /// Gets or sets any error messages
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Creates a successful result
    /// </summary>
    /// <param name="car">The car result</param>
    /// <returns>A successful result</returns>
    public static GetCarByIdQueryResult Success(CarDto car)
    {
        return new GetCarByIdQueryResult
        {
            Car = car,
            IsSuccess = true
        };
    }

    /// <summary>
    /// Creates a failure result
    /// </summary>
    /// <param name="errorMessage">The error message</param>
    /// <returns>A failure result</returns>
    public static GetCarByIdQueryResult Failure(string errorMessage)
    {
        return new GetCarByIdQueryResult
        {
            IsSuccess = false,
            ErrorMessage = errorMessage
        };
    }
}