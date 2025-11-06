namespace CarMaintenance.Domain.Events;

/// <summary>
/// Event raised when a new car is created
/// </summary>
public class CarCreatedEvent : DomainEvent<int>
{
    public string Make { get; }
    public string Model { get; }
    public int Year { get; }
    public string Vin { get; }
    public int OwnerId { get; }

    public CarCreatedEvent(int carId, string make, string model, int year, string vin, int ownerId)
        : base(carId)
    {
        Make = make;
        Model = model;
        Year = year;
        Vin = vin;
        OwnerId = ownerId;
    }
}

/// <summary>
/// Event raised when a car is updated
/// </summary>
public class CarUpdatedEvent : DomainEvent<int>
{
    public string? Make { get; }
    public string? Model { get; }
    public int? Year { get; }
    public string? Color { get; }
    public string? LicensePlate { get; }
    public int? Mileage { get; }
    public int? OwnerId { get; }
    public bool IsActive { get; }

    public CarUpdatedEvent(
        int carId, 
        string? make = null, 
        string? model = null, 
        int? year = null, 
        string? color = null,
        string? licensePlate = null,
        int? mileage = null,
        int? ownerId = null,
        bool isActive = true)
        : base(carId)
    {
        Make = make;
        Model = model;
        Year = year;
        Color = color;
        LicensePlate = licensePlate;
        Mileage = mileage;
        OwnerId = ownerId;
        IsActive = isActive;
    }
}

/// <summary>
/// Event raised when a car is deleted
/// </summary>
public class CarDeletedEvent : DomainEvent<int>
{
    public string Make { get; }
    public string Model { get; }
    public int Year { get; }
    public string Vin { get; }

    public CarDeletedEvent(int carId, string make, string model, int year, string vin)
        : base(carId)
    {
        Make = make;
        Model = model;
        Year = year;
        Vin = vin;
    }
}

/// <summary>
/// Event raised when car ownership is transferred
/// </summary>
public class CarOwnershipTransferredEvent : DomainEvent<int>
{
    public int PreviousOwnerId { get; }
    public int NewOwnerId { get; }
    public string TransferReason { get; }

    public CarOwnershipTransferredEvent(int carId, int previousOwnerId, int newOwnerId, string transferReason)
        : base(carId)
    {
        PreviousOwnerId = previousOwnerId;
        NewOwnerId = newOwnerId;
        TransferReason = transferReason;
    }
}

/// <summary>
/// Event raised when car mileage is updated
/// </summary>
public class CarMileageUpdatedEvent : DomainEvent<int>
{
    public int PreviousMileage { get; }
    public int NewMileage { get; }
    public int MileageDifference { get; }
    public DateTime UpdateDate { get; }

    public CarMileageUpdatedEvent(int carId, int previousMileage, int newMileage, DateTime updateDate)
        : base(carId)
    {
        PreviousMileage = previousMileage;
        NewMileage = newMileage;
        MileageDifference = newMileage - previousMileage;
        UpdateDate = updateDate;
    }
}

/// <summary>
/// Event raised when a car is due for maintenance
/// </summary>
public class CarMaintenanceDueEvent : DomainEvent<int>
{
    public int ServiceTypeId { get; }
    public string ServiceTypeName { get; }
    public DateTime DueDate { get; }
    public int CurrentMileage { get; }
    public int MileageAtLastService { get; }
    public int MilesOverdue { get; }
    public int DaysOverdue { get; }

    public CarMaintenanceDueEvent(
        int carId, 
        int serviceTypeId, 
        string serviceTypeName, 
        DateTime dueDate,
        int currentMileage,
        int mileageAtLastService,
        int milesOverdue,
        int daysOverdue)
        : base(carId)
    {
        ServiceTypeId = serviceTypeId;
        ServiceTypeName = serviceTypeName;
        DueDate = dueDate;
        CurrentMileage = currentMileage;
        MileageAtLastService = mileageAtLastService;
        MilesOverdue = milesOverdue;
        DaysOverdue = daysOverdue;
    }
}