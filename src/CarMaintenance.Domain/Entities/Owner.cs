using System.ComponentModel.DataAnnotations;

namespace CarMaintenance.Domain.Entities;

/// <summary>
/// Owner entity representing a vehicle owner
/// </summary>
public class Owner : BaseEntity
{
    [Required]
    [MaxLength(50)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [Phone]
    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(200)]
    public string? Address { get; set; }

    [MaxLength(50)]
    public string? City { get; set; }

    [MaxLength(50)]
    public string? State { get; set; }

    [MaxLength(10)]
    public string? ZipCode { get; set; }

    [MaxLength(20)]
    public string? LicenseNumber { get; set; }

    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual ICollection<Car> Cars { get; set; } = new List<Car>();

    // Business methods
    public string FullName => $"{FirstName} {LastName}";
    
    public bool HasActiveCars => Cars.Any(c => c.IsActive);
    
    public bool IsEmailValid()
    {
        return !string.IsNullOrEmpty(Email) && 
               Email.Contains('@') && 
               Email.Contains('.');
    }
}