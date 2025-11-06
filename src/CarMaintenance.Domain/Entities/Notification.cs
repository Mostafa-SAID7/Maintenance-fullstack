using System.ComponentModel.DataAnnotations;

namespace CarMaintenance.Domain.Entities;

/// <summary>
/// Notification entity for system notifications
/// </summary>
public class Notification : BaseEntity
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string Message { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Type { get; set; }

    [MaxLength(50)]
    public string? Priority { get; set; } = "Normal";

    public string? UserId { get; set; }

    public bool IsRead { get; set; } = false;

    public DateTime? ReadAt { get; set; }

    public DateTime? ExpiresAt { get; set; }

    [MaxLength(200)]
    public string? ActionUrl { get; set; }

    [MaxLength(100)]
    public string? ActionText { get; set; }

    [MaxLength(100)]
    public string? Source { get; set; }

    public int? RelatedEntityId { get; set; }

    [MaxLength(50)]
    public string? RelatedEntityType { get; set; }

    // Navigation properties
    public virtual AppUser? User { get; set; }

    // Business methods
    public bool IsExpired => ExpiresAt.HasValue && ExpiresAt < DateTime.UtcNow;
    
    public bool IsUnread => !IsRead;
    
    public bool IsHighPriority => Priority?.ToLower() == "high" || Priority?.ToLower() == "urgent";
    
    public void MarkAsRead()
    {
        IsRead = true;
        ReadAt = DateTime.UtcNow;
    }
}