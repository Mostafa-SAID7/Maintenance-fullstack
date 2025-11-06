using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CarMaintenance.Api.Data;
using CarMaintenance.Domain.Entities;

namespace CarMaintenance.Api.Controllers;

/// <summary>
/// Health check controller for monitoring application status
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<HealthController> _logger;

    public HealthController(AppDbContext context, ILogger<HealthController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Basic health check endpoint
    /// </summary>
    /// <returns>Health status</returns>
    [HttpGet("basic")]
    public async Task<IActionResult> Basic()
    {
        return Ok(new
        {
            Status = "Healthy",
            Timestamp = DateTime.UtcNow,
            Application = "CarMaintenance API",
            Version = "2.0.0"
        });
    }

    /// <summary>
    /// Comprehensive health check including database
    /// </summary>
    /// <returns>Detailed health status</returns>
    [HttpGet("detailed")]
    public async Task<IActionResult> Detailed()
    {
        var startTime = DateTime.UtcNow;
        var checks = new Dictionary<string, object>();

        try
        {
            // Database connectivity check
            await _context.Database.CanConnectAsync();
            checks["database"] = new
            {
                Status = "Healthy",
                ResponseTime = "N/A"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database health check failed");
            checks["database"] = new
            {
                Status = "Unhealthy",
                Error = ex.Message
            };
        }

        var endTime = DateTime.UtcNow;
        var responseTime = endTime - startTime;

        return Ok(new
        {
            Status = "Healthy",
            Timestamp = DateTime.UtcNow,
            ResponseTime = responseTime.TotalMilliseconds,
            Checks = checks,
            Application = new
            {
                Name = "CarMaintenance API",
                Version = "2.0.0",
                Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Unknown"
            }
        });
    }

    /// <summary>
    /// Database health check specifically
    /// </summary>
    /// <returns>Database status</returns>
    [HttpGet("database")]
    public async Task<IActionResult> Database()
    {
        try
        {
            // Test database connectivity
            var canConnect = await _context.Database.CanConnectAsync();
            
            if (canConnect)
            {
                // Test basic query
                var serviceTypesCount = await _context.ServiceTypes.CountAsync();
                
                return Ok(new
                {
                    Status = "Healthy",
                    Database = "SQL Server",
                    ConnectionString = "Available",
                    ServiceTypesCount = serviceTypesCount,
                    Timestamp = DateTime.UtcNow
                });
            }
            else
            {
                return StatusCode(503, new
                {
                    Status = "Unhealthy",
                    Database = "SQL Server",
                    ConnectionString = "Unavailable",
                    Timestamp = DateTime.UtcNow
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database health check failed");
            return StatusCode(503, new
            {
                Status = "Unhealthy",
                Database = "SQL Server",
                Error = ex.Message,
                Timestamp = DateTime.UtcNow
            });
        }
    }
}