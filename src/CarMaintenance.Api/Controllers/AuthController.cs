using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CarMaintenance.Api.DTOs;
using CarMaintenance.Domain.Entities;
using CarMaintenance.Application.Commands.Cars;
using MediatR;
using CarMaintenance.Shared.Models;

namespace CarMaintenance.Api.Controllers;

/// <summary>
/// Enhanced authentication controller with modern .NET patterns
/// Supports JWT authentication, refresh tokens, rate limiting, and comprehensive validation
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/auth")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly UserManager<AppUser> _userManager;
    private readonly SignInManager<AppUser> _signInManager;
    private readonly ILogger<AuthController> _logger;
    private readonly IMediator _mediator;
    private readonly ICacheService _cacheService;

    public AuthController(
        IConfiguration configuration,
        UserManager<AppUser> userManager,
        SignInManager<AppUser> signInManager,
        ILogger<AuthController> logger,
        IMediator mediator,
        ICacheService cacheService)
    {
        _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        _userManager = userManager ?? throw new ArgumentNullException(nameof(userManager));
        _signInManager = signInManager ?? throw new ArgumentNullException(nameof(signInManager));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
        _cacheService = cacheService ?? throw new ArgumentNullException(nameof(cacheService));
    }

    /// <summary>
    /// User registration with comprehensive validation
    /// </summary>
    /// <param name="request">Registration request containing user details</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Registration result with user information and tokens</returns>
    [HttpPost("register")]
    [RateLimiting("fixed")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<RegisterDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Register([FromBody] RegisterDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("User registration attempt for email: {Email}", request.Email);

            // Validate request using our validation system
            var validationResult = new RegisterDtoValidation().Validate(request);
            if (!validationResult.IsValid)
            {
                return BadRequest(ApiResponse<object>.Failure(validationResult.GetErrorMessage()));
            }

            // Check if user already exists
            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
            {
                _logger.LogWarning("Registration attempt for existing email: {Email}", request.Email);
                return BadRequest(ApiResponse<object>.Failure("User with this email already exists"));
            }

            // Create new user
            var user = new AppUser
            {
                Id = Guid.NewGuid().ToString(),
                UserName = request.Email,
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                PhoneNumber = request.PhoneNumber,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            
            if (!result.Succeeded)
            {
                _logger.LogError("User creation failed: {Errors}", string.Join(", ", result.Errors.Select(e => e.Description)));
                return BadRequest(ApiResponse<object>.Failure("User creation failed", result.Errors.Select(e => e.Description)));
            }

            // Add user to default role
            await _userManager.AddToRoleAsync(user, "User");

            // Generate JWT token
            var token = await GenerateJwtTokenAsync(user);

            // Create response
            var response = new RegisterDto
            {
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneNumber = user.PhoneNumber,
                Token = token
            };

            _logger.LogInformation("User registered successfully: {Email}", user.Email);

            return CreatedAtAction(nameof(GetProfile), new { id = user.Id }, ApiResponse<RegisterDto>.Success(response, "User registered successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during user registration for email: {Email}", request.Email);
            return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse<object>.Failure("Registration failed"));
        }
    }

    /// <summary>
    /// User login with rate limiting and security checks
    /// </summary>
    /// <param name="request">Login request containing credentials</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Login result with access and refresh tokens</returns>
    [HttpPost("login")]
    [RateLimiting("auth")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<TokenDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Login([FromBody] LoginDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Login attempt for email: {Email}", request.Email);

            // Validate request
            var validationResult = new LoginDtoValidation().Validate(request);
            if (!validationResult.IsValid)
            {
                return BadRequest(ApiResponse<object>.Failure(validationResult.GetErrorMessage()));
            }

            // Find user
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null || !await _userManager.CheckPasswordAsync(user, request.Password))
            {
                _logger.LogWarning("Invalid login attempt for email: {Email}", request.Email);
                return Unauthorized(ApiResponse<object>.Failure("Invalid credentials"));
            }

            // Check if user is active
            if (!user.IsActive)
            {
                _logger.LogWarning("Login attempt for inactive user: {Email}", request.Email);
                return Unauthorized(ApiResponse<object>.Failure("Account is deactivated"));
            }

            // Generate tokens
            var accessToken = await GenerateJwtTokenAsync(user);
            var refreshToken = await GenerateRefreshTokenAsync(user.Id);

            // Update last login
            user.LastLoginAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            // Cache user session
            await CacheUserSessionAsync(user.Id, accessToken, refreshToken);

            var tokenDto = new TokenDto
            {
                Token = accessToken,
                RefreshToken = refreshToken,
                Email = user.Email,
                ExpiresAt = DateTime.UtcNow.AddHours(24), // Token expires in 24 hours
                UserId = user.Id
            };

            _logger.LogInformation("User logged in successfully: {Email}", user.Email);

            return Ok(ApiResponse<TokenDto>.Success(tokenDto, "Login successful"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for email: {Email}", request.Email);
            return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse<object>.Failure("Login failed"));
        }
    }

    /// <summary>
    /// Refresh access token using refresh token
    /// </summary>
    /// <param name="request">Refresh token request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>New access token</returns>
    [HttpPost("refresh-token")]
    [RateLimiting("auth")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<TokenDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Token refresh attempt");

            // Validate refresh token
            var userId = await ValidateRefreshTokenAsync(request.RefreshToken);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ApiResponse<object>.Failure("Invalid refresh token"));
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null || !user.IsActive)
            {
                return Unauthorized(ApiResponse<object>.Failure("Invalid refresh token"));
            }

            // Generate new tokens
            var accessToken = await GenerateJwtTokenAsync(user);
            var refreshToken = await GenerateRefreshTokenAsync(user.Id);

            // Update cache
            await CacheUserSessionAsync(user.Id, accessToken, refreshToken);

            var tokenDto = new TokenDto
            {
                Token = accessToken,
                RefreshToken = refreshToken,
                Email = user.Email,
                ExpiresAt = DateTime.UtcNow.AddHours(24),
                UserId = user.Id
            };

            _logger.LogInformation("Token refreshed successfully for user: {Email}", user.Email);

            return Ok(ApiResponse<TokenDto>.Success(tokenDto, "Token refreshed successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token refresh");
            return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse<object>.Failure("Token refresh failed"));
        }
    }

    /// <summary>
    /// Logout and invalidate user session
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Logout result</returns>
    [HttpPost("logout")]
    [Authorize]
    [RateLimiting("fixed")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ApiResponse<object>.Failure("Invalid token"));
            }

            // Remove from cache
            await _cacheService.RemoveAsync($"user_session_{userId}", cancellationToken);

            _logger.LogInformation("User logged out successfully: {UserId}", userId);

            return Ok(ApiResponse<object>.Success(null, "Logged out successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during logout");
            return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse<object>.Failure("Logout failed"));
        }
    }

    /// <summary>
    /// Get current user profile
    /// </summary>
    /// <param name="id">User ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>User profile information</returns>
    [HttpGet("profile/{id}")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<RegisterDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetProfile(string id, CancellationToken cancellationToken = default)
    {
        try
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (currentUserId != id)
            {
                return Forbid("You can only access your own profile");
            }

            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return NotFound(ApiResponse<object>.Failure("User not found"));
            }

            var profile = new RegisterDto
            {
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneNumber = user.PhoneNumber
            };

            return Ok(ApiResponse<RegisterDto>.Success(profile));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user profile for ID: {UserId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse<object>.Failure("Failed to get profile"));
        }
    }

    /// <summary>
    /// Update user profile
    /// </summary>
    /// <param name="id">User ID</param>
    /// <param name="request">Updated profile information</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated profile result</returns>
    [HttpPut("profile/{id}")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<RegisterDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateProfile(string id, [FromBody] RegisterDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (currentUserId != id)
            {
                return Forbid("You can only update your own profile");
            }

            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return NotFound(ApiResponse<object>.Failure("User not found"));
            }

            // Validate request
            var validationResult = new UpdateProfileDtoValidation().Validate(request);
            if (!validationResult.IsValid)
            {
                return BadRequest(ApiResponse<object>.Failure(validationResult.GetErrorMessage()));
            }

            // Update user
            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.PhoneNumber = request.PhoneNumber;
            user.UpdatedAt = DateTime.UtcNow;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                return BadRequest(ApiResponse<object>.Failure("Failed to update profile", result.Errors.Select(e => e.Description)));
            }

            var profile = new RegisterDto
            {
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneNumber = user.PhoneNumber
            };

            _logger.LogInformation("User profile updated successfully: {UserId}", id);

            return Ok(ApiResponse<RegisterDto>.Success(profile, "Profile updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user profile for ID: {UserId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse<object>.Failure("Failed to update profile"));
        }
    }

    #region Private Methods

    /// <summary>
    /// Generates JWT access token for user
    /// </summary>
    /// <param name="user">The user to generate token for</param>
    /// <returns>JWT access token</returns>
    private async Task<string> GenerateJwtTokenAsync(AppUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Name, user.UserName!),
            new Claim(ClaimTypes.Email, user.Email!),
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email!),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Iat, new DateTimeOffset(DateTime.UtcNow).ToUnixTimeSeconds().ToString())
        };

        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JWT:Secret"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["JWT:ValidIssuer"],
            audience: _configuration["JWT:ValidAudience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>
    /// Generates refresh token for user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <returns>Refresh token</returns>
    private async Task<string> GenerateRefreshTokenAsync(string userId)
    {
        var refreshToken = Guid.NewGuid().ToString();
        
        // Store refresh token in cache with expiration
        var key = $"refresh_token_{refreshToken}";
        await _cacheService.SetAsync(key, userId, TimeSpan.FromDays(30), default);
        
        return refreshToken;
    }

    /// <summary>
    /// Validates refresh token and returns user ID
    /// </summary>
    /// <param name="refreshToken">Refresh token to validate</param>
    /// <returns>User ID if valid, null otherwise</returns>
    private async Task<string?> ValidateRefreshTokenAsync(string refreshToken)
    {
        var key = $"refresh_token_{refreshToken}";
        var userId = await _cacheService.GetAsync<string>(key, default);
        
        return userId;
    }

    /// <summary>
    /// Caches user session information
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="accessToken">Access token</param>
    /// <param name="refreshToken">Refresh token</param>
    /// <returns>A task representing the operation</returns>
    private async Task CacheUserSessionAsync(string userId, string accessToken, string refreshToken)
    {
        var sessionData = new UserSession
        {
            UserId = userId,
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(24)
        };

        await _cacheService.SetAsync($"user_session_{userId}", sessionData, TimeSpan.FromHours(24), default);
    }

    #endregion

    #region DTOs and Validators

    /// <summary>
    /// User session information for caching
    /// </summary>
    public class UserSession
    {
        public string UserId { get; set; } = string.Empty;
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
    }

    /// <summary>
    /// Refresh token request DTO
    /// </summary>
    public class RefreshTokenDto
    {
        public string RefreshToken { get; set; } = string.Empty;
    }

    /// <summary>
    /// Login DTO validator
    /// </summary>
    public class LoginDtoValidation : ValidationResult
    {
        public ValidationResult Validate(LoginDto loginDto)
        {
            var result = new ValidationResult();

            if (string.IsNullOrWhiteSpace(loginDto.Email))
                result.AddError(nameof(loginDto.Email), "Email is required");
            else if (!IsValidEmail(loginDto.Email))
                result.AddError(nameof(loginDto.Email), "Invalid email format");

            if (string.IsNullOrWhiteSpace(loginDto.Password))
                result.AddError(nameof(loginDto.Password), "Password is required");

            return result;
        }

        private bool IsValidEmail(string email)
        {
            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }
    }

    /// <summary>
    /// Register DTO validator
    /// </summary>
    public class RegisterDtoValidation : ValidationResult
    {
        public ValidationResult Validate(RegisterDto registerDto)
        {
            var result = new ValidationResult();

            if (string.IsNullOrWhiteSpace(registerDto.Email))
                result.AddError(nameof(registerDto.Email), "Email is required");
            else if (!IsValidEmail(registerDto.Email))
                result.AddError(nameof(registerDto.Email), "Invalid email format");

            if (string.IsNullOrWhiteSpace(registerDto.Password))
                result.AddError(nameof(registerDto.Password), "Password is required");
            else if (registerDto.Password.Length < 6)
                result.AddError(nameof(registerDto.Password), "Password must be at least 6 characters long");

            if (string.IsNullOrWhiteSpace(registerDto.FirstName))
                result.AddError(nameof(registerDto.FirstName), "First name is required");

            if (string.IsNullOrWhiteSpace(registerDto.LastName))
                result.AddError(nameof(registerDto.LastName), "Last name is required");

            return result;
        }

        private bool IsValidEmail(string email)
        {
            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }
    }

    /// <summary>
    /// Update profile DTO validator
    /// </summary>
    public class UpdateProfileDtoValidation : ValidationResult
    {
        public ValidationResult Validate(RegisterDto profileDto)
        {
            var result = new ValidationResult();

            if (string.IsNullOrWhiteSpace(profileDto.FirstName))
                result.AddError(nameof(profileDto.FirstName), "First name is required");

            if (string.IsNullOrWhiteSpace(profileDto.LastName))
                result.AddError(nameof(profileDto.LastName), "Last name is required");

            return result;
        }
    }

    #endregion
}