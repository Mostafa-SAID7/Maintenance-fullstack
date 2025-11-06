using Microsoft.AspNetCore.Mvc;
using CarMaintenance.Api.Interfaces;
using CarMaintenance.Api.DTOs;

namespace CarMaintenance.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class MaintenanceRecordsController : ControllerBase
    {
        private readonly IMaintenanceRecordService _maintenanceRecordService;
        private readonly ILogger<MaintenanceRecordsController> _logger;

        public MaintenanceRecordsController(
            IMaintenanceRecordService maintenanceRecordService,
            ILogger<MaintenanceRecordsController> logger)
        {
            _maintenanceRecordService = maintenanceRecordService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var records = await _maintenanceRecordService.GetAllAsync(page, pageSize);
                return Ok(records);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting maintenance records");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var record = await _maintenanceRecordService.GetByIdAsync(id);
                if (record == null)
                    return NotFound(new { message = "Maintenance record not found" });

                return Ok(record);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting maintenance record with ID {RecordId}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("by-car/{carId}")]
        public async Task<IActionResult> GetByCarId(int carId)
        {
            try
            {
                var records = await _maintenanceRecordService.GetByCarIdAsync(carId);
                return Ok(records);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting maintenance records for car {CarId}", carId);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] MaintenanceRecordDto maintenanceRecordDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var result = await _maintenanceRecordService.CreateAsync(maintenanceRecordDto);
                return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating maintenance record");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] MaintenanceRecordDto maintenanceRecordDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                if (id != maintenanceRecordDto.Id)
                    return BadRequest(new { message = "ID mismatch" });

                var result = await _maintenanceRecordService.UpdateAsync(id, maintenanceRecordDto);
                if (result == null)
                    return NotFound(new { message = "Maintenance record not found" });

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating maintenance record with ID {RecordId}", id);
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var result = await _maintenanceRecordService.DeleteAsync(id);
                if (!result)
                    return NotFound(new { message = "Maintenance record not found" });

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting maintenance record with ID {RecordId}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }
    }
}