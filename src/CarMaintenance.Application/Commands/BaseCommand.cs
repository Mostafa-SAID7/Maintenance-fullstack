using MediatR;
using CarMaintenance.Shared.Models;

namespace CarMaintenance.Application.Commands;

/// <summary>
/// Base class for all CQRS commands
/// </summary>
/// <typeparam name="TResult">The result type returned by the command handler</typeparam>
public abstract class BaseCommand<TResult> : IRequest<TResult>
{
    /// <summary>
    /// Gets or sets the unique identifier for correlation and tracking
    /// </summary>
    public virtual Guid CorrelationId { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Gets or sets the timestamp when the command was created
    /// </summary>
    public virtual DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Gets or sets the user ID who initiated the command
    /// </summary>
    public virtual string? UserId { get; set; }

    /// <summary>
    /// Gets or sets additional metadata for the command
    /// </summary>
    public virtual Dictionary<string, object>? Metadata { get; set; }

    /// <summary>
    /// Validates the command using fluent validation
    /// </summary>
    /// <returns>A validation result indicating whether the command is valid</returns>
    public virtual ValidationResult Validate()
    {
        // Override in derived commands to implement specific validation
        return ValidationResult.Success();
    }

    /// <summary>
    /// Gets a string representation of the command for logging
    /// </summary>
    /// <returns>A descriptive string for logging purposes</returns>
    public override string ToString()
    {
        return $"{GetType().Name} - CorrelationId: {CorrelationId}, UserId: {UserId}, CreatedAt: {CreatedAt:yyyy-MM-dd HH:mm:ss.fff}Z";
    }
}

/// <summary>
/// Base class for commands that return results
/// </summary>
public abstract class BaseCommand : BaseCommand<object>
{
}