using CarMaintenance.Api.Interfaces;
using CarMaintenance.Shared.DTOs.PredictiveMaintenance;

namespace CarMaintenance.Api.Services
{
    public class PredictiveMaintenanceService : IPredictiveMaintenanceService
    {
        private readonly IUnitOfWork _unitOfWork;

        public PredictiveMaintenanceService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<PredictionResultDto> PredictMaintenanceAsync(int carId)
        {
            // Simple prediction logic based on mileage and time since last maintenance
            var car = await _unitOfWork.Repository<Car>().GetByIdAsync(carId);
            if (car == null)
                throw new ArgumentException("Car not found");

            var lastMaintenance = await _unitOfWork.Repository<MaintenanceRecord>()
                .FindAsync(m => m.CarId == carId);

            var lastRecord = lastMaintenance.OrderByDescending(m => m.ServiceDate).FirstOrDefault();

            var daysSinceLastMaintenance = lastRecord != null
                ? (DateTime.UtcNow - lastRecord.ServiceDate).TotalDays
                : 365; // Default to 1 year if no maintenance history

            var mileageSinceLastMaintenance = lastRecord != null
                ? car.Mileage - lastRecord.Mileage
                : car.Mileage;

            // Simple prediction algorithm
            var maintenanceNeeded = daysSinceLastMaintenance > 180 || mileageSinceLastMaintenance > 5000;

            return new PredictionResultDto
            {
                CarId = carId,
                MaintenanceNeeded = maintenanceNeeded,
                Confidence = maintenanceNeeded ? 0.85 : 0.15,
                PredictedDate = maintenanceNeeded
                    ? DateTime.UtcNow.AddDays(30)
                    : DateTime.UtcNow.AddDays(90),
                Reason = maintenanceNeeded
                    ? $"High mileage ({mileageSinceLastMaintenance} miles) or time since last maintenance ({daysSinceLastMaintenance:F0} days)"
                    : "Regular maintenance schedule"
            };
        }

        public async Task<IEnumerable<PredictionResultDto>> GetAllPredictionsAsync()
        {
            var cars = await _unitOfWork.Repository<Car>().GetAllAsync();
            var predictions = new List<PredictionResultDto>();

            foreach (var car in cars)
            {
                predictions.Add(await PredictMaintenanceAsync(car.Id));
            }

            return predictions;
        }

        public async Task TrainModelAsync()
        {
            // Placeholder for ML model training
            // In a real implementation, this would train a machine learning model
            // using historical maintenance data
            await Task.CompletedTask;
        }

        public async Task<double> GetModelAccuracyAsync()
        {
            // Placeholder for model accuracy calculation
            // In a real implementation, this would return the accuracy of the trained model
            return 0.85;
        }
    }
}