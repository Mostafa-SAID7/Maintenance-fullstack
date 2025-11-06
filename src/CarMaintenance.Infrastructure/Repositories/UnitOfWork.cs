using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging;
using CarMaintenance.Api.Data;

namespace CarMaintenance.Infrastructure.Repositories;

/// <summary>
/// Advanced Unit of Work implementation with transaction management
/// </summary>
public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;
    private readonly ILogger<UnitOfWork> _logger;
    private IDbContextTransaction? _currentTransaction;
    private bool _disposed;
    private bool _transactionStarted;

    /// <summary>
    /// Gets a value indicating whether a transaction is currently active
    /// </summary>
    public bool IsInTransaction => _currentTransaction != null;

    /// <summary>
    /// Gets the current transaction if one is active
    /// </summary>
    public IDbContextTransaction? CurrentTransaction => _currentTransaction;

    /// <summary>
    /// Initializes a new instance of the UnitOfWork class
    /// </summary>
    /// <param name="context">The database context</param>
    /// <param name="logger">The logger instance</param>
    public UnitOfWork(AppDbContext context, ILogger<UnitOfWork> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Saves all changes made in this context to the database
    /// </summary>
    /// <param name="cancellationToken">The cancellation token</param>
    /// <returns>The number of state entries written to the database</returns>
    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Saving changes to database. Current transaction: {IsInTransaction}", IsInTransaction);

            var result = await _context.SaveChangesAsync(cancellationToken);

            _logger.LogDebug("Successfully saved {Count} changes to database", result);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while saving changes to database");
            throw;
        }
    }

    /// <summary>
    /// Begins a new database transaction
    /// </summary>
    /// <param name="cancellationToken">The cancellation token</param>
    /// <returns>A task representing the asynchronous operation</returns>
    public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transactionStarted)
        {
            throw new InvalidOperationException("A transaction is already in progress");
        }

        try
        {
            _logger.LogDebug("Beginning database transaction");

            _currentTransaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            _transactionStarted = true;

            _logger.LogDebug("Database transaction started successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while beginning database transaction");
            throw;
        }
    }

    /// <summary>
    /// Commits the current transaction
    /// </summary>
    /// <param name="cancellationToken">The cancellation token</param>
    /// <returns>A task representing the asynchronous operation</returns>
    public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (!_transactionStarted || _currentTransaction == null)
        {
            throw new InvalidOperationException("No transaction is in progress");
        }

        try
        {
            _logger.LogDebug("Committing database transaction");

            // Ensure all pending changes are saved before committing
            await SaveChangesAsync(cancellationToken);

            await _currentTransaction.CommitAsync(cancellationToken);

            _logger.LogDebug("Database transaction committed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while committing database transaction");
            await RollbackTransactionAsync(cancellationToken);
            throw;
        }
        finally
        {
            await DisposeTransactionAsync();
        }
    }

    /// <summary>
    /// Rolls back the current transaction
    /// </summary>
    /// <param name="cancellationToken">The cancellation token</param>
    /// <returns>A task representing the asynchronous operation</returns>
    public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (!_transactionStarted || _currentTransaction == null)
        {
            throw new InvalidOperationException("No transaction is in progress");
        }

        try
        {
            _logger.LogDebug("Rolling back database transaction");

            await _currentTransaction.RollbackAsync(cancellationToken);

            _logger.LogDebug("Database transaction rolled back successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while rolling back database transaction");
            throw;
        }
        finally
        {
            await DisposeTransactionAsync();
        }
    }

    /// <summary>
    /// Executes an operation within a database transaction
    /// </summary>
    /// <typeparam name="T">The type of result returned by the operation</typeparam>
    /// <param name="operation">The operation to execute</param>
    /// <param name="cancellationToken">The cancellation token</param>
    /// <returns>The result of the operation</returns>
    public async Task<T> ExecuteInTransactionAsync<T>(Func<Task<T>> operation, CancellationToken cancellationToken = default)
    {
        if (_transactionStarted)
        {
            // Already in a transaction, just execute the operation
            return await operation();
        }

        try
        {
            await BeginTransactionAsync(cancellationToken);

            var result = await operation();

            await CommitTransactionAsync(cancellationToken);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during transaction execution");
            
            if (_transactionStarted)
            {
                await RollbackTransactionAsync(cancellationToken);
            }
            
            throw;
        }
    }

    /// <summary>
    /// Executes an operation within a database transaction
    /// </summary>
    /// <param name="operation">The operation to execute</param>
    /// <param name="cancellationToken">The cancellation token</param>
    /// <returns>A task representing the asynchronous operation</returns>
    public async Task ExecuteInTransactionAsync(Func<Task> operation, CancellationToken cancellationToken = default)
    {
        if (_transactionStarted)
        {
            // Already in a transaction, just execute the operation
            await operation();
            return;
        }

        try
        {
            await BeginTransactionAsync(cancellationToken);

            await operation();

            await CommitTransactionAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during transaction execution");
            
            if (_transactionStarted)
            {
                await RollbackTransactionAsync(cancellationToken);
            }
            
            throw;
        }
    }

    /// <summary>
    /// Gets the database context
    /// </summary>
    /// <returns>The database context</returns>
    public AppDbContext GetContext()
    {
        return _context;
    }

    /// <summary>
    /// Detaches all entities from the context
    /// </summary>
    public void DetachAllEntities()
    {
        var entries = _context.ChangeTracker.Entries().ToList();
        foreach (var entry in entries)
        {
            entry.State = EntityState.Detached;
        }
    }

    /// <summary>
    /// Gets the number of entities being tracked by the context
    /// </summary>
    /// <returns>The number of tracked entities</returns>
    public int GetTrackedEntitiesCount()
    {
        return _context.ChangeTracker.Entries().Count();
    }

    /// <summary>
    /// Gets the current state of the context
    /// </summary>
    /// <returns>A string representation of the context state</returns>
    public string GetContextState()
    {
        var entries = _context.ChangeTracker.Entries()
            .GroupBy(e => e.State)
            .Select(g => $"{g.Key}: {g.Count()}")
            .ToList();

        return string.Join(", ", entries);
    }

    /// <summary>
    /// Disposes the current transaction
    /// </summary>
    private async Task DisposeTransactionAsync()
    {
        if (_currentTransaction != null)
        {
            await _currentTransaction.DisposeAsync();
            _currentTransaction = null;
        }
        
        _transactionStarted = false;
    }

    /// <summary>
    /// Disposes the Unit of Work
    /// </summary>
    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Disposes the Unit of Work
    /// </summary>
    /// <param name="disposing">Whether to dispose managed resources</param>
    protected virtual void Dispose(bool disposing)
    {
        if (!_disposed)
        {
            if (disposing)
            {
                _logger.LogDebug("Disposing Unit of Work");

                if (_transactionStarted)
                {
                    _logger.LogWarning("Unit of Work disposed while transaction was active, rolling back");
                    try
                    {
                        _currentTransaction?.Rollback();
                        _currentTransaction?.Dispose();
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error occurred while rolling back transaction during disposal");
                    }
                }

                _context?.Dispose();
            }

            _disposed = true;
        }
    }
}

