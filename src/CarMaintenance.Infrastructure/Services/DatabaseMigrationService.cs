using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using CarMaintenance.Api.Data;
using CarMaintenance.Models;

namespace CarMaintenance.Infrastructure.Services;

/// <summary>
/// Service for managing database migrations and seeding
/// </summary>
public interface IMigrationService
{
    /// <summary>
    /// Applies all pending database migrations
    /// </summary>
    /// <param name="cancellationToken">The cancellation token</param>
    /// <returns>A task representing the operation</returns>
    Task ApplyMigrationsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new database migration
    /// </summary>
    /// <param name="name">The name of the migration</param>
    /// <param name="cancellationToken">The cancellation token</param>
    /// <returns>A task representing the operation</returns>
    Task CreateMigrationAsync(string name, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the status of database migrations
    /// </summary>
    /// <param name="cancellationToken">The cancellation token</param>
    /// <returns>Migration status information</returns>
    Task<MigrationStatus> GetMigrationStatusAsync(CancellationToken cancellationToken = default);
}

/// <summary>
/// Database seeding service interface
/// </summary>
public interface IDatabaseSeeder
{
    /// <summary>
    /// Seeds the database with initial data
    /// </summary>
    /// <param name="cancellationToken">The cancellation token</param>
    /// <returns>A task representing the operation</returns>
    Task SeedAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Resets the database to its initial state
    /// </summary>
    /// <param name="cancellationToken">The cancellation token</param>
    /// <returns>A task representing the operation</returns>
    Task ResetAsync(CancellationToken cancellationToken = default);
}

/// <summary>
/// Migration service implementation
/// </summary>
public class MigrationService : IMigrationService
{
    private readonly AppDbContext _context;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<MigrationService> _logger;

    public MigrationService(
        AppDbContext context, 
        IServiceProvider serviceProvider, 
        ILogger<MigrationService> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _serviceProvider = serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task ApplyMigrationsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Starting database migration process");

            // Ensure database exists
            await _context.Database.EnsureCreatedAsync(cancellationToken);

            // Check if migrations have been applied
            var appliedMigrations = await _context.Database.GetAppliedMigrationsAsync(cancellationToken);
            var pendingMigrations = await _context.Database.GetPendingMigrationsAsync(cancellationToken);

            _logger.LogInformation("Applied migrations: {AppliedCount}, Pending migrations: {PendingCount}",
                appliedMigrations.Count(), pendingMigrations.Count());

            // Apply pending migrations
            if (pendingMigrations.Any())
            {
                _logger.LogInformation("Applying {Count} pending migrations", pendingMigrations.Count());

                foreach (var migration in pendingMigrations)
                {
                    _logger.LogInformation("Applying migration: {Migration}", migration);
                    await _context.Database.MigrateAsync(migration, cancellationToken);
                }

                _logger.LogInformation("Database migrations applied successfully");
            }
            else
            {
                _logger.LogInformation("No pending migrations to apply");
            }

            // Validate database connection
            await ValidateDatabaseConnectionAsync(cancellationToken);

            _logger.LogInformation("Database migration process completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during database migration");
            throw;
        }
    }

    public async Task CreateMigrationAsync(string name, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Creating migration: {MigrationName}", name);

            if (string.IsNullOrWhiteSpace(name))
            {
                throw new ArgumentException("Migration name cannot be null or empty", nameof(name));
            }

            // Use scoped context to avoid conflicts
            using var scope = _serviceProvider.CreateScope();
            var scopedContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            await scopedContext.Database.CreateMigrationAsync(name, cancellationToken);

            _logger.LogInformation("Migration created successfully: {MigrationName}", name);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating migration: {MigrationName}", name);
            throw;
        }
    }

    public async Task<MigrationStatus> GetMigrationStatusAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var appliedMigrations = await _context.Database.GetAppliedMigrationsAsync(cancellationToken);
            var pendingMigrations = await _context.Database.GetPendingMigrationsAsync(cancellationToken);

            // Get the latest migration
            var latestMigration = appliedMigrations.LastOrDefault();
            var latestMigrationDate = latestMigration?.Split('_').First();

            DateTime? latestDate = null;
            if (!string.IsNullOrEmpty(latestMigrationDate) && DateTime.TryParseExact(
                latestMigrationDate, 
                "yyyyMMddHHmmss", 
                System.Globalization.CultureInfo.InvariantCulture, 
                System.Globalization.DateTimeStyles.None, 
                out var parsedDate))
            {
                latestDate = parsedDate;
            }

            return new MigrationStatus
            {
                AppliedMigrations = appliedMigrations.ToList(),
                PendingMigrations = pendingMigrations.ToList(),
                IsUpToDate = !pendingMigrations.Any(),
                LatestMigration = latestMigration,
                LatestMigrationDate = latestDate,
                TotalMigrations = appliedMigrations.Count() + pendingMigrations.Count(),
                LastChecked = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting migration status");
            return new MigrationStatus
            {
                Error = ex.Message,
                LastChecked = DateTime.UtcNow
            };
        }
    }

    private async Task ValidateDatabaseConnectionAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Validating database connection");

            // Test connection by executing a simple query
            await _context.Database.ExecuteSqlRawAsync("SELECT 1", cancellationToken);

            _logger.LogDebug("Database connection validated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database connection validation failed");
            throw new InvalidOperationException("Database connection test failed", ex);
        }
    }
}

