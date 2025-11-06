using System.ComponentModel.DataAnnotations;

namespace CarMaintenance.Domain.Entities;

/// <summary>
/// MaintenanceRecord entity representing a maintenance service record
/// </summary>
public class MaintenanceRecord : BaseEntity
{
    [Required]
    public int CarId { get; set; }

    [Required]
    public int ServiceTypeId { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? Cost { get; set; }

    public DateTime ServiceDate { get; set; } = DateTime.UtcNow;

    public int Mileage { get; set; }

    [MaxLength(100)]
    public string? ServiceProvider { get; set; }

    [MaxLength(200)]
    public string? Location { get; set; }

    public bool IsCompleted { get; set; } = true;

    public DateTime? NextServiceDueDate { get; set; }

    public int? NextServiceDueMileage { get; set; }

    // Navigation properties - will be properly defined in Infrastructure layer
    public virtual Car Car { get; set; } = null!;
    public virtual ServiceType ServiceType { get; set; } = null!;

    // Business methods
    public bool IsMaintenanceRecord => ServiceDate <= DateTime.UtcNow;
    public bool IsUpcoming => ServiceDate > DateTime.UtcNow;
    public bool IsOverdue => NextServiceDueDate.HasValue && NextServiceDueDate < DateTime.UtcNow;

    public int DaysSinceService => (DateTime.UtcNow - ServiceDate).Days;
    public int MilesSinceService => Car?.Mileage - Mileage ?? 0;
}