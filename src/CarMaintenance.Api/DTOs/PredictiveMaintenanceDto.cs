namespace CarMaintenance.Api.DTOs
{
    public class PredictionResultDto
    {
        public int CarId { get; set; }
        public bool MaintenanceNeeded { get; set; }
        public double Confidence { get; set; }
        public DateTime PredictedDate { get; set; }
        public string Reason { get; set; } = string.Empty;
        public List<PredictionDetail> Details { get; set; } = new List<PredictionDetail>();
    }

    public class PredictionDetail
    {
        public string Factor { get; set; } = string.Empty;
        public string Impact { get; set; } = string.Empty;
        public double Score { get; set; }
    }

    public class PredictiveAnalyticsDto
    {
        public int CarId { get; set; }
        public string CarName { get; set; } = string.Empty;
        public List<PredictionResultDto> Predictions { get; set; } = new List<PredictionResultDto>();
        public double OverallRiskScore { get; set; }
        public string RecommendedAction { get; set; } = string.Empty;
        public DateTime LastAnalyzed { get; set; }
    }
}