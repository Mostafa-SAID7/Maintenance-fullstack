using MediatR;
using Microsoft.Extensions.DependencyInjection;
using FluentValidation;
using CarMaintenance.Application.Behaviors;
using AutoMapper;
using System.Reflection;

namespace CarMaintenance.Application.Configuration;

/// <summary>
/// Application layer configuration with CQRS, MediatR, AutoMapper, and validation setup
/// </summary>
public static class ApplicationConfiguration
{
    /// <summary>
    /// Configure application services
    /// </summary>
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // AutoMapper configuration
        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile(new CarMaintenanceProfile());
        });

        mapperConfig.AssertConfigurationIsValid();
        services.AddSingleton(mapperConfig.CreateMapper());

        // MediatR configuration
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly()));

        // FluentValidation configuration
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());

        // Add pipeline behaviors
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(PerformanceBehavior<,>));

        return services;
    }

    /// <summary>
    /// Add FluentValidation validators from assembly
    /// </summary>
    private static IServiceCollection AddValidatorsFromAssembly(this IServiceCollection services, Assembly assembly)
    {
        services.AddValidatorsFromAssembly(assembly);
        return services;
    }
}

/// <summary>
/// AutoMapper profile for mapping between domain entities and DTOs
/// </summary>
public class CarMaintenanceProfile : Profile
{
    public CarMaintenanceProfile()
    {
        CreateMap<Domain.Entities.Car, DTOs.CarDto>();
        CreateMap<DTOs.CreateCarDto, Domain.Entities.Car>();
        CreateMap<DTOs.UpdateCarDto, Domain.Entities.Car>();

        CreateMap<Domain.Entities.Owner, DTOs.OwnerDto>();
        CreateMap<DTOs.CreateOwnerDto, Domain.Entities.Owner>();
        CreateMap<DTOs.UpdateOwnerDto, Domain.Entities.Owner>();

        CreateMap<Domain.Entities.MaintenanceRecord, DTOs.MaintenanceRecordDto>();
        CreateMap<DTOs.CreateMaintenanceRecordDto, Domain.Entities.MaintenanceRecord>();
        CreateMap<DTOs.UpdateMaintenanceRecordDto, Domain.Entities.MaintenanceRecord>();

        CreateMap<Domain.Entities.ServiceType, DTOs.ServiceTypeDto>();
        CreateMap<DTOs.CreateServiceTypeDto, Domain.Entities.ServiceType>();
        CreateMap<DTOs.UpdateServiceTypeDto, Domain.Entities.ServiceType>();

        CreateMap<Domain.Entities.Notification, DTOs.NotificationDto>();
        CreateMap<DTOs.CreateNotificationDto, Domain.Entities.Notification>();
        CreateMap<DTOs.UpdateNotificationDto, Domain.Entities.Notification>();

        // PagedResult mapping
        CreateMap(typeof(DTOs.PagedResult<>), typeof(DTOs.PagedResult<>));
    }
}