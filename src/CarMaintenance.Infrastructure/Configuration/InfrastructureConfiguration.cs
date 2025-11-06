using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using CarMaintenance.Api.Data;
using CarMaintenance.Api.Models;
using CarMaintenance.Infrastructure.Repositories;
using CarMaintenance.Infrastructure.Services;
using CarMaintenance.Infrastructure.Interceptors;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging;

namespace CarMaintenance.Infrastructure.Configuration;

/// <summary>
/// Infrastructure layer configuration and service registration
/// </summary>
public static class InfrastructureConfiguration
{
    /// <summary>
    /// Adds infrastructure layer services to the dependency injection container
    /// </summary>
    /// <param name="services">The service collection</param>
    /// <param name="configuration">The configuration instance</param>
    /// <returns>The service collection for chaining</returns>
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Database Configuration
        services.AddDbContext<AppDbContext>((serviceProvider, options) =>
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection");
            if (string.IsNullOrEmpty(connectionString))
            {
                throw new InvalidOperationException("Database connection string is not configured");
            }

            options.UseSqlServer(connectionString, sqlOptions =>
            {
                sqlOptions.CommandTimeout(30);
                sqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 3,
                    maxRetryDelay: TimeSpan.FromSeconds(30),
                    errorNumbersToAdd: null);
            });

            // Enable sensitive data logging in development
            if (serviceProvider.GetRequiredService<IHostEnvironment>().IsDevelopment())
            {
                options.EnableSensitiveDataLogging();
                options.LogTo(Console.WriteLine, LogLevel.Information);
            }

            // Add query tracking behavior
            options.ConfigureWarnings(warnings =>
            {
                warnings.Log(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.ConnectionOpened);
                warnings.Log(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.ConnectionClosed);
            });
        });

        // Repository Pattern
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));

        // Specialized Repositories
        services.AddScoped<ICarRepository, CarRepository>();
        services.AddScoped<IOwnerRepository, OwnerRepository>();
        services.AddScoped<IMaintenanceRecordRepository, MaintenanceRecordRepository>();
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<IServiceTypeRepository, ServiceTypeRepository>();
        services.AddScoped<IUserRepository, UserRepository>();

        // Repository Interceptors
        services.AddScoped<UpdateAuditInterceptor>();
        services.AddScoped<SoftDeleteInterceptor>();

        // Caching Services
        services.AddMemoryCache();
        services.AddDistributedMemoryCache();

        if (!string.IsNullOrEmpty(configuration.GetConnectionString("Redis")))
        {
            services.AddStackExchangeRedisCache(options =>
            {
                options.Configuration = configuration.GetConnectionString("Redis");
                options.InstanceName = "CarMaintenanceCache";
            });

            services.AddSingleton<ICacheService, RedisCacheService>();
        }
        else
        {
            services.AddSingleton<ICacheService, MemoryCacheService>();
        }

        // Database Migrations and Seed Data
        services.AddScoped<IMigrationService, MigrationService>();
        services.AddScoped<IDatabaseSeeder, DatabaseSeeder>();

        // Query Optimization Services
        services.AddScoped<IQueryOptimizationService, QueryOptimizationService>();
        services.AddScoped<INPlusOneDetectionService, NPlusOneDetectionService>();

        // Transaction Management
        services.AddScoped<ITransactionManager, TransactionManager>();
        services.AddScoped<IDatabaseTransactionInterceptor, DatabaseTransactionInterceptor>();

        // Performance Monitoring
        services.AddSingleton<DatabasePerformanceMonitor>();
        services.AddScoped<DatabasePerformanceInterceptor>();

        // Identity Configuration
        services.AddScoped<IUserStore<AppUser>, UserStore<AppUser, IdentityRole, AppDbContext>>();
        services.AddScoped<IRoleStore<IdentityRole>, RoleStore<IdentityRole, AppDbContext>>();

        return services;
    }

    /// <summary>
    /// Applies database migrations and seed data
    /// </summary>
    /// <param name="app">The web application</param>
    /// <returns>The web application for chaining</returns>
    public static async Task<WebApplication> EnsureDatabaseAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var migrationService = scope.ServiceProvider.GetRequiredService<IMigrationService>();
        var databaseSeeder = scope.ServiceProvider.GetRequiredService<IDatabaseSeeder>();

        try
        {
            // Apply migrations
            await migrationService.ApplyMigrationsAsync();
            
            // Seed database
            await databaseSeeder.SeedAsync();
            
            return app;
        }
        catch (Exception ex)
        {
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
            logger.LogError(ex, "Failed to initialize database");
            throw;
        }
    }
}

/// <summary>
/// Base interface for all repositories
/// </summary>
/// <typeparam name="T">The entity type</typeparam>
public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<T>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<T?> FindAsync(System.Linq.Expressions.Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);
    Task<IEnumerable<T>> FindManyAsync(System.Linq.Expressions.Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);
    Task<int> CountAsync(System.Linq.Expressions.Expression<Func<T, bool>>? predicate = null, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(System.Linq.Expressions.Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);
    Task<T> AddAsync(T entity, CancellationToken cancellationToken = default);
    Task<IEnumerable<T>> AddRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default);
    Task<T> UpdateAsync(T entity, CancellationToken cancellationToken = default);
    Task<IEnumerable<T>> UpdateRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default);
    Task DeleteAsync(T entity, CancellationToken cancellationToken = default);
    Task DeleteRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default);
    Task<IEnumerable<T>> GetPagedAsync(
        System.Linq.Expressions.Expression<Func<T, bool>>? filter = null,
        System.Linq.Expressions.Expression<Func<T, object>>? orderBy = null,
        int skip = 0,
        int take = 20,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Unit of Work pattern interface
/// </summary>
public interface IUnitOfWork : IDisposable
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task BeginTransactionAsync(CancellationToken cancellationToken = default);
    Task CommitTransactionAsync(CancellationToken cancellationToken = default);
    Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
    Task<T> ExecuteInTransactionAsync<T>(Func<Task<T>> operation, CancellationToken cancellationToken = default);
}

/// <summary>
/// Cache service interface
/// </summary>
public interface ICacheService
{
    Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default) where T : class;
    Task SetAsync<T>(string key, T value, TimeSpan? expiry = null, CancellationToken cancellationToken = default) where T : class;
    Task RemoveAsync(string key, CancellationToken cancellationToken = default);
    Task RemoveByPatternAsync(string pattern, CancellationToken cancellationToken = default);
    Task ClearAsync(CancellationToken cancellationToken = default);
}