using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CarMaintenance.Api.Interfaces;
using CarMaintenance.Api.DTOs;

namespace CarMaintenance.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class CarsController : ControllerBase
    {
        private readonly ICarService _carService;
        private readonly ILogger<CarsController> _logger;

        public CarsController(ICarService carService, ILogger<CarsController> logger)
        {
            _carService = carService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var cars = await _carService.GetAllAsync(page, pageSize);
                return Ok(cars);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cars");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var car = await _carService.GetByIdAsync(id);
                if (car == null)
                    return NotFound(new { message = "Car not found" });

                return Ok(car);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting car with ID {CarId}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("by-owner/{ownerId}")]
        public async Task<IActionResult> GetByOwnerId(string ownerId)
        {
            try
            {
                var cars = await _carService.GetByOwnerIdAsync(ownerId);
                return Ok(cars);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cars for owner {OwnerId}", ownerId);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CarDto carDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var result = await _carService.CreateAsync(carDto);
                return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating car");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CarDto carDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                if (id != carDto.Id)
                    return BadRequest(new { message = "ID mismatch" });

                var result = await _carService.UpdateAsync(id, carDto);
                if (result == null)
                    return NotFound(new { message = "Car not found" });

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating car with ID {CarId}", id);
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var result = await _carService.DeleteAsync(id);
                if (!result)
                    return NotFound(new { message = "Car not found" });

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting car with ID {CarId}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }
    }
}