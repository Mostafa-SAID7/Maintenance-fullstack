using System.ComponentModel.DataAnnotations;
using CarMaintenance.Domain.ValueObjects;
using CarMaintenance.Domain.Events;

namespace CarMaintenance.Domain.Entities;

/// <summary>
/// Car aggregate root representing a vehicle in the system
/// </summary>
public class Car : AggregateRoot<int>
{
    private readonly List<MaintenanceRecord> _maintenanceRecords = new();
    private string _make = string.Empty;
    private string _model = string.Empty;
    private int _year;
    private string? _color;
    private string? _licensePlate;
    private Vin _vin = null!;
    private int _mileage;
    private int _ownerId;
    private DateTime? _lastMaintenanceDate;
    private int? _serviceTypeId;
    private bool _isActive = true;

    // Required by EF Core
    private Car() { }

    /// <summary>
    /// Creates a new car
    /// </summary>
    /// <param name="make">Car manufacturer</param>
    /// <param name="model">Car model</param>
    /// <param name="year">Manufacturing year</param>
    /// <param name="vin">Vehicle identification number</param>
    /// <param name="ownerId">Owner identifier</param>
    /// <param name="color">Car color (optional)</param>
    /// <param name="licensePlate">License plate (optional)</param>
    /// <param name="mileage">Current mileage</param>
    public Car(
        string make, 
        string model, 
        int year, 
        Vin vin, 
        int ownerId, 
        string? color = null, 
        string? licensePlate = null, 
        int mileage = 0)
    {
        Id = 0; // Will be set by database
        _make = make;
        _model = model;
        _year = year;
        _vin = vin;
        _ownerId = ownerId;
        _color = color;
        _licensePlate = licensePlate;
        _mileage = mileage;
        CreatedAt = DateTime.UtcNow;
        _isActive = true;

        // Raise domain event
        AddDomainEvent(new CarCreatedEvent(Id, make, model, year, vin.Value, ownerId));
    }

    /// <summary>
    /// Gets the primary key
    /// </summary>
    public override int Id { get; protected set; }

