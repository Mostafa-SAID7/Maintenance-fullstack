using FluentValidation;
using CarMaintenance.Application.DTOs;

namespace CarMaintenance.Application.Validators;

/// <summary>
/// Validator for CreateMaintenanceRecordDto
/// </summary>
public class CreateMaintenanceRecordDtoValidator : AbstractValidator<CreateMaintenanceRecordDto>
{
    public CreateMaintenanceRecordDtoValidator()
    {
        RuleFor(x => x.CarId)
            .GreaterThan(0)
            .WithMessage("Car ID is required and must be greater than 0");

        RuleFor(x => x.ServiceTypeId)
            .GreaterThan(0)
            .WithMessage("Service type ID is required and must be greater than 0");

        RuleFor(x => x.ServiceDate)
            .NotEmpty()
            .WithMessage("Service date is required")
            .LessThanOrEqualTo(DateTime.Now)
            .WithMessage("Service date cannot be in the future");

        RuleFor(x => x.Mileage)
            .NotEmpty()
            .WithMessage("Mileage is required")
            .GreaterThanOrEqualTo(0)
            .WithMessage("Mileage must be greater than or equal to 0")
            .LessThanOrEqualTo(999999)
            .WithMessage("Mileage must be less than 1,000,000");

        RuleFor(x => x.Description)
            .NotEmpty()
            .WithMessage("Description is required")
            .MaximumLength(500)
            .WithMessage("Description must not exceed 500 characters");

        RuleFor(x => x.Cost)
            .NotEmpty()
            .WithMessage("Cost is required")
            .GreaterThanOrEqualTo(0)
            .WithMessage("Cost must be greater than or equal to 0")
            .LessThanOrEqualTo(999999.99m)
            .WithMessage("Cost must be less than $999,999.99");

        RuleFor(x => x.Notes)
            .MaximumLength(1000)
            .When(x => !string.IsNullOrEmpty(x.Notes))
            .WithMessage("Notes must not exceed 1000 characters");
    }
}

/// <summary>
/// Validator for UpdateMaintenanceRecordDto
/// </summary>
public class UpdateMaintenanceRecordDtoValidator : AbstractValidator<UpdateMaintenanceRecordDto>
{
    public UpdateMaintenanceRecordDtoValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0)
            .WithMessage("Maintenance record ID is required and must be greater than 0");

        RuleFor(x => x.CarId)
            .GreaterThan(0)
            .WithMessage("Car ID is required and must be greater than 0");

        RuleFor(x => x.ServiceTypeId)
            .GreaterThan(0)
            .WithMessage("Service type ID is required and must be greater than 0");

        RuleFor(x => x.ServiceDate)
            .NotEmpty()
            .WithMessage("Service date is required")
            .LessThanOrEqualTo(DateTime.Now)
            .WithMessage("Service date cannot be in the future");

        RuleFor(x => x.Mileage)
            .NotEmpty()
            .WithMessage("Mileage is required")
            .GreaterThanOrEqualTo(0)
            .WithMessage("Mileage must be greater than or equal to 0")
            .LessThanOrEqualTo(999999)
            .WithMessage("Mileage must be less than 1,000,000");

        RuleFor(x => x.Description)
            .NotEmpty()
            .WithMessage("Description is required")
            .MaximumLength(500)
            .WithMessage("Description must not exceed 500 characters");

        RuleFor(x => x.Cost)
            .NotEmpty()
            .WithMessage("Cost is required")
            .GreaterThanOrEqualTo(0)
            .WithMessage("Cost must be greater than or equal to 0")
            .LessThanOrEqualTo(999999.99m)
            .WithMessage("Cost must be less than $999,999.99");

        RuleFor(x => x.Notes)
            .MaximumLength(1000)
            .When(x => !string.IsNullOrEmpty(x.Notes))
            .WithMessage("Notes must not exceed 1000 characters");
    }
}

/// <summary>
/// Validator for MaintenanceRecordDto
/// </summary>
public class MaintenanceRecordDtoValidator : AbstractValidator<MaintenanceRecordDto>
{
    public MaintenanceRecordDtoValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0)
            .WithMessage("Maintenance record ID must be greater than 0");

        RuleFor(x => x.CarId)
            .GreaterThan(0)
            .WithMessage("Car ID must be greater than 0");

        RuleFor(x => x.ServiceTypeId)
            .GreaterThan(0)
            .WithMessage("Service type ID must be greater than 0");

        RuleFor(x => x.ServiceDate)
            .NotEmpty()
            .WithMessage("Service date is required");

        RuleFor(x => x.Mileage)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Mileage must be greater than or equal to 0");

        RuleFor(x => x.Description)
            .NotEmpty()
            .WithMessage("Description is required");

        RuleFor(x => x.Cost)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Cost must be greater than or equal to 0");

        RuleFor(x => x.CreatedAt)
            .NotEmpty()
            .WithMessage("Created date is required");

        RuleFor(x => x.CarMake)
            .NotEmpty()
            .WithMessage("Car make is required");

        RuleFor(x => x.CarModel)
            .NotEmpty()
            .WithMessage("Car model is required");

        RuleFor(x => x.ServiceTypeName)
            .NotEmpty()
            .WithMessage("Service type name is required");
    }
}