using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using CarMaintenance.Api.Models;
using CarMaintenance.Api.DTOs;

namespace CarMaintenance.Api.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly ILogger<ChatHub> _logger;

        public ChatHub(ILogger<ChatHub> logger)
        {
            _logger = logger;
        }

        public async Task JoinUserGroup(string userId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId}");
            _logger.LogInformation("User {UserId} joined their private group", userId);
        }

        public async Task LeaveUserGroup(string userId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"User_{userId}");
            _logger.LogInformation("User {UserId} left their private group", userId);
        }

        public async Task JoinCarGroup(int carId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Car_{carId}");
            _logger.LogInformation("Connection {ConnectionId} joined car group {CarId}", Context.ConnectionId, carId);
        }

        public async Task LeaveCarGroup(int carId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Car_{carId}");
            _logger.LogInformation("Connection {ConnectionId} left car group {CarId}", Context.ConnectionId, carId);
        }

        public async Task SendMaintenanceReminder(MaintenanceReminderDto reminder)
        {
            try
            {
                // Send to specific user
                await Clients.User(reminder.UserId).SendAsync("ReceiveMaintenanceReminder", reminder);
                
                // Send to car-specific group
                await Clients.Group($"Car_{reminder.CarId}").SendAsync("ReceiveMaintenanceReminder", reminder);
                
                _logger.LogInformation("Maintenance reminder sent for car {CarId} to user {UserId}", reminder.CarId, reminder.UserId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending maintenance reminder");
                throw;
            }
        }

        public async Task SendCarUpdate(CarUpdateDto update)
        {
            try
            {
                // Send to all users who have this car
                await Clients.Group($"Car_{update.CarId}").SendAsync("ReceiveCarUpdate", update);
                
                // Send to car owner specifically
                await Clients.User(update.OwnerId).SendAsync("ReceiveCarUpdate", update);
                
                _logger.LogInformation("Car update sent for car {CarId} to owner {OwnerId}", update.CarId, update.OwnerId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending car update");
                throw;
            }
        }

        public async Task SendMaintenanceCompleted(MaintenanceCompletedDto completed)
        {
            try
            {
                await Clients.Group($"Car_{completed.CarId}").SendAsync("ReceiveMaintenanceCompleted", completed);
                await Clients.User(completed.UserId).SendAsync("ReceiveMaintenanceCompleted", completed);
                
                _logger.LogInformation("Maintenance completion notification sent for car {CarId}", completed.CarId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending maintenance completion notification");
                throw;
            }
        }

        public async Task SendPredictiveAlert(PredictiveAlertDto alert)
        {
            try
            {
                await Clients.Group($"Car_{alert.CarId}").SendAsync("ReceivePredictiveAlert", alert);
                await Clients.User(alert.OwnerId).SendAsync("ReceivePredictiveAlert", alert);
                
                _logger.LogInformation("Predictive maintenance alert sent for car {CarId}", alert.CarId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending predictive maintenance alert");
                throw;
            }
        }

        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                await JoinUserGroup(userId);
            }
            
            _logger.LogInformation("Client connected: {ConnectionId}", Context.ConnectionId);
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                await LeaveUserGroup(userId);
            }
            
            _logger.LogInformation("Client disconnected: {ConnectionId}", Context.ConnectionId);
            await base.OnDisconnectedAsync(exception);
        }

        // Health check method for monitoring
        public async Task HealthCheck()
        {
            await Clients.Caller.SendAsync("HealthCheckResponse", new 
            { 
                connectionId = Context.ConnectionId,
                timestamp = DateTime.UtcNow,
                status = "healthy"
            });
        }

        // Method to get connection statistics
        public async Task GetConnectionInfo()
        {
            var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            await Clients.Caller.SendAsync("ConnectionInfo", new
            {
                connectionId = Context.ConnectionId,
                userId = userId,
                groups = Context.User?.FindAll("groups").Select(c => c.Value).ToList() ?? new List<string>(),
                timestamp = DateTime.UtcNow
            });
        }
    }

    // DTOs for SignalR messages
    public class MaintenanceReminderDto
    {
        public int CarId { get; set; }
        public string UserId { get; set; } = string.Empty;
        public int MaintenanceRecordId { get; set; }
        public string ServiceTypeName { get; set; } = string.Empty;
        public DateTime ServiceDate { get; set; }
        public string Message { get; set; } = string.Empty;
        public int DaysUntilService { get; set; }
    }

    public class CarUpdateDto
    {
        public int CarId { get; set; }
        public string OwnerId { get; set; } = string.Empty;
        public string UpdateType { get; set; } = string.Empty; // "Created", "Updated", "Deleted"
        public string Description { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public CarDto? CarData { get; set; }
    }

    public class MaintenanceCompletedDto
    {
        public int CarId { get; set; }
        public string UserId { get; set; } = string.Empty;
        public int MaintenanceRecordId { get; set; }
        public string ServiceTypeName { get; set; } = string.Empty;
        public DateTime CompletedDate { get; set; }
        public decimal TotalCost { get; set; }
        public string? Notes { get; set; }
    }

    public class PredictiveAlertDto
    {
        public int CarId { get; set; }
        public string OwnerId { get; set; } = string.Empty;
        public string AlertType { get; set; } = string.Empty; // "Maintenance Needed", "Service Overdue"
        public string Message { get; set; } = string.Empty;
        public double Confidence { get; set; }
        public DateTime PredictedDate { get; set; }
        public List<string> RiskFactors { get; set; } = new List<string>();
    }
}