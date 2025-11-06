using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Diagnostics;
using System.Reflection;

namespace CarMaintenance.Domain.Events;

/// <summary>
/// Enhanced domain event dispatcher with performance monitoring and better error handling
/// </summary>
public class EnhancedDomainEventDispatcher : IDomainEventDispatcher
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<EnhancedDomainEventDispatcher> _logger;
    private readonly Dictionary<Type, List<Type>> _handlerCache = new();
    private readonly PerformanceCounter _performanceCounter = new();

    public EnhancedDomainEventDispatcher(
        IServiceProvider serviceProvider,
        ILogger<EnhancedDomainEventDispatcher> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    /// <summary>
    /// Dispatches domain events to their handlers with performance monitoring
    /// </summary>
    public async Task DispatchAsync(IEnumerable<DomainEvent> events, CancellationToken cancellationToken = default)
    {
        var eventList = events.ToList();
        if (!eventList.Any())
        {
            return;
        }

        _logger.LogInformation("Dispatching {EventCount} domain events", eventList.Count);

        using var scope = _performanceCounter.Measure("DispatchAllEvents");
        
        try
        {
            var dispatchTasks = eventList.Select(async domainEvent =>
            {
                using var eventScope = _performanceCounter.Measure($"Handle_{domainEvent.GetType().Name}");
                
                try
                {
                    await DispatchSingleEventAsync(domainEvent, cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error dispatching domain event {EventType} with ID {EventId}", 
                        domainEvent.GetType().Name, domainEvent.Id);
                    throw; // Re-throw to be handled by caller
                }
            });

            await Task.WhenAll(dispatchTasks);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during domain event dispatch");
            throw;
        }
        finally
        {
            LogPerformanceMetrics();
        }
    }

    /// <summary>
    /// Dispatches a single domain event
    /// </summary>
    public async Task DispatchAsync(DomainEvent domainEvent, CancellationToken cancellationToken = default)
    {
        using var scope = _performanceCounter.Measure($"Dispatch_{domainEvent.GetType().Name}");
        
        try
        {
            await DispatchSingleEventAsync(domainEvent, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error dispatching domain event {EventType} with ID {EventId}", 
                domainEvent.GetType().Name, domainEvent.Id);
            throw;
        }
    }

    /// <summary>
    /// Dispatch multiple events of the same type efficiently
    /// </summary>
    public async Task DispatchTypedAsync<T>(IEnumerable<T> events, CancellationToken cancellationToken = default) 
        where T : DomainEvent
    {
        var eventList = events.ToList();
        if (!eventList.Any())
        {
            return;
        }

        _logger.LogInformation("Dispatching {EventCount} typed domain events of type {EventType}", 
            eventList.Count, typeof(T).Name);

        using var scope = _performanceCounter.Measure($"DispatchTyped_{typeof(T).Name}");
        
        var handlerType = typeof(IDomainEventHandler<>).MakeGenericType(typeof(T));
        var handlers = _serviceProvider.GetServices(handlerType).ToList();

        if (!handlers.Any())
        {
            _logger.LogWarning("No handlers found for domain event type {EventType}", typeof(T).Name);
            return;
        }

        var dispatchTasks = eventList.Select(async domainEvent =>
        {
            using var eventScope = _performanceCounter.Measure($"Handle_{domainEvent.GetType().Name}");
            
            try
            {
                var handlerTasks = handlers.Select(async handler =>
                {
                    var handleMethod = handlerType.GetMethod("HandleAsync");
                    if (handleMethod != null)
                    {
                        await (Task)handleMethod.Invoke(handler, new object[] { domainEvent, cancellationToken })!;
                    }
                });

                await Task.WhenAll(handlerTasks);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error handling typed domain event {EventType} with ID {EventId}", 
                    domainEvent.GetType().Name, domainEvent.Id);
                throw;
            }
        });

        await Task.WhenAll(dispatchTasks);
    }

    /// <summary>
    /// Get performance metrics for monitoring
    /// </summary>
    public PerformanceMetrics GetPerformanceMetrics()
    {
        return _performanceCounter.GetMetrics();
    }

    /// <summary>
    /// Clear performance metrics
    /// </summary>
    public void ClearPerformanceMetrics()
    {
        _performanceCounter.Clear();
    }

    /// <summary>
    /// Pre-warm handler cache for better performance
    /// </summary>
    public void PreWarmHandlerCache()
    {
        _logger.LogInformation("Pre-warming domain event handler cache");
        
        var eventTypes = Assembly.GetExecutingAssembly()
            .GetTypes()
            .Where(t => typeof(DomainEvent).IsAssignableFrom(t) && !t.IsAbstract)
            .ToList();

        foreach (var eventType in eventTypes)
        {
            GetHandlerTypes(eventType);
        }
        
        _logger.LogInformation("Handler cache pre-warmed with {Count} event types", eventTypes.Count);
    }

    private async Task DispatchSingleEventAsync(DomainEvent domainEvent, CancellationToken cancellationToken)
    {
        var eventType = domainEvent.GetType();
        var handlerTypes = GetHandlerTypes(eventType);

        if (!handlerTypes.Any())
        {
            _logger.LogWarning("No handlers found for domain event type {EventType}", eventType.Name);
            return;
        }

        _logger.LogDebug("Found {HandlerCount} handlers for event {EventType}", 
            handlerTypes.Count, eventType.Name);

        var handlerTasks = handlerTypes.Select(async handlerType =>
        {
            try
            {
                var handler = _serviceProvider.GetService(handlerType);
                if (handler != null)
                {
                    var handleMethod = handlerType.GetMethod("HandleAsync");
                    if (handleMethod != null)
                    {
                        var parameters = handleMethod.GetParameters();
                        if (parameters.Length == 2)
                        {
                            await (Task)handleMethod.Invoke(handler, new object[] { domainEvent, cancellationToken })!;
                        }
                        else
                        {
                            await (Task)handleMethod.Invoke(handler, new object[] { domainEvent })!;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in handler {HandlerType} for event {EventType}", 
                    handlerType.Name, eventType.Name);
                throw;
            }
        });

        await Task.WhenAll(handlerTasks);
    }

    private List<Type> GetHandlerTypes(Type eventType)
    {
        if (_handlerCache.TryGetValue(eventType, out var cached))
        {
            return cached;
        }

        var handlerInterfaceType = typeof(IDomainEventHandler<>).MakeGenericType(eventType);
        var handlerTypes = Assembly.GetExecutingAssembly()
            .GetTypes()
            .Where(t => handlerInterfaceType.IsAssignableFrom(t) && !t.IsInterface && !t.IsAbstract)
            .ToList();

        _handlerCache[eventType] = handlerTypes;
        return handlerTypes;
    }

    private void LogPerformanceMetrics()
    {
        var metrics = _performanceCounter.GetMetrics();
        if (metrics.TotalOperations > 0)
        {
            _logger.LogInformation("Domain Event Dispatch Performance: {TotalOperations} operations, " +
                "Average duration: {AverageDuration}ms, Total time: {TotalTime}ms", 
                metrics.TotalOperations, metrics.AverageDurationMs, metrics.TotalTimeMs);
        }
    }
}

/// <summary>
/// Performance counter for monitoring domain event operations
/// </summary>
public class PerformanceCounter
{
    private readonly List<OperationMetric> _metrics = new();
    private readonly object _lock = new();

    public IDisposable Measure(string operationName)
    {
        return new OperationTimer(this, operationName);
    }

    public void RecordOperation(string operationName, TimeSpan duration)
    {
        lock (_lock)
        {
            _metrics.Add(new OperationMetric
            {
                OperationName = operationName,
                Duration = duration,
                Timestamp = DateTime.UtcNow
            });
        }
    }

    public PerformanceMetrics GetMetrics()
    {
        lock (_lock)
        {
            var totalTime = _metrics.Sum(m => m.Duration.TotalMilliseconds);
            var operationGroups = _metrics.GroupBy(m => m.OperationName);
            
            return new PerformanceMetrics
            {
                TotalOperations = _metrics.Count,
                TotalTimeMs = totalTime,
                AverageDurationMs = _metrics.Any() ? totalTime / _metrics.Count : 0,
                OperationBreakdown = operationGroups.ToDictionary(
                    g => g.Key, 
                    g => new OperationStats
                    {
                        Count = g.Count(),
                        TotalTimeMs = g.Sum(m => m.Duration.TotalMilliseconds),
                        AverageTimeMs = g.Average(m => m.Duration.TotalMilliseconds),
                        MinTimeMs = g.Min(m => m.Duration.TotalMilliseconds),
                        MaxTimeMs = g.Max(m => m.Duration.TotalMilliseconds)
                    })
            };
        }
    }

    public void Clear()
    {
        lock (_lock)
        {
            _metrics.Clear();
        }
    }

    private class OperationTimer : IDisposable
    {
        private readonly PerformanceCounter _counter;
        private readonly string _operationName;
        private readonly Stopwatch _stopwatch;

        public OperationTimer(PerformanceCounter counter, string operationName)
        {
            _counter = counter;
            _operationName = operationName;
            _stopwatch = Stopwatch.StartNew();
        }

        public void Dispose()
        {
            _stopwatch.Stop();
            _counter.RecordOperation(_operationName, _stopwatch.Elapsed);
        }
    }
}

public class OperationMetric
{
    public string OperationName { get; set; } = string.Empty;
    public TimeSpan Duration { get; set; }
    public DateTime Timestamp { get; set; }
}

public class PerformanceMetrics
{
    public int TotalOperations { get; set; }
    public double TotalTimeMs { get; set; }
    public double AverageDurationMs { get; set; }
    public Dictionary<string, OperationStats> OperationBreakdown { get; set; } = new();
}

public class OperationStats
{
    public int Count { get; set; }
    public double TotalTimeMs { get; set; }
    public double AverageTimeMs { get; set; }
    public double MinTimeMs { get; set; }
    public double MaxTimeMs { get; set; }
}