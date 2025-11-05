using Microsoft.EntityFrameworkCore;
using CarMaintenance.Domain.Entities;

namespace CarMaintenance.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<AppUser> Users { get; set; }
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

            modelBuilder.Entity<MaintenanceRecord>()
                .HasOne(m => m.ServiceType)
                .WithMany()
                .HasForeignKey(m => m.ServiceTypeId);

            // Seed data
            modelBuilder.Entity<ServiceType>().HasData(
                new ServiceType { Id = 1, Name = "Oil Change", Description = "Engine oil and filter replacement" },
                new ServiceType { Id = 2, Name = "Tire Rotation", Description = "Rotate tires for even wear" },
                new ServiceType { Id = 3, Name = "Brake Service", Description = "Brake pad and rotor replacement" },
                new ServiceType { Id = 4, Name = "Battery Replacement", Description = "Replace car battery" },
                new ServiceType { Id = 5, Name = "Air Filter", Description = "Replace engine air filter" }
            );
        }
    }
}