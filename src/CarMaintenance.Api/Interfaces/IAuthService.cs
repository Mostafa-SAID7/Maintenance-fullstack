using CarMaintenance.Api.DTOs;

namespace CarMaintenance.Api.Interfaces
{
    public interface IAuthService
    {
        Task<TokenDto?> LoginAsync(LoginDto loginDto);
        Task<TokenDto?> RegisterAsync(RegisterDto registerDto);
        Task<TokenDto?> RefreshTokenAsync(TokenDto tokenDto);
        Task<bool> LogoutAsync(string userId);
        Task<bool> ValidateTokenAsync(string token);
    }
}