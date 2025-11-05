namespace CarMaintenance.Api.Models
{
    public class ServiceType
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int RecommendedIntervalMiles { get; set; }
        public int RecommendedIntervalMonths { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}