namespace CarMaintenance.Api.Models;

/// <summary>
/// Generic API response wrapper for consistent API responses
/// </summary>
/// <typeparam name="T">The type of data being returned</typeparam>
public class ApiResponse<T>
{
    /// <summary>
    /// Gets or sets a value indicating whether the operation was successful
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Gets or sets the data being returned
    /// </summary>
    public T? Data { get; set; }

    /// <summary>
    /// Gets or sets a message providing additional information
    /// </summary>
    public string? Message { get; set; }

    /// <summary>
    /// Gets or sets any errors that occurred during the operation
    /// </summary>
    public IEnumerable<string>? Errors { get; set; }

    /// <summary>
    /// Gets or sets the timestamp when the response was created
    /// </summary>
    public DateTime Timestamp { get; set; }

    /// <summary>
    /// Initializes a new instance of the ApiResponse class
    /// </summary>
    public ApiResponse()
    {
        Timestamp = DateTime.UtcNow;
    }

    /// <summary>
    /// Creates a successful response
    /// </summary>
    /// <param name="data">The data to return</param>
    /// <param name="message">Optional success message</param>
    /// <returns>A successful API response</returns>
    public static ApiResponse<T> CreateSuccess(T data, string? message = null)
    {
        return new ApiResponse<T>
        {
            Success = true,
            Data = data,
            Message = message,
        };
    }

    /// <summary>
    /// Creates a failure response
    /// </summary>
    /// <param name="message">The error message</param>
    /// <param name="errors">Optional list of detailed errors</param>
    /// <returns>A failure API response</returns>
    public static ApiResponse<T> Failure(string message, IEnumerable<string>? errors = null)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Message = message,
            Errors = errors,
        };
    }
}