using CarMaintenance.Shared.DTOs.PredictiveMaintenance;

namespace CarMaintenance.Api.Interfaces
{
    public interface IPredictiveMaintenanceService
    {
        Task<PredictionResultDto> PredictMaintenanceAsync(int carId);
        Task<IEnumerable<PredictionResultDto>> GetAllPredictionsAsync();
        Task TrainModelAsync();
        Task<double> GetModelAccuracyAsync();
    }
}