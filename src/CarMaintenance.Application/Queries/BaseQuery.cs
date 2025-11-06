using MediatR;
using CarMaintenance.Shared.Models;

namespace CarMaintenance.Application.Queries;

/// <summary>
/// Base abstract class for all CQRS queries
/// </summary>
/// <typeparam name="TResult">The type of result returned by the query handler</typeparam>
public abstract class BaseQuery<TResult> : IRequest<TResult>
{
    /// <summary>
    /// Gets or sets the unique identifier for correlation and tracking
    /// </summary>
    public virtual Guid CorrelationId { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Gets or sets the timestamp when the query was created
    /// </summary>
    public virtual DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Gets or sets the user ID who initiated the query
    /// </summary>
    public virtual string? UserId { get; set; }

    /// <summary>
    /// Gets or sets additional metadata for the query
    /// </summary>
    public virtual Dictionary<string, object>? Metadata { get; set; }

    /// <summary>
    /// Validates the query using fluent validation
    /// </summary>
    /// <returns>A validation result indicating whether the query is valid</returns>
    public virtual ValidationResult Validate()
    {
        // Override in derived queries to implement specific validation
        return ValidationResult.Success();
    }

    /// <summary>
    /// Gets a string representation of the query for logging
    /// </summary>
    /// <returns>A descriptive string for logging purposes</returns>
    public override string ToString()
    {
        return $"{GetType().Name} - CorrelationId: {CorrelationId}, UserId: {UserId}, CreatedAt: {CreatedAt:yyyy-MM-dd HH:mm:ss.fff}Z";
    }
}

/// <summary>
/// Base class for queries that return results
/// </summary>
public abstract class BaseQuery : BaseQuery<object>
{
}

/// <summary>
/// Base class for paginated queries
/// </summary>
public abstract class BasePaginatedQuery : BaseQuery<PagedResult<object>>
{
    /// <summary>
    /// Gets or sets the page number (1-based)
    /// </summary>
    public virtual int PageNumber { get; set; } = 1;

    /// <summary>
    /// Gets or sets the page size
    /// </summary>
    public virtual int PageSize { get; set; } = 20;

    /// <summary>
    /// Gets or sets the sorting field
    /// </summary>
    public virtual string? SortBy { get; set; }

    /// <summary>
    /// Gets or sets the sort direction
    /// </summary>
    public virtual string? SortDirection { get; set; } = "asc";

    /// <summary>
    /// Gets or sets whether to include total count
    /// </summary>
    public virtual bool IncludeTotalCount { get; set; } = true;

    /// <summary>
    /// Validates pagination parameters
    /// </summary>
    /// <returns>A validation result</returns>
    public override ValidationResult Validate()
    {
        var result = base.Validate();

        if (PageNumber < 1)
        {
            result.AddError(nameof(PageNumber), "Page number must be greater than 0");
        }

        if (PageSize < 1 || PageSize > 100)
        {
            result.AddError(nameof(PageSize), "Page size must be between 1 and 100");
        }

        if (!string.IsNullOrEmpty(SortDirection) && 
            !SortDirection.Equals("asc", StringComparison.OrdinalIgnoreCase) &&
            !SortDirection.Equals("desc", StringComparison.OrdinalIgnoreCase))
        {
            result.AddError(nameof(SortDirection), "Sort direction must be 'asc' or 'desc'");
        }

        return result;
    }

    /// <summary>
    /// Calculates the number of records to skip
    /// </summary>
    /// <returns>The number of records to skip</returns>
    public virtual int GetSkipCount()
    {
        return (PageNumber - 1) * PageSize;
    }

    /// <summary>
    /// Calculates the number of records to take
    /// </summary>
    /// <returns>The number of records to take</returns>
    public virtual int GetTakeCount()
    {
        return PageSize;
    }
}