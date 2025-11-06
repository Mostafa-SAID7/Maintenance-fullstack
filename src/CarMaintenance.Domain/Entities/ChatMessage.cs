using System.ComponentModel.DataAnnotations;

namespace CarMaintenance.Domain.Entities;

/// <summary>
/// ChatMessage entity representing a chat message in the system
/// </summary>
public class ChatMessage : BaseEntity
{
    [Required]
    [MaxLength(1000)]
    public string Message { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? SenderName { get; set; }

    public string? UserId { get; set; }

    public DateTime SentAt { get; set; } = DateTime.UtcNow;

    public bool IsRead { get; set; } = false;

    [MaxLength(50)]
    public string? Room { get; set; }

    [MaxLength(50)]
    public string? MessageType { get; set; } = "Text";

    // Navigation properties
    public virtual AppUser? User { get; set; }

    // Business methods
    public bool IsRecent => SentAt > DateTime.UtcNow.AddHours(-1);
    public bool IsToday => SentAt.Date == DateTime.UtcNow.Date;
    public bool IsThisWeek => SentAt > DateTime.UtcNow.AddDays(-7);
}