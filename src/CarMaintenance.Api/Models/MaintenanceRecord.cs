namespace CarMaintenance.Api.Models
{
    public class MaintenanceRecord
    {
        public int Id { get; set; }
        public int CarId { get; set; }
        public int ServiceTypeId { get; set; }
        public DateTime ServiceDate { get; set; }
        public int Mileage { get; set; }
        public decimal Cost { get; set; }
        public string Description { get; set; } = string.Empty;
        public string PerformedBy { get; set; } = string.Empty;
        public DateTime NextServiceDue { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Car? Car { get; set; }
        public ServiceType? ServiceType { get; set; }
    }
}