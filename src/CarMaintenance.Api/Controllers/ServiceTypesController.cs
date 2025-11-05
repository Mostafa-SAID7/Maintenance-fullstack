using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CarMaintenance.Application.Services;
using CarMaintenance.Shared.DTOs.ServiceTypes;

namespace CarMaintenance.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ServiceTypesController : ControllerBase
    {
        private readonly IServiceTypeService _serviceTypeService;

        public ServiceTypesController(IServiceTypeService serviceTypeService)
        {
            _serviceTypeService = serviceTypeService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var serviceTypes = await _serviceTypeService.GetAllAsync();
            return Ok(serviceTypes);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var serviceType = await _serviceTypeService.GetByIdAsync(id);
            if (serviceType == null)
                return NotFound();

            return Ok(serviceType);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ServiceTypeDto serviceTypeDto)
        {
            var result = await _serviceTypeService.CreateAsync(serviceTypeDto);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ServiceTypeDto serviceTypeDto)
        {
            var result = await _serviceTypeService.UpdateAsync(id, serviceTypeDto);
            if (result == null)
                return NotFound();

            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _serviceTypeService.DeleteAsync(id);
            if (!result)
                return NotFound();

            return NoContent();
        }
    }
}