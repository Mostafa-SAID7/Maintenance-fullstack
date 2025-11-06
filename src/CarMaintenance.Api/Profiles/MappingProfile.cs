using AutoMapper;
using CarMaintenance.Api.DTOs;
using CarMaintenance.Api.Models;

namespace CarMaintenance.Api.Profiles
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // Car Mappings
            CreateMap<Car, CarDto>()
                .ForMember(dest => dest.OwnerName, opt => opt.MapFrom(src => src.Owner != null ? src.Owner.UserName : "Unknown"));

            CreateMap<CarDto, Car>()
                .ForMember(dest => dest.Owner, opt => opt.Ignore())
                .ForMember(dest => dest.MaintenanceRecords, opt => opt.Ignore());

            // Maintenance Record Mappings
            CreateMap<MaintenanceRecord, MaintenanceRecordDto>()
                .ForMember(dest => dest.ServiceTypeName, opt => opt.MapFrom(src => src.ServiceType != null ? src.ServiceType.Name : "Unknown"));

            CreateMap<MaintenanceRecordDto, MaintenanceRecord>()
                .ForMember(dest => dest.Car, opt => opt.Ignore())
                .ForMember(dest => dest.ServiceType, opt => opt.Ignore());

            // Owner Mappings
            CreateMap<Owner, OwnerDto>()
                .ForMember(dest => dest.TotalCars, opt => opt.MapFrom(src => src.Cars != null ? src.Cars.Count : 0))
                .ForMember(dest => dest.TotalMaintenanceCost, opt => opt.MapFrom(src => 
                    src.Cars != null ? src.Cars.SelectMany(c => c.MaintenanceRecords).Sum(m => m.Cost) : 0));

            CreateMap<OwnerDto, Owner>()
                .ForMember(dest => dest.Cars, opt => opt.Ignore());

            // Service Type Mappings
            CreateMap<ServiceType, ServiceTypeDto>();

            CreateMap<ServiceTypeDto, ServiceType>();

            // Notification Mappings
            CreateMap<Notification, NotificationDto>();

            CreateMap<NotificationDto, Notification>();

            // Chat Message Mappings
            CreateMap<ChatMessage, ChatMessageDto>()
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User != null ? src.User.UserName : "Unknown"));

            CreateMap<ChatMessageDto, ChatMessage>()
                .ForMember(dest => dest.User, opt => opt.Ignore());

            // Authentication DTOs
            CreateMap<LoginDto, object>().ConvertUsing((src, dest, context) => new { src.Email, src.Password });
            
            CreateMap<RegisterDto, object>().ConvertUsing((src, dest, context) => new 
            { 
                src.FirstName, 
                src.LastName, 
                src.Email, 
                src.Password 
            });

            // Token DTO
            CreateMap<object, TokenDto>().ConvertUsing((src, dest, context) => 
            {
                // This would be populated by the AuthService
                return new TokenDto();
            });

            // Predictive Maintenance Mappings
            CreateMap<PredictionResultDto, object>().ConvertUsing((src, dest, context) => src);
            CreateMap<PredictiveAnalyticsDto, object>().ConvertUsing((src, dest, context) => src);
            CreateMap<PredictionDetail, object>().ConvertUsing((src, dest, context) => src);

            // User Mappings (for internal use)
            CreateMap<AppUser, object>().ConvertUsing((src, dest, context) => new
            {
                src.Id,
                src.FirstName,
                src.LastName,
                src.Email,
                src.UserName,
                src.CreatedAt,
                src.LastLoginAt
            });
        }
    }
}