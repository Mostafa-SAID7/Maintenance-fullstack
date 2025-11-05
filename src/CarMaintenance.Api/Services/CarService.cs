using CarMaintenance.Api.Interfaces;
using CarMaintenance.Api.Models;
using CarMaintenance.Shared.DTOs.Cars;

namespace CarMaintenance.Api.Services
{
    public class CarService : ICarService
    {
        private readonly IUnitOfWork _unitOfWork;

        public CarService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IEnumerable<CarDto>> GetAllAsync()
        {
            var cars = await _unitOfWork.Repository<Car>().GetAllAsync();
            return cars.Select(c => new CarDto
            {
                Id = c.Id,
                Make = c.Make,
                Model = c.Model,
                Year = c.Year,
                LicensePlate = c.LicensePlate,
                Vin = c.Vin,
                Mileage = c.Mileage,
                Color = c.Color,
                OwnerId = c.OwnerId,
                CreatedAt = c.CreatedAt,
                LastMaintenanceDate = c.LastMaintenanceDate,
                OwnerName = c.Owner?.FirstName + " " + c.Owner?.LastName ?? ""
            });
        }

        public async Task<CarDto?> GetByIdAsync(int id)
        {
            var car = await _unitOfWork.Repository<Car>().GetByIdAsync(id);
            if (car == null) return null;

            return new CarDto
            {
                Id = car.Id,
                Make = car.Make,
                Model = car.Model,
                Year = car.Year,
                LicensePlate = car.LicensePlate,
                Vin = car.Vin,
                Mileage = car.Mileage,
                Color = car.Color,
                OwnerId = car.OwnerId,
                CreatedAt = car.CreatedAt,
                LastMaintenanceDate = car.LastMaintenanceDate,
                OwnerName = car.Owner?.FirstName + " " + car.Owner?.LastName ?? ""
            };
        }

        public async Task<CarDto> CreateAsync(CarDto carDto)
        {
            var car = new Car
            {
                Make = carDto.Make,
                Model = carDto.Model,
                Year = carDto.Year,
                LicensePlate = carDto.LicensePlate,
                Vin = carDto.Vin,
                Mileage = carDto.Mileage,
                Color = carDto.Color,
                OwnerId = carDto.OwnerId
            };

            await _unitOfWork.Repository<Car>().AddAsync(car);
            await _unitOfWork.SaveChangesAsync();

            carDto.Id = car.Id;
            carDto.CreatedAt = car.CreatedAt;
            return carDto;
        }

        public async Task<CarDto?> UpdateAsync(int id, CarDto carDto)
        {
            var car = await _unitOfWork.Repository<Car>().GetByIdAsync(id);
            if (car == null) return null;

            car.Make = carDto.Make;
            car.Model = carDto.Model;
            car.Year = carDto.Year;
            car.LicensePlate = carDto.LicensePlate;
            car.Vin = carDto.Vin;
            car.Mileage = carDto.Mileage;
            car.Color = carDto.Color;
            car.OwnerId = carDto.OwnerId;

            await _unitOfWork.Repository<Car>().UpdateAsync(car);
            await _unitOfWork.SaveChangesAsync();

            return carDto;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var car = await _unitOfWork.Repository<Car>().GetByIdAsync(id);
            if (car == null) return false;

            await _unitOfWork.Repository<Car>().DeleteAsync(car);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }
    }
}