namespace CarMaintenance.Domain.Interfaces;

/// <summary>
/// Generic repository interface following the Repository pattern
/// </summary>
/// <typeparam name="T">The entity type</typeparam>
/// <typeparam name="TKey">The primary key type</typeparam>
public interface IRepository<T, TKey> where T : class
{
    /// <summary>
    /// Gets an entity by its primary key
    /// </summary>
    /// <param name="id">The primary key</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The entity if found, null otherwise</returns>
    Task<T?> GetByIdAsync(TKey id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all entities
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>All entities</returns>
    Task<IEnumerable<T>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Adds a new entity
    /// </summary>
    /// <param name="entity">The entity to add</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The added entity</returns>
    Task<T> AddAsync(T entity, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing entity
    /// </summary>
    /// <param name="entity">The entity to update</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The updated entity</returns>
    Task<T> UpdateAsync(T entity, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes an entity by its primary key
    /// </summary>
    /// <param name="id">The primary key</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if deleted, false if not found</returns>
    Task<bool> DeleteAsync(TKey id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes an entity
    /// </summary>
    /// <param name="entity">The entity to delete</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if deleted, false if not found</returns>
    Task<bool> DeleteAsync(T entity, CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if an entity exists by its primary key
    /// </summary>
    /// <param name="id">The primary key</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if exists, false otherwise</returns>
    Task<bool> ExistsAsync(TKey id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the count of all entities
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The total count</returns>
    Task<int> CountAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a paged result of entities
    /// </summary>
    /// <param name="pageNumber">The page number (1-based)</param>
    /// <param name="pageSize">The page size</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Paged result</returns>
    Task<(IEnumerable<T> Items, int TotalCount)> GetPagedAsync(
        int pageNumber, 
        int pageSize, 
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Specialized repository interface for aggregate roots
/// </summary>
/// <typeparam name="T">The aggregate root type</typeparam>
/// <typeparam name="TKey">The primary key type</typeparam>
public interface IAggregateRepository<T, TKey> : IRepository<T, TKey>
    where T : class
{
    /// <summary>
    /// Gets the aggregate root with domain events loaded
    /// </summary>
    /// <param name="id">The primary key</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The aggregate root with events</returns>
    Task<T?> GetWithEventsAsync(TKey id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Saves the aggregate root and dispatches domain events
    /// </summary>
    /// <param name="aggregate">The aggregate root</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The saved aggregate root</returns>
    Task<T> SaveAsync(T aggregate, CancellationToken cancellationToken = default);
}

/// <summary>
/// Interface for unit of work pattern
/// </summary>
public interface IUnitOfWork : IDisposable
{
    /// <summary>
    /// Gets a repository for the specified entity type
    /// </summary>
    /// <typeparam name="T">The entity type</typeparam>
    /// <typeparam name="TKey">The primary key type</typeparam>
    /// <returns>The repository instance</returns>
    IRepository<T, TKey> Repository<T, TKey>() where T : class;

    /// <summary>
    /// Gets an aggregate repository for the specified aggregate root type
    /// </summary>
    /// <typeparam name="T">The aggregate root type</typeparam>
    /// <typeparam name="TKey">The primary key type</typeparam>
    /// <returns>The aggregate repository instance</returns>
    IAggregateRepository<T, TKey> AggregateRepository<T, TKey>() where T : class;

    /// <summary>
    /// Saves all changes made in this context to the database
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The number of state entries written to the database</returns>
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Begins a new transaction
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The transaction</returns>
    Task BeginTransactionAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Commits the current transaction
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>A task representing the async operation</returns>
    Task CommitTransactionAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Rolls back the current transaction
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>A task representing the async operation</returns>
    Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
}