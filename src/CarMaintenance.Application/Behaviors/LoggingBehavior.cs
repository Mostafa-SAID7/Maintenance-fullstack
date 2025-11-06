using MediatR;
using Microsoft.Extensions.Logging;

namespace CarMaintenance.Application.Behaviors;

/// <summary>
/// MediatR pipeline behavior for logging
/// Logs the execution of commands and queries
/// </summary>
/// <typeparam name="TRequest">The request type</typeparam>
/// <typeparam name="TResponse">The response type</typeparam>
public class LoggingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly ILogger<LoggingBehavior<TRequest, TResponse>> _logger;

    /// <summary>
    /// Initializes a new instance of the LoggingBehavior class
    /// </summary>
    /// <param name="logger">The logger instance</param>
    public LoggingBehavior(ILogger<LoggingBehavior<TRequest, TResponse>> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Handles the logging process in the pipeline
    /// </summary>
    /// <param name="request">The request to process</param>
    /// <param name="next">The next handler in the pipeline</param>
    /// <param name="cancellationToken">The cancellation token</param>
    /// <returns>The response from the next handler</returns>
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;
        var correlationId = GetCorrelationId(request);
        var userId = GetUserId(request);

        // Log request start
        _logger.LogInformation(
            "Processing request {RequestName} - CorrelationId: {CorrelationId}, UserId: {UserId}",
            requestName, correlationId, userId);

        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        var startTime = DateTime.UtcNow;

        try
        {
            // Execute the request
            var response = await next();

            // Calculate execution time
            stopwatch.Stop();
            var executionTime = stopwatch.ElapsedMilliseconds;

            // Log successful completion
            _logger.LogInformation(
                "Successfully processed request {RequestName} - CorrelationId: {CorrelationId}, ExecutionTime: {ExecutionTime}ms, UserId: {UserId}",
                requestName, correlationId, executionTime, userId);

            return response;
        }
        catch (Exception ex)
        {
            // Calculate execution time for failed requests
            stopwatch.Stop();
            var executionTime = stopwatch.ElapsedMilliseconds;

            // Log failure
            _logger.LogError(ex,
                "Failed to process request {RequestName} - CorrelationId: {CorrelationId}, ExecutionTime: {ExecutionTime}ms, UserId: {UserId}, Error: {Error}",
                requestName, correlationId, executionTime, userId, ex.Message);

            throw;
        }
    }

    private static string GetCorrelationId(object request)
    {
        var correlationIdProperty = request.GetType().GetProperty("CorrelationId");
        return correlationIdProperty?.GetValue(request)?.ToString() ?? "N/A";
    }

    private static string GetUserId(object request)
    {
        var userIdProperty = request.GetType().GetProperty("UserId");
        return userIdProperty?.GetValue(request)?.ToString() ?? "Anonymous";
    }
}

/// <summary>
/// MediatR pipeline behavior for exception handling
/// Provides consistent exception handling across all requests
/// </summary>
/// <typeparam name="TRequest">The request type</typeparam>
/// <typeparam name="TResponse">The response type</typeparam>
public class ExceptionHandlingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly ILogger<ExceptionHandlingBehavior<TRequest, TResponse>> _logger;

    /// <summary>
    /// Initializes a new instance of the ExceptionHandlingBehavior class
    /// </summary>
    /// <param name="logger">The logger instance</param>
    public ExceptionHandlingBehavior(ILogger<ExceptionHandlingBehavior<TRequest, TResponse>> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Handles the exception handling process in the pipeline
    /// </summary>
    /// <param name="request">The request to process</param>
    /// <param name="next">The next handler in the pipeline</param>
    /// <param name="cancellationToken">The cancellation token</param>
    /// <returns>The response from the next handler</returns>
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;
        var correlationId = GetCorrelationId(request);

        try
        {
            return await next();
        }
        catch (ValidationException ex)
        {
            // Log validation errors at warning level
            _logger.LogWarning(ex,
                "Validation error in request {RequestName} - CorrelationId: {CorrelationId}: {ValidationMessage}",
                requestName, correlationId, ex.Message);

            // Re-throw validation exceptions
            throw;
        }
        catch (Exception ex)
        {
            // Log unexpected errors at error level
            _logger.LogError(ex,
                "Unexpected error in request {RequestName} - CorrelationId: {CorrelationId}: {ErrorMessage}",
                requestName, correlationId, ex.Message);

            // Re-throw to let the global exception handler deal with it
            throw;
        }
    }

    private static string GetCorrelationId(object request)
    {
        var correlationIdProperty = request.GetType().GetProperty("CorrelationId");
        return correlationIdProperty?.GetValue(request)?.ToString() ?? "N/A";
    }
}