using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace CarMaintenance.Api.Middleware
{
    public class RequestValidationMiddleware
    {
        private readonly RequestDelegate _next;

        public RequestValidationMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Validate Content-Type for POST/PUT/PATCH requests
            if (context.Request.Method == "POST" || context.Request.Method == "PUT" || context.Request.Method == "PATCH")
            {
                if (context.Request.HasFormContentType)
                {
                    // Allow form submissions
                }
                else if (context.Request.ContentType != null && 
                         !context.Request.ContentType.Contains("application/json"))
                {
                    context.Response.StatusCode = 415; // Unsupported Media Type
                    await context.Response.WriteAsync("Only application/json and application/x-www-form-urlencoded content types are supported.");
                    return;
                }
            }

            await _next(context);
        }
    }
}