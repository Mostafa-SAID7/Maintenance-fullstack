using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using StackExchange.Redis;

namespace CarMaintenance.Infrastructure.Services;

/// <summary>
/// Memory cache service implementation
/// </summary>
public class MemoryCacheService : ICacheService
{
    private readonly IMemoryCache _cache;
    private readonly ILogger<MemoryCacheService> _logger;

    public MemoryCacheService(IMemoryCache cache, ILogger<MemoryCacheService> logger)
    {
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default) where T : class
    {
        try
        {
            _logger.LogDebug("Getting cache entry for key: {CacheKey}", key);

            if (_cache.TryGetValue(key, out T? value))
            {
                _logger.LogDebug("Cache hit for key: {CacheKey}", key);
                return value;
            }

            _logger.LogDebug("Cache miss for key: {CacheKey}", key);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving cache entry for key: {CacheKey}", key);
            return null;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiry = null, CancellationToken cancellationToken = default) where T : class
    {
        try
        {
            _logger.LogDebug("Setting cache entry for key: {CacheKey} with expiry: {Expiry}", key, expiry);

            var options = new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = expiry ?? TimeSpan.FromMinutes(30)
            };

            _cache.Set(key, value, options);

            _logger.LogDebug("Successfully set cache entry for key: {CacheKey}", key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting cache entry for key: {CacheKey}", key);
        }
    }

    public async Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Removing cache entry for key: {CacheKey}", key);
            _cache.Remove(key);
            _logger.LogDebug("Successfully removed cache entry for key: {CacheKey}", key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing cache entry for key: {CacheKey}", key);
        }
    }

    public async Task RemoveByPatternAsync(string pattern, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Removing cache entries matching pattern: {Pattern}", pattern);
            
            // Note: Memory cache doesn't support pattern matching natively
            // This would need to be implemented with a custom solution
            // For now, log that pattern removal isn't supported in memory cache
            _logger.LogWarning("Pattern-based cache removal is not supported in memory cache implementation");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing cache entries matching pattern: {Pattern}", pattern);
        }
    }

    public async Task ClearAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Clearing all cache entries");
            
            // Note: Memory cache doesn't support clearing all entries natively
            // This would need to be implemented with a custom solution
            _logger.LogWarning("Bulk cache clearing is not supported in memory cache implementation");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing cache");
        }
    }
}

