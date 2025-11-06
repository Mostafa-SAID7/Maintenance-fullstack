using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using FluentAssertions;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using CarMaintenance.Api.Data;
using CarMaintenance.Api.Models;
using CarMaintenance.Api.DTOs;

namespace CarMaintenance.IntegrationTests.Controllers
{
    [TestFixture]
    public class AuthControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;
        private readonly HttpClient _client;
        private readonly AppDbContext _context;
        private const string BaseUrl = "/api/auth";

        public AuthControllerIntegrationTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Remove the existing AppDbContext registration
                    var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                    if (descriptor != null)
                    {
                        services.Remove(descriptor);
                    }

                    // Add a new in-memory database for testing
                    services.AddDbContext<AppDbContext>(options =>
                    {
                        options.UseInMemoryDatabase("TestDatabase");
                    });
                });
            });

            _client = _factory.CreateClient();
            var scope = _factory.Services.CreateScope();
            _context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            
            // Ensure database is created
            _context.Database.EnsureCreated();
        }

        [TearDown]
        public async Task Cleanup()
        {
            // Clean up test data after each test
            _context.Cars.RemoveRange(_context.Cars);
            _context.Owners.RemoveRange(_context.Owners);
            _context.Users.RemoveRange(_context.Users);
            await _context.SaveChangesAsync();
        }

        [Test]
        public async Task Register_ValidUser_ReturnsSuccess()
        {
            // Arrange
            var registerDto = new RegisterDto
            {
                Email = "test@example.com",
                Password = "TestPassword123!",
                FirstName = "John",
                LastName = "Doe"
            };

            var content = new StringContent(JsonSerializer.Serialize(registerDto), Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync($"{BaseUrl}/register", content);

            // Assert
            response.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
            
            var responseContent = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<ApiResponse<TokenDto>>(responseContent, new JsonSerializerOptions 
            { 
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase 
            });
            
            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            result.Message.Should().Be("User created successfully");
            result.Data.Should().NotBeNull();
            result.Data.Token.Should().NotBeNullOrEmpty();
        }

        [Test]
        public async Task Register_DuplicateEmail_ReturnsBadRequest()
        {
            // Arrange
            var registerDto = new RegisterDto
            {
                Email = "test@example.com",
                Password = "TestPassword123!",
                FirstName = "John",
                LastName = "Doe"
            };

            // First registration should succeed
            var firstContent = new StringContent(JsonSerializer.Serialize(registerDto), Encoding.UTF8, "application/json");
            await _client.PostAsync($"{BaseUrl}/register", firstContent);

            // Second registration with same email should fail
            var secondContent = new StringContent(JsonSerializer.Serialize(registerDto), Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync($"{BaseUrl}/register", secondContent);

            // Assert
            response.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);
        }

        [Test]
        public async Task Login_ValidCredentials_ReturnsSuccess()
        {
            // Arrange
            var registerDto = new RegisterDto
            {
                Email = "test@example.com",
                Password = "TestPassword123!",
                FirstName = "John",
                LastName = "Doe"
            };

            // First register the user
            var registerContent = new StringContent(JsonSerializer.Serialize(registerDto), Encoding.UTF8, "application/json");
            await _client.PostAsync($"{BaseUrl}/register", registerContent);

            // Now attempt login
            var loginDto = new LoginDto
            {
                Email = "test@example.com",
                Password = "TestPassword123!"
            };

            var content = new StringContent(JsonSerializer.Serialize(loginDto), Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync($"{BaseUrl}/login", content);

            // Assert
            response.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
            
            var responseContent = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<ApiResponse<TokenDto>>(responseContent, new JsonSerializerOptions 
            { 
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase 
            });
            
            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            result.Data.Should().NotBeNull();
            result.Data.Token.Should().NotBeNullOrEmpty();
        }

        [Test]
        public async Task Login_InvalidCredentials_ReturnsUnauthorized()
        {
            // Arrange
            var loginDto = new LoginDto
            {
                Email = "nonexistent@example.com",
                Password = "WrongPassword"
            };

            var content = new StringContent(JsonSerializer.Serialize(loginDto), Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync($"{BaseUrl}/login", content);

            // Assert
            response.StatusCode.Should().Be(System.Net.HttpStatusCode.Unauthorized);
            
            var responseContent = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<ApiResponse<TokenDto>>(responseContent, new JsonSerializerOptions 
            { 
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase 
            });
            
            result.Should().NotBeNull();
            result.Success.Should().BeFalse();
            result.Message.Should().Be("Invalid email or password");
        }

        [Test]
        public async Task Login_MissingRequiredFields_ReturnsBadRequest()
        {
            // Arrange
            var loginDto = new LoginDto
            {
                Email = "",  // Missing email
                Password = ""  // Missing password
            };

            var content = new StringContent(JsonSerializer.Serialize(loginDto), Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync($"{BaseUrl}/login", content);

            // Assert
            response.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);
        }

        [Test]
        public async Task Login_InvalidEmailFormat_ReturnsBadRequest()
        {
            // Arrange
            var loginDto = new LoginDto
            {
                Email = "invalid-email",  // Invalid email format
                Password = "TestPassword123!"
            };

            var content = new StringContent(JsonSerializer.Serialize(loginDto), Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync($"{BaseUrl}/login", content);

            // Assert
            response.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);
        }
    }
}