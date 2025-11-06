namespace CarMaintenance.Application.DTOs;

/// <summary>
/// Data Transfer Object for ServiceType entity
/// </summary>
public class ServiceTypeDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal BaseCost { get; set; }
    public int EstimatedDurationMinutes { get; set; }
    public bool RequiresParts { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public bool IsActive { get; set; } = true;
}

/// <summary>
/// Data Transfer Object for creating a ServiceType
/// </summary>
public class CreateServiceTypeDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal BaseCost { get; set; }
    public int EstimatedDurationMinutes { get; set; }
    public bool RequiresParts { get; set; } = true;
}

/// <summary>
/// Data Transfer Object for updating a ServiceType
/// </summary>
public class UpdateServiceTypeDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal BaseCost { get; set; }
    public int EstimatedDurationMinutes { get; set; }
    public bool RequiresParts { get; set; } = true;
    public bool IsActive { get; set; } = true;
}