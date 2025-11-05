using CarMaintenance.Shared.DTOs.Notifications;

namespace CarMaintenance.Api.Interfaces
{
    public interface INotificationService
    {
        Task<IEnumerable<NotificationDto>> GetAllAsync();
        Task<NotificationDto?> GetByIdAsync(int id);
        Task<IEnumerable<NotificationDto>> GetByUserIdAsync(string userId);
        Task<NotificationDto> CreateAsync(NotificationDto notificationDto);
        Task<bool> MarkAsReadAsync(int id);
        Task<bool> DeleteAsync(int id);
        Task SendNotificationAsync(string userId, string message, string type);
    }
}