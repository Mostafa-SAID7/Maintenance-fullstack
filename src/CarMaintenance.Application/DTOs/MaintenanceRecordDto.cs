namespace CarMaintenance.Application.DTOs;

/// <summary>
/// Data Transfer Object for MaintenanceRecord entity
/// </summary>
public class MaintenanceRecordDto
{
    public int Id { get; set; }
    public int CarId { get; set; }
    public int ServiceTypeId { get; set; }
    public DateTime ServiceDate { get; set; }
    public int Mileage { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Cost { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string CarMake { get; set; } = string.Empty;
    public string CarModel { get; set; } = string.Empty;
    public string CarLicensePlate { get; set; } = string.Empty;
    public string ServiceTypeName { get; set; } = string.Empty;
}

/// <summary>
/// Data Transfer Object for creating a MaintenanceRecord
/// </summary>
public class CreateMaintenanceRecordDto
{
    public int CarId { get; set; }
    public int ServiceTypeId { get; set; }
    public DateTime ServiceDate { get; set; }
    public int Mileage { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Cost { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Data Transfer Object for updating a MaintenanceRecord
/// </summary>
public class UpdateMaintenanceRecordDto
{
    public int Id { get; set; }
    public int CarId { get; set; }
    public int ServiceTypeId { get; set; }
    public DateTime ServiceDate { get; set; }
    public int Mileage { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Cost { get; set; }
    public string? Notes { get; set; }
}