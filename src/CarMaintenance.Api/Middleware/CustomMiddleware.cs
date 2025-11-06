using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Diagnostics;
using System.Text.Json;

namespace CarMaintenance.Api.Middleware
{
    public class RequestLoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RequestLoggingMiddleware> _logger;
        private readonly Stopwatch _stopwatch;

        public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
            _stopwatch = new Stopwatch();
        }

        public async Task InvokeAsync(HttpContext context)
        {
            _stopwatch.Start();

            // Log request
            var requestId = Guid.NewGuid().ToString();
            context.Items["RequestId"] = requestId;

            _logger.LogInformation(
                "Handling request {RequestId}: {Method} {Path} {QueryString}",
                requestId,
                context.Request.Method,
                context.Request.Path,
                context.Request.QueryString);

            try
            {
                await _next(context);
            }
            finally
            {
                _stopwatch.Stop();

                // Log response
                _logger.LogInformation(
                    "Finished handling request {RequestId}: {Method} {Path} - {StatusCode} ({Duration}ms)",
                    requestId,
                    context.Request.Method,
                    context.Request.Path,
                    context.Response.StatusCode,
                    _stopwatch.ElapsedMilliseconds);
            }
        }
    }

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

            try
            {
                await _next(context);
            }
            finally
            {
                stopwatch.Stop();

                if (stopwatch.ElapsedMilliseconds > _slowRequestThresholdMs)
                {
                    _logger.LogWarning(
                        "Slow request detected: {Method} {Path} took {Duration}ms (threshold: {Threshold}ms)",
                        context.Request.Method,
                        context.Request.Path,
                        stopwatch.ElapsedMilliseconds,
                        _slowRequestThresholdMs);
                }
            }
        }
    }

    public class RequestSizeLimitingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RequestSizeLimitingMiddleware> _logger;
        private readonly long _maxRequestSize = 10 * 1024 * 1024; // 10MB

        public RequestSizeLimitingMiddleware(RequestDelegate next, ILogger<RequestSizeLimitingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            if (context.Request.ContentLength.HasValue && context.Request.ContentLength > _maxRequestSize)
            {
                _logger.LogWarning(
                    "Request too large: {ContentLength} bytes (max: {MaxSize} bytes)",
                    context.Request.ContentLength,
                    _maxRequestSize);

                context.Response.StatusCode = 413; // Payload Too Large
                await context.Response.WriteAsync("Request payload too large");
                return;
            }

            await _next(context);
        }
    }

    public class RequestValidationMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RequestValidationMiddleware> _logger;

        public RequestValidationMiddleware(RequestDelegate next, ILogger<RequestValidationMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Validate Content-Type for POST/PUT requests
            if ((context.Request.Method == "POST" || context.Request.Method == "PUT") && 
                context.Request.HasFormContentType == false &&
                !context.Request.Headers.ContainsKey("Content-Type"))
            {
                _logger.LogWarning("Missing Content-Type header for {Method} request", context.Request.Method);
                context.Response.StatusCode = 400;
                await context.Response.WriteAsync("Content-Type header is required");
                return;
            }

            // Validate Content-Type for JSON requests
            if (context.Request.Headers.TryGetValue("Content-Type", out var contentType) &&
                contentType.ToString().Contains("application/json"))
            {
                // Additional JSON validation could be added here
            }

            await _next(context);
        }
    }

    public class SecurityHeadersMiddleware
    {
        private readonly RequestDelegate _next;

        public SecurityHeadersMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Add security headers
            context.Response.Headers.Add("X-Content-Type-Options", "nosniff");
            context.Response.Headers.Add("X-Frame-Options", "DENY");
            context.Response.Headers.Add("X-XSS-Protection", "1; mode=block");
            context.Response.Headers.Add("Referrer-Policy", "strict-origin-when-cross-origin");
            context.Response.Headers.Add("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

            // Add CORS headers if needed
            if (context.Request.Headers.ContainsKey("Origin"))
            {
                context.Response.Headers.Add("Access-Control-Allow-Origin", "*");
                context.Response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
                context.Response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization");
            }

            await _next(context);
        }
    }
}