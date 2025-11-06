using System.ComponentModel.DataAnnotations;

namespace CarMaintenance.Domain.Entities;

/// <summary>
/// ServiceType entity representing types of maintenance services
/// </summary>
public class ServiceType : BaseEntity
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Range(0, int.MaxValue)]
    public int RecommendedIntervalMiles { get; set; } = 5000;

    [Range(0, 120)]
    public int RecommendedIntervalMonths { get; set; } = 6;

    [Range(0, int.MaxValue)]
    public decimal AverageCost { get; set; }

    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual ICollection<Car> Cars { get; set; } = new List<Car>();
    public virtual ICollection<MaintenanceRecord> MaintenanceRecords { get; set; } = new List<MaintenanceRecord>();

    // Business methods
    public bool IsMaintenanceDue(int miles, int months)
    {
        return miles >= RecommendedIntervalMiles || months >= RecommendedIntervalMonths;
    }

    public int GetNextServiceMileage(int currentMileage)
    {
        return currentMileage + RecommendedIntervalMiles;
    }
}