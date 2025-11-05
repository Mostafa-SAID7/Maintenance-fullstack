using AutoMapper;
using CarMaintenance.Api.Models;
using CarMaintenance.Shared.DTOs.Cars;
using CarMaintenance.Shared.DTOs.Owners;
using CarMaintenance.Shared.DTOs.MaintenanceRecords;
using CarMaintenance.Shared.DTOs.ServiceTypes;
using CarMaintenance.Shared.DTOs.Notifications;
using CarMaintenance.Shared.DTOs.Chat;

namespace CarMaintenance.Api.Profiles
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // Car mappings
            CreateMap<Car, CarDto>()
                .ForMember(dest => dest.OwnerName,
                    opt => opt.MapFrom(src => src.Owner != null ? $"{src.Owner.FirstName} {src.Owner.LastName}" : string.Empty));

            CreateMap<CarDto, Car>();

            // Owner mappings
            CreateMap<Owner, OwnerDto>()
                .ForMember(dest => dest.CarsCount,
                    opt => opt.MapFrom(src => src.Cars.Count));

            CreateMap<OwnerDto, Owner>();

            // Maintenance Record mappings
            CreateMap<MaintenanceRecord, MaintenanceRecordDto>()
                .ForMember(dest => dest.CarInfo,
                    opt => opt.MapFrom(src => src.Car != null ? $"{src.Car.Make} {src.Car.Model} ({src.Car.LicensePlate})" : string.Empty))
                .ForMember(dest => dest.ServiceTypeName,
                    opt => opt.MapFrom(src => src.ServiceType != null ? src.ServiceType.Name : string.Empty));

            CreateMap<MaintenanceRecordDto, MaintenanceRecord>();

            // Service Type mappings
            CreateMap<ServiceType, ServiceTypeDto>();
            CreateMap<ServiceTypeDto, ServiceType>();

            // Notification mappings
            CreateMap<Notification, NotificationDto>();
            CreateMap<NotificationDto, Notification>();

            // Chat Message mappings
            CreateMap<ChatMessage, ChatMessageDto>();
            CreateMap<ChatMessageDto, ChatMessage>();
        }
    }
}