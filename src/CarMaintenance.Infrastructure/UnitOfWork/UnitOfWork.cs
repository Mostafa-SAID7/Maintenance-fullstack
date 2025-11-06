using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using CarMaintenance.Api.Data;

namespace CarMaintenance.Infrastructure.UnitOfWork;

/// <summary>
/// Unit of work implementation for transaction management
/// </summary>
public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;
    private readonly ILogger<UnitOfWork> _logger;
    private IDbContextTransaction? _currentTransaction;
    private bool _disposed = false;

    public UnitOfWork(AppDbContext context, ILogger<UnitOfWork> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_currentTransaction != null)
        {
            throw new InvalidOperationException("A transaction is already in progress.");
        }

        try
        {
            _currentTransaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            _logger.LogInformation("Database transaction started");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to begin database transaction");
            throw;
        }
    }

    public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_currentTransaction == null)
        {
            throw new InvalidOperationException("No transaction is in progress.");
        }

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
            await _currentTransaction.CommitAsync(cancellationToken);
            _logger.LogInformation("Database transaction committed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to commit database transaction");
            await RollbackTransactionAsync(cancellationToken);
            throw;
        }
        finally
        {
            await _currentTransaction.DisposeAsync();
            _currentTransaction = null;
        }
    }

    public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_currentTransaction == null)
        {
            throw new InvalidOperationException("No transaction is in progress.");
        }

        try
        {
            await _currentTransaction.RollbackAsync(cancellationToken);
            _logger.LogWarning("Database transaction rolled back");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to rollback database transaction");
        }
        finally
        {
            await _currentTransaction.DisposeAsync();
            _currentTransaction = null;
        }
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            return await _context.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save changes to database");
            throw;
        }
    }

    public IRepository<T, TKey> Repository<T, TKey>() where T : class
    {
        return new Repository<T, TKey>(_context, _logger);
    }

    public IAggregateRepository<T, TKey> AggregateRepository<T, TKey>() where T : class
    {
        return new AggregateRepository<T, TKey>(_context, _logger);
    }

    public void Dispose()
    {
        if (!_disposed)
        {
            if (_currentTransaction != null)
            {
                _currentTransaction.Dispose();
            }
            
            _context.Dispose();
            _disposed = true;
        }
        
        GC.SuppressFinalize(this);
    }
}

/// <summary>
/// Aggregate repository with domain event support
/// </summary>
public class AggregateRepository<T, TKey> : Repository<T, TKey>, IAggregateRepository<T, TKey> 
    where T : class
{
    public AggregateRepository(AppDbContext context, ILogger<Repository<T, TKey>> logger) 
        : base(context, logger)
    {
    }

    public async Task<T?> GetWithEventsAsync(TKey id, CancellationToken cancellationToken = default)
    {
        return await base.GetByIdAsync(id, cancellationToken);
    }

    public async Task<T> SaveAsync(T aggregate, CancellationToken cancellationToken = default)
    {
        if (aggregate == null)
        {
            throw new ArgumentNullException(nameof(aggregate));
        }

        try
        {
            // Handle aggregate creation vs update
            var existingEntity = await base.GetByIdAsync(id: id, cancellationToken);
            if (existingEntity == null)
            {
                // New aggregate - add to context
                await base.AddAsync(aggregate, cancellationToken);
            }
            else
            {
                // Existing aggregate - update in context
                base.Update(aggregate);
            }

            // Save changes will be handled by unit of work
            return aggregate;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save aggregate of type {AggregateType}", typeof(T).Name);
            throw;
        }
    }
}