using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using CarMaintenance.Domain.Entities;
using CarMaintenance.Domain.Interfaces;
using CarMaintenance.Api.Data;

namespace CarMaintenance.Infrastructure.Repositories;

/// <summary>
/// Generic repository implementation
/// </summary>
/// <typeparam name="T">The entity type</typeparam>
/// <typeparam name="TKey">The primary key type</typeparam>
public class Repository<T, TKey> : IRepository<T, TKey> where T : class
{
    protected readonly AppDbContext _context;
    protected readonly DbSet<T> _dbSet;
    protected readonly ILogger<Repository<T, TKey>> _logger;

    public Repository(AppDbContext context, ILogger<Repository<T, TKey>> logger)
    {
        _context = context;
        _dbSet = context.Set<T>();
        _logger = logger;
    }

    public virtual async Task<T?> GetByIdAsync(TKey id, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Getting entity {EntityType} with ID {Id}", typeof(T).Name, id);
            return await _dbSet.FindAsync(new object[] { id }, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting entity {EntityType} with ID {Id}", typeof(T).Name, id);
            throw;
        }
    }

    public virtual async Task<IEnumerable<T>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Getting all entities of type {EntityType}", typeof(T).Name);
            return await _dbSet.ToListAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all entities of type {EntityType}", typeof(T).Name);
            throw;
        }
    }

    public virtual async Task<T> AddAsync(T entity, CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _dbSet.AddAsync(entity, cancellationToken);
            _logger.LogDebug("Added entity of type {EntityType}", typeof(T).Name);
            return result.Entity;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding entity of type {EntityType}", typeof(T).Name);
            throw;
        }
    }

    public virtual async Task<T> UpdateAsync(T entity, CancellationToken cancellationToken = default)
    {
        try
        {
            _dbSet.Update(entity);
            _logger.LogDebug("Updated entity of type {EntityType}", typeof(T).Name);
            return await Task.FromResult(entity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating entity of type {EntityType}", typeof(T).Name);
            throw;
        }
    }

    public virtual async Task<bool> DeleteAsync(TKey id, CancellationToken cancellationToken = default)
    {
        try
        {
            var entity = await GetByIdAsync(id, cancellationToken);
            if (entity == null) return false;
            
            _dbSet.Remove(entity);
            _logger.LogDebug("Deleted entity of type {EntityType} with ID {Id}", typeof(T).Name, id);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting entity {EntityType} with ID {Id}", typeof(T).Name, id);
            throw;
        }
    }

    public virtual async Task<bool> DeleteAsync(T entity, CancellationToken cancellationToken = default)
    {
        try
        {
            _dbSet.Remove(entity);
            _logger.LogDebug("Removed entity of type {EntityType}", typeof(T).Name);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing entity of type {EntityType}", typeof(T).Name);
            throw;
        }
    }

    public virtual async Task<bool> ExistsAsync(TKey id, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _dbSet.FindAsync(new object[] { id }, cancellationToken) != null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if entity {EntityType} with ID {Id} exists", typeof(T).Name, id);
            throw;
        }
    }

    public virtual async Task<int> CountAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            return await _dbSet.CountAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error counting entities of type {EntityType}", typeof(T).Name);
            throw;
        }
    }

    public virtual async Task<(IEnumerable<T> Items, int TotalCount)> GetPagedAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var totalCount = await _dbSet.CountAsync(cancellationToken);
            var items = await _dbSet
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            return (items, totalCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting paged entities of type {EntityType} - Page: {PageNumber}, Size: {PageSize}",
                typeof(T).Name, pageNumber, pageSize);
            throw;
        }
    }
}