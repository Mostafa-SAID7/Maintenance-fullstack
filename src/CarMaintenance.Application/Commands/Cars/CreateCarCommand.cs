using MediatR;
using CarMaintenance.Application.DTOs;
using CarMaintenance.Domain.Entities;

namespace CarMaintenance.Application.Commands.Cars;

/// <summary>
/// Command to create a new car
/// </summary>
public record CreateCarCommand(
    string Make,
    string Model,
    int Year,
    string? Color,
    string? LicensePlate,
    string VIN,
    int Mileage,
    string OwnerId,
    int? ServiceTypeId
) : IRequest<CarDto>;

/// <summary>
/// Validator for CreateCarCommand
/// </summary>
public class CreateCarCommandValidator : AbstractValidator<CreateCarCommand>
{
    public CreateCarCommandValidator()
    {
        RuleFor(x => x.Make)
            .NotEmpty()
            .MaximumLength(50)
            .WithMessage("Make is required and must not exceed 50 characters");

        RuleFor(x => x.Model)
            .NotEmpty()
            .MaximumLength(50)
            .WithMessage("Model is required and must not exceed 50 characters");

        RuleFor(x => x.Year)
            .NotEmpty()
            .GreaterThanOrEqualTo(1900)
            .LessThanOrEqualTo(DateTime.UtcNow.Year + 2)
            .WithMessage("Year must be between 1900 and current year + 2");

        RuleFor(x => x.VIN)
            .NotEmpty()
            .Length(17)
            .WithMessage("VIN must be exactly 17 characters");

        RuleFor(x => x.Mileage)
            .NotEmpty()
            .GreaterThanOrEqualTo(0)
            .WithMessage("Mileage must be greater than or equal to 0");

        RuleFor(x => x.OwnerId)
            .NotEmpty()
            .WithMessage("Owner ID is required");

        RuleFor(x => x.ServiceTypeId)
            .GreaterThan(0)
            .When(x => x.ServiceTypeId.HasValue)
            .WithMessage("ServiceTypeId must be greater than 0 when specified");
    }
}