using FluentValidation;
using CarMaintenance.Application.DTOs;

namespace CarMaintenance.Application.Validators;

/// <summary>
/// Validator for CreateCarDto
/// </summary>
public class CreateCarDtoValidator : AbstractValidator<CreateCarDto>
{
    public CreateCarDtoValidator()
    {
        RuleFor(x => x.Make)
            .NotEmpty()
            .WithMessage("Car make is required")
            .MaximumLength(50)
            .WithMessage("Car make must not exceed 50 characters");

        RuleFor(x => x.Model)
            .NotEmpty()
            .WithMessage("Car model is required")
            .MaximumLength(50)
            .WithMessage("Car model must not exceed 50 characters");

        RuleFor(x => x.Year)
            .NotEmpty()
            .WithMessage("Car year is required")
            .InclusiveBetween(1900, DateTime.Now.Year + 2)
            .WithMessage($"Car year must be between 1900 and {DateTime.Now.Year + 2}");

        RuleFor(x => x.Vin)
            .NotEmpty()
            .WithMessage("VIN is required")
            .Length(17)
            .WithMessage("VIN must be exactly 17 characters")
            .Matches("^[A-HJ-NPR-Z0-9]{17}$")
            .WithMessage("VIN must contain valid characters");

        RuleFor(x => x.Mileage)
            .NotEmpty()
            .WithMessage("Mileage is required")
            .GreaterThanOrEqualTo(0)
            .WithMessage("Mileage must be greater than or equal to 0")
            .LessThanOrEqualTo(999999)
            .WithMessage("Mileage must be less than 1,000,000");

        RuleFor(x => x.Color)
            .MaximumLength(30)
            .When(x => !string.IsNullOrEmpty(x.Color))
            .WithMessage("Color must not exceed 30 characters");

        RuleFor(x => x.LicensePlate)
            .MaximumLength(15)
            .When(x => !string.IsNullOrEmpty(x.LicensePlate))
            .WithMessage("License plate must not exceed 15 characters");

        RuleFor(x => x.OwnerId)
            .NotEmpty()
            .WithMessage("Owner ID is required");

        RuleFor(x => x.ServiceTypeId)
            .GreaterThan(0)
            .When(x => x.ServiceTypeId.HasValue)
            .WithMessage("Service type ID must be greater than 0 when specified");
    }
}

/// <summary>
/// Validator for UpdateCarDto
/// </summary>
public class UpdateCarDtoValidator : AbstractValidator<UpdateCarDto>
{
    public UpdateCarDtoValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0)
            .WithMessage("Car ID is required and must be greater than 0");

        RuleFor(x => x.Make)
            .NotEmpty()
            .WithMessage("Car make is required")
            .MaximumLength(50)
            .WithMessage("Car make must not exceed 50 characters");

        RuleFor(x => x.Model)
            .NotEmpty()
            .WithMessage("Car model is required")
            .MaximumLength(50)
            .WithMessage("Car model must not exceed 50 characters");

        RuleFor(x => x.Year)
            .NotEmpty()
            .WithMessage("Car year is required")
            .InclusiveBetween(1900, DateTime.Now.Year + 2)
            .WithMessage($"Car year must be between 1900 and {DateTime.Now.Year + 2}");

        RuleFor(x => x.Vin)
            .NotEmpty()
            .WithMessage("VIN is required")
            .Length(17)
            .WithMessage("VIN must be exactly 17 characters")
            .Matches("^[A-HJ-NPR-Z0-9]{17}$")
            .WithMessage("VIN must contain valid characters");

        RuleFor(x => x.Mileage)
            .NotEmpty()
            .WithMessage("Mileage is required")
            .GreaterThanOrEqualTo(0)
            .WithMessage("Mileage must be greater than or equal to 0")
            .LessThanOrEqualTo(999999)
            .WithMessage("Mileage must be less than 1,000,000");

        RuleFor(x => x.Color)
            .MaximumLength(30)
            .When(x => !string.IsNullOrEmpty(x.Color))
            .WithMessage("Color must not exceed 30 characters");

        RuleFor(x => x.LicensePlate)
            .MaximumLength(15)
            .When(x => !string.IsNullOrEmpty(x.LicensePlate))
            .WithMessage("License plate must not exceed 15 characters");
    }
}

/// <summary>
/// Validator for CarDto
/// </summary>
public class CarDtoValidator : AbstractValidator<CarDto>
{
    public CarDtoValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0)
            .WithMessage("Car ID must be greater than 0");

        RuleFor(x => x.Make)
            .NotEmpty()
            .WithMessage("Car make is required");

        RuleFor(x => x.Model)
            .NotEmpty()
            .WithMessage("Car model is required");

        RuleFor(x => x.Year)
            .GreaterThan(1900)
            .WithMessage("Car year must be greater than 1900");

        RuleFor(x => x.Vin)
            .NotEmpty()
            .WithMessage("VIN is required");

        RuleFor(x => x.Mileage)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Mileage must be greater than or equal to 0");

        RuleFor(x => x.OwnerId)
            .NotEmpty()
            .WithMessage("Owner ID is required");

        RuleFor(x => x.CreatedAt)
            .NotEmpty()
            .WithMessage("Created date is required");
    }
}