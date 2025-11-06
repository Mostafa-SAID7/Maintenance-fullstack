namespace CarMaintenance.Shared.Models;

/// <summary>
/// Represents the result of a validation operation
/// </summary>
public class ValidationResult
{
    /// <summary>
    /// Gets a value indicating whether the validation was successful
    /// </summary>
    public bool IsValid { get; private set; }

    /// <summary>
    /// Gets the collection of validation errors
    /// </summary>
    public List<ValidationError> Errors { get; private set; }

    /// <summary>
    /// Gets a value indicating whether this is a success result
    /// </summary>
    public bool IsSuccess => IsValid && !HasErrors;

    /// <summary>
    /// Gets a value indicating whether there are any errors
    /// </summary>
    public bool HasErrors => Errors.Any();

    /// <summary>
    /// Gets the count of errors
    /// </summary>
    public int ErrorCount => Errors.Count;

    /// <summary>
    /// Creates a successful validation result
    /// </summary>
    /// <returns>A successful validation result</returns>
    public static ValidationResult Success()
    {
        return new ValidationResult
        {
            IsValid = true,
            Errors = new List<ValidationError>()
        };
    }

    /// <summary>
    /// Creates a failed validation result
    /// </summary>
    /// <param name="fieldName">The name of the field that failed validation</param>
    /// <param name="errorMessage">The error message</param>
    /// <returns>A failed validation result</returns>
    public static ValidationResult Failure(string fieldName, string errorMessage)
    {
        var result = new ValidationResult
        {
            IsValid = false,
            Errors = new List<ValidationError>
            {
                new ValidationError(fieldName, errorMessage)
            }
        };

        return result;
    }

    /// <summary>
    /// Creates a failed validation result with multiple errors
    /// </summary>
    /// <param name="errors">The collection of validation errors</param>
    /// <returns>A failed validation result</returns>
    public static ValidationResult Failure(IEnumerable<ValidationError> errors)
    {
        var errorList = errors.ToList();
        return new ValidationResult
        {
            IsValid = false,
            Errors = errorList
        };
    }

    /// <summary>
    /// Creates a failed validation result from another validation result
    /// </summary>
    /// <param name="validationResult">The validation result to convert</param>
    /// <returns>A failed validation result</returns>
    public static ValidationResult Failure(ValidationResult validationResult)
    {
        return new ValidationResult
        {
            IsValid = false,
            Errors = new List<ValidationError>(validationResult.Errors)
        };
    }

    /// <summary>
    /// Initializes a new instance of the ValidationResult class
    /// </summary>
    public ValidationResult()
    {
        IsValid = true;
        Errors = new List<ValidationError>();
    }

    /// <summary>
    /// Adds an error to the validation result
    /// </summary>
    /// <param name="fieldName">The name of the field that failed validation</param>
    /// <param name="errorMessage">The error message</param>
    /// <returns>The current validation result for method chaining</returns>
    public ValidationResult AddError(string fieldName, string errorMessage)
    {
        Errors.Add(new ValidationError(fieldName, errorMessage));
        IsValid = false;
        return this;
    }

    /// <summary>
    /// Adds multiple errors to the validation result
    /// </summary>
    /// <param name="errors">The collection of validation errors to add</param>
    /// <returns>The current validation result for method chaining</returns>
    public ValidationResult AddErrors(IEnumerable<ValidationError> errors)
    {
        var errorList = errors.ToList();
        Errors.AddRange(errorList);
        IsValid = false;
        return this;
    }

    /// <summary>
    /// Adds an error from another validation result
    /// </summary>
    /// <param name="validationResult">The validation result to add errors from</param>
    /// <returns>The current validation result for method chaining</returns>
    public ValidationResult AddErrors(ValidationResult validationResult)
    {
        Errors.AddRange(validationResult.Errors);
        IsValid = false;
        return this;
    }

    /// <summary>
    /// Gets a formatted error message that combines all errors
    /// </summary>
    /// <returns>A formatted error message</returns>
    public string GetErrorMessage()
    {
        if (HasErrors)
        {
            return string.Join("; ", Errors.Select(e => $"{e.FieldName}: {e.ErrorMessage}"));
        }

        return string.Empty;
    }

    /// <summary>
    /// Gets a dictionary of field names and their error messages
    /// </summary>
    /// <returns>A dictionary of field errors</returns>
    public Dictionary<string, string> GetErrorDictionary()
    {
        return Errors.GroupBy(e => e.FieldName)
                   .ToDictionary(g => g.Key, g => string.Join("; ", g.Select(e => e.ErrorMessage)));
    }

