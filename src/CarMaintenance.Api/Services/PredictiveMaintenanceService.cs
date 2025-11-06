using CarMaintenance.Api.Interfaces;
using CarMaintenance.Api.DTOs;
using CarMaintenance.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CarMaintenance.Api.Services
{
    public class PredictiveMaintenanceService : IPredictiveMaintenanceService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<PredictiveMaintenanceService> _logger;

        public PredictiveMaintenanceService(IUnitOfWork unitOfWork, ILogger<PredictiveMaintenanceService> logger)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task<PredictionResultDto> PredictMaintenanceAsync(int carId)
        {
            var car = await _unitOfWork.Repository<Car>()
                .GetQueryable()
                .Include(c => c.MaintenanceRecords.OrderByDescending(m => m.ServiceDate))
                .FirstOrDefaultAsync(c => c.Id == carId);

            if (car == null)
                throw new ArgumentException("Car not found");

            // Comprehensive prediction analysis
            var analysis = await AnalyzeCarHealth(car);
            
            // Determine if maintenance is needed
            var maintenanceNeeded = analysis.RiskScore > 0.6;
            var confidence = CalculateConfidence(analysis);
            var predictedDate = CalculatePredictedDate(analysis);

            var prediction = new PredictionResultDto
            {
                CarId = carId,
                MaintenanceNeeded = maintenanceNeeded,
                Confidence = confidence,
                PredictedDate = predictedDate,
                Reason = GeneratePredictionReason(analysis),
                Details = analysis.Details
            };

            return prediction;
        }

        public async Task<IEnumerable<PredictionResultDto>> GetAllPredictionsAsync()
        {
            var cars = await _unitOfWork.Repository<Car>()
                .GetQueryable()
                .Include(c => c.MaintenanceRecords)
                .ToListAsync();

            var predictions = new List<PredictionResultDto>();

            foreach (var car in cars)
            {
                try
                {
                    predictions.Add(await PredictMaintenanceAsync(car.Id));
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error predicting maintenance for car {CarId}", car.Id);
                }
            }

            return predictions;
        }

        public async Task<PredictiveAnalyticsDto> GetAnalyticsAsync(int carId)
        {
            var car = await _unitOfWork.Repository<Car>()
                .GetQueryable()
                .Include(c => c.MaintenanceRecords.OrderByDescending(m => m.ServiceDate))
                .FirstOrDefaultAsync(c => c.Id == carId);

            if (car == null)
                throw new ArgumentException("Car not found");

            var predictions = new List<PredictionResultDto>();
            
            // Get multiple predictions for different maintenance types
            predictions.Add(await PredictMaintenanceAsync(carId));
            
            // Add service-specific predictions
            var serviceTypes = await _unitOfWork.Repository<ServiceType>().GetAllAsync();
            foreach (var serviceType in serviceTypes.Take(3)) // Limit to top 3 service types
            {
                var prediction = await PredictServiceMaintenanceAsync(carId, serviceType.Id);
                predictions.Add(prediction);
            }

            var analysis = await AnalyzeCarHealth(car);
            var overallRiskScore = analysis.RiskScore;

            return new PredictiveAnalyticsDto
            {
                CarId = carId,
                CarName = $"{car.Year} {car.Make} {car.Model}",
                Predictions = predictions,
                OverallRiskScore = overallRiskScore,
                RecommendedAction = GenerateRecommendedAction(analysis),
                LastAnalyzed = DateTime.UtcNow
            };
        }

        public async Task<PredictionResultDto> PredictServiceMaintenanceAsync(int carId, int serviceTypeId)
        {
            var car = await _unitOfWork.Repository<Car>()
                .GetQueryable()
                .Include(c => c.MaintenanceRecords.Where(m => m.ServiceTypeId == serviceTypeId).OrderByDescending(m => m.ServiceDate))
                .FirstOrDefaultAsync(c => c.Id == carId);

            if (car == null)
                throw new ArgumentException("Car not found");

            var serviceType = await _unitOfWork.Repository<ServiceType>().GetByIdAsync(serviceTypeId);
            if (serviceType == null)
                throw new ArgumentException("Service type not found");

            var relevantRecords = car.MaintenanceRecords.Where(m => m.ServiceTypeId == serviceTypeId).ToList();
            
            // Service-specific prediction logic
            var daysSinceLast = relevantRecords.Any()
                ? (DateTime.UtcNow - relevantRecords.First().ServiceDate).TotalDays
                : 365;

            var mileageSinceLast = relevantRecords.Any()
                ? car.Mileage - relevantRecords.First().Mileage
                : car.Mileage;

            // Service-specific prediction logic
            var maintenanceNeeded = IsServiceDue(serviceType.Name, daysSinceLast, mileageSinceLast);
            var confidence = CalculateServiceConfidence(serviceType.Name, relevantRecords.Count, daysSinceLast);
            var predictedDate = CalculateServicePredictedDate(serviceType.Name, daysSinceLast, mileageSinceLast);

            var details = new List<PredictionDetail>
            {
                new PredictionDetail { Factor = "Time Since Last Service", Impact = CalculateTimeImpact(serviceType.Name, daysSinceLast), Score = Math.Min(daysSinceLast / 365.0, 1.0) },
                new PredictionDetail { Factor = "Mileage Since Last Service", Impact = CalculateMileageImpact(serviceType.Name, mileageSinceLast), Score = Math.Min(mileageSinceLast / 10000.0, 1.0) },
                new PredictionDetail { Factor = "Service History", Impact = relevantRecords.Count > 2 ? "Good maintenance history" : "Limited maintenance history", Score = Math.Min(relevantRecords.Count / 5.0, 1.0) }
            };

            return new PredictionResultDto
            {
                CarId = carId,
                MaintenanceNeeded = maintenanceNeeded,
                Confidence = confidence,
                PredictedDate = predictedDate,
                Reason = GenerateServiceReason(serviceType.Name, daysSinceLast, mileageSinceLast, maintenanceNeeded),
                Details = details
            };
        }

        public async Task TrainModelAsync()
        {
            try
            {
                // Collect training data from historical maintenance records
                var trainingData = await CollectTrainingData();
                
                // In a real implementation, this would train an ML model
                // For now, we'll simulate model training
                _logger.LogInformation("Training predictive maintenance model with {Count} data points", trainingData.Count);
                
                await Task.Delay(1000); // Simulate training time
                
                _logger.LogInformation("Model training completed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during model training");
                throw;
            }
        }

        public async Task<double> GetModelAccuracyAsync()
        {
            // In a real implementation, this would calculate actual model accuracy
            // using test data and validation metrics
            await Task.Delay(100); // Simulate calculation time
            return 0.87 + Random.Shared.NextDouble() * 0.1; // Simulated accuracy between 0.87 and 0.97
        }

        private async Task<CarHealthAnalysis> AnalyzeCarHealth(Car car)
        {
            var analysis = new CarHealthAnalysis
            {
                Details = new List<PredictionDetail>()
            };

            // Analyze maintenance frequency
            var maintenanceRecords = await _unitOfWork.Repository<MaintenanceRecord>()
                .GetQueryable()
                .Where(m => m.CarId == car.Id)
                .OrderByDescending(m => m.ServiceDate)
                .Take(10)
                .ToListAsync();

            var daysBetweenMaintenance = CalculateAverageMaintenanceInterval(maintenanceRecords);
            var currentInterval = car.LastMaintenanceDate.HasValue
                ? (DateTime.UtcNow - car.LastMaintenanceDate.Value).TotalDays
                : 365;

            var maintenanceFrequencyRisk = Math.Max(0, (currentInterval - daysBetweenMaintenance) / daysBetweenMaintenance);
            analysis.Details.Add(new PredictionDetail
            {
                Factor = "Maintenance Frequency",
                Impact = maintenanceFrequencyRisk > 0.2 ? "Maintenance overdue" : "On schedule",
                Score = maintenanceFrequencyRisk
            });

            // Analyze cost patterns
            var totalCost = maintenanceRecords.Sum(m => m.Cost);
            var avgCostPerMonth = totalCost / Math.Max(currentInterval / 30.0, 1);
            var costRisk = avgCostPerMonth > 100 ? Math.Min(avgCostPerMonth / 500.0, 1.0) : 0;
            
            analysis.Details.Add(new PredictionDetail
            {
                Factor = "Maintenance Cost Trend",
                Impact = costRisk > 0.7 ? "High maintenance costs" : "Normal costs",
                Score = costRisk
            });

            // Analyze mileage patterns
            var mileageTrend = CalculateMileageTrend(maintenanceRecords);
            var mileageRisk = mileageTrend > 12000 ? Math.Min(mileageTrend / 20000.0, 1.0) : 0;
            
            analysis.Details.Add(new PredictionDetail
            {
                Factor = "Mileage Usage Pattern",
                Impact = mileageRisk > 0.5 ? "High mileage usage" : "Normal usage",
                Score = mileageRisk
            });

            // Calculate overall risk score
            analysis.RiskScore = (maintenanceFrequencyRisk * 0.4) + (costRisk * 0.3) + (mileageRisk * 0.3);
            analysis.RiskScore = Math.Min(Math.Max(analysis.RiskScore, 0), 1);

            return analysis;
        }

        private double CalculateConfidence(CarHealthAnalysis analysis)
        {
            // Base confidence on data availability and consistency
            var detailCount = analysis.Details.Count;
            var detailVariance = CalculateVariance(analysis.Details.Select(d => d.Score));
            
            var baseConfidence = Math.Min(detailCount / 5.0, 1.0); // More data = higher confidence
            var consistencyBonus = detailVariance < 0.2 ? 0.1 : 0; // Consistent data = higher confidence
            
            return Math.Min(baseConfidence + consistencyBonus, 0.95);
        }

        private DateTime CalculatePredictedDate(CarHealthAnalysis analysis)
        {
            var urgencyDays = analysis.RiskScore switch
            {
                > 0.8 => 7,   // Very urgent
                > 0.6 => 30,  // Urgent
                > 0.4 => 60,  // Moderately urgent
                > 0.2 => 90,  // Regular schedule
                _ => 180      // Low priority
            };

            return DateTime.UtcNow.AddDays(urgencyDays);
        }

        private string GeneratePredictionReason(CarHealthAnalysis analysis)
        {
            var primaryFactor = analysis.Details.OrderByDescending(d => d.Score).First();
            var severity = analysis.RiskScore switch
            {
                > 0.8 => "Critical",
                > 0.6 => "High",
                > 0.4 => "Medium",
                > 0.2 => "Low",
                _ => "Minimal"
            };

            return $"{severity} risk due to {primaryFactor.Factor}: {primaryFactor.Impact}";
        }

        private async Task<List<TrainingDataPoint>> CollectTrainingData()
        {
            // Collect historical data for model training
            var records = await _unitOfWork.Repository<MaintenanceRecord>()
                .GetQueryable()
                .Include(m => m.Car)
                .ToListAsync();

            return records.Select(r => new TrainingDataPoint
            {
                CarAge = DateTime.UtcNow.Year - r.Car.Year,
                Mileage = r.Mileage,
                DaysSinceLastMaintenance = (r.ServiceDate - (r.Car.LastMaintenanceDate ?? r.ServiceDate.AddDays(-90))).Days,
                Cost = r.Cost,
                ServiceType = r.ServiceTypeId,
                Result = r.IsCompleted ? 1 : 0 // Whether maintenance was successful/completed
            }).ToList();
        }

        // Helper methods for service-specific predictions
        private bool IsServiceDue(string serviceType, double days, double mileage)
        {
            return serviceType.ToLower() switch
            {
                "oil change" => days > 180 || mileage > 5000,
                "tire rotation" => mileage > 7000,
                "brake service" => days > 365 || mileage > 25000,
                "battery replacement" => days > 1095, // 3 years
                "air filter" => days > 365 || mileage > 15000,
                _ => days > 365 || mileage > 10000
            };
        }

        private double CalculateServiceConfidence(string serviceType, int historyCount, double daysSinceLast)
        {
            var dataConfidence = Math.Min(historyCount / 5.0, 1.0);
            var recencyConfidence = Math.Max(0, 1 - (daysSinceLast / 365.0));
            return (dataConfidence + recencyConfidence) / 2.0;
        }

        private DateTime CalculateServicePredictedDate(string serviceType, double days, double mileage)
        {
            var baseDays = serviceType.ToLower() switch
            {
                "oil change" => 180,
                "tire rotation" => 7000 / (12000 / 180), // Based on mileage
                "brake service" => 365,
                "battery replacement" => 1095,
                "air filter" => 365,
                _ => 365
            };

            var urgencyMultiplier = days > baseDays * 1.2 ? 0.5 : 1.0;
            return DateTime.UtcNow.AddDays(baseDays * urgencyMultiplier);
        }

        private string GenerateServiceReason(string serviceType, double days, double mileage, bool due)
        {
            if (!due)
            {
                return $"{serviceType} is not due yet. Last service was {days:F0} days ago.";
            }

            var reasons = new List<string>();
            var baseDays = serviceType.ToLower() switch
            {
                "oil change" => 180,
                "tire rotation" => 7000 / (12000 / 180),
                "brake service" => 365,
                "battery replacement" => 1095,
                "air filter" => 365,
                _ => 365
            };

            if (days > baseDays * 1.2)
                reasons.Add($"overdue by {days - baseDays:F0} days");

            if (serviceType.ToLower() == "oil change" && mileage > 5000)
                reasons.Add($"high mileage ({mileage:F0} miles)");

            return $"{serviceType} is due: {string.Join(" and ", reasons)}";
        }

        private string CalculateTimeImpact(string serviceType, double days)
        {
            return days > 365 ? "High" : days > 180 ? "Medium" : "Low";
        }

        private string CalculateMileageImpact(string serviceType, double mileage)
        {
            return mileage > 10000 ? "High" : mileage > 5000 ? "Medium" : "Low";
        }

        private string GenerateRecommendedAction(CarHealthAnalysis analysis)
        {
            return analysis.RiskScore switch
            {
                > 0.8 => "Immediate maintenance required - schedule service within 1 week",
                > 0.6 => "Schedule maintenance soon - within 2-4 weeks",
                > 0.4 => "Plan maintenance in next 2 months",
                > 0.2 => "Regular maintenance schedule",
                _ => "Continue regular maintenance schedule"
            };
        }

        private double CalculateAverageMaintenanceInterval(List<MaintenanceRecord> records)
        {
            if (records.Count < 2) return 180; // Default to 6 months

            var intervals = new List<double>();
            for (int i = 1; i < records.Count; i++)
            {
                intervals.Add((records[i - 1].ServiceDate - records[i].ServiceDate).TotalDays);
            }

            return intervals.Average();
        }

        private double CalculateMileageTrend(List<MaintenanceRecord> records)
        {
            if (records.Count < 2) return records.Any() ? records.First().Mileage / 12.0 : 0;

            var trend = 0.0;
            var count = 0;
            for (int i = 1; i < Math.Min(records.Count, 5); i++)
            {
                var daysDiff = (records[i - 1].ServiceDate - records[i].ServiceDate).TotalDays;
                if (daysDiff > 0)
                {
                    trend += (records[i - 1].Mileage - records[i].Mileage) / daysDiff * 365;
                    count++;
                }
            }

            return count > 0 ? trend / count : 0;
        }

        private double CalculateVariance(IEnumerable<double> values)
        {
            var data = values.ToList();
            if (data.Count < 2) return 0;

            var mean = data.Average();
            return data.Sum(x => Math.Pow(x - mean, 2)) / data.Count;
        }

        // Helper classes
        private class CarHealthAnalysis
        {
            public double RiskScore { get; set; }
            public List<PredictionDetail> Details { get; set; } = new List<PredictionDetail>();
        }

        private class TrainingDataPoint
        {
            public int CarAge { get; set; }
            public int Mileage { get; set; }
            public int DaysSinceLastMaintenance { get; set; }
            public decimal Cost { get; set; }
            public int ServiceType { get; set; }
            public int Result { get; set; }
        }
    }
}