using Microsoft.EntityFrameworkCore;
using CarMaintenance.Api.Models;

namespace CarMaintenance.Infrastructure.Data;

/// <summary>
/// Application database context for Car Maintenance system
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Car> Cars { get; set; }
    public DbSet<Owner> Owners { get; set; }
    public DbSet<MaintenanceRecord> MaintenanceRecords { get; set; }
    public DbSet<ServiceType> ServiceTypes { get; set; }
    public DbSet<ChatMessage> ChatMessages { get; set; }
    public DbSet<Notification> Notifications { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Configure relationships
        modelBuilder.Entity<Car>()
            .HasOne(c => c.Owner)
            .WithMany(o => o.Cars)
            .HasForeignKey(c => c.OwnerId);

        modelBuilder.Entity<MaintenanceRecord>()
            .HasOne(m => m.Car)
            .WithMany(c => c.MaintenanceRecords)
            .HasForeignKey(m => m.CarId);

        // Seed data
        modelBuilder.Entity<ServiceType>().HasData(
            new ServiceType { Id = 1, Name = "Oil Change", Description = "Engine oil and filter replacement", RecommendedIntervalMiles = 5000, RecommendedIntervalMonths = 6 },
            new ServiceType { Id = 2, Name = "Tire Rotation", Description = "Rotate tires for even wear", RecommendedIntervalMiles = 7500, RecommendedIntervalMonths = 6 },
            new ServiceType { Id = 3, Name = "Brake Service", Description = "Brake pad and rotor replacement", RecommendedIntervalMiles = 50000, RecommendedIntervalMonths = 24 }
        );
    }
}