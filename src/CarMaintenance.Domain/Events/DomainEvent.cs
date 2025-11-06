namespace CarMaintenance.Domain.Events;

/// <summary>
/// Base class for all domain events
/// </summary>
public abstract class DomainEvent
{
    /// <summary>
    /// Gets the unique identifier of the event
    /// </summary>
    public Guid Id { get; } = Guid.NewGuid();

    /// <summary>
    /// Gets the timestamp when the event occurred
    /// </summary>
    public DateTime OccurredAt { get; } = DateTime.UtcNow;

    /// <summary>
    /// Gets the version of the event schema
    /// </summary>
    public virtual int Version { get; } = 1;

    /// <summary>
    /// Gets the type name of the event
    /// </summary>
    public string EventType => GetType().Name;

    /// <summary>
    /// Gets the aggregate root ID that triggered this event
    /// </summary>
    public virtual Guid AggregateId { get; init; } = Guid.Empty;

    /// <summary>
    /// Gets metadata associated with the event
    /// </summary>
    public virtual Dictionary<string, object> Metadata { get; } = [];

    /// <summary>
    /// Gets the user ID who triggered the event (if applicable)
    /// </summary>
    public string? UserId { get; set; }

    /// <summary>
    /// Gets the correlation ID for event tracing
    /// </summary>
    public Guid CorrelationId { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Adds metadata to the event
    /// </summary>
    /// <param name="key">The metadata key</param>
    /// <param name="value">The metadata value</param>
    public void AddMetadata(string key, object value)
    {
        Metadata[key] = value;
    }

    /// <summary>
    /// Gets metadata value by key
    /// </summary>
    /// <typeparam name="T">The type of the metadata value</typeparam>
    /// <param name="key">The metadata key</param>
    /// <returns>The metadata value</returns>
    public T? GetMetadata<T>(string key)
    {
        return Metadata.TryGetValue(key, out var value) ? (T?)value : default;
    }
}

/// <summary>
/// Base class for domain events with a specific aggregate ID type
/// </summary>
/// <typeparam name="T">The type of the aggregate ID</typeparam>
public abstract class DomainEvent<T>(T aggregateId) : DomainEvent
{
    public override Guid AggregateId => aggregateId is not null ? (Guid)(object)aggregateId : throw new ArgumentException("AggregateId cannot be null", nameof(aggregateId));
}

/// <summary>
/// Interface for domain event handlers
/// </summary>
/// <typeparam name="T">The type of domain event to handle</typeparam>
public interface IDomainEventHandler<in T> where T : DomainEvent
{
    /// <summary>
    /// Handles the domain event
    /// </summary>
    /// <param name="domainEvent">The domain event to handle</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>A task representing the async operation</returns>
    Task HandleAsync(T domainEvent, CancellationToken cancellationToken = default);
}

/// <summary>
/// Interface for domain event dispatcher
/// </summary>
public interface IDomainEventDispatcher
{
    /// <summary>
    /// Dispatches domain events to their handlers
    /// </summary>
    /// <param name="events">The domain events to dispatch</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>A task representing the async operation</returns>
    Task DispatchAsync(
        IEnumerable<DomainEvent> events,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Dispatches a single domain event
    /// </summary>
    /// <param name="domainEvent">The domain event to dispatch</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>A task representing the async operation</returns>
    Task DispatchAsync(DomainEvent domainEvent, CancellationToken cancellationToken = default);
}

/// <summary>
/// Exception thrown when a domain event handler is not found
/// </summary>
public class DomainEventHandlerNotFoundException(Type eventType) 
    : Exception($"No domain event handler found for event type: {eventType.Name}")
{
}