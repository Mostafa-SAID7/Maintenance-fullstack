using MediatR;
using Microsoft.Extensions.Logging;
using System.Diagnostics;
using CarMaintenance.Shared.Models;

namespace CarMaintenance.Application.Behaviors;

/// <summary>
/// MediatR pipeline behavior for structured logging
/// </summary>
/// <typeparam name="TRequest">The request type</typeparam>
/// <typeparam name="TResponse">The response type</typeparam>
public class LoggingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly ILogger<LoggingBehavior<TRequest, TResponse>> _logger;

    public LoggingBehavior(ILogger<LoggingBehavior<TRequest, TResponse>> logger)
    {
        _logger = logger;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;
        var stopwatch = Stopwatch.StartNew();

        try
        {
            _logger.LogInformation(
                "Handling request {RequestName} - {CorrelationId}",
                requestName,
                GetCorrelationId(request));

            var response = await next();

            stopwatch.Stop();

            _logger.LogInformation(
                "Successfully handled request {RequestName} in {ElapsedMilliseconds}ms - {CorrelationId}",
                requestName,
                stopwatch.ElapsedMilliseconds,
                GetCorrelationId(request));

            return response;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();

            _logger.LogError(ex,
                "Error handling request {RequestName} after {ElapsedMilliseconds}ms - {CorrelationId}",
                requestName,
                stopwatch.ElapsedMilliseconds,
                GetCorrelationId(request));

            throw;
        }
    }

    private static string GetCorrelationId(TRequest request)
    {
        // Try to extract correlation ID from the request
        if (request is ICorrelationId correlationIdRequest)
        {
            return correlationIdRequest.CorrelationId.ToString();
        }

        // For requests that don't implement ICorrelationId, generate a new one
        return Guid.NewGuid().ToString();
    }
}

/// <summary>
/// Interface for requests that need correlation tracking
/// </summary>
public interface ICorrelationId
{
    Guid CorrelationId { get; }
}

/// <summary>
/// Enhanced logging behavior with performance metrics
/// </summary>
public class PerformanceLoggingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly ILogger<PerformanceLoggingBehavior<TRequest, TResponse>> _logger;
    private readonly ActivitySource _activitySource;

    public PerformanceLoggingBehavior(
        ILogger<PerformanceLoggingBehavior<TRequest, TResponse>> logger,
        ActivitySource activitySource)
    {
        _logger = logger;
        _activitySource = activitySource;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;
        var correlationId = GetCorrelationId(request);

        using var activity = _activitySource.StartActivity(
            $"Handle {requestName}",
            ActivityKind.Server,
            correlationId);

        activity?.SetTag("request.name", requestName);
        activity?.SetTag("request.correlation_id", correlationId);

        var stopwatch = Stopwatch.StartNew();

        try
        {
            _logger.LogInformation(
                "Starting request processing {RequestName} with correlation ID {CorrelationId}",
                requestName,
                correlationId);

            var response = await next();

            stopwatch.Stop();
            var duration = stopwatch.ElapsedMilliseconds;

            activity?.SetTag("response.duration_ms", duration);
            activity?.SetTag("response.success", true);

            _logger.LogInformation(
                "Request {RequestName} completed successfully in {Duration}ms with correlation ID {CorrelationId}",
                requestName,
                duration,
                correlationId);

            // Log performance warnings
            if (duration > 1000) // Log slow requests
            {
                _logger.LogWarning(
                    "Slow request detected: {RequestName} took {Duration}ms with correlation ID {CorrelationId}",
                    requestName,
                    duration,
                    correlationId);
            }

            return response;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            var duration = stopwatch.ElapsedMilliseconds;

            activity?.SetTag("response.duration_ms", duration);
            activity?.SetTag("response.success", false);
            activity?.SetTag("error.type", ex.GetType().Name);
            activity?.SetTag("error.message", ex.Message);

            _logger.LogError(ex,
                "Request {RequestName} failed after {Duration}ms with correlation ID {CorrelationId}. Error: {ErrorMessage}",
                requestName,
                duration,
                correlationId,
                ex.Message);

            throw;
        }
    }

    private static string GetCorrelationId(TRequest request)
    {
        if (request is ICorrelationId correlationIdRequest)
        {
            return correlationIdRequest.CorrelationId.ToString();
        }

        return Guid.NewGuid().ToString();
    }
}