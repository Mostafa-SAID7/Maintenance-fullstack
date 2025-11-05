using CarMaintenance.Api.Interfaces;
using CarMaintenance.Api.Models;
using CarMaintenance.Shared.DTOs.Notifications;

namespace CarMaintenance.Api.Services
{
    public class NotificationService : INotificationService
    {
        private readonly IUnitOfWork _unitOfWork;

        public NotificationService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IEnumerable<NotificationDto>> GetAllAsync()
        {
            var notifications = await _unitOfWork.Repository<Notification>().GetAllAsync();
            return notifications.Select(n => new NotificationDto
            {
                Id = n.Id,
                UserId = n.UserId,
                Message = n.Message,
                Type = n.Type,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt
            });
        }

        public async Task<NotificationDto?> GetByIdAsync(int id)
        {
            var notification = await _unitOfWork.Repository<Notification>().GetByIdAsync(id);
            if (notification == null) return null;

            return new NotificationDto
            {
                Id = notification.Id,
                UserId = notification.UserId,
                Message = notification.Message,
                Type = notification.Type,
                IsRead = notification.IsRead,
                CreatedAt = notification.CreatedAt
            };
        }

        public async Task<IEnumerable<NotificationDto>> GetByUserIdAsync(string userId)
        {
            var notifications = await _unitOfWork.Repository<Notification>().FindAsync(n => n.UserId == userId);
            return notifications.Select(n => new NotificationDto
            {
                Id = n.Id,
                UserId = n.UserId,
                Message = n.Message,
                Type = n.Type,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt
            });
        }

        public async Task<NotificationDto> CreateAsync(NotificationDto notificationDto)
        {
            var notification = new Notification
            {
                UserId = notificationDto.UserId,
                Message = notificationDto.Message,
                Type = notificationDto.Type,
                IsRead = notificationDto.IsRead
            };

            await _unitOfWork.Repository<Notification>().AddAsync(notification);
            await _unitOfWork.SaveChangesAsync();

            notificationDto.Id = notification.Id;
            notificationDto.CreatedAt = notification.CreatedAt;
            return notificationDto;
        }

        public async Task<bool> MarkAsReadAsync(int id)
        {
            var notification = await _unitOfWork.Repository<Notification>().GetByIdAsync(id);
            if (notification == null) return false;

            notification.IsRead = true;
            await _unitOfWork.Repository<Notification>().UpdateAsync(notification);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var notification = await _unitOfWork.Repository<Notification>().GetByIdAsync(id);
            if (notification == null) return false;

            await _unitOfWork.Repository<Notification>().DeleteAsync(notification);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        public async Task SendNotificationAsync(string userId, string message, string type)
        {
            var notificationDto = new NotificationDto
            {
                UserId = userId,
                Message = message,
                Type = type,
                IsRead = false
            };

            await CreateAsync(notificationDto);
        }
    }
}