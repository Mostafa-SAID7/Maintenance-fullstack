using Moq;
using Microsoft.AspNetCore.Identity;
using FluentAssertions;
using CarMaintenance.Api.Services;
using CarMaintenance.Api.DTOs;
using CarMaintenance.Api.Models;
using CarMaintenance.Api.Interfaces;

namespace CarMaintenance.UnitTests.Services
{
    public class AuthServiceTests
    {
        private readonly Mock<UserManager<AppUser>> _mockUserManager;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly Mock<IRepository<Car>> _mockCarRepository;
        private readonly AuthService _authService;

        public AuthServiceTests()
        {
            _mockUserManager = new Mock<UserManager<AppUser>>(
                Mock.Of<Microsoft.AspNetCore.Identity.IUserStore<AppUser>>(),
                null, null, null, null, null, null, null, null);
            _mockConfiguration = new Mock<IConfiguration>();
            _mockCarRepository = new Mock<IRepository<Car>>();
            
            _authService = new AuthService(_mockUserManager.Object, _mockConfiguration.Object, _mockCarRepository.Object);
        }

        [Test]
        public async Task Login_ValidCredentials_ReturnsSuccess()
        {
            // Arrange
            var loginDto = new LoginDto { Email = "test@example.com", Password = "Password123!" };
            var user = new AppUser 
            { 
                Id = "1", 
                Email = "test@example.com", 
                UserName = "test@example.com",
                OwnerId = 1 
            };

            _mockUserManager.Setup(x => x.FindByEmailAsync(loginDto.Email)).ReturnsAsync(user);
            _mockUserManager.Setup(x => x.CheckPasswordAsync(user, loginDto.Password)).ReturnsAsync(true);
            _mockUserManager.Setup(x => x.GetRolesAsync(user)).ReturnsAsync(new List<string> { "User" });

            var jwtSettings = new Dictionary<string, string>
            {
                { "JWT:Secret", "ThisIsASecretKeyForJwtTokenGeneration" },
                { "JWT:ValidIssuer", "CarMaintenanceAPI" },
                { "JWT:ValidAudience", "CarMaintenanceAPI" }
            };
            _mockConfiguration.Setup(x => x.GetSection("JWT")).Returns(new Mock<IConfigurationSection>().Object);
            _mockConfiguration.Setup(x => x["JWT:Secret"]).Returns("ThisIsASecretKeyForJwtTokenGeneration");
            _mockConfiguration.Setup(x => x["JWT:ValidIssuer"]).Returns("CarMaintenanceAPI");
            _mockConfiguration.Setup(x => x["JWT:ValidAudience"]).Returns("CarMaintenanceAPI");

            // Act
            var result = await _authService.Login(loginDto);

            // Assert
            result.Success.Should().BeTrue();
            result.Token.Should().NotBeNullOrEmpty();
            result.Email.Should().Be(user.Email);
        }

        [Test]
        public async Task Login_InvalidCredentials_ReturnsFailure()
        {
            // Arrange
            var loginDto = new LoginDto { Email = "test@example.com", Password = "WrongPassword" };

            _mockUserManager.Setup(x => x.FindByEmailAsync(loginDto.Email)).ReturnsAsync((AppUser)null);

            // Act
            var result = await _authService.Login(loginDto);

            // Assert
            result.Success.Should().BeFalse();
            result.Message.Should().Be("User not found");
        }

        [Test]
        public async Task Register_ValidData_ReturnsSuccess()
        {
            // Arrange
            var registerDto = new RegisterDto 
            { 
                Email = "newuser@example.com", 
                Password = "Password123!",
                FirstName = "John",
                LastName = "Doe"
            };

            var owner = new Owner { Id = 1, Email = "newuser@example.com" };
            var user = new AppUser 
            { 
                Id = "1", 
                Email = registerDto.Email, 
                UserName = registerDto.Email,
                FirstName = registerDto.FirstName,
                LastName = registerDto.LastName,
                OwnerId = owner.Id
            };

            _mockUserManager.Setup(x => x.CreateAsync(It.IsAny<AppUser>(), registerDto.Password))
                .ReturnsAsync(IdentityResult.Success);
            _mockUserManager.Setup(x => x.AddToRoleAsync(It.IsAny<AppUser>(), "User"))
                .ReturnsAsync(IdentityResult.Success);

            // Act
            var result = await _authService.Register(registerDto);

            // Assert
            result.Success.Should().BeTrue();
            result.Message.Should().Be("User created successfully");
        }

        [Test]
        public async Task RefreshToken_ValidToken_ReturnsNewToken()
        {
            // Arrange
            var user = new AppUser 
            { 
                Id = "1", 
                Email = "test@example.com", 
                UserName = "test@example.com" 
            };

            _mockUserManager.Setup(x => x.FindByIdAsync("1")).ReturnsAsync(user);
            _mockUserManager.Setup(x => x.GetRolesAsync(user)).ReturnsAsync(new List<string> { "User" });

            var jwtSettings = new Dictionary<string, string>
            {
                { "JWT:Secret", "ThisIsASecretKeyForJwtTokenGeneration" },
                { "JWT:ValidIssuer", "CarMaintenanceAPI" },
                { "JWT:ValidAudience", "CarMaintenanceAPI" }
            };
            _mockConfiguration.Setup(x => x["JWT:Secret"]).Returns("ThisIsASecretKeyForJwtTokenGeneration");
            _mockConfiguration.Setup(x => x["JWT:ValidIssuer"]).Returns("CarMaintenanceAPI");
            _mockConfiguration.Setup(x => x["JWT:ValidAudience"]).Returns("CarMaintenanceAPI");

            // Act
            var result = await _authService.RefreshToken("1", "dummy_refresh_token");

            // Assert
            result.Success.Should().BeTrue();
            result.Token.Should().NotBeNullOrEmpty();
        }
    }
}