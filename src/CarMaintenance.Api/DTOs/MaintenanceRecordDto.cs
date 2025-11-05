namespace CarMaintenance.Api.DTOs
{
    public class MaintenanceRecordDto
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
        public DateTime CreatedAt { get; set; }
        public string CarInfo { get; set; } = string.Empty;
        public string ServiceTypeName { get; set; } = string.Empty;
    }
}