using Moq;
using FluentAssertions;
using CarMaintenance.Api.Services;
using CarMaintenance.Api.DTOs;
using CarMaintenance.Api.Models;
using CarMaintenance.Api.Interfaces;

namespace CarMaintenance.UnitTests.Services
{
    public class CarServiceTests
    {
        private readonly Mock<IRepository<Car>> _mockCarRepository;
        private readonly Mock<IRepository<Owner>> _mockOwnerRepository;
        private readonly Mock<INotificationService> _mockNotificationService;
        private readonly CarService _carService;

        public CarServiceTests()
        {
            _mockCarRepository = new Mock<IRepository<Car>>();
            _mockOwnerRepository = new Mock<IRepository<Owner>>();
            _mockNotificationService = new Mock<INotificationService>();
            
            _carService = new CarService(
                _mockCarRepository.Object, 
                _mockOwnerRepository.Object, 
                _mockNotificationService.Object);
        }

        [Test]
        public async Task GetCars_ValidRequest_ReturnsPagedResult()
        {
            // Arrange
            var cars = new List<Car>
            {
                new Car { Id = 1, Make = "Toyota", Model = "Camry", OwnerId = 1 },
                new Car { Id = 2, Make = "Honda", Model = "Civic", OwnerId = 1 }
            };
            
            var request = new PagedRequest { Page = 1, Size = 10, SearchTerm = "" };

            _mockCarRepository.Setup(x => x.GetAllAsync(null, null, null, null))
                .ReturnsAsync(cars.AsQueryable());

            // Act
            var result = await _carService.GetCarsAsync(request, 1);

            // Assert
            result.Success.Should().BeTrue();
            result.Data.Should().HaveCount(2);
            result.TotalCount.Should().Be(2);
        }

        [Test]
        public async Task GetCarById_ExistingCar_ReturnsCar()
        {
            // Arrange
            var car = new Car 
            { 
                Id = 1, 
                Make = "Toyota", 
                Model = "Camry", 
                OwnerId = 1,
                MaintenanceRecords = new List<MaintenanceRecord>()
            };
            
            _mockCarRepository.Setup(x => x.GetByIdAsync(1))
                .ReturnsAsync(car);

            // Act
            var result = await _carService.GetCarByIdAsync(1);

            // Assert
            result.Success.Should().BeTrue();
            result.Data.Should().NotBeNull();
            result.Data.Id.Should().Be(1);
        }

        [Test]
        public async Task GetCarById_NonExistingCar_ReturnsNotFound()
        {
            // Arrange
            _mockCarRepository.Setup(x => x.GetByIdAsync(999))
                .ReturnsAsync((Car)null);

            // Act
            var result = await _carService.GetCarByIdAsync(999);

            // Assert
            result.Success.Should().BeFalse();
            result.Message.Should().Be("Car not found");
        }

        [Test]
        public async Task CreateCar_ValidData_ReturnsSuccess()
        {
            // Arrange
            var carDto = new CarDto 
            { 
                Make = "Toyota",
                Model = "Camry",
                Year = 2022,
                VIN = "1HGBH41JXMN109186",
                OwnerId = 1
            };
            
            var owner = new Owner { Id = 1, Email = "owner@example.com" };

            _mockOwnerRepository.Setup(x => x.GetByIdAsync(1))
                .ReturnsAsync(owner);
            _mockCarRepository.Setup(x => x.AddAsync(It.IsAny<Car>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _carService.CreateCarAsync(carDto);

            // Assert
            result.Success.Should().BeTrue();
            result.Message.Should().Be("Car created successfully");
        }

        [Test]
        public async Task UpdateCar_ValidData_ReturnsSuccess()
        {
            // Arrange
            var existingCar = new Car 
            { 
                Id = 1, 
                Make = "Toyota", 
                Model = "Camry", 
                Year = 2022,
                VIN = "1HGBH41JXMN109186",
                OwnerId = 1 
            };
            
            var carDto = new CarDto 
            { 
                Make = "Toyota",
                Model = "Camry",
                Year = 2023,
                VIN = "1HGBH41JXMN109186",
                OwnerId = 1
            };

            _mockCarRepository.Setup(x => x.GetByIdAsync(1))
                .ReturnsAsync(existingCar);
            _mockCarRepository.Setup(x => x.UpdateAsync(existingCar))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _carService.UpdateCarAsync(1, carDto);

            // Assert
            result.Success.Should().BeTrue();
            result.Message.Should().Be("Car updated successfully");
        }

        [Test]
        public async Task DeleteCar_ExistingCar_ReturnsSuccess()
        {
            // Arrange
            var car = new Car { Id = 1, Make = "Toyota", OwnerId = 1 };
            
            _mockCarRepository.Setup(x => x.GetByIdAsync(1))
                .ReturnsAsync(car);
            _mockCarRepository.Setup(x => x.DeleteAsync(car))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _carService.DeleteCarAsync(1);

            // Assert
            result.Success.Should().BeTrue();
            result.Message.Should().Be("Car deleted successfully");
        }

        [Test]
        public async Task GetCarsByOwner_ValidOwner_ReturnsCars()
        {
            // Arrange
            var cars = new List<Car>
            {
                new Car { Id = 1, Make = "Toyota", OwnerId = 1 },
                new Car { Id = 2, Make = "Honda", OwnerId = 1 }
            };

            _mockCarRepository.Setup(x => x.GetAllAsync(
                It.IsAny<System.Linq.Expressions.Expression<System.Func<Car, bool>>>(),
                null, null, null))
                .ReturnsAsync(cars.AsQueryable());

            // Act
            var result = await _carService.GetCarsByOwnerAsync(1);

            // Assert
            result.Success.Should().BeTrue();
            result.Data.Should().HaveCount(2);
        }
    }
}