using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using CarMaintenance.Domain.Entities;

namespace CarMaintenance.Api.Data;

/// <summary>
/// Application database context
/// </summary>
public class AppDbContext : IdentityDbContext<Domain.Entities.AppUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    // DbSets for domain entities
    public DbSet<Car> Cars { get; set; }
    public DbSet<Owner> Owners { get; set; }
    public DbSet<MaintenanceRecord> MaintenanceRecords { get; set; }
    public DbSet<ServiceType> ServiceTypes { get; set; }
    public DbSet<Notification> Notifications { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Configure Car entity
        builder.Entity<Car>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Make).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Model).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Year).IsRequired();
            entity.Property(e => e.Color).HasMaxLength(30);
            entity.Property(e => e.LicensePlate).HasMaxLength(20);
            entity.Property(e => e.Vin).IsRequired();
            entity.Property(e => e.Mileage).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);

            // Configure relationships based on current domain structure
            entity.HasOne<ServiceType>()
                  .WithMany()
                  .HasForeignKey(e => e.ServiceTypeId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne<Owner>()
                  .WithMany(o => o.Cars)
                  .HasForeignKey(e => e.OwnerId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.Vin).IsUnique();
            entity.HasIndex(e => e.LicensePlate);
        });

        // Configure Owner entity
        builder.Entity<Owner>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FirstName).IsRequired().HasMaxLength(50);
            entity.Property(e => e.LastName).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.Address).HasMaxLength(200);
            entity.Property(e => e.City).HasMaxLength(50);
            entity.Property(e => e.State).HasMaxLength(50);
            entity.Property(e => e.ZipCode).HasMaxLength(10);
            entity.Property(e => e.LicenseNumber).HasMaxLength(20);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);

            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.Phone);
        });

        // Configure MaintenanceRecord entity
        builder.Entity<MaintenanceRecord>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Description).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Notes).HasMaxLength(1000);
            entity.Property(e => e.ServiceDate).IsRequired();
            entity.Property(e => e.Mileage).IsRequired();
            entity.Property(e => e.ServiceProvider).HasMaxLength(100);
            entity.Property(e => e.Location).HasMaxLength(200);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.IsCompleted).IsRequired().HasDefaultValue(true);

            entity.HasOne(e => e.Car)
                  .WithMany(c => c.MaintenanceRecords)
                  .HasForeignKey(e => e.CarId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.ServiceType)
                  .WithMany(s => s.MaintenanceRecords)
                  .HasForeignKey(e => e.ServiceTypeId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Configure ServiceType entity
        builder.Entity<ServiceType>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.RecommendedIntervalMiles).IsRequired();
            entity.Property(e => e.RecommendedIntervalMonths).IsRequired();
            entity.Property(e => e.AverageCost).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);

            entity.HasIndex(e => e.Name).IsUnique();
        });

        // Configure Notification entity
        builder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Message).IsRequired().HasMaxLength(1000);
            entity.Property(e => e.Type).IsRequired();
            entity.Property(e => e.Priority).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.IsRead).IsRequired().HasDefaultValue(false);

            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.IsRead);
        });

        // Seed data
        SeedData(builder);
    }

    private static void SeedData(ModelBuilder builder)
    {
        // Seed ServiceTypes
        builder.Entity<ServiceType>().HasData(
            new ServiceType { Id = 1, Name = "Oil Change", Description = "Regular engine oil change", RecommendedIntervalMiles = 5000, RecommendedIntervalMonths = 6, AverageCost = 50.00m, CreatedAt = DateTime.UtcNow, IsActive = true },
            new ServiceType { Id = 2, Name = "Tire Rotation", Description = "Rotate tires for even wear", RecommendedIntervalMiles = 7500, RecommendedIntervalMonths = 6, AverageCost = 30.00m, CreatedAt = DateTime.UtcNow, IsActive = true },
            new ServiceType { Id = 3, Name = "Brake Inspection", Description = "Check brake pads and system", RecommendedIntervalMiles = 12000, RecommendedIntervalMonths = 12, AverageCost = 100.00m, CreatedAt = DateTime.UtcNow, IsActive = true }
        );
    }
}