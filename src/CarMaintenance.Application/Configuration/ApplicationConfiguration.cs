using MediatR;
using Microsoft.Extensions.DependencyInjection;
using FluentValidation;
using CarMaintenance.Application.Behaviors;
using AutoMapper;
using CarMaintenance.Application.Validators;
using System.Reflection;
using CarMaintenance.Application.DTOs;
using CarMaintenance.Domain.Entities;
using CarMaintenance.Application.Commands;
using CarMaintenance.Application.Queries;

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
        services.AddFluentValidationAutoValidation();
        services.AddFluentValidationClientsideAdapters();
        services.AddValidatorsFromAssemblyContaining<CreateCarDtoValidator>();
        services.AddValidatorsFromAssemblyContaining<CreateOwnerDtoValidator>();
        services.AddValidatorsFromAssemblyContaining<CreateMaintenanceRecordDtoValidator>();
        services.AddValidatorsFromAssemblyContaining<CreateServiceTypeDtoValidator>();

        // Add pipeline behaviors in order
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(PerformanceLoggingBehavior<,>));

        return services;
    }

    /// <summary>
    /// Add FluentValidation validators from assembly
    /// </summary>
    private static IServiceCollection AddValidatorsFromAssemblyContaining<T>(this IServiceCollection services)
    {
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());
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
        CreateMap<Car, CarDto>()
            .ForMember(dest => dest.Vin, opt => opt.MapFrom(src => src.Vin.Value))
            .ForMember(dest => dest.OwnerName, opt => opt.MapFrom(src => "")); // Will be filled by repository/service layer

        CreateMap<CreateCarDto, Car>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.Vin, opt => opt.MapFrom(src => CarMaintenance.Domain.ValueObjects.Vin.Create(src.Vin)))
            .ForMember(dest => dest.OwnerId, opt => opt.MapFrom(src => int.Parse(src.OwnerId)))
            .ForMember(dest => dest.IsActive, opt => opt.Ignore())
            .ForMember(dest => dest.LastMaintenanceDate, opt => opt.Ignore())
            .ForMember(dest => dest.ServiceTypeId, opt => opt.MapFrom(src => src.ServiceTypeId))
            .ForMember(dest => dest.ServiceType, opt => opt.Ignore())
            .ForMember(dest => dest.MaintenanceRecords, opt => opt.Ignore());

        CreateMap<UpdateCarDto, Car>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.Vin, opt => opt.MapFrom(src => CarMaintenance.Domain.ValueObjects.Vin.Create(src.Vin)))
            .ForMember(dest => dest.OwnerId, opt => opt.Ignore())
            .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => src.IsActive))
            .ForMember(dest => dest.LastMaintenanceDate, opt => opt.MapFrom(src => src.LastMaintenanceDate))
            .ForMember(dest => dest.ServiceTypeId, opt => opt.Ignore())
            .ForMember(dest => dest.ServiceType, opt => opt.Ignore())
            .ForMember(dest => dest.MaintenanceRecords, opt => opt.Ignore());

        CreateMap<Owner, OwnerDto>()
            .ForMember(dest => dest.Phone, opt => opt.MapFrom(src => src.Phone ?? ""));

        CreateMap<CreateOwnerDto, Owner>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.IsActive, opt => opt.Ignore())
            .ForMember(dest => dest.Cars, opt => opt.Ignore())
            .ForMember(dest => dest.Phone, opt => opt.MapFrom(src => src.Phone));

        CreateMap<UpdateOwnerDto, Owner>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => src.IsActive))
            .ForMember(dest => dest.Cars, opt => opt.Ignore());

        CreateMap<MaintenanceRecord, MaintenanceRecordDto>()
            .ForMember(dest => dest.CarMake, opt => opt.MapFrom(src => src.Car != null ? src.Car.Make : ""))
            .ForMember(dest => dest.CarModel, opt => opt.MapFrom(src => src.Car != null ? src.Car.Model : ""))
            .ForMember(dest => dest.CarLicensePlate, opt => opt.MapFrom(src => src.Car != null ? src.Car.LicensePlate ?? "" : ""))
            .ForMember(dest => dest.ServiceTypeName, opt => opt.MapFrom(src => src.ServiceType != null ? src.ServiceType.Name : ""));

        CreateMap<CreateMaintenanceRecordDto, MaintenanceRecord>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.ServiceDate, opt => opt.MapFrom(src => src.ServiceDate))
            .ForMember(dest => dest.Mileage, opt => opt.MapFrom(src => src.Mileage))
            .ForMember(dest => dest.Cost, opt => opt.MapFrom(src => src.Cost))
            .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Description))
            .ForMember(dest => dest.Notes, opt => opt.MapFrom(src => src.Notes))
            .ForMember(dest => dest.ServiceProvider, opt => opt.Ignore())
            .ForMember(dest => dest.Location, opt => opt.Ignore())
            .ForMember(dest => dest.IsCompleted, opt => opt.Ignore())
            .ForMember(dest => dest.NextServiceDueDate, opt => opt.Ignore())
            .ForMember(dest => dest.NextServiceDueMileage, opt => opt.Ignore())
            .ForMember(dest => dest.Car, opt => opt.Ignore())
            .ForMember(dest => dest.ServiceType, opt => opt.Ignore());

        CreateMap<UpdateMaintenanceRecordDto, MaintenanceRecord>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.ServiceDate, opt => opt.MapFrom(src => src.ServiceDate))
            .ForMember(dest => dest.Mileage, opt => opt.MapFrom(src => src.Mileage))
            .ForMember(dest => dest.Cost, opt => opt.MapFrom(src => src.Cost))
            .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Description))
            .ForMember(dest => dest.Notes, opt => opt.MapFrom(src => src.Notes))
            .ForMember(dest => dest.ServiceProvider, opt => opt.Ignore())
            .ForMember(dest => dest.Location, opt => opt.Ignore())
            .ForMember(dest => dest.IsCompleted, opt => opt.Ignore())
            .ForMember(dest => dest.NextServiceDueDate, opt => opt.Ignore())
            .ForMember(dest => dest.NextServiceDueMileage, opt => opt.Ignore())
            .ForMember(dest => dest.Car, opt => opt.Ignore())
            .ForMember(dest => dest.ServiceType, opt => opt.Ignore());

        CreateMap<ServiceType, ServiceTypeDto>()
            .ForMember(dest => dest.BaseCost, opt => opt.MapFrom(src => src.AverageCost))
            .ForMember(dest => dest.EstimatedDurationMinutes, opt => opt.MapFrom(src => src.RecommendedIntervalMonths * 30 * 24 * 60)); // Convert months to minutes

        CreateMap<CreateServiceTypeDto, ServiceType>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.AverageCost, opt => opt.MapFrom(src => src.BaseCost))
            .ForMember(dest => dest.RecommendedIntervalMonths, opt => opt.MapFrom(src => src.EstimatedDurationMinutes / (30 * 24 * 60))) // Convert minutes to months
            .ForMember(dest => dest.IsActive, opt => opt.Ignore())
            .ForMember(dest => dest.Cars, opt => opt.Ignore())
            .ForMember(dest => dest.MaintenanceRecords, opt => opt.Ignore());

        CreateMap<UpdateServiceTypeDto, ServiceType>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.AverageCost, opt => opt.MapFrom(src => src.BaseCost))
            .ForMember(dest => dest.RecommendedIntervalMonths, opt => opt.MapFrom(src => src.EstimatedDurationMinutes / (30 * 24 * 60)))
            .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => src.IsActive))
            .ForMember(dest => dest.Cars, opt => opt.Ignore())
            .ForMember(dest => dest.MaintenanceRecords, opt => opt.Ignore());

        CreateMap<Notification, NotificationDto>();
        CreateMap<CreateNotificationDto, Notification>();
        CreateMap<UpdateNotificationDto, Notification>();

        // PagedResult mapping
        CreateMap(typeof(PagedResult<>), typeof(PagedResult<>));
    }
}