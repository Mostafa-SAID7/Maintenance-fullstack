using MediatR;
using Microsoft.Extensions.Logging;
using FluentValidation;
using CarMaintenance.Shared.Models;

namespace CarMaintenance.Application.Behaviors;

/// <summary>
/// MediatR pipeline behavior for validation
/// </summary>
/// <typeparam name="TRequest">The request type</typeparam>
/// <typeparam name="TResponse">The response type</typeparam>
public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly ILogger<ValidationBehavior<TRequest, TResponse>> _logger;
    private readonly IEnumerable<FluentValidation.IValidator<TRequest>> _validators;

    public ValidationBehavior(
        ILogger<ValidationBehavior<TRequest, TResponse>> logger,
        IEnumerable<FluentValidation.IValidator<TRequest>> validators)
    {
        _logger = logger;
        _validators = validators;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (!_validators.Any())
        {
            return await next();
        }

        _logger.LogInformation(
            "Validating request {RequestName}",
            typeof(TRequest).Name);

        var context = new FluentValidation.ValidationContext<TRequest>(request);

        // Validate using FluentValidation
        var validationResults = await Task.WhenAll(
            _validators.Select(v => v.ValidateAsync(context, cancellationToken)));

        var failures = validationResults
            .Where(r => r.Errors.Any())
            .SelectMany(r => r.Errors)
            .ToList();

        if (failures.Any())
        {
            _logger.LogWarning(
                "Validation failed for request {RequestName} with {ErrorCount} errors",
                typeof(TRequest).Name,
                failures.Count);

            // Log detailed validation errors
            foreach (var error in failures)
            {
                _logger.LogWarning(
                    "Validation error: {PropertyName} - {ErrorMessage}",
                    error.PropertyName,
                    error.ErrorMessage);
            }

            throw new ValidationException(
                "One or more validation failures have occurred.",
                failures);
        }

        return await next();
    }
}

/// <summary>
/// Exception thrown when validation fails
/// </summary>
public class ValidationException : Exception
{
    public List<FluentValidation.Results.ValidationFailure> Errors { get; }

    public ValidationException(string message, List<FluentValidation.Results.ValidationFailure> errors)
        : base(message)
    {
        Errors = errors;
    }
}