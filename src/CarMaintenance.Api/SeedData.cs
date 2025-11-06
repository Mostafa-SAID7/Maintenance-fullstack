using Microsoft.AspNetCore.Identity;
using CarMaintenance.Api.Models;
using CarMaintenance.Api.Data;

namespace CarMaintenance.Api
{
    public static class SeedData
    {
        public static async Task SeedAsync(AppDbContext context, UserManager<AppUser> userManager)
        {
            // Ensure database is created
            await context.Database.EnsureCreatedAsync();

            // Check if seed data already exists
            if (context.ServiceTypes.Any())
            {
                return; // Database has been seeded
            }

            // Seed Service Types
            var serviceTypes = new[]
            {
                new ServiceType { Name = "Oil Change", Description = "Engine oil and filter replacement", IsActive = true },
                new ServiceType { Name = "Tire Rotation", Description = "Rotate tires for even wear", IsActive = true },
                new ServiceType { Name = "Brake Service", Description = "Brake pad and rotor replacement", IsActive = true },
                new ServiceType { Name = "Battery Replacement", Description = "Replace car battery", IsActive = true },
                new ServiceType { Name = "Air Filter", Description = "Replace engine air filter", IsActive = true },
                new ServiceType { Name = "Spark Plugs", Description = "Replace spark plugs", IsActive = true },
                new ServiceType { Name = "Transmission Service", Description = "Transmission fluid and filter change", IsActive = true },
                new ServiceType { Name = "Coolant Service", Description = "Flush and replace coolant", IsActive = true },
                new ServiceType { Name = "Wheel Alignment", Description = "Align wheels for proper handling", IsActive = true },
                new ServiceType { Name = "Comprehensive Inspection", Description = "Complete vehicle inspection", IsActive = true }
            };

            context.ServiceTypes.AddRange(serviceTypes);
            await context.SaveChangesAsync();

            // Seed sample users
            var adminUser = new AppUser
            {
                UserName = "admin@carmaintenance.com",
                Email = "admin@carmaintenance.com",
                FirstName = "Admin",
                LastName = "User",
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            };

            var regularUser = new AppUser
            {
                UserName = "john.doe@example.com",
                Email = "john.doe@example.com",
                FirstName = "John",
                LastName = "Doe",
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            };

            // Create users
            await userManager.CreateAsync(adminUser, "Admin@123456");
            await userManager.CreateAsync(regularUser, "User@123456");

            // Seed sample cars
            var sampleCars = new[]
            {
                new Car
                {
                    Make = "Toyota",
                    Model = "Camry",
                    Year = 2019,
                    LicensePlate = "ABC-1234",
                    Vin = "1HGBH41JXMN109186",
                    Mileage = 45000,
                    Color = "Silver",
                    OwnerId = regularUser.Id,
                    CreatedAt = DateTime.UtcNow
                },
                new Car
                {
                    Make = "Honda",
                    Model = "Accord",
                    Year = 2020,
                    LicensePlate = "XYZ-5678",
                    Vin = "2HGBH41JXMN109187",
                    Mileage = 32000,
                    Color = "Blue",
                    OwnerId = regularUser.Id,
                    CreatedAt = DateTime.UtcNow
                }
            };

            context.Cars.AddRange(sampleCars);
            await context.SaveChangesAsync();

            // Seed sample maintenance records
            var oilChangeService = context.ServiceTypes.First(s => s.Name == "Oil Change");
            var brakeService = context.ServiceTypes.First(s => s.Name == "Brake Service");
            var tireRotationService = context.ServiceTypes.First(s => s.Name == "Tire Rotation");

            var sampleMaintenanceRecords = new[]
            {
                new MaintenanceRecord
                {
                    CarId = sampleCars[0].Id,
                    ServiceTypeId = oilChangeService.Id,
                    ServiceDate = DateTime.UtcNow.AddMonths(-6),
                    Description = "Regular oil change - 5W-30 synthetic",
                    Cost = 45.99m,
                    Mileage = 35000,
                    ServiceProvider = "Quick Lube Express",
                    IsCompleted = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new MaintenanceRecord
                {
                    CarId = sampleCars[0].Id,
                    ServiceTypeId = brakeService.Id,
                    ServiceDate = DateTime.UtcNow.AddMonths(-3),
                    Description = "Front brake pads replacement",
                    Cost = 189.99m,
                    Mileage = 40000,
                    ServiceProvider = "AutoCare Center",
                    IsCompleted = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new MaintenanceRecord
                {
                    CarId = sampleCars[1].Id,
                    ServiceTypeId = tireRotationService.Id,
                    ServiceDate = DateTime.UtcNow.AddMonths(-1),
                    Description = "Tire rotation and balance",
                    Cost = 35.99m,
                    Mileage = 30000,
                    ServiceProvider = "Tire World",
                    IsCompleted = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };

            context.MaintenanceRecords.AddRange(sampleMaintenanceRecords);
            await context.SaveChangesAsync();

            // Seed sample notifications
            var sampleNotifications = new[]
            {
                new Notification
                {
                    UserId = regularUser.Id,
                    Title = "Oil Change Reminder",
                    Message = "Your Toyota Camry is due for an oil change.",
                    Type = NotificationType.MaintenanceReminder,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow,
                    Priority = NotificationPriority.Medium,
                    Data = "{\"carId\":1,\"serviceTypeId\":1}"
                },
                new Notification
                {
                    UserId = regularUser.Id,
                    Title = "Maintenance Completed",
                    Message = "Your brake service has been completed successfully.",
                    Type = NotificationType.MaintenanceCompleted,
                    IsRead = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-5),
                    Priority = NotificationPriority.Low,
                    Data = "{\"carId\":1,\"recordId\":2}"
                }
            };

            context.Notifications.AddRange(sampleNotifications);
            await context.SaveChangesAsync();

            Console.WriteLine("Database seeded successfully with sample data.");
        }
    }

    public enum NotificationType
    {
        MaintenanceReminder = 0,
        MaintenanceCompleted = 1,
        PredictiveAlert = 2,
        SystemAlert = 3
    }

    public enum NotificationPriority
    {
        Low = 0,
        Medium = 1,
        High = 2,
        Critical = 3
    }
}