    /// <summary>
    /// Creates a combined validation result from multiple validation results
    /// </summary>
    /// <param name="results">The validation results to combine</param>
    /// <returns>A combined validation result</returns>
    public static ValidationResult Combine(params ValidationResult[] results)
    {
        if (results == null || !results.Any())
        {
            return Success();
        }

        var allErrors = results.SelectMany(r => r.Errors);
        return new ValidationResult
        {
            IsValid = results.All(r => r.IsValid),
            Errors = allErrors.ToList()
        };
    }

    /// <summary>
    /// Creates a combined validation result from a collection of validation results
    /// </summary>
    /// <param name="results">The validation results to combine</param>
    /// <returns>A combined validation result</returns>
    public static ValidationResult Combine(IEnumerable<ValidationResult> results)
    {
        var resultList = results?.ToList();
        if (resultList == null || !resultList.Any())
        {
            return Success();
        }

        var allErrors = resultList.SelectMany(r => r.Errors);
        return new ValidationResult
        {
            IsValid = resultList.All(r => r.IsValid),
            Errors = allErrors.ToList()
        };
    }

    /// <summary>
    /// Throws an exception if the validation result is not valid
    /// </summary>
    /// <exception cref="ValidationException">Thrown when the validation result is not valid</exception>
    public void ThrowIfInvalid()
    {
        if (!IsValid)
        {
            throw new ValidationException(GetErrorMessage(), this);
        }
    }

    /// <summary>
    /// Returns a string representation of the validation result
    /// </summary>
    /// <returns>A string representation</returns>
    public override string ToString()
    {
        return IsValid ? "Valid" : $"Invalid ({ErrorCount} error(s)): {GetErrorMessage()}";
    }
}

/// <summary>
/// Represents a single validation error
/// </summary>
public class ValidationError
{
    /// <summary>
    /// Gets the name of the field that failed validation
    /// </summary>
    public string FieldName { get; }

    /// <summary>
    /// Gets the error message
    /// </summary>
    public string ErrorMessage { get; }

    /// <summary>
    /// Initializes a new instance of the ValidationError class
    /// </summary>
    /// <param name="fieldName">The name of the field that failed validation</param>
    /// <param name="errorMessage">The error message</param>
    public ValidationError(string fieldName, string errorMessage)
    {
        FieldName = fieldName ?? throw new ArgumentNullException(nameof(fieldName));
        ErrorMessage = errorMessage ?? throw new ArgumentNullException(nameof(errorMessage));
    }

    /// <summary>
    /// Deconstructs the validation error into its components
    /// </summary>
    /// <param name="fieldName">The field name</param>
    /// <param name="errorMessage">The error message</param>
    public void Deconstruct(out string fieldName, out string errorMessage)
    {
        fieldName = FieldName;
        errorMessage = ErrorMessage;
    }

    /// <summary>
    /// Returns a string representation of the validation error
    /// </summary>
    /// <returns>A string representation</returns>
    public override string ToString()
    {
        return $"{FieldName}: {ErrorMessage}";
    }

    /// <summary>
    /// Determines whether the specified object is equal to the current object
    /// </summary>
    /// <param name="obj">The object to compare</param>
    /// <returns>True if the objects are equal, false otherwise</returns>
    public override bool Equals(object? obj)
    {
        return obj is ValidationError other &&
               FieldName == other.FieldName &&
               ErrorMessage == other.ErrorMessage;
    }

    /// <summary>
    /// Serves as the default hash function
    /// </summary>
    /// <returns>A hash code for the current object</returns>
    public override int GetHashCode()
    {
        return HashCode.Combine(FieldName, ErrorMessage);
    }

    /// <summary>
    /// Creates a validation error with the specified field name and error message
    /// </summary>
    /// <param name="fieldName">The field name</param>
    /// <param name="errorMessage">The error message</param>
    /// <returns>A new validation error</returns>
    public static ValidationError Create(string fieldName, string errorMessage)
    {
        return new ValidationError(fieldName, errorMessage);
    }
}

/// <summary>
/// Exception thrown when validation fails
/// </summary>
public class ValidationException : Exception
{
    /// <summary>
    /// Gets the validation result that caused the exception
    /// </summary>
    public ValidationResult ValidationResult { get; }

    /// <summary>
    /// Initializes a new instance of the ValidationException class
    /// </summary>
    /// <param name="message">The error message</param>
    /// <param name="validationResult">The validation result</param>
    public ValidationException(string message, ValidationResult validationResult) 
        : base(message)
    {
        ValidationResult = validationResult ?? throw new ArgumentNullException(nameof(validationResult));
    }

    /// <summary>
    /// Initializes a new instance of the ValidationException class
    /// </summary>
    /// <param name="message">The error message</param>
    /// <param name="innerException">The inner exception</param>
    /// <param name="validationResult">The validation result</param>
    public ValidationException(string message, Exception innerException, ValidationResult validationResult) 
        : base(message, innerException)
    {
        ValidationResult = validationResult ?? throw new ArgumentNullException(nameof(validationResult));
    }
}