using MediatR;
using CarMaintenance.Domain.Entities;
using CarMaintenance.Shared.Models;

namespace CarMaintenance.Application.Commands.Cars;

/// <summary>
/// Command to delete a car
/// </summary>
public record DeleteCarCommand(
    int CarId,
    string UserId
) : IRequest<DeleteCarCommandResult>;

/// <summary>
/// Result of the delete car command
/// </summary>
public class DeleteCarCommandResult
{
    /// <summary>
    /// Gets or sets the deleted car ID
    /// </summary>
    public int CarId { get; set; }

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
    /// <param name="carId">The deleted car ID</param>
    /// <returns>A successful result</returns>
    public static DeleteCarCommandResult Success(int carId)
    {
        return new DeleteCarCommandResult
        {
            CarId = carId,
            IsSuccess = true
        };
    }

    /// <summary>
    /// Creates a failure result
    /// </summary>
    /// <param name="errorMessage">The error message</param>
    /// <returns>A failure result</returns>
    public static DeleteCarCommandResult Failure(string errorMessage)
    {
        return new DeleteCarCommandResult
        {
            IsSuccess = false,
            ErrorMessage = errorMessage
        };
    }
}