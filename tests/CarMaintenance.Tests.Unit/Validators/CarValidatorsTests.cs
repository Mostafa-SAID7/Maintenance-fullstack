using Xunit;
using FluentValidation;
using FluentValidation.Results;
using CarMaintenance.Application.Validators;
using CarMaintenance.Application.DTOs;

namespace CarMaintenance.Tests.Unit.Validators;

/// <summary>
/// Unit tests for CarValidators
/// </summary>
public class CarValidatorsTests
{
    private readonly CreateCarDtoValidator _createValidator = new();
    private readonly UpdateCarDtoValidator _updateValidator = new();
    private readonly CarDtoValidator _dtoValidator = new();

    [Fact]
    public void CreateCarDtoValidator_ValidData_ShouldPass()
    {
        // Arrange
        var car = new CreateCarDto
        {
            Make = "Toyota",
            Model = "Camry",
            Year = 2023,
            Vin = "1HGBH41JXMN109186",
            Mileage = 25000,
            OwnerId = "1"
        };

        // Act
        var result = _createValidator.Validate(car);

        // Assert
        Assert.True(result.IsValid);
        Assert.Empty(result.Errors);
    }

    [Fact]
    public void CreateCarDtoValidator_InvalidYear_ShouldFail()
    {
        // Arrange
        var car = new CreateCarDto
        {
            Make = "Toyota",
            Model = "Camry",
            Year = 1800, // Invalid year
            Vin = "1HGBH41JXMN109186",
            Mileage = 25000,
            OwnerId = "1"
        };

        // Act
        var result = _createValidator.Validate(car);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateCarDto.Year));
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    [InlineData("INVALIDVIN")]
    [InlineData("123456789012345")]
    public void CreateCarDtoValidator_InvalidVin_ShouldFail(string vin)
    {
        // Arrange
        var car = new CreateCarDto
        {
            Make = "Toyota",
            Model = "Camry",
            Year = 2023,
            Vin = vin,
            Mileage = 25000,
            OwnerId = "1"
        };

        // Act
        var result = _createValidator.Validate(car);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateCarDto.Vin));
    }

    [Fact]
    public void CreateCarDtoValidator_NegativeMileage_ShouldFail()
    {
        // Arrange
        var car = new CreateCarDto
        {
            Make = "Toyota",
            Model = "Camry",
            Year = 2023,
            Vin = "1HGBH41JXMN109186",
            Mileage = -100, // Negative mileage
            OwnerId = "1"
        };

        // Act
        var result = _createValidator.Validate(car);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateCarDto.Mileage));
    }

    [Fact]
    public void CreateCarDtoValidator_EmptyOwnerId_ShouldFail()
    {
        // Arrange
        var car = new CreateCarDto
        {
            Make = "Toyota",
            Model = "Camry",
            Year = 2023,
            Vin = "1HGBH41JXMN109186",
            Mileage = 25000,
            OwnerId = "" // Empty owner ID
        };

        // Act
        var result = _createValidator.Validate(car);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateCarDto.OwnerId));
    }

    [Fact]
    public void UpdateCarDtoValidator_ValidData_ShouldPass()
    {
        // Arrange
        var car = new UpdateCarDto
        {
            Id = 1,
            Make = "Toyota",
            Model = "Camry",
            Year = 2023,
            Vin = "1HGBH41JXMN109186",
            Mileage = 25000
        };

        // Act
        var result = _updateValidator.Validate(car);

        // Assert
        Assert.True(result.IsValid);
        Assert.Empty(result.Errors);
    }

    [Fact]
    public void UpdateCarDtoValidator_InvalidId_ShouldFail()
    {
        // Arrange
        var car = new UpdateCarDto
        {
            Id = 0, // Invalid ID
            Make = "Toyota",
            Model = "Camry",
            Year = 2023,
            Vin = "1HGBH41JXMN109186",
            Mileage = 25000
        };

        // Act
        var result = _updateValidator.Validate(car);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateCarDto.Id));
    }

    [Theory]
    [InlineData("123")]
    [InlineData("")]
    [InlineData(null)]
    public void CreateCarDtoValidator_ServiceTypeIdValidation_InvalidValues(int? serviceTypeId)
    {
        // Arrange
        var car = new CreateCarDto
        {
            Make = "Toyota",
            Model = "Camry",
            Year = 2023,
            Vin = "1HGBH41JXMN109186",
            Mileage = 25000,
            OwnerId = "1",
            ServiceTypeId = serviceTypeId
        };

        // Act
        var result = _createValidator.Validate(car);

        // Assert
        if (serviceTypeId.HasValue && serviceTypeId <= 0)
        {
            Assert.False(result.IsValid);
            Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateCarDto.ServiceTypeId));
        }
        else
        {
            // null or positive value should be valid for ServiceTypeId
            Assert.True(result.IsValid);
        }
    }
}