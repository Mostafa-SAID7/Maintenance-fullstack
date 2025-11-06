using Microsoft.AspNetCore.Http;
using System.Diagnostics;
using System.Text.Json;
using System.Threading.Tasks;

namespace CarMaintenance.Api.Middleware
{
    public class PerformanceMonitoringMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<PerformanceMonitoringMiddleware> _logger;
        private readonly long _slowRequestThresholdMs = 1000; // 1 second

        public PerformanceMonitoringMiddleware(RequestDelegate next, ILogger<PerformanceMonitoringMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var stopwatch = Stopwatch.StartNew();
            var startTime = DateTime.UtcNow;

            try
            {
                await _next(context);
            }
            finally
            {
                stopwatch.Stop();
                var duration = stopwatch.ElapsedMilliseconds;

                if (duration > _slowRequestThresholdMs)
                {
                    var performanceLog = new
                    {
                        Timestamp = startTime,
                        Duration = duration,
                        Threshold = _slowRequestThresholdMs,
                        Method = context.Request.Method,
                        Path = context.Request.Path,
                        StatusCode = context.Response.StatusCode,
                        IsSlow = true
                    };

                    _logger.LogWarning("Slow request detected: {Performance}", JsonSerializer.Serialize(performanceLog));
                }
                else
                {
                    // Log normal performance for monitoring
                    var performanceLog = new
                    {
                        Timestamp = startTime,
                        Duration = duration,
                        Method = context.Request.Method,
                        Path = context.Request.Path,
                        StatusCode = context.Response.StatusCode,
                        IsSlow = false
                    };

                    _logger.LogInformation("Request performance: {Performance}", JsonSerializer.Serialize(performanceLog));
                }
            }
        }
    }
}