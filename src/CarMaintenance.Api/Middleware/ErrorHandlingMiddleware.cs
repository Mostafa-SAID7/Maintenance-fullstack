using Microsoft.AspNetCore.Http;
using System.Net;
using System.Text.Json;
using CarMaintenance.Api.DTOs;

namespace CarMaintenance.Api.Middleware
{
    public class ErrorHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ErrorHandlingMiddleware> _logger;
        private readonly IWebHostEnvironment _environment;

        public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger, IWebHostEnvironment environment)
        {
            _next = next;
            _logger = logger;
            _environment = environment;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unhandled exception occurred");
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            var response = context.Response;
            response.ContentType = "application/json";

            var errorResponse = CreateErrorResponse(exception);
            
            response.StatusCode = errorResponse.StatusCode;

            var jsonResponse = JsonSerializer.Serialize(errorResponse.Body, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            await response.WriteAsync(jsonResponse);
        }

        private ErrorResponse CreateErrorResponse(Exception exception)
        {
            return exception switch
            {
                ArgumentException => new ErrorResponse
                {
                    StatusCode = (int)HttpStatusCode.BadRequest,
                    Message = "Invalid request parameters",
                    Details = exception.Message,
                    Timestamp = DateTime.UtcNow
                },
                UnauthorizedAccessException => new ErrorResponse
                {
                    StatusCode = (int)HttpStatusCode.Unauthorized,
                    Message = "Unauthorized access",
                    Details = exception.Message,
                    Timestamp = DateTime.UtcNow
                },
                KeyNotFoundException => new ErrorResponse
                {
                    StatusCode = (int)HttpStatusCode.NotFound,
                    Message = "Resource not found",
                    Details = exception.Message,
                    Timestamp = DateTime.UtcNow
                },
                InvalidOperationException => new ErrorResponse
                {
                    StatusCode = (int)HttpStatusCode.Conflict,
                    Message = "Operation cannot be completed",
                    Details = exception.Message,
                    Timestamp = DateTime.UtcNow
                },
                TimeoutException => new ErrorResponse
                {
                    StatusCode = (int)HttpStatusCode.RequestTimeout,
                    Message = "Request timed out",
                    Details = "The operation took too long to complete",
                    Timestamp = DateTime.UtcNow
                },
                _ => new ErrorResponse
                {
                    StatusCode = (int)HttpStatusCode.InternalServerError,
                    Message = _environment.IsDevelopment() ? "Internal server error" : "An error occurred processing your request",
                    Details = _environment.IsDevelopment() ? exception.ToString() : "Please try again later",
                    Timestamp = DateTime.UtcNow
                }
            };
        }
    }

    public class ErrorResponse
    {
        public int StatusCode { get; set; }
        public string Message { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string? TraceId { get; set; }
        
        public object Body => new
        {
            statusCode = StatusCode,
            message = Message,
            details = Details,
            timestamp = Timestamp,
            traceId = TraceId
        };
    }
}