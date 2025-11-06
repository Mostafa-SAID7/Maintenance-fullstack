using MediatR;
using Microsoft.Extensions.DependencyInjection;
using FluentValidation;
using CarMaintenance.Application.Behaviors;
using AutoMapper;

using System.Reflection;
using CarMaintenance.Application.DTOs;
using CarMaintenance.Domain.Entities;

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
        CreateMap<Car, CarDto>();
        CreateMap<CreateCarDto, Car>();
        CreateMap<UpdateCarDto, Car>();

        CreateMap<Owner, OwnerDto>();
        CreateMap<CreateOwnerDto, Owner>();
        CreateMap<UpdateOwnerDto, Owner>();

        CreateMap<MaintenanceRecord, MaintenanceRecordDto>();
        CreateMap<CreateMaintenanceRecordDto, MaintenanceRecord>();
        CreateMap<UpdateMaintenanceRecordDto, MaintenanceRecord>();

        CreateMap<ServiceType, ServiceTypeDto>();
        CreateMap<CreateServiceTypeDto, ServiceType>();
        CreateMap<UpdateServiceTypeDto, ServiceType>();

        CreateMap<Notification, NotificationDto>();
        CreateMap<CreateNotificationDto, Notification>();
        CreateMap<UpdateNotificationDto, Notification>();

        // PagedResult mapping
        CreateMap(typeof(PagedResult<>), typeof(PagedResult<>));
    }
}