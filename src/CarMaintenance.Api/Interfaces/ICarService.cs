using CarMaintenance.Api.DTOs;

namespace CarMaintenance.Api.Interfaces
{
    public interface ICarService
    {
        Task<PagedResult<CarDto>> GetAllAsync(int page = 1, int pageSize = 10);
        Task<CarDto?> GetByIdAsync(int id);
        Task<PagedResult<CarDto>> GetByOwnerIdAsync(string ownerId, int page = 1, int pageSize = 10);
        Task<CarDto?> CreateAsync(CarDto carDto);
        Task<CarDto?> UpdateAsync(int id, CarDto carDto);
        Task<bool> DeleteAsync(int id);
    }
}