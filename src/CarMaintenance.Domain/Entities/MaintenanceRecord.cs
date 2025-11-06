using System.ComponentModel.DataAnnotations;

namespace CarMaintenance.Domain.Entities;

/// <summary>
/// MaintenanceRecord entity representing a maintenance service record
/// </summary>
public class MaintenanceRecord : BaseEntity
{
    private string? _description;
    private string? _notes;
    private decimal? _cost;
    private DateTime _serviceDate;
    private int _mileage;
    private string? _serviceProvider;
    private string? _location;
    private bool _isCompleted = true;
    private DateTime? _nextServiceDueDate;
    private int? _nextServiceDueMileage;

    // Required by EF Core
    private MaintenanceRecord() { }

    /// <summary>
    /// Creates a new maintenance record
    /// </summary>
    /// <param name="carId">The car identifier</param>
    /// <param name="serviceTypeId">The service type identifier</param>
    /// <param name="serviceDate">When the service was performed</param>
    /// <param name="mileage">Mileage at service time</param>
    /// <param name="description">Description of service</param>
    /// <param name="cost">Cost of service</param>
    /// <param name="notes">Additional notes</param>
    public MaintenanceRecord(
        int carId,
        int serviceTypeId,
        DateTime serviceDate,
        int mileage,
        string description,
        decimal cost = 0,
        string? notes = null)
    {
        CarId = carId;
        ServiceTypeId = serviceTypeId;
        _serviceDate = serviceDate;
        _mileage = mileage;
        _description = description;
        _cost = cost;
        _notes = notes;
        _isCompleted = true;
        CreatedAt = DateTime.UtcNow;
    }

    [Required]
    public int CarId { get; private set; }

    [Required]
    public int ServiceTypeId { get; private set; }

    [Required]
    [MaxLength(500)]
    public string Description
    {
        get => _description ?? string.Empty;
        private set
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException("Description cannot be empty", nameof(Description));
            
            if (value.Length > 500)
                throw new ArgumentException("Description cannot exceed 500 characters", nameof(Description));
            
            _description = value;
        }
    }

    [MaxLength(1000)]
    public string? Notes
    {
        get => _notes;
        private set
        {
            if (!string.IsNullOrEmpty(value) && value.Length > 1000)
                throw new ArgumentException("Notes cannot exceed 1000 characters", nameof(Notes));
            
            _notes = string.IsNullOrWhiteSpace(value) ? null : value;
        }
    }

    [Range(0, double.MaxValue)]
    public decimal? Cost
    {
        get => _cost;
        private set
        {
            if (value.HasValue && value.Value < 0)
                throw new ArgumentOutOfRangeException(nameof(Cost), "Cost cannot be negative");
            
            _cost = value;
        }
    }

    public DateTime ServiceDate
    {
        get => _serviceDate;
        private set
        {
            if (value > DateTime.UtcNow)
                throw new ArgumentOutOfRangeException(nameof(ServiceDate), "Service date cannot be in the future");
            
            _serviceDate = value;
        }
    }

    public int Mileage
    {
        get => _mileage;
        private set
        {
            if (value < 0)
                throw new ArgumentOutOfRangeException(nameof(Mileage), "Mileage cannot be negative");
            
            _mileage = value;
        }
    }

    [MaxLength(100)]
    public string? ServiceProvider
    {
        get => _serviceProvider;
        private set
        {
            if (!string.IsNullOrEmpty(value) && value.Length > 100)
                throw new ArgumentException("Service provider cannot exceed 100 characters", nameof(ServiceProvider));
            
            _serviceProvider = string.IsNullOrWhiteSpace(value) ? null : value;
        }
    }

    [MaxLength(200)]
    public string? Location
    {
        get => _location;
        private set
        {
            if (!string.IsNullOrEmpty(value) && value.Length > 200)
                throw new ArgumentException("Location cannot exceed 200 characters", nameof(Location));
            
            _location = string.IsNullOrWhiteSpace(value) ? null : value;
        }
    }

    public bool IsCompleted
    {
        get => _isCompleted;
        private set => _isCompleted = value;
    }

    public DateTime? NextServiceDueDate
    {
        get => _nextServiceDueDate;
        private set
        {
            if (value.HasValue && value.Value < _serviceDate)
                throw new ArgumentOutOfRangeException(nameof(NextServiceDueDate), "Next service due date cannot be before service date");
            
            _nextServiceDueDate = value;
        }
    }

    public int? NextServiceDueMileage
    {
        get => _nextServiceDueMileage;
        private set
        {
            if (value.HasValue && value.Value < _mileage)
                throw new ArgumentOutOfRangeException(nameof(NextServiceDueMileage), "Next service due mileage cannot be less than current service mileage");
            
            _nextServiceDueMileage = value;
        }
    }

    // Navigation properties - will be properly defined in Infrastructure layer
    public virtual Car Car { get; private set; } = null!;
    public virtual ServiceType ServiceType { get; private set; } = null!;

    // Domain methods

    /// <summary>
    /// Marks the maintenance as completed
    /// </summary>
    public void MarkAsCompleted()
    {
        _isCompleted = true;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Sets the next service due date and mileage
    /// </summary>
    /// <param name="dueDate">Next service due date</param>
    /// <param name="dueMileage">Next service due mileage</param>
    public void SetNextService(DateTime? dueDate, int? dueMileage)
    {
        NextServiceDueDate = dueDate;
        NextServiceDueMileage = dueMileage;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Updates the cost of the service
    /// </summary>
    /// <param name="cost">New cost</param>
    public void UpdateCost(decimal cost)
    {
        Cost = cost;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Adds notes to the maintenance record
    /// </summary>
    /// <param name="notes">Additional notes</param>
    public void AddNotes(string notes)
    {
        Notes = notes;
        UpdatedAt = DateTime.UtcNow;
    }

    // Business methods
    public bool IsMaintenanceRecord => ServiceDate <= DateTime.UtcNow;
    public bool IsUpcoming => ServiceDate > DateTime.UtcNow;
    public bool IsOverdue => NextServiceDueDate.HasValue && NextServiceDueDate < DateTime.UtcNow;

    public int DaysSinceService => (DateTime.UtcNow - ServiceDate).Days;
    public int MilesSinceService => (Car?.Mileage ?? 0) - Mileage;

    /// <summary>
    /// Calculates the cost per mile for this maintenance
    /// </summary>
    /// <returns>Cost per mile</returns>
    public decimal CalculateCostPerMile()
    {
        if (Cost == 0 || Car == null) return 0;
        
        var currentMileage = Car.Mileage;
        if (currentMileage <= Mileage) return Cost.Value;
        
        return Cost.Value / (currentMileage - Mileage);
    }
}