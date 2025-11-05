using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CarMaintenance.Application.Services;
using CarMaintenance.Shared.DTOs.MaintenanceRecords;

namespace CarMaintenance.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class MaintenanceRecordsController : ControllerBase
    {
        private readonly IMaintenanceRecordService _maintenanceRecordService;

        public MaintenanceRecordsController(IMaintenanceRecordService maintenanceRecordService)
        {
            _maintenanceRecordService = maintenanceRecordService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var records = await _maintenanceRecordService.GetAllAsync();
            return Ok(records);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var record = await _maintenanceRecordService.GetByIdAsync(id);
            if (record == null)
                return NotFound();

            return Ok(record);
        }

        [HttpGet("car/{carId}")]
        public async Task<IActionResult> GetByCarId(int carId)
        {
            var records = await _maintenanceRecordService.GetByCarIdAsync(carId);
            return Ok(records);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] MaintenanceRecordDto recordDto)
        {
            var result = await _maintenanceRecordService.CreateAsync(recordDto);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] MaintenanceRecordDto recordDto)
        {
            var result = await _maintenanceRecordService.UpdateAsync(id, recordDto);
            if (result == null)
                return NotFound();

            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _maintenanceRecordService.DeleteAsync(id);
            if (!result)
                return NotFound();

            return NoContent();
        }
    }
}