/// <summary>
/// Database seeding service implementation
/// </summary>
public class DatabaseSeeder : IDatabaseSeeder
{
    private readonly AppDbContext _context;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DatabaseSeeder> _logger;

    public DatabaseSeeder(
        AppDbContext context, 
        IServiceProvider serviceProvider, 
        ILogger<DatabaseSeeder> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _serviceProvider = serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Starting database seeding process");

            // Check if data already exists
            if (await HasDataAsync(cancellationToken))
            {
                _logger.LogInformation("Database already contains data, skipping seeding");
                return;
            }

            await SeedServiceTypesAsync(cancellationToken);
            await SeedOwnersAsync(cancellationToken);
            await SeedCarsAsync(cancellationToken);
            await SeedMaintenanceRecordsAsync(cancellationToken);
            await SeedNotificationsAsync(cancellationToken);

            // Save changes
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Database seeding completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during database seeding");
            throw;
        }
    }

    public async Task ResetAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogWarning("Resetting database to initial state");

            // Drop and recreate database
            await _context.Database.EnsureDeletedAsync(cancellationToken);
            await _context.Database.EnsureCreatedAsync(cancellationToken);

            // Re-seed
            await SeedAsync(cancellationToken);

            _logger.LogInformation("Database reset completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during database reset");
            throw;
        }
    }

    private async Task<bool> HasDataAsync(CancellationToken cancellationToken = default)
    {
        return await _context.ServiceTypes.AnyAsync(cancellationToken) ||
               await _context.Owners.AnyAsync(cancellationToken) ||
               await _context.Cars.AnyAsync(cancellationToken);
    }

    private async Task SeedServiceTypesAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Seeding service types");

        var serviceTypes = new[]
        {
            new ServiceType { Id = Guid.NewGuid(), Name = "Oil Change", Description = "Regular oil and filter change", Cost = 50.00m, EstimatedDuration = 30, IsActive = true, CreatedAt = DateTime.UtcNow },
            new ServiceType { Id = Guid.NewGuid(), Name = "Brake Inspection", Description = "Comprehensive brake system check", Cost = 75.00m, EstimatedDuration = 60, IsActive = true, CreatedAt = DateTime.UtcNow },
            new ServiceType { Id = Guid.NewGuid(), Name = "Tire Rotation", Description = "Rotate tires for even wear", Cost = 30.00m, EstimatedDuration = 30, IsActive = true, CreatedAt = DateTime.UtcNow },
            new ServiceType { Id = Guid.NewGuid(), Name = "Engine Diagnostic", Description = "Complete engine diagnostic check", Cost = 150.00m, EstimatedDuration = 120, IsActive = true, CreatedAt = DateTime.UtcNow },
            new ServiceType { Id = Guid.NewGuid(), Name = "Transmission Service", Description = "Transmission fluid and filter change", Cost = 200.00m, EstimatedDuration = 180, IsActive = true, CreatedAt = DateTime.UtcNow }
        };

        _context.ServiceTypes.AddRange(serviceTypes);
        await Task.CompletedTask;
    }

    private async Task SeedOwnersAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Seeding owners");

        var owners = new[]
        {
            new Owner { Id = Guid.NewGuid(), Name = "John Smith", Email = "john.smith@email.com", Phone = "(555) 123-4567", Address = "123 Main St, City, State", CreatedAt = DateTime.UtcNow },
            new Owner { Id = Guid.NewGuid(), Name = "Sarah Johnson", Email = "sarah.johnson@email.com", Phone = "(555) 987-6543", Address = "456 Oak Ave, City, State", CreatedAt = DateTime.UtcNow },
            new Owner { Id = Guid.NewGuid(), Name = "Michael Brown", Email = "michael.brown@email.com", Phone = "(555) 555-1234", Address = "789 Pine Rd, City, State", CreatedAt = DateTime.UtcNow }
        };

        _context.Owners.AddRange(owners);
        await Task.CompletedTask;
    }

    private async Task SeedCarsAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Seeding cars");

        var owners = await _context.Owners.ToListAsync(cancellationToken);

        var cars = new[]
        {
            new Car { Id = Guid.NewGuid(), Vin = "1HGBH41JXMN109186", Make = "Toyota", Model = "Camry", Year = 2020, Color = "Silver", Mileage = 25000, OwnerId = owners[0].Id, IsActive = true, CreatedAt = DateTime.UtcNow },
            new Car { Id = Guid.NewGuid(), Vin = "2HGBH41JXMN109187", Make = "Honda", Model = "Accord", Year = 2019, Color = "Black", Mileage = 35000, OwnerId = owners[1].Id, IsActive = true, CreatedAt = DateTime.UtcNow },
            new Car { Id = Guid.NewGuid(), Vin = "3HGBH41JXMN109188", Make = "Ford", Model = "F-150", Year = 2021, Color = "Blue", Mileage = 15000, OwnerId = owners[2].Id, IsActive = true, CreatedAt = DateTime.UtcNow }
        };

        _context.Cars.AddRange(cars);
        await Task.CompletedTask;
    }

    private async Task SeedMaintenanceRecordsAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Seeding maintenance records");

        var cars = await _context.Cars.ToListAsync(cancellationToken);
        var serviceTypes = await _context.ServiceTypes.ToListAsync(cancellationToken);

        var maintenanceRecords = new[]
        {
            new MaintenanceRecord
            {
                Id = Guid.NewGuid(),
                CarId = cars[0].Id,
                ServiceTypeId = serviceTypes[0].Id,
                Description = "Regular oil change",
                Cost = 45.00m,
                ServiceDate = DateTime.UtcNow.AddDays(-30),
                IsCompleted = true,
                Notes = "Used synthetic oil",
                CreatedAt = DateTime.UtcNow
            },
            new MaintenanceRecord
            {
                Id = Guid.NewGuid(),
                CarId = cars[1].Id,
                ServiceTypeId = serviceTypes[1].Id,
                Description = "Brake pad replacement",
                Cost = 200.00m,
                ServiceDate = DateTime.UtcNow.AddDays(-15),
                IsCompleted = true,
                Notes = "Front brake pads replaced",
                CreatedAt = DateTime.UtcNow
            }
        };

        _context.MaintenanceRecords.AddRange(maintenanceRecords);
        await Task.CompletedTask;
    }

    private async Task SeedNotificationsAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Seeding notifications");

        var cars = await _context.Cars.ToListAsync(cancellationToken);

        var notifications = new[]
        {
            new Notification
            {
                Id = Guid.NewGuid(),
                CarId = cars[0].Id,
                Title = "Maintenance Due",
                Message = "Oil change is due for your 2020 Toyota Camry",
                Type = "Maintenance",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            },
            new Notification
            {
                Id = Guid.NewGuid(),
                CarId = cars[1].Id,
                Title = "Service Reminder",
                Message = "Brake inspection scheduled for next week",
                Type = "Reminder",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            }
        };

        _context.Notifications.AddRange(notifications);
        await Task.CompletedTask;
    }
}

/// <summary>
/// Migration status information
/// </summary>
public class MigrationStatus
{
    public List<string> AppliedMigrations { get; set; } = new();
    public List<string> PendingMigrations { get; set; } = new();
    public bool IsUpToDate { get; set; }
    public string? LatestMigration { get; set; }
    public DateTime? LatestMigrationDate { get; set; }
    public int TotalMigrations { get; set; }
    public DateTime LastChecked { get; set; }
    public string? Error { get; set; }

    public string Status => IsUpToDate ? "Up to date" : "Updates pending";
    public string LastCheckedFormatted => LastChecked.ToString("yyyy-MM-dd HH:mm:ss UTC");
}