using AutoMapper;
using CarMaintenance.Api.Interfaces;
using CarMaintenance.Api.DTOs;
using CarMaintenance.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CarMaintenance.Api.Services
{
    public class CarService : ICarService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public CarService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<PagedResult<CarDto>> GetAllAsync(int page = 1, int pageSize = 10)
        {
            var query = _unitOfWork.Repository<Car>()
                .GetQueryable()
                .Include(c => c.Owner)
                .Include(c => c.MaintenanceRecords);

            var totalCount = await query.CountAsync();
            var cars = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var carDtos = _mapper.Map<List<CarDto>>(cars);

            // Enhance with owner name
            foreach (var carDto in carDtos)
            {
                carDto.OwnerName = cars.FirstOrDefault(c => c.Id == carDto.Id)?.Owner?.UserName ?? "Unknown";
            }

            return new PagedResult<CarDto>
            {
                Items = carDtos,
                TotalCount = totalCount,
                CurrentPage = page,
                PageSize = pageSize
            };
        }

        public async Task<CarDto?> GetByIdAsync(int id)
        {
            var car = await _unitOfWork.Repository<Car>()
                .GetQueryable()
                .Include(c => c.Owner)
                .Include(c => c.MaintenanceRecords)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (car == null)
                return null;

            var carDto = _mapper.Map<CarDto>(car);
            carDto.OwnerName = car.Owner?.UserName ?? "Unknown";
            return carDto;
        }

        public async Task<PagedResult<CarDto>> GetByOwnerIdAsync(string ownerId, int page = 1, int pageSize = 10)
        {
            var query = _unitOfWork.Repository<Car>()
                .GetQueryable()
                .Include(c => c.Owner)
                .Include(c => c.MaintenanceRecords)
                .Where(c => c.OwnerId == ownerId);

            var totalCount = await query.CountAsync();
            var cars = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var carDtos = _mapper.Map<List<CarDto>>(cars);

            // Enhance with owner name
            foreach (var carDto in carDtos)
            {
                carDto.OwnerName = cars.FirstOrDefault(c => c.Id == carDto.Id)?.Owner?.UserName ?? "Unknown";
            }

            return new PagedResult<CarDto>
            {
                Items = carDtos,
                TotalCount = totalCount,
                CurrentPage = page,
                PageSize = pageSize
            };
        }

        public async Task<CarDto?> CreateAsync(CarDto carDto)
        {
            // Validate VIN uniqueness
            var existingCar = await _unitOfWork.Repository<Car>()
                .GetQueryable()
                .FirstOrDefaultAsync(c => c.Vin == carDto.Vin);

            if (existingCar != null)
                throw new InvalidOperationException("A car with this VIN already exists");

            // Validate license plate uniqueness
            existingCar = await _unitOfWork.Repository<Car>()
                .GetQueryable()
                .FirstOrDefaultAsync(c => c.LicensePlate == carDto.LicensePlate);

            if (existingCar != null)
                throw new InvalidOperationException("A car with this license plate already exists");

            var car = _mapper.Map<Car>(carDto);
            car.CreatedAt = DateTime.UtcNow;

            await _unitOfWork.Repository<Car>().AddAsync(car);
            await _unitOfWork.SaveChangesAsync();

            return await GetByIdAsync(car.Id);
        }

        public async Task<CarDto?> UpdateAsync(int id, CarDto carDto)
        {
            var existingCar = await _unitOfWork.Repository<Car>()
                .GetByIdAsync(id);

            if (existingCar == null)
                return null;

            // Validate VIN uniqueness (excluding current car)
            var vinExists = await _unitOfWork.Repository<Car>()
                .GetQueryable()
                .AnyAsync(c => c.Vin == carDto.Vin && c.Id != id);

            if (vinExists)
                throw new InvalidOperationException("A car with this VIN already exists");

            // Validate license plate uniqueness (excluding current car)
            var plateExists = await _unitOfWork.Repository<Car>()
                .GetQueryable()
                .AnyAsync(c => c.LicensePlate == carDto.LicensePlate && c.Id != id);

            if (plateExists)
                throw new InvalidOperationException("A car with this license plate already exists");

            // Update properties
            existingCar.Make = carDto.Make;
            existingCar.Model = carDto.Model;
            existingCar.Year = carDto.Year;
            existingCar.LicensePlate = carDto.LicensePlate;
            existingCar.Vin = carDto.Vin;
            existingCar.Mileage = carDto.Mileage;
            existingCar.Color = carDto.Color;
            existingCar.OwnerId = carDto.OwnerId;

            await _unitOfWork.Repository<Car>().UpdateAsync(existingCar);
            await _unitOfWork.SaveChangesAsync();

            return await GetByIdAsync(id);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var car = await _unitOfWork.Repository<Car>()
                .GetByIdAsync(id);

            if (car == null)
                return false;

            // Check if car has maintenance records
            var hasMaintenanceRecords = await _unitOfWork.Repository<MaintenanceRecord>()
                .GetQueryable()
                .AnyAsync(m => m.CarId == id);

            if (hasMaintenanceRecords)
                throw new InvalidOperationException("Cannot delete car with existing maintenance records");

            await _unitOfWork.Repository<Car>().DeleteAsync(id);
            await _unitOfWork.SaveChangesAsync();
            return true;
        }
    }
}