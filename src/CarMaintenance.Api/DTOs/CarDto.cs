namespace CarMaintenance.Api.DTOs
{
    public class CarDto
    {
        public int Id { get; set; }
        public string Make { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public int Year { get; set; }
        public string LicensePlate { get; set; } = string.Empty;
        public string Vin { get; set; } = string.Empty;
        public int Mileage { get; set; }
        public string Color { get; set; } = string.Empty;
        public string OwnerId { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? LastMaintenanceDate { get; set; }
        public string OwnerName { get; set; } = string.Empty;
    }
}