    /// <summary>
    /// Gets the car manufacturer
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Make
    {
        get => _make;
        private set
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException("Make cannot be empty", nameof(Make));
            
            if (value.Length > 50)
                throw new ArgumentException("Make cannot exceed 50 characters", nameof(Make));
            
            var oldValue = _make;
            _make = value;
            
            if (oldValue != value && Id != 0)
            {
                AddDomainEvent(new CarUpdatedEvent(Id, make: value, year: _year, isActive: _isActive));
            }
        }
    }

    /// <summary>
    /// Gets the car model
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Model
    {
        get => _model;
        private set
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException("Model cannot be empty", nameof(Model));
            
            if (value.Length > 50)
                throw new ArgumentException("Model cannot exceed 50 characters", nameof(Model));
            
            var oldValue = _model;
            _model = value;
            
            if (oldValue != value && Id != 0)
            {
                AddDomainEvent(new CarUpdatedEvent(Id, model: value, isActive: _isActive));
            }
        }
    }

    /// <summary>
    /// Gets the manufacturing year
    /// </summary>
    [Required]
    [Range(1900, 2100)]
    public int Year
    {
        get => _year;
        private set
        {
            var currentYear = DateTime.UtcNow.Year + 1;
            if (value < 1900 || value > currentYear)
                throw new ArgumentOutOfRangeException(nameof(Year), $"Year must be between 1900 and {currentYear}");
            
            var oldValue = _year;
            _year = value;
            
            if (oldValue != value && Id != 0)
            {
                AddDomainEvent(new CarUpdatedEvent(Id, year: value, isActive: _isActive));
            }
        }
    }

    /// <summary>
    /// Gets the car color
    /// </summary>
    [MaxLength(30)]
    public string? Color
    {
        get => _color;
        set
        {
            if (!string.IsNullOrEmpty(value) && value.Length > 30)
                throw new ArgumentException("Color cannot exceed 30 characters", nameof(Color));
            
            var oldValue = _color;
            _color = string.IsNullOrWhiteSpace(value) ? null : value;
            
            if (oldValue != _color && Id != 0)
            {
                AddDomainEvent(new CarUpdatedEvent(Id, color: _color, isActive: _isActive));
            }
        }
    }

    /// <summary>
    /// Gets the license plate
    /// </summary>
    [MaxLength(20)]
    public string? LicensePlate
    {
        get => _licensePlate;
        set
        {
            if (!string.IsNullOrEmpty(value) && value.Length > 20)
                throw new ArgumentException("License plate cannot exceed 20 characters", nameof(LicensePlate));
            
            var oldValue = _licensePlate;
            _licensePlate = string.IsNullOrWhiteSpace(value) ? null : value;
            
            if (oldValue != _licensePlate && Id != 0)
            {
                AddDomainEvent(new CarUpdatedEvent(Id, licensePlate: _licensePlate, isActive: _isActive));
            }
        }
    }

    /// <summary>
    /// Gets the VIN
    /// </summary>
    [Required]
    public Vin Vin => _vin;

    /// <summary>
    /// Gets the current mileage
    /// </summary>
    public int Mileage
    {
        get => _mileage;
        set
        {
            if (value < 0)
                throw new ArgumentOutOfRangeException(nameof(Mileage), "Mileage cannot be negative");
            
            var oldMileage = _mileage;
            _mileage = value;
            
            if (oldMileage != value && Id != 0)
            {
                AddDomainEvent(new CarMileageUpdatedEvent(Id, oldMileage, value, DateTime.UtcNow));
            }
        }
    }

    /// <summary>
    /// Gets the owner identifier
    /// </summary>
    public int OwnerId
    {
        get => _ownerId;
        set
        {
            if (value <= 0)
                throw new ArgumentOutOfRangeException(nameof(OwnerId), "Owner ID must be greater than 0");
            
            var oldOwnerId = _ownerId;
            _ownerId = value;
            
            if (oldOwnerId != value && Id != 0)
            {
                AddDomainEvent(new CarUpdatedEvent(Id, ownerId: value, isActive: _isActive));
            }
        }
    }

    /// <summary>
    /// Gets the last maintenance date
    /// </summary>
    public DateTime? LastMaintenanceDate
    {
        get => _lastMaintenanceDate;
        set => _lastMaintenanceDate = value;
    }

    /// <summary>
    /// Gets the service type identifier for recommended maintenance
    /// </summary>
    public int? ServiceTypeId
    {
        get => _serviceTypeId;
        set
        {
            if (value.HasValue && value.Value <= 0)
                throw new ArgumentOutOfRangeException(nameof(ServiceTypeId), "Service type ID must be greater than 0");
            
            _serviceTypeId = value;
        }
    }

    /// <summary>
    /// Gets the creation timestamp
    /// </summary>
    public DateTime CreatedAt { get; private set; }

    /// <summary>
    /// Gets the last update timestamp
    /// </summary>
    public DateTime? UpdatedAt { get; private set; }

    /// <summary>
    /// Gets whether the car is active
    /// </summary>
    public bool IsActive
    {
        get => _isActive;
        private set
        {
            var oldValue = _isActive;
            _isActive = value;
            
            if (oldValue != value && Id != 0)
            {
                UpdatedAt = DateTime.UtcNow;
                AddDomainEvent(new CarUpdatedEvent(Id, isActive: value));
            }
        }
    }

    // Navigation properties
    public virtual ServiceType? ServiceType { get; private set; }
    public virtual IReadOnlyCollection<MaintenanceRecord> MaintenanceRecords => _maintenanceRecords.AsReadOnly();

    // Domain methods

    /// <summary>
    /// Updates the car information
    /// </summary>
    public void Update(
        string? make = null,
        string? model = null,
        int? year = null,
        string? color = null,
        string? licensePlate = null,
        int? mileage = null)
    {
        if (make is not null) Make = make;
        if (model is not null) Model = model;
        if (year.HasValue) Year = year.Value;
        if (color is not null) Color = color;
        if (licensePlate is not null) LicensePlate = licensePlate;
        if (mileage.HasValue) Mileage = mileage.Value;
        
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Transfers ownership to a new owner
    /// </summary>
    /// <param name="newOwnerId">The new owner identifier</param>
    /// <param name="transferReason">Reason for the transfer</param>
    public void TransferOwnership(int newOwnerId, string transferReason = "Ownership transfer")
    {
        if (newOwnerId <= 0)
            throw new ArgumentOutOfRangeException(nameof(newOwnerId), "Owner ID must be greater than 0");
        
        if (newOwnerId == _ownerId)
            throw new InvalidOperationException("Cannot transfer ownership to the same owner");
        
        var previousOwnerId = _ownerId;
        OwnerId = newOwnerId;
        UpdatedAt = DateTime.UtcNow;
        
        AddDomainEvent(new CarOwnershipTransferredEvent(Id, previousOwnerId, newOwnerId, transferReason));
    }

    /// <summary>
    /// Deactivates the car
    /// </summary>
    /// <param name="reason">Reason for deactivation</param>
    public void Deactivate(string reason = "Car deactivated")
    {
        if (!_isActive)
            return;
        
        IsActive = false;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Reactivates the car
    /// </summary>
    public void Reactivate()
    {
        if (_isActive)
            return;
        
        IsActive = true;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Records maintenance performed on the car
    /// </summary>
    /// <param name="serviceTypeId">The service type performed</param>
    /// <param name="serviceDate">When the service was performed</param>
    /// <param name="mileage">Mileage at service time</param>
    /// <param name="description">Description of service performed</param>
    /// <param name="cost">Cost of the service</param>
    /// <param name="notes">Additional notes</param>
    /// <returns>The maintenance record</returns>
    public MaintenanceRecord RecordMaintenance(
        int serviceTypeId, 
        DateTime serviceDate, 
        int mileage, 
        string description, 
        decimal cost = 0, 
        string? notes = null)
    {
        if (serviceTypeId <= 0)
            throw new ArgumentOutOfRangeException(nameof(serviceTypeId), "Service type ID must be greater than 0");
        
        if (serviceDate > DateTime.UtcNow)
            throw new ArgumentOutOfRangeException(nameof(serviceDate), "Service date cannot be in the future");
        
        if (mileage < 0)
            throw new ArgumentOutOfRangeException(nameof(mileage), "Mileage cannot be negative");
        
        if (mileage < _mileage)
            throw new ArgumentOutOfRangeException(nameof(mileage), "Service mileage cannot be less than current mileage");
        
        if (string.IsNullOrWhiteSpace(description))
            throw new ArgumentException("Description cannot be empty", nameof(description));
        
        var record = new MaintenanceRecord(
            Id, 
            serviceTypeId, 
            serviceDate, 
            mileage, 
            description, 
            cost, 
            notes);
        
        _maintenanceRecords.Add(record);
        _lastMaintenanceDate = serviceDate;
        
        // Update mileage if this service includes mileage update
        if (mileage > _mileage)
        {
            Mileage = mileage;
        }
        
        return record;
    }

    /// <summary>
    /// Checks if the car is overdue for a specific service
    /// </summary>
    /// <param name="serviceType">The service type to check</param>
    /// <returns>True if overdue</returns>
    public bool IsOverdueForService(ServiceType serviceType)
    {
        if (_lastMaintenanceDate == null)
            return true;
        
        var monthsSinceLastService = (int)(DateTime.UtcNow - _lastMaintenanceDate.Value).TotalDays / 30;
        var milesSinceLastService = _mileage - (_maintenanceRecords.OrderByDescending(m => m.ServiceDate).FirstOrDefault()?.Mileage ?? 0);
        
        return monthsSinceLastService > serviceType.RecommendedIntervalMonths ||
               milesSinceLastService > serviceType.RecommendedIntervalMiles;
    }

    /// <summary>
    /// Calculates when the next service is due
    /// </summary>
    /// <param name="serviceType">The service type</param>
    /// <returns>Next service due date</returns>
    public DateTime CalculateNextServiceDate(ServiceType serviceType)
    {
        if (_lastMaintenanceDate == null)
            return DateTime.UtcNow;
        
        return _lastMaintenanceDate.Value.AddMonths(serviceType.RecommendedIntervalMonths);
    }

    /// <summary>
    /// Calculates the mileage at which next service is due
    /// </summary>
    /// <param name="serviceType">The service type</param>
    /// <returns>Mileage for next service</returns>
    public int CalculateNextServiceMileage(ServiceType serviceType)
    {
        var lastServiceMileage = _maintenanceRecords
            .OrderByDescending(m => m.ServiceDate)
            .FirstOrDefault()?.Mileage ?? _mileage;
        
        return lastServiceMileage + serviceType.RecommendedIntervalMiles;
    }

    /// <summary>
    /// Gets the current age of the car
    /// </summary>
    /// <returns>Age in years</returns>
    public int GetAge()
    {
        return DateTime.UtcNow.Year - _year;
    }

    /// <summary>
    /// Gets the total maintenance cost for the car
    /// </summary>
    /// <returns>Total maintenance cost</returns>
    public decimal GetTotalMaintenanceCost()
    {
        return _maintenanceRecords.Sum(r => r.Cost ?? 0);
    }

    /// <summary>
    /// Gets maintenance records within a date range
    /// </summary>
    /// <param name="fromDate">Start date</param>
    /// <param name="toDate">End date</param>
    /// <returns>Filtered maintenance records</returns>
    public IEnumerable<MaintenanceRecord> GetMaintenanceInDateRange(DateTime fromDate, DateTime toDate)
    {
        return _maintenanceRecords
            .Where(r => r.ServiceDate >= fromDate && r.ServiceDate <= toDate)
            .OrderByDescending(r => r.ServiceDate);
    }

    public override void ApplyEvent(DomainEvent domainEvent)
    {
        // Handle domain events if using event sourcing
        // Implementation would depend on the specific event type
    }
}