using FluentValidation;
using CarMaintenance.Application.DTOs;

namespace CarMaintenance.Application.Validators;

/// <summary>
/// Validator for CreateOwnerDto
/// </summary>
public class CreateOwnerDtoValidator : AbstractValidator<CreateOwnerDto>
{
    public CreateOwnerDtoValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty()
            .WithMessage("First name is required")
            .MaximumLength(50)
            .WithMessage("First name must not exceed 50 characters");

        RuleFor(x => x.LastName)
            .NotEmpty()
            .WithMessage("Last name is required")
            .MaximumLength(50)
            .WithMessage("Last name must not exceed 50 characters");

        RuleFor(x => x.Email)
            .NotEmpty()
            .WithMessage("Email is required")
            .EmailAddress()
            .WithMessage("Email must be a valid email address")
            .MaximumLength(100)
            .WithMessage("Email must not exceed 100 characters");

        RuleFor(x => x.Phone)
            .NotEmpty()
            .WithMessage("Phone number is required")
            .Matches(@"^[\+]?[1-9][\d]{0,15}$")
            .WithMessage("Phone number must be a valid international phone number")
            .MaximumLength(20)
            .WithMessage("Phone number must not exceed 20 characters");

        RuleFor(x => x.Address)
            .MaximumLength(200)
            .When(x => !string.IsNullOrEmpty(x.Address))
            .WithMessage("Address must not exceed 200 characters");

        RuleFor(x => x.City)
            .MaximumLength(50)
            .When(x => !string.IsNullOrEmpty(x.City))
            .WithMessage("City must not exceed 50 characters");

        RuleFor(x => x.PostalCode)
            .MaximumLength(10)
            .When(x => !string.IsNullOrEmpty(x.PostalCode))
            .WithMessage("Postal code must not exceed 10 characters");
    }
}

/// <summary>
/// Validator for UpdateOwnerDto
/// </summary>
public class UpdateOwnerDtoValidator : AbstractValidator<UpdateOwnerDto>
{
    public UpdateOwnerDtoValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0)
            .WithMessage("Owner ID is required and must be greater than 0");

        RuleFor(x => x.FirstName)
            .NotEmpty()
            .WithMessage("First name is required")
            .MaximumLength(50)
            .WithMessage("First name must not exceed 50 characters");

        RuleFor(x => x.LastName)
            .NotEmpty()
            .WithMessage("Last name is required")
            .MaximumLength(50)
            .WithMessage("Last name must not exceed 50 characters");

        RuleFor(x => x.Email)
            .NotEmpty()
            .WithMessage("Email is required")
            .EmailAddress()
            .WithMessage("Email must be a valid email address")
            .MaximumLength(100)
            .WithMessage("Email must not exceed 100 characters");

        RuleFor(x => x.PhoneNumber)
            .NotEmpty()
            .WithMessage("Phone number is required")
            .Matches(@"^[\+]?[1-9][\d]{0,15}$")
            .WithMessage("Phone number must be a valid international phone number")
            .MaximumLength(20)
            .WithMessage("Phone number must not exceed 20 characters");

        RuleFor(x => x.Address)
            .MaximumLength(200)
            .When(x => !string.IsNullOrEmpty(x.Address))
            .WithMessage("Address must not exceed 200 characters");

        RuleFor(x => x.City)
            .MaximumLength(50)
            .When(x => !string.IsNullOrEmpty(x.City))
            .WithMessage("City must not exceed 50 characters");

        RuleFor(x => x.PostalCode)
            .MaximumLength(10)
            .When(x => !string.IsNullOrEmpty(x.PostalCode))
            .WithMessage("Postal code must not exceed 10 characters");
    }
}