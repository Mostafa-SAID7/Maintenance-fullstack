using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.OutputCaching;
using CarMaintenance.Api.Data;
using CarMaintenance.Api.Interfaces;
using CarMaintenance.Api.Services;
using CarMaintenance.Api.Hubs;
using CarMaintenance.Api.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using CarMaintenance.Api.Models;
using Microsoft.Extensions.Caching.StackExchangeRedis;
using Microsoft.Extensions.Caching.Memory;
using StackExchange.Redis;
using CarMaintenance.Application;
using CarMaintenance.Infrastructure;
using Serilog;
using Serilog.Events;

// Configure Serilog early
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/car-maintenance-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);

// Use Serilog for logging
builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddIdentity<AppUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;
    options.User.RequireUniqueEmail = true;
    options.SignIn.RequireConfirmedEmail = false;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.MaxFailedAccessAttempts = 5;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// JWT Authentication Configuration
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.SaveToken = true;
    options.RequireHttpsMetadata = false;
    options.TokenValidationParameters = new TokenValidationParameters()
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidAudience = builder.Configuration["JWT:ValidAudience"],
        ValidIssuer = builder.Configuration["JWT:ValidIssuer"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["JWT:Secret"])),
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true
    };
});

// Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("fixed", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.PermitLimit = 100;
    });

    options.AddFixedWindowLimiter("auth", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(5);
        opt.PermitLimit = 5;
    });

    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

// Output Caching (improves performance for GET requests)
builder.Services.AddOutputCache(options =>
{
    options.AddPolicy("default", builder =>
    {
        builder.Expire(TimeSpan.FromMinutes(5));
    });

    options.AddPolicy("long", builder =>
    {
        builder.Expire(TimeSpan.FromHours(1));
    });
});

// Memory Cache (distributed cache fallback)
builder.Services.AddMemoryCache();

// Redis Cache (if configured)
if (!string.IsNullOrEmpty(builder.Configuration.GetConnectionString("Redis")))
{
    builder.Services.AddStackExchangeRedisCache(options =>
    {
        options.Configuration = builder.Configuration.GetConnectionString("Redis");
        options.InstanceName = "CarMaintenanceCache";
    });
}

// Application Layer Configuration (CQRS, MediatR, AutoMapper, etc.)
builder.Services.AddApplication();

// Infrastructure Layer Configuration
builder.Services.AddInfrastructure(builder.Configuration);

// SignalR Configuration
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true;
    options.HandshakeTimeout = TimeSpan.FromSeconds(30);
    options.ClientTimeoutInterval = TimeSpan.FromMinutes(1);
    options.KeepAliveInterval = TimeSpan.FromMinutes(3);
});

// CORS Configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });

    options.AddPolicy("Development", builder =>
    {
        builder.WithOrigins("http://localhost:3000", "http://localhost:4200")
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials();
    });

    options.AddPolicy("Production", builder =>
    {
        builder.WithOrigins("https://yourdomain.com")
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials();
    });
});

// Controllers with JSON options
builder.Services.AddControllers(options =>
{
    options.ReturnHttpNotAcceptable = true;
    options.SuppressAsyncSuffixInActionNames = false;
})
.AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = null; // Keep property names as-is
    options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    options.JsonSerializerOptions.WriteIndented = false;
});

// API Versioning
builder.Services.AddApiVersioning(options =>
{
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.ReportApiVersions = true;
})
.AddApiVersioningExplorer();

// Health Checks
builder.Services.AddHealthChecks()
    .AddSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"), name: "Database")
    .AddRedis(builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379", name: "Redis")
    .AddCheck<ApplicationHealthCheck>("Application");

// Swagger/OpenAPI Configuration
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Car Maintenance API v1",
        Version = "v1",
        Description = "Comprehensive API for Car Maintenance Management System with predictive maintenance capabilities",
        Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name = "Car Maintenance API Support",
            Email = "support@carmaintenance.com",
            Url = new Uri("https://github.com/car-maintenance/api")
        },
        License = new Microsoft.OpenApi.Models.OpenApiLicense
        {
            Name = "MIT License",
            Url = new Uri("https://opensource.org/licenses/MIT")
        }
    });

    c.SwaggerDoc("v2", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Car Maintenance API v2",
        Version = "v2",
        Description = "Enhanced version with CQRS architecture and advanced features",
        Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name = "Car Maintenance API Support",
            Email = "support@carmaintenance.com"
        }
    });

    // Include XML comments
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }

    // Add JWT Authentication to Swagger
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below.",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    c.EnableAnnotations();
});

// AutoMapper (for backward compatibility, though we're using the new approach in Application layer)
builder.Services.AddAutoMapper(typeof(Program));

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Car Maintenance API v1");
        c.SwaggerEndpoint("/swagger/v2/swagger.json", "Car Maintenance API v2");
        c.RoutePrefix = string.Empty; // Serve Swagger UI at root
        c.DisplayRequestDuration();
        c.EnableTryItOutByDefault();
    });
}

// Security headers
app.UseSecurityHeaders();

// HTTPS redirection
app.UseHttpsRedirection();

// Custom Middleware Pipeline (order matters!)
app.UseMiddleware<RequestSizeLimitingMiddleware>();
app.UseMiddleware<RequestValidationMiddleware>();
app.UseMiddleware<RequestLoggingMiddleware>();
app.UseMiddleware<PerformanceMonitoringMiddleware>();

// CORS
app.UseCors(app.Environment.IsDevelopment() ? "Development" : "Production");

// Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

// Rate limiting
app.UseRateLimiter();

// Output caching
app.UseOutputCache();

// Map controllers and SignalR hubs
app.MapControllers();
app.MapHub<ChatHub>("/chatHub", options =>
{
    options.HandshakeTimeout = TimeSpan.FromSeconds(30);
    options.KeepAliveInterval = TimeSpan.FromMinutes(3);
});

// Health checks endpoint
app.MapHealthChecks("/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        var response = new
        {
            status = report.Status.ToString(),
            timestamp = DateTime.UtcNow,
            totalDuration = report.TotalDuration.ToString(),
            entries = report.Entries.ToDictionary(
                kvp => kvp.Key,
                kvp => new
                {
                    status = kvp.Value.Status.ToString(),
                    duration = kvp.Value.Duration.ToString(),
                    description = kvp.Value.Description,
                    data = kvp.Value.Data
                })
        };

        await context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(response, new System.Text.Json.JsonSerializerOptions
        {
            WriteIndented = true,
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        }));
    }
});

// Database initialization and seeding
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
    
    try
    {
        // Apply migrations
        await context.Database.MigrateAsync();
        
        Log.Information("Database migrations applied successfully");

        // Seed initial data
        await SeedData.SeedAsync(context, userManager);
        
        Log.Information("Database seeding completed");
    }
    catch (Exception ex)
    {
        Log.Error(ex, "An error occurred during database initialization");
        throw;
    }
}

// Enhanced error handling for development
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

// Start the application
try
{
    Log.Information("Starting Car Maintenance API v2.0");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

/// <summary>
/// Custom health check for the application
/// </summary>
public class ApplicationHealthCheck : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        // Add application-specific health checks here
        // For example, check if critical services are responding
        
        try
        {
            // Example: Check if a critical service is available
            await Task.Delay(100, cancellationToken); // Simulate some work
            
            return HealthCheckResult.Healthy("Application is running normally");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Application health check failed", ex);
        }
    }
}