/// <summary>
/// Transaction manager interface for advanced transaction operations
/// </summary>
public interface ITransactionManager
{
    /// <summary>
    /// Begins a new transaction with specified isolation level
    /// </summary>
    /// <param name="isolationLevel">The isolation level</param>
    /// <param name="cancellationToken">The cancellation token</param>
    /// <returns>A task representing the asynchronous operation</returns>
    Task BeginTransactionAsync(IsolationLevel isolationLevel = IsolationLevel.ReadCommitted, CancellationToken cancellationToken = default);

    /// <summary>
    /// Commits the current transaction with retry logic
    /// </summary>
    /// <param name="maxRetries">Maximum number of retry attempts</param>
    /// <param name="cancellationToken">The cancellation token</param>
    /// <returns>A task representing the asynchronous operation</returns>
    Task CommitTransactionAsync(int maxRetries = 3, CancellationToken cancellationToken = default);

    /// <summary>
    /// Executes an operation with automatic transaction management and retry logic
    /// </summary>
    /// <typeparam name="T">The type of result</typeparam>
    /// <param name="operation">The operation to execute</param>
    /// <param name="isolationLevel">The isolation level</param>
    /// <param name="maxRetries">Maximum number of retry attempts</param>
    /// <param name="cancellationToken">The cancellation token</param>
    /// <returns>The result of the operation</returns>
    Task<T> ExecuteWithTransactionAsync<T>(
        Func<Task<T>> operation,
        IsolationLevel isolationLevel = IsolationLevel.ReadCommitted,
        int maxRetries = 3,
        CancellationToken cancellationToken = default);
}