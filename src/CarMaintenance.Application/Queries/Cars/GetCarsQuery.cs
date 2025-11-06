using CarMaintenance.Application.Queries;
using CarMaintenance.Shared.Models;
using CarMaintenance.Application.DTOs;

namespace CarMaintenance.Application.Queries.Cars;

/// <summary>
/// Query to get a paginated list of cars
/// </summary>
public class GetCarsQuery : BasePaginatedQuery
{
    /// <summary>
    /// Gets or sets the optional VIN filter
    /// </summary>
    public string? VinFilter { get; set; }

    /// <summary>
    /// Gets or sets the optional make filter
    /// </summary>
    public string? MakeFilter { get; set; }

    /// <summary>
    /// Gets or sets the optional model filter
    /// </summary>
    public string? ModelFilter { get; set; }

    /// <summary>
    /// Gets or sets the optional year range filter (from year)
    /// </summary>
    public int? YearFrom { get; set; }

    /// <summary>
    /// Gets or sets the optional year range filter (to year)
    /// </summary>
    public int? YearTo { get; set; }

    /// <summary>
    /// Gets or sets the optional owner ID filter
    /// </summary>
    public Guid? OwnerId { get; set; }

    /// <summary>
    /// Gets or sets whether to include inactive cars
    /// </summary>
    public bool IncludeInactive { get; set; } = false;

    /// <summary>
    /// Gets or sets the search text for full-text search
    /// </summary>
    public string? SearchText { get; set; }

    /// <summary>
    /// Validates the query parameters
    /// </summary>
    /// <returns>A validation result</returns>
    public override ValidationResult Validate()
    {
        var result = base.Validate();

        // Validate year range
        if (YearFrom.HasValue && YearTo.HasValue && YearFrom > YearTo)
        {
            result.AddError(nameof(YearFrom), "From year cannot be greater than to year");
        }

        var currentYear = DateTime.UtcNow.Year + 1;
        if (YearFrom.HasValue && (YearFrom < 1886 || YearFrom > currentYear))
        {
            result.AddError(nameof(YearFrom), $"Year from must be between 1886 and {currentYear}");
        }

        if (YearTo.HasValue && (YearTo < 1886 || YearTo > currentYear))
        {
            result.AddError(nameof(YearTo), $"Year to must be between 1886 and {currentYear}");
        }

        // Validate filter lengths
        if (!string.IsNullOrEmpty(VinFilter) && VinFilter.Length > 50)
        {
            result.AddError(nameof(VinFilter), "VIN filter cannot exceed 50 characters");
        }

        if (!string.IsNullOrEmpty(MakeFilter) && MakeFilter.Length > 100)
        {
            result.AddError(nameof(MakeFilter), "Make filter cannot exceed 100 characters");
        }

        if (!string.IsNullOrEmpty(ModelFilter) && ModelFilter.Length > 100)
        {
            result.AddError(nameof(ModelFilter), "Model filter cannot exceed 100 characters");
        }

        if (!string.IsNullOrEmpty(SearchText) && SearchText.Length > 200)
        {
            result.AddError(nameof(SearchText), "Search text cannot exceed 200 characters");
        }

        return result;
    }

    /// <summary>
    /// Gets a string representation of the query
    /// </summary>
    /// <returns>A descriptive string</returns>
    public override string ToString()
    {
        var filters = new List<string>();

        if (!string.IsNullOrEmpty(VinFilter)) filters.Add($"VIN:{VinFilter}");
        if (!string.IsNullOrEmpty(MakeFilter)) filters.Add($"Make:{MakeFilter}");
        if (!string.IsNullOrEmpty(ModelFilter)) filters.Add($"Model:{ModelFilter}");
        if (YearFrom.HasValue) filters.Add($"YearFrom:{YearFrom}");
        if (YearTo.HasValue) filters.Add($"YearTo:{YearTo}");
        if (OwnerId.HasValue) filters.Add($"OwnerId:{OwnerId}");
        if (IncludeInactive) filters.Add("IncludeInactive:true");
        if (!string.IsNullOrEmpty(SearchText)) filters.Add($"Search:'{SearchText}'");

        var filterString = filters.Count > 0 ? $" with filters: {string.Join(", ", filters)}" : "";
        
        return $"{base.ToString()} - GetCars: Page {PageNumber}, Size {PageSize}{filterString}";
    }

