namespace CarMaintenance.Application.DTOs;

/// <summary>
/// Data Transfer Object for Car entity
/// </summary>
public class CarDto
{
    public int Id { get; set; }
    public string Make { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int Year { get; set; }
    public string LicensePlate { get; set; } = string.Empty;
    public string Vin { get; set; } = string.Empty;
    public int Mileage { get; set; }
    public string Color { get; set; } = string.Empty;
    public string OwnerId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? LastMaintenanceDate { get; set; }
    public string OwnerName { get; set; } = string.Empty;
}

/// <summary>
/// Data Transfer Object for creating a Car
/// </summary>
public class CreateCarDto
{
    public string Make { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int Year { get; set; }
    public string? Color { get; set; }
    public string? LicensePlate { get; set; }
    public string Vin { get; set; } = string.Empty;
    public int Mileage { get; set; }
    public string OwnerId { get; set; } = string.Empty;
    public int? ServiceTypeId { get; set; }
}

/// <summary>
/// Data Transfer Object for updating a Car
/// </summary>
public class UpdateCarDto
{
    public int Id { get; set; }
    public string Make { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int Year { get; set; }
    public string? Color { get; set; }
    public string? LicensePlate { get; set; }
    public string Vin { get; set; } = string.Empty;
    public int Mileage { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? LastMaintenanceDate { get; set; }
}