/// <summary>
/// Redis cache service implementation
/// </summary>
public class RedisCacheService : ICacheService
{
    private readonly IDistributedCache _distributedCache;
    private readonly IConnectionMultiplexer _connection;
    private readonly ILogger<RedisCacheService> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    public RedisCacheService(IDistributedCache distributedCache, IConnectionMultiplexer connection, ILogger<RedisCacheService> logger)
    {
        _distributedCache = distributedCache ?? throw new ArgumentNullException(nameof(distributedCache));
        _connection = connection ?? throw new ArgumentNullException(nameof(connection));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        };
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default) where T : class
    {
        try
        {
            _logger.LogDebug("Getting Redis cache entry for key: {CacheKey}", key);

            var jsonData = await _distributedCache.GetStringAsync(key, cancellationToken);
            
            if (string.IsNullOrEmpty(jsonData))
            {
                _logger.LogDebug("Redis cache miss for key: {CacheKey}", key);
                return null;
            }

            var result = JsonSerializer.Deserialize<T>(jsonData, _jsonOptions);
            
            _logger.LogDebug("Redis cache hit for key: {CacheKey}", key);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Redis cache entry for key: {CacheKey}", key);
            return null;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiry = null, CancellationToken cancellationToken = default) where T : class
    {
        try
        {
            _logger.LogDebug("Setting Redis cache entry for key: {CacheKey} with expiry: {Expiry}", key, expiry);

            var jsonData = JsonSerializer.Serialize(value, _jsonOptions);
            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = expiry ?? TimeSpan.FromMinutes(30)
            };

            await _distributedCache.SetStringAsync(key, jsonData, options, cancellationToken);

            _logger.LogDebug("Successfully set Redis cache entry for key: {CacheKey}", key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting Redis cache entry for key: {CacheKey}", key);
        }
    }

    public async Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Removing Redis cache entry for key: {CacheKey}", key);
            await _distributedCache.RemoveAsync(key, cancellationToken);
            _logger.LogDebug("Successfully removed Redis cache entry for key: {CacheKey}", key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing Redis cache entry for key: {CacheKey}", key);
        }
    }

    public async Task RemoveByPatternAsync(string pattern, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Removing Redis cache entries matching pattern: {Pattern}", pattern);

            var server = _connection.GetServer(_connection.GetEndPoints().First());
            var keys = server.Keys(pattern: $"*{pattern}*").ToArray();

            if (keys.Length > 0)
            {
                var database = _connection.GetDatabase();
                await database.KeyDeleteAsync(keys);
                _logger.LogDebug("Removed {Count} Redis cache entries matching pattern: {Pattern}", keys.Length, pattern);
            }
            else
            {
                _logger.LogDebug("No Redis cache entries found matching pattern: {Pattern}", pattern);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing Redis cache entries matching pattern: {Pattern}", pattern);
        }
    }

    public async Task ClearAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Clearing all Redis cache entries");

            var server = _connection.GetServer(_connection.GetEndPoints().First());
            var keys = server.Keys().ToArray();

            if (keys.Length > 0)
            {
                var database = _connection.GetDatabase();
                await database.KeyDeleteAsync(keys);
                _logger.LogDebug("Cleared {Count} Redis cache entries", keys.Length);
            }
            else
            {
                _logger.LogDebug("No Redis cache entries to clear");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing Redis cache");
        }
    }

    /// <summary>
    /// Gets Redis database instance for direct operations
    /// </summary>
    /// <returns>The Redis database</returns>
    public IDatabase GetDatabase()
    {
        return _connection.GetDatabase();
    }

    /// <summary>
    /// Gets Redis server instance for direct operations
    /// </summary>
    /// <returns>The Redis server</returns>
    public IServer GetServer()
    {
        return _connection.GetServer(_connection.GetEndPoints().First());
    }

    /// <summary>
    /// Gets Redis connection status
    /// </summary>
    /// <returns>The connection status</returns>
    public bool IsConnected()
    {
        return _connection.IsConnected;
    }

    /// <summary>
    /// Gets Redis cache statistics
    /// </summary>
    /// <returns>Cache statistics</returns>
    public async Task<CacheStatistics> GetStatisticsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var server = GetServer();
            var database = GetDatabase();

            var info = await server.InfoAsync("memory");
            var keys = server.Keys().Count();

            return new CacheStatistics
            {
                TotalKeys = keys,
                ConnectedClients = server.ClientList().Count,
                UsedMemory = ParseMemoryInfo(info),
                IsConnected = _connection.IsConnected,
                LastUpdated = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Redis cache statistics");
            return new CacheStatistics { IsConnected = false, LastUpdated = DateTime.UtcNow };
        }
    }

    private static long ParseMemoryInfo(string info)
    {
        try
        {
            var lines = info.Split('\n');
            foreach (var line in lines)
            {
                if (line.StartsWith("used_memory:"))
                {
                    var value = line.Split(':')[1].Trim();
                    return long.Parse(value);
                }
            }
        }
        catch
        {
            // Ignore parsing errors
        }
        return 0;
    }
}

/// <summary>
/// Cache statistics model
/// </summary>
public class CacheStatistics
{
    public int TotalKeys { get; set; }
    public int ConnectedClients { get; set; }
    public long UsedMemory { get; set; }
    public bool IsConnected { get; set; }
    public DateTime LastUpdated { get; set; }

    public string MemoryFormatted => FormatBytes(UsedMemory);
    public string Status => IsConnected ? "Connected" : "Disconnected";

    private static string FormatBytes(long bytes)
    {
        if (bytes < 1024) return $"{bytes} B";
        if (bytes < 1024 * 1024) return $"{bytes / 1024:F1} KB";
        if (bytes < 1024 * 1024 * 1024) return $"{bytes / (1024 * 1024):F1} MB";
        return $"{bytes / (1024 * 1024 * 1024):F1} GB";
    }
}