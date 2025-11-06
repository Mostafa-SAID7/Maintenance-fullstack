using MediatR;
using Microsoft.Extensions.DependencyInjection;
using System.Reflection;
using CarMaintenance.Application.Behaviors;
using AutoMapper;
using FluentValidation;

namespace CarMaintenance.Application.Configuration;

/// <summary>
/// Application layer configuration and service registration
/// </summary>
public static class ApplicationConfiguration
{
    /// <summary>
    /// Adds application layer services to the dependency injection container
    /// </summary>
    /// <param name="services">The service collection</param>
    /// <returns>The service collection for chaining</returns>
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // Add AutoMapper
        services.AddAutoMapper(Assembly.GetExecutingAssembly());
        
        // Add FluentValidation
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());
        
        // Add MediatR
        services.AddMediatR(cfg => {
            cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly());
            
            // Add pipeline behaviors (order matters!)
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ExceptionHandlingBehavior<,>));
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(PerformanceBehavior<,>));
        });

        return services;
    }
}

/// <summary>
/// Extension methods for application configuration
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Adds validators from an assembly to the service collection
    /// </summary>
    /// <param name="services">The service collection</param>
    /// <param name="assembly">The assembly to scan for validators</param>
    /// <returns>The service collection for chaining</returns>
    public static IServiceCollection AddValidatorsFromAssembly(this IServiceCollection services, Assembly assembly)
    {
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());
        return services;
    }

    /// <summary>
    /// Adds AutoMapper profiles from an assembly
    /// </summary>
    /// <param name="services">The service collection</param>
    /// <param name="assembly">The assembly to scan for profiles</param>
    /// <returns>The service collection for chaining</returns>
    public static IServiceCollection AddAutoMapperProfiles(this IServiceCollection services, Assembly assembly)
    {
        var config = new MapperConfiguration(cfg =>
        {
            cfg.AddMaps(assembly);
            cfg.Advanced.AdvancedConfigOptions.ValidateInlineMaps = false;
        });

        services.AddSingleton(config);
        services.AddSingleton<IMapper>(sp => new Mapper(config, sp.GetService));

        return services;
    }
}

/// <summary>
/// Performance monitoring MediatR pipeline behavior
/// </summary>
/// <typeparam name="TRequest">The request type</typeparam>
/// <typeparam name="TResponse">The response type</typeparam>
public class PerformanceBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly ILogger<PerformanceBehavior<TRequest, TResponse>> _logger;
    private readonly Stopwatch _timer;

    /// <summary>
    /// Initializes a new instance of the PerformanceBehavior class
    /// </summary>
    /// <param name="logger">The logger instance</param>
    public PerformanceBehavior(ILogger<PerformanceBehavior<TRequest, TResponse>> logger)
    {
        _logger = logger;
        _timer = new Stopwatch();
    }

    /// <summary>
    /// Handles the performance monitoring in the pipeline
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
        _timer.Start();

        try
        {
            var response = await next();
            return response;
        }
        finally
        {
            _timer.Stop();

            var elapsedMilliseconds = _timer.ElapsedMilliseconds;
            var requestName = typeof(TRequest).Name;

            if (elapsedMilliseconds > 500) // Log slow requests
            {
                _logger.LogWarning("Long Running Request: {RequestName} ({ElapsedMilliseconds} milliseconds) - {Request}",
                    requestName, elapsedMilliseconds, request);
            }

            _logger.LogDebug("Performance - {RequestName}: {ElapsedMilliseconds}ms", requestName, elapsedMilliseconds);
        }
    }
}

/// <summary>
/// Stopwatch utility class
/// </summary>
public class Stopwatch
{
    private long _startTime;
    private bool _isRunning;

    /// <summary>
    /// Gets the elapsed milliseconds
    /// </summary>
    public long ElapsedMilliseconds { get; private set; }

    /// <summary>
    /// Starts the stopwatch
    /// </summary>
    public void Start()
    {
        if (!_isRunning)
        {
            _startTime = Environment.TickCount64;
            _isRunning = true;
        }
    }

    /// <summary>
    /// Stops the stopwatch
    /// </summary>
    public void Stop()
    {
        if (_isRunning)
        {
            ElapsedMilliseconds = Environment.TickCount64 - _startTime;
            _isRunning = false;
        }
    }

    /// <summary>
    /// Resets the stopwatch
    /// </summary>
    public void Reset()
    {
        _startTime = 0;
        ElapsedMilliseconds = 0;
        _isRunning = false;
    }

    /// <summary>
    /// Restarts the stopwatch
    /// </summary>
    public void Restart()
    {
        Reset();
        Start();
    }
}