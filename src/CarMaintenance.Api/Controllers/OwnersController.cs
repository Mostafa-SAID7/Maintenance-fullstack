using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CarMaintenance.Application.Services;
using CarMaintenance.Shared.DTOs.Owners;

namespace CarMaintenance.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class OwnersController : ControllerBase
    {
        private readonly IOwnerService _ownerService;

        public OwnersController(IOwnerService ownerService)
        {
            _ownerService = ownerService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var owners = await _ownerService.GetAllAsync();
            return Ok(owners);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var owner = await _ownerService.GetByIdAsync(id);
            if (owner == null)
                return NotFound();

            return Ok(owner);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] OwnerDto ownerDto)
        {
            var result = await _ownerService.CreateAsync(ownerDto);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] OwnerDto ownerDto)
        {
            var result = await _ownerService.UpdateAsync(id, ownerDto);
            if (result == null)
                return NotFound();

            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _ownerService.DeleteAsync(id);
            if (!result)
                return NotFound();

            return NoContent();
        }
    }
}