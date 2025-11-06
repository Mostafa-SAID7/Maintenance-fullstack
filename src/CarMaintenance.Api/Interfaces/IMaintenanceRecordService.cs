using CarMaintenance.Api.DTOs;

namespace CarMaintenance.Api.Interfaces
{
    public interface IMaintenanceRecordService
    {
        Task<PagedResult<MaintenanceRecordDto>> GetAllAsync(int page = 1, int pageSize = 10);
        Task<MaintenanceRecordDto?> GetByIdAsync(int id);
        Task<PagedResult<MaintenanceRecordDto>> GetByCarIdAsync(int carId, int page = 1, int pageSize = 10);
        Task<MaintenanceRecordDto?> CreateAsync(MaintenanceRecordDto maintenanceRecordDto);
        Task<MaintenanceRecordDto?> UpdateAsync(int id, MaintenanceRecordDto maintenanceRecordDto);
        Task<bool> DeleteAsync(int id);
    }
}