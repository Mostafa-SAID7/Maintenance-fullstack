using FluentValidation;
using CarMaintenance.Application.DTOs;

namespace CarMaintenance.Application.Validators;

/// <summary>
/// Validator for CreateServiceTypeDto
/// </summary>
public class CreateServiceTypeDtoValidator : AbstractValidator<CreateServiceTypeDto>
{
    public CreateServiceTypeDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Service type name is required")
            .MaximumLength(100)
            .WithMessage("Service type name must not exceed 100 characters");

        RuleFor(x => x.Description)
            .NotEmpty()
            .WithMessage("Description is required")
            .MaximumLength(500)
            .WithMessage("Description must not exceed 500 characters");

        RuleFor(x => x.BaseCost)
            .NotEmpty()
            .WithMessage("Base cost is required")
            .GreaterThanOrEqualTo(0)
            .WithMessage("Base cost must be greater than or equal to 0")
            .LessThanOrEqualTo(999999.99m)
            .WithMessage("Base cost must be less than $999,999.99");

        RuleFor(x => x.EstimatedDurationMinutes)
            .NotEmpty()
            .WithMessage("Estimated duration is required")
            .GreaterThan(0)
            .WithMessage("Estimated duration must be greater than 0")
            .LessThanOrEqualTo(1440) // 24 hours in minutes
            .WithMessage("Estimated duration cannot exceed 24 hours (1440 minutes)");

        RuleFor(x => x.RequiresParts)
            .NotNull()
            .WithMessage("Requires parts flag is required");
    }
}

/// <summary>
/// Validator for UpdateServiceTypeDto
/// </summary>
public class UpdateServiceTypeDtoValidator : AbstractValidator<UpdateServiceTypeDto>
{
    public UpdateServiceTypeDtoValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0)
            .WithMessage("Service type ID is required and must be greater than 0");

        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Service type name is required")
            .MaximumLength(100)
            .WithMessage("Service type name must not exceed 100 characters");

        RuleFor(x => x.Description)
            .NotEmpty()
            .WithMessage("Description is required")
            .MaximumLength(500)
            .WithMessage("Description must not exceed 500 characters");

        RuleFor(x => x.BaseCost)
            .NotEmpty()
            .WithMessage("Base cost is required")
            .GreaterThanOrEqualTo(0)
            .WithMessage("Base cost must be greater than or equal to 0")
            .LessThanOrEqualTo(999999.99m)
            .WithMessage("Base cost must be less than $999,999.99");

        RuleFor(x => x.EstimatedDurationMinutes)
            .NotEmpty()
            .WithMessage("Estimated duration is required")
            .GreaterThan(0)
            .WithMessage("Estimated duration must be greater than 0")
            .LessThanOrEqualTo(1440) // 24 hours in minutes
            .WithMessage("Estimated duration cannot exceed 24 hours (1440 minutes)");

        RuleFor(x => x.RequiresParts)
            .NotNull()
            .WithMessage("Requires parts flag is required");
    }
}

/// <summary>
/// Validator for ServiceTypeDto
/// </summary>
public class ServiceTypeDtoValidator : AbstractValidator<ServiceTypeDto>
{
    public ServiceTypeDtoValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0)
            .WithMessage("Service type ID must be greater than 0");

        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Service type name is required");

        RuleFor(x => x.Description)
            .NotEmpty()
            .WithMessage("Description is required");

        RuleFor(x => x.BaseCost)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Base cost must be greater than or equal to 0");

        RuleFor(x => x.EstimatedDurationMinutes)
            .GreaterThan(0)
            .WithMessage("Estimated duration must be greater than 0");

        RuleFor(x => x.CreatedAt)
            .NotEmpty()
            .WithMessage("Created date is required");

        RuleFor(x => x.RequiresParts)
            .NotNull()
            .WithMessage("Requires parts flag is required");
    }
}