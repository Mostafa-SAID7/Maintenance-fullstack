using CarMaintenance.Domain.Events;

namespace CarMaintenance.Domain.Entities;

/// <summary>
/// Base class for aggregate roots following the Aggregate Root pattern
/// </summary>
/// <typeparam name="T">The entity type</typeparam>
public abstract class AggregateRoot<T>
{
    private readonly List<DomainEvent> _domainEvents = new();

    /// <summary>
    /// Gets the primary key
    /// </summary>
    public abstract T Id { get; protected set; }

    /// <summary>
    /// Gets the version for optimistic concurrency
    /// </summary>
    public virtual int Version { get; private set; }

    /// <summary>
    /// Gets a read-only collection of domain events
    /// </summary>
    public IReadOnlyCollection<DomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    /// <summary>
    /// Adds a domain event to be published
    /// </summary>
    /// <param name="domainEvent">The domain event</param>
    protected void AddDomainEvent(DomainEvent domainEvent)
    {
        _domainEvents.Add(domainEvent);
    }

    /// <summary>
    /// Marks the aggregate as having been loaded from storage
    /// </summary>
    /// <param name="version">The version when loaded</param>
    public virtual void MarkAsLoaded(int version)
    {
        Version = version;
    }

    /// <summary>
    /// Clears all domain events
    /// </summary>
    public void ClearDomainEvents()
    {
        _domainEvents.Clear();
    }

    /// <summary>
    /// Applies a domain event to this aggregate (for event sourcing)
    /// </summary>
    /// <param name="domainEvent">The domain event</param>
    public virtual void ApplyEvent(DomainEvent domainEvent)
    {
        // Override in derived classes to implement event handling
        // This method should contain the logic to apply the event to the aggregate state
    }
}