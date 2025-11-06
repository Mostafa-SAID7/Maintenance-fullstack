using CarMaintenance.Api.DTOs;

namespace CarMaintenance.Api.Interfaces
{
    public interface INotificationService
    {
        Task<PagedResult<NotificationDto>> GetAllAsync(int page = 1, int pageSize = 10);
        Task<NotificationDto?> GetByIdAsync(int id);
        Task<PagedResult<NotificationDto>> GetByUserIdAsync(string userId, int page = 1, int pageSize = 10);
        Task<NotificationDto?> CreateAsync(NotificationDto notificationDto);
        Task<NotificationDto?> MarkAsReadAsync(int id);
        Task<bool> DeleteAsync(int id);
        Task SendMaintenanceReminderAsync(MaintenanceReminderDto reminder);
        Task SendPredictiveAlertAsync(PredictiveAlertDto alert);
    }
}