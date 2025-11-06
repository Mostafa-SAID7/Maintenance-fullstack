namespace CarMaintenance.Api.DTOs
{
    public class MaintenanceRecordDto
    {
        public int Id { get; set; }
        public int CarId { get; set; }
        public int ServiceTypeId { get; set; }
        public string ServiceTypeName { get; set; } = string.Empty;
        public DateTime ServiceDate { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal Cost { get; set; }
        public int Mileage { get; set; }
        public string ServiceProvider { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public bool IsCompleted { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}