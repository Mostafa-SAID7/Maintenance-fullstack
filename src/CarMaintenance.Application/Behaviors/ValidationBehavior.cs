using MediatR;
using MediatR.Pipeline;
using Microsoft.Extensions.Logging;
using CarMaintenance.Shared.Models;

namespace CarMaintenance.Application.Behaviors;

/// <summary>
/// MediatR pipeline behavior for validation
/// Validates commands and queries before they are processed
/// </summary>
/// <typeparam name="TRequest">The request type</typeparam>
/// <typeparam name="TResponse">The response type</typeparam>
public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly ILogger<ValidationBehavior<TRequest, TResponse>> _logger;

    /// <summary>
    /// Initializes a new instance of the ValidationBehavior class
    /// </summary>
    /// <param name="logger">The logger instance</param>
    public ValidationBehavior(ILogger<ValidationBehavior<TRequest, TResponse>> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Handles the validation process in the pipeline
    /// </summary>
    /// <param name="request">The request to validate</param>
    /// <param name="next">The next handler in the pipeline</param>
    /// <param name="cancellationToken">The cancellation token</param>
    /// <returns>The response from the next handler</returns>
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var requestType = typeof(TRequest).Name;

        _logger.LogDebug("Starting validation for request {RequestType}", requestType);

        // Check if the request has validation functionality
        if (request is IValidatableRequest validatableRequest)
        {
            var validationResult = validatableRequest.Validate();
            
            if (!validationResult.IsValid)
            {
                _logger.LogWarning("Validation failed for request {RequestType}: {Errors}", 
                    requestType, validationResult.GetErrorMessage());
                
                throw new ValidationException(
                    $"Validation failed for {requestType}: {validationResult.GetErrorMessage()}", 
                    validationResult);
            }
        }

        // Log successful validation
        _logger.LogDebug("Validation passed for request {RequestType}", requestType);

        // Continue to the next handler
        return await next();
    }
}

/// <summary>
/// Interface to identify requests that can be validated
/// </summary>
public interface IValidatableRequest
{
    /// <summary>
    /// Validates the request
    /// </summary>
    /// <returns>The validation result</returns>
    ValidationResult Validate();
}