using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace CarMaintenance.Api.Middleware
{
    public class RequestSizeLimitingMiddleware
    {
        private readonly RequestDelegate _next;
        private const int MaxRequestSizeInBytes = 10 * 1024 * 1024; // 10MB

        public RequestSizeLimitingMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var contentLength = context.Request.ContentLength;
            
            if (contentLength.HasValue && contentLength.Value > MaxRequestSizeInBytes)
            {
                context.Response.StatusCode = 413; // Payload Too Large
                await context.Response.WriteAsync("Request payload is too large. Maximum allowed size is 10MB.");
                return;
            }

            await _next(context);
        }
    }
}