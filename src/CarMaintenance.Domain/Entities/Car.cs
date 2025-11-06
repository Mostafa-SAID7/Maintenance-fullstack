using System.ComponentModel.DataAnnotations;

namespace CarMaintenance.Domain.Entities;

/// <summary>
/// Car entity representing a vehicle in the system
/// </summary>
public class Car : BaseEntity
{
    [Required]
    [MaxLength(50)]
    public string Make { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Model { get; set; } = string.Empty;

    [Required]
    [Range(1900, 2100)]
    public int Year { get; set; }

    [MaxLength(30)]
    public string? Color { get; set; }

    [MaxLength(20)]
    public string? LicensePlate { get; set; }

    [Required]
    [MaxLength(17)]
    public string VIN { get; set; } = string.Empty;

    public int Mileage { get; set; }

    public string OwnerId { get; set; } = string.Empty;

    public DateTime? LastMaintenanceDate { get; set; }

    public int? ServiceTypeId { get; set; }

    // Navigation properties
    public virtual ServiceType? ServiceType { get; set; }
    public virtual ICollection<MaintenanceRecord> MaintenanceRecords { get; set; } = new List<MaintenanceRecord>();

    // Business methods
    public bool IsOverdueForService(int monthsSinceLastService, int milesSinceLastService, ServiceType serviceType)
    {
        if (LastMaintenanceDate == null) return true;

        return monthsSinceLastService > serviceType.RecommendedIntervalMonths ||
               milesSinceLastService > serviceType.RecommendedIntervalMiles;
    }

    public int CalculateNextServiceMileage(int currentMileage, ServiceType serviceType)
    {
        return currentMileage + serviceType.RecommendedIntervalMiles;
    }
}