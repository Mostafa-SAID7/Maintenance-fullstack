using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace CarMaintenance.Domain.Entities;

/// <summary>
/// AppUser entity extending IdentityUser for application-specific user data
/// </summary>
public class AppUser : IdentityUser
{
    [MaxLength(50)]
    public string FirstName { get; set; } = string.Empty;

    [MaxLength(50)]
    public string LastName { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? LastLoginAt { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public bool IsActive { get; set; } = true;

    [MaxLength(50)]
    public string? PreferredLanguage { get; set; }

    [MaxLength(50)]
    public string? Timezone { get; set; }

    // Navigation properties
    public virtual ICollection<Car> Cars { get; set; } = new List<Car>();
    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public virtual ICollection<ChatMessage> ChatMessages { get; set; } = new List<ChatMessage>();

    // Business methods
    public string FullName => $"{FirstName} {LastName}";
    
    public bool HasRecentLogin => LastLoginAt.HasValue && LastLoginAt.Value > DateTime.UtcNow.AddDays(-30);
}