    /// <summary>
    /// Creates a query with only required parameters
    /// </summary>
    /// <param name="pageNumber">The page number (1-based)</param>
    /// <param name="pageSize">The page size</param>
    /// <returns>A basic cars query</returns>
    public static GetCarsQuery CreateBasic(int pageNumber = 1, int pageSize = 20)
    {
        return new GetCarsQuery
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            IncludeInactive = false
        };
    }

    /// <summary>
    /// Creates a query with VIN filter
    /// </summary>
    /// <param name="vin">The VIN to filter by</param>
    /// <param name="pageNumber">The page number</param>
    /// <param name="pageSize">The page size</param>
    /// <returns>A VIN-filtered cars query</returns>
    public static GetCarsQuery WithVin(string vin, int pageNumber = 1, int pageSize = 20)
    {
        return new GetCarsQuery
        {
            VinFilter = vin,
            PageNumber = pageNumber,
            PageSize = pageSize,
            IncludeInactive = false
        };
    }

    /// <summary>
    /// Creates a query with make and model filters
    /// </summary>
    /// <param name="make">The make to filter by</param>
    /// <param name="model">The model to filter by</param>
    /// <param name="pageNumber">The page number</param>
    /// <param name="pageSize">The page size</param>
    /// <returns>A make/model-filtered cars query</returns>
    public static GetCarsQuery WithMakeModel(string make, string? model = null, int pageNumber = 1, int pageSize = 20)
    {
        return new GetCarsQuery
        {
            MakeFilter = make,
            ModelFilter = model,
            PageNumber = pageNumber,
            PageSize = pageSize,
            IncludeInactive = false
        };
    }

    /// <summary>
    /// Creates a query with year range filter
    /// </summary>
    /// <param name="yearFrom">The starting year</param>
    /// <param name="yearTo">The ending year</param>
    /// <param name="pageNumber">The page number</param>
    /// <param name="pageSize">The page size</param>
    /// <returns>A year-range-filtered cars query</returns>
    public static GetCarsQuery WithYearRange(int yearFrom, int? yearTo = null, int pageNumber = 1, int pageSize = 20)
    {
        return new GetCarsQuery
        {
            YearFrom = yearFrom,
            YearTo = yearTo,
            PageNumber = pageNumber,
            PageSize = pageSize,
            IncludeInactive = false
        };
    }

    /// <summary>
    /// Creates a search query
    /// </summary>
    /// <param name="searchText">The text to search for</param>
    /// <param name="pageNumber">The page number</param>
    /// <param name="pageSize">The page size</param>
    /// <returns>A search-based cars query</returns>
    public static GetCarsQuery WithSearch(string searchText, int pageNumber = 1, int pageSize = 20)
    {
        return new GetCarsQuery
        {
            SearchText = searchText,
            PageNumber = pageNumber,
            PageSize = pageSize,
            IncludeInactive = false
        };
    }
}

/// <summary>
/// Result of the get cars query
/// </summary>
public class GetCarsQueryResult
{
    /// <summary>
    /// Gets or sets the paginated list of cars
    /// </summary>
    public PagedResult<CarDto> Cars { get; set; } = new();

    /// <summary>
    /// Gets or sets the total number of cars matching the criteria
    /// </summary>
    public int TotalCount { get; set; }

    /// <summary>
    /// Gets or sets whether the query was successful
    /// </summary>
    public bool IsSuccess { get; set; }

    /// <summary>
    /// Gets or sets any error messages
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Gets or sets the query parameters that were used
    /// </summary>
    public GetCarsQuery Query { get; set; } = new();

    /// <summary>
    /// Creates a successful result
    /// </summary>
    /// <param name="cars">The paginated cars result</param>
    /// <param name="query">The query that was executed</param>
    /// <returns>A successful result</returns>
    public static GetCarsQueryResult Success(PagedResult<CarDto> cars, GetCarsQuery query)
    {
        return new GetCarsQueryResult
        {
            Cars = cars,
            TotalCount = cars.TotalCount,
            IsSuccess = true,
            Query = query
        };
    }

    /// <summary>
    /// Creates a failure result
    /// </summary>
    /// <param name="errorMessage">The error message</param>
    /// <param name="query">The query that failed</param>
    /// <returns>A failure result</returns>
    public static GetCarsQueryResult Failure(string errorMessage, GetCarsQuery query)
    {
        return new GetCarsQueryResult
        {
            IsSuccess = false,
            ErrorMessage = errorMessage,
            Query = query
        };
    }

    /// <summary>
    /// Gets the total number of pages
    /// </summary>
    /// <returns>The total number of pages</returns>
    public int GetTotalPages()
    {
        if (Query.PageSize <= 0) return 0;
        return (int)Math.Ceiling((double)TotalCount / Query.PageSize);
    }

    /// <summary>
    /// Gets whether there is a next page
    /// </summary>
    /// <returns>True if there is a next page, false otherwise</returns>
    public bool HasNextPage()
    {
        return Query.PageNumber < GetTotalPages();
    }

    /// <summary>
    /// Gets whether there is a previous page
    /// </summary>
    /// <returns>True if there is a previous page, false otherwise</returns>
    public bool HasPreviousPage()
    {
        return Query.PageNumber > 1;
    }
}