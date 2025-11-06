namespace CarMaintenance.Application.DTOs;

/// <summary>
/// Data Transfer Object for Notification entity
/// </summary>
public class NotificationDto
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public string? ActionUrl { get; set; }
}

/// <summary>
/// Data Transfer Object for creating a Notification
/// </summary>
public class CreateNotificationDto
{
    public string UserId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public DateTime? ExpiresAt { get; set; }
    public string? ActionUrl { get; set; }
}

/// <summary>
/// Data Transfer Object for updating a Notification
/// </summary>
public class UpdateNotificationDto
{
    public int Id { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
}