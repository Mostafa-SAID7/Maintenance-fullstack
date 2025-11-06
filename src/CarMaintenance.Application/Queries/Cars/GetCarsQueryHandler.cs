using MediatR;
using Microsoft.Extensions.Logging;
using CarMaintenance.Shared.Models;

namespace CarMaintenance.Application.Queries.Cars;

/// <summary>
/// MediatR query handler for getting a paginated list of cars
/// </summary>
public class GetCarsQueryHandler : IRequestHandler<GetCarsQuery, GetCarsQueryResult>
{
    private readonly ICarRepository _carRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<GetCarsQueryHandler> _logger;

    /// <summary>
    /// Initializes a new instance of the GetCarsQueryHandler class
    /// </summary>
    /// <param name="carRepository">The car repository</param>
    /// <param name="mapper">The AutoMapper instance</param>
    /// <param name="logger">The logger instance</param>
    public GetCarsQueryHandler(
        ICarRepository carRepository,
        IMapper mapper,
        ILogger<GetCarsQueryHandler> logger)
    {
        _carRepository = carRepository ?? throw new ArgumentNullException(nameof(carRepository));
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Handles the get cars query
    /// </summary>
    /// <param name="query">The get cars query</param>
    /// <param name="cancellationToken">The cancellation token</param>
    /// <returns>The result of the operation</returns>
    public async Task<GetCarsQueryResult> Handle(GetCarsQuery query, CancellationToken cancellationToken)
    {
        _logger.LogDebug("Handling GetCarsQuery: Page {PageNumber}, Size {PageSize}", query.PageNumber, query.PageSize);

        try
        {
            // Validate query
            var validationResult = query.Validate();
            if (!validationResult.IsValid)
            {
                var errorMessage = $"Query validation failed: {validationResult.GetErrorMessage()}";
                _logger.LogWarning("GetCarsQuery validation failed: {ErrorMessage}", errorMessage);
                return GetCarsQueryResult.Failure(errorMessage, query);
            }

            // Build filter expression
            var filterExpression = BuildFilterExpression(query);
            
            // Get cars with filtering and pagination
            var cars = await _carRepository.GetPagedAsync(
                filter: filterExpression,
                orderBy: GetSortExpression(query),
                skip: query.GetSkipCount(),
                take: query.GetTakeCount(),
                includeInactive: query.IncludeInactive,
                cancellationToken: cancellationToken);

            // Get total count if requested
            int totalCount = 0;
            if (query.IncludeTotalCount)
            {
                totalCount = await _carRepository.CountAsync(filterExpression, query.IncludeInactive, cancellationToken);
            }

            // Map to DTOs
            var carDtos = cars.Select(_mapper.Map<CarDto>).ToList();

            // Create paged result
            var pagedResult = new PagedResult<CarDto>
            {
                Items = carDtos,
                PageNumber = query.PageNumber,
                PageSize = query.PageSize,
                TotalCount = totalCount,
                HasNextPage = query.PageNumber < (int)Math.Ceiling((double)totalCount / query.PageSize),
                HasPreviousPage = query.PageNumber > 1
            };

            _logger.LogInformation("Successfully retrieved {Count} cars (Page {PageNumber} of {TotalPages})", 
                carDtos.Count, query.PageNumber, (int)Math.Ceiling((double)totalCount / query.PageSize));

            return GetCarsQueryResult.Success(pagedResult, query);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while retrieving cars: {ErrorMessage}", ex.Message);
            return GetCarsQueryResult.Failure($"An error occurred while retrieving cars: {ex.Message}", query);
        }
    }

    /// <summary>
    /// Builds a filter expression based on the query parameters
    /// </summary>
    /// <param name="query">The query to build filter for</param>
    /// <returns>A filter expression</returns>
    private System.Linq.Expressions.Expression<Func<Car, bool>> BuildFilterExpression(GetCarsQuery query)
    {
        var parameter = System.Linq.Expressions.Expression.Parameter(typeof(Car), "car");
        var expressions = new List<System.Linq.Expressions.Expression>();

        // VIN filter
        if (!string.IsNullOrWhiteSpace(query.VinFilter))
        {
            var vinProperty = System.Linq.Expressions.Expression.Property(parameter, nameof(Car.Vin));
            var vinConstant = System.Linq.Expressions.Expression.Constant(query.VinFilter.ToUpperInvariant());
            var vinContains = typeof(string).GetMethod("Contains", new[] { typeof(string) });
            var vinCall = System.Linq.Expressions.Expression.Call(vinProperty, vinContains!, vinConstant);
            expressions.Add(vinCall);
        }

        // Make filter
        if (!string.IsNullOrWhiteSpace(query.MakeFilter))
        {
            var makeProperty = System.Linq.Expressions.Expression.Property(parameter, nameof(Car.Make));
            var makeConstant = System.Linq.Expressions.Expression.Constant(query.MakeFilter.Trim(), typeof(string));
            var makeContains = typeof(string).GetMethod("Contains", new[] { typeof(string) });
            var makeCall = System.Linq.Expressions.Expression.Call(makeProperty, makeContains!, makeConstant);
            expressions.Add(makeCall);
        }

        // Model filter
        if (!string.IsNullOrWhiteSpace(query.ModelFilter))
        {
            var modelProperty = System.Linq.Expressions.Expression.Property(parameter, nameof(Car.Model));
            var modelConstant = System.Linq.Expressions.Expression.Constant(query.ModelFilter.Trim(), typeof(string));
            var modelContains = typeof(string).GetMethod("Contains", new[] { typeof(string) });
            var modelCall = System.Linq.Expressions.Expression.Call(modelProperty, modelContains!, modelConstant);
            expressions.Add(modelCall);
        }

        // Year range filter
        if (query.YearFrom.HasValue)
        {
            var yearProperty = System.Linq.Expressions.Expression.Property(parameter, nameof(Car.Year));
            var yearConstant = System.Linq.Expressions.Expression.Constant(query.YearFrom.Value);
            var yearGreaterOrEqual = System.Linq.Expressions.Expression.GreaterThanOrEqual(yearProperty, yearConstant);
            expressions.Add(yearGreaterOrEqual);
        }

        if (query.YearTo.HasValue)
        {
            var yearProperty = System.Linq.Expressions.Expression.Property(parameter, nameof(Car.Year));
            var yearConstant = System.Linq.Expressions.Expression.Constant(query.YearTo.Value);
            var yearLessOrEqual = System.Linq.Expressions.Expression.LessThanOrEqual(yearProperty, yearConstant);
            expressions.Add(yearLessOrEqual);
        }

        // Owner ID filter
        if (query.OwnerId.HasValue)
        {
            var ownerProperty = System.Linq.Expressions.Expression.Property(parameter, nameof(Car.OwnerId));
            var ownerConstant = System.Linq.Expressions.Expression.Constant(query.OwnerId.Value);
            var ownerEqual = System.Linq.Expressions.Expression.Equal(ownerProperty, ownerConstant);
            expressions.Add(ownerEqual);
        }

        // Active status filter (handled by repository if IncludeInactive is false)
        if (!query.IncludeInactive)
        {
            var isActiveProperty = System.Linq.Expressions.Expression.Property(parameter, nameof(Car.IsActive));
            var isActiveConstant = System.Linq.Expressions.Expression.Constant(true);
            var isActiveEqual = System.Linq.Expressions.Expression.Equal(isActiveProperty, isActiveConstant);
            expressions.Add(isActiveEqual);
        }

        // Search text filter (full-text search across multiple fields)
        if (!string.IsNullOrWhiteSpace(query.SearchText))
        {
            var searchConstant = System.Linq.Expressions.Expression.Constant(query.SearchText.Trim().ToLowerInvariant());
            
            var vinProperty = System.Linq.Expressions.Expression.Property(parameter, nameof(Car.Vin));
            var vinLower = System.Linq.Expressions.Expression.Call(vinProperty, "ToLower", null);
            var vinContains = typeof(string).GetMethod("Contains", new[] { typeof(string) });
            var vinCall = System.Linq.Expressions.Expression.Call(vinLower, vinContains!, searchConstant);

            var makeProperty = System.Linq.Expressions.Expression.Property(parameter, nameof(Car.Make));
            var makeLower = System.Linq.Expressions.Expression.Call(makeProperty, "ToLower", null);
            var makeCall = System.Linq.Expressions.Expression.Call(makeLower, vinContains!, searchConstant);

            var modelProperty = System.Linq.Expressions.Expression.Property(parameter, nameof(Car.Model));
            var modelLower = System.Linq.Expressions.Expression.Call(modelProperty, "ToLower", null);
            var modelCall = System.Linq.Expressions.Expression.Call(modelLower, vinContains!, searchConstant);

            var licenseProperty = System.Linq.Expressions.Expression.Property(parameter, nameof(Car.LicensePlate));
            var licenseLower = System.Linq.Expressions.Expression.Call(licenseProperty, "ToLower", null);
            var licenseCall = System.Linq.Expressions.Expression.Call(licenseLower, vinContains!, searchConstant);

            var searchExpression = System.Linq.Expressions.Expression.OrElse(
                System.Linq.Expressions.Expression.OrElse(vinCall, makeCall),
                System.Linq.Expressions.Expression.OrElse(modelCall, licenseCall));

            expressions.Add(searchExpression);
        }

        // Combine all expressions with AND
        if (expressions.Count == 0)
        {
            return car => true;
        }

        var combined = expressions.Aggregate((expr1, expr2) => System.Linq.Expressions.Expression.AndAlso(expr1, expr2));
        return System.Linq.Expressions.Expression.Lambda<Func<Car, bool>>(combined, parameter);
    }

    /// <summary>
    /// Gets the sort expression based on query parameters
    /// </summary>
    /// <param name="query">The query to get sort expression for</param>
    /// <returns>A sort expression</returns>
    private System.Linq.Expressions.Expression<Func<Car, object>>? GetSortExpression(GetCarsQuery query)
    {
        if (string.IsNullOrEmpty(query.SortBy))
        {
            return car => car.CreatedAt;
        }

        var parameter = System.Linq.Expressions.Expression.Parameter(typeof(Car), "car");
        System.Linq.Expressions.Expression propertyExpression;

        // Map sort fields to car properties
        propertyExpression = query.SortBy.ToLowerInvariant() switch
        {
            "vin" => System.Linq.Expressions.Expression.Property(parameter, nameof(Car.Vin)),
            "make" => System.Linq.Expressions.Expression.Property(parameter, nameof(Car.Make)),
            "model" => System.Linq.Expressions.Expression.Property(parameter, nameof(Car.Model)),
            "year" => System.Linq.Expressions.Expression.Property(parameter, nameof(Car.Year)),
            "licenseplate" => System.Linq.Expressions.Expression.Property(parameter, nameof(Car.LicensePlate)),
            "color" => System.Linq.Expressions.Expression.Property(parameter, nameof(Car.Color)),
            "mileage" => System.Linq.Expressions.Expression.Property(parameter, nameof(Car.Mileage)),
            "createdat" => System.Linq.Expressions.Expression.Property(parameter, nameof(Car.CreatedAt)),
            "updatedat" => System.Linq.Expressions.Expression.Property(parameter, nameof(Car.UpdatedAt)),
            _ => System.Linq.Expressions.Expression.Property(parameter, nameof(Car.CreatedAt))
        };

        var converted = System.Linq.Expressions.Expression.Convert(propertyExpression, typeof(object));
        var lambda = System.Linq.Expressions.Expression.Lambda<Func<Car, object>>(converted, parameter);

        return lambda;
    }
}

/// <summary>
/// Extended interface for car repository operations with advanced querying
/// </summary>
public interface ICarRepository
{
    /// <summary>
    /// Gets a paginated list of cars
    /// </summary>
    /// <param name="filter">The filter expression</param>
    /// <param name="orderBy">The order by expression</param>
    /// <param name="skip">Number of records to skip</param>
    /// <param name="take">Number of records to take</param>
    /// <param name="includeInactive">Whether to include inactive cars</param>
    /// <param name="cancellationToken">The cancellation token</param>
    /// <returns>A list of cars</returns>
    Task<IEnumerable<Car>> GetPagedAsync(
        System.Linq.Expressions.Expression<Func<Car, bool>>? filter = null,
        System.Linq.Expressions.Expression<Func<Car, object>>? orderBy = null,
        int skip = 0,
        int take = 20,
        bool includeInactive = false,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Counts cars matching the filter
    /// </summary>
    /// <param name="filter">The filter expression</param>
    /// <param name="includeInactive">Whether to include inactive cars</param>
    /// <param name="cancellationToken">The cancellation token</param>
    /// <returns>The count of cars</returns>
    Task<int> CountAsync(
        System.Linq.Expressions.Expression<Func<Car, bool>>? filter = null,
        bool includeInactive = false,
        CancellationToken cancellationToken = default);
}