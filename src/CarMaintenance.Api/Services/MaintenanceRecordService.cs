using AutoMapper;
using CarMaintenance.Api.Interfaces;
using CarMaintenance.Api.DTOs;
using CarMaintenance.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CarMaintenance.Api.Services
{
    public class MaintenanceRecordService : IMaintenanceRecordService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public MaintenanceRecordService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<PagedResult<MaintenanceRecordDto>> GetAllAsync(int page = 1, int pageSize = 10)
        {
            var query = _unitOfWork.Repository<MaintenanceRecord>()
                .GetQueryable()
                .Include(m => m.Car)
                .Include(m => m.ServiceType);

            var totalCount = await query.CountAsync();
            var records = await query
                .OrderByDescending(m => m.ServiceDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var recordDtos = new List<MaintenanceRecordDto>();
            foreach (var record in records)
            {
                var recordDto = _mapper.Map<MaintenanceRecordDto>(record);
                recordDto.ServiceTypeName = record.ServiceType?.Name ?? "Unknown";
                recordDtos.Add(recordDto);
            }

            return new PagedResult<MaintenanceRecordDto>
            {
                Items = recordDtos,
                TotalCount = totalCount,
                CurrentPage = page,
                PageSize = pageSize
            };
        }

        public async Task<MaintenanceRecordDto?> GetByIdAsync(int id)
        {
            var record = await _unitOfWork.Repository<MaintenanceRecord>()
                .GetQueryable()
                .Include(m => m.Car)
                .Include(m => m.ServiceType)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (record == null)
                return null;

            var recordDto = _mapper.Map<MaintenanceRecordDto>(record);
            recordDto.ServiceTypeName = record.ServiceType?.Name ?? "Unknown";
            return recordDto;
        }

        public async Task<PagedResult<MaintenanceRecordDto>> GetByCarIdAsync(int carId, int page = 1, int pageSize = 10)
        {
            var query = _unitOfWork.Repository<MaintenanceRecord>()
                .GetQueryable()
                .Include(m => m.Car)
                .Include(m => m.ServiceType)
                .Where(m => m.CarId == carId);

            var totalCount = await query.CountAsync();
            var records = await query
                .OrderByDescending(m => m.ServiceDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var recordDtos = new List<MaintenanceRecordDto>();
            foreach (var record in records)
            {
                var recordDto = _mapper.Map<MaintenanceRecordDto>(record);
                recordDto.ServiceTypeName = record.ServiceType?.Name ?? "Unknown";
                recordDtos.Add(recordDto);
            }

            return new PagedResult<MaintenanceRecordDto>
            {
                Items = recordDtos,
                TotalCount = totalCount,
                CurrentPage = page,
                PageSize = pageSize
            };
        }

        public async Task<MaintenanceRecordDto?> CreateAsync(MaintenanceRecordDto maintenanceRecordDto)
        {
            // Validate that the car exists
            var car = await _unitOfWork.Repository<Car>().GetByIdAsync(maintenanceRecordDto.CarId);
            if (car == null)
                throw new InvalidOperationException("Car not found");

            // Validate that the service type exists
            var serviceType = await _unitOfWork.Repository<ServiceType>().GetByIdAsync(maintenanceRecordDto.ServiceTypeId);
            if (serviceType == null)
                throw new InvalidOperationException("Service type not found");

            var record = _mapper.Map<MaintenanceRecord>(maintenanceRecordDto);
            record.CreatedAt = DateTime.UtcNow;
            record.UpdatedAt = DateTime.UtcNow;

            // Set IsCompleted based on whether service date is in the future or past
            record.IsCompleted = record.ServiceDate <= DateTime.UtcNow;

            await _unitOfWork.Repository<MaintenanceRecord>().AddAsync(record);
            await _unitOfWork.SaveChangesAsync();

            // Update car's last maintenance date
            car.LastMaintenanceDate = record.ServiceDate;
            await _unitOfWork.Repository<Car>().UpdateAsync(car);
            await _unitOfWork.SaveChangesAsync();

            return await GetByIdAsync(record.Id);
        }

        public async Task<MaintenanceRecordDto?> UpdateAsync(int id, MaintenanceRecordDto maintenanceRecordDto)
        {
            var existingRecord = await _unitOfWork.Repository<MaintenanceRecord>()
                .GetByIdAsync(id);

            if (existingRecord == null)
                return null;

            // Validate car exists if changed
            if (existingRecord.CarId != maintenanceRecordDto.CarId)
            {
                var car = await _unitOfWork.Repository<Car>().GetByIdAsync(maintenanceRecordDto.CarId);
                if (car == null)
                    throw new InvalidOperationException("Car not found");
            }

            // Validate service type exists if changed
            if (existingRecord.ServiceTypeId != maintenanceRecordDto.ServiceTypeId)
            {
                var serviceType = await _unitOfWork.Repository<ServiceType>().GetByIdAsync(maintenanceRecordDto.ServiceTypeId);
                if (serviceType == null)
                    throw new InvalidOperationException("Service type not found");
            }

            // Update properties
            existingRecord.CarId = maintenanceRecordDto.CarId;
            existingRecord.ServiceTypeId = maintenanceRecordDto.ServiceTypeId;
            existingRecord.ServiceDate = maintenanceRecordDto.ServiceDate;
            existingRecord.Description = maintenanceRecordDto.Description;
            existingRecord.Cost = maintenanceRecordDto.Cost;
            existingRecord.Mileage = maintenanceRecordDto.Mileage;
            existingRecord.ServiceProvider = maintenanceRecordDto.ServiceProvider;
            existingRecord.Notes = maintenanceRecordDto.Notes;
            existingRecord.IsCompleted = maintenanceRecordDto.IsCompleted;
            existingRecord.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.Repository<MaintenanceRecord>().UpdateAsync(existingRecord);
            await _unitOfWork.SaveChangesAsync();

            return await GetByIdAsync(id);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var record = await _unitOfWork.Repository<MaintenanceRecord>()
                .GetByIdAsync(id);

            if (record == null)
                return false;

            await _unitOfWork.Repository<MaintenanceRecord>().DeleteAsync(id);
            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        public async Task<List<MaintenanceRecordDto>> GetUpcomingMaintenanceAsync(string ownerId, int days = 30)
        {
            var upcomingDate = DateTime.UtcNow.AddDays(days);
            
            var query = _unitOfWork.Repository<MaintenanceRecord>()
                .GetQueryable()
                .Include(m => m.Car)
                .Include(m => m.ServiceType)
                .Where(m => m.Car.OwnerId == ownerId && 
                           !m.IsCompleted && 
                           m.ServiceDate <= upcomingDate);

            var records = await query
                .OrderBy(m => m.ServiceDate)
                .ToListAsync();

            var recordDtos = new List<MaintenanceRecordDto>();
            foreach (var record in records)
            {
                var recordDto = _mapper.Map<MaintenanceRecordDto>(record);
                recordDto.ServiceTypeName = record.ServiceType?.Name ?? "Unknown";
                recordDtos.Add(recordDto);
            }

            return recordDtos;
        }

        public async Task<MaintenanceRecordDto?> MarkAsCompletedAsync(int id, string notes = "")
        {
            var record = await _unitOfWork.Repository<MaintenanceRecord>()
                .GetByIdAsync(id);

            if (record == null)
                return null;

            record.IsCompleted = true;
            record.Notes = string.IsNullOrEmpty(notes) ? record.Notes : $"{record.Notes}\n\nCompleted: {DateTime.UtcNow:yyyy-MM-dd HH:mm} - {notes}";
            record.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.Repository<MaintenanceRecord>().UpdateAsync(record);
            await _unitOfWork.SaveChangesAsync();

            return await GetByIdAsync(id);
        }
    }
}