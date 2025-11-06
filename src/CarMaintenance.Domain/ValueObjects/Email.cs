using System.Text.RegularExpressions;

namespace CarMaintenance.Domain.ValueObjects;

/// <summary>
/// Value object representing an email address
/// </summary>
public class Email : ValueObject
{
    private static readonly Regex EmailRegex = new(
        @"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    public string Value { get; private set; }

    private Email(string email)
    {
        Value = email;
    }

    /// <summary>
    /// Creates a new email value object
    /// </summary>
    /// <param name="email">The email address</param>
    /// <returns>Email value object</returns>
    /// <exception cref="ArgumentException">Thrown when email is invalid</exception>
    public static Email Create(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("Email cannot be empty", nameof(email));

        var cleanEmail = email.Trim().ToLowerInvariant();

        if (cleanEmail.Length > 254)
            throw new ArgumentException("Email cannot be longer than 254 characters", nameof(email));

        if (!EmailRegex.IsMatch(cleanEmail))
            throw new ArgumentException("Invalid email format", nameof(email));

        // Additional validation for RFC 5322
        var parts = cleanEmail.Split('@');
        if (parts.Length != 2)
            throw new ArgumentException("Invalid email format", nameof(email));

        var localPart = parts[0];
        var domainPart = parts[1];

        if (localPart.Length == 0 || localPart.Length > 64)
            throw new ArgumentException("Local part of email must be between 1 and 64 characters", nameof(email));

        if (domainPart.Length == 0 || domainPart.Length > 253)
            throw new ArgumentException("Domain part of email must be between 1 and 253 characters", nameof(email));

        // Domain validation
        var domainLabels = domainPart.Split('.');
        foreach (var label in domainLabels)
        {
            if (label.Length == 0 || label.Length > 63)
                throw new ArgumentException("Each domain label must be between 1 and 63 characters", nameof(email));

            if (label.StartsWith('-') || label.EndsWith('-'))
                throw new ArgumentException("Domain labels cannot start or end with hyphen", nameof(email));

            if (!label.All(c => char.IsLetterOrDigit(c) || c == '-'))
                throw new ArgumentException("Domain labels can only contain letters, digits, and hyphens", nameof(email));
        }

        return new Email(cleanEmail);
    }

    /// <summary>
    /// Gets the local part of the email (before @)
    /// </summary>
    /// <returns>Local part of the email</returns>
    public string GetLocalPart() => Value.Split('@')[0];

    /// <summary>
    /// Gets the domain part of the email (after @)
    /// </summary>
    /// <returns>Domain part of the email</returns>
    public string GetDomain() => Value.Split('@')[1];

    /// <summary>
    /// Gets the domain extension (TLD)
    /// </summary>
    /// <returns>Top-level domain</returns>
    public string GetDomainExtension()
    {
        var domainParts = GetDomain().Split('.');
        return domainParts.Length > 1 ? domainParts[^1] : string.Empty;
    }

    /// <summary>
    /// Checks if the email is from a specific domain
    /// </summary>
    /// <param name="domain">The domain to check</param>
    /// <returns>True if email is from the specified domain</returns>
    public bool IsFromDomain(string domain)
    {
        return string.Equals(GetDomain(), domain, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Checks if the email is from a corporate domain
    /// </summary>
    /// <returns>True if email is from a corporate domain</returns>
    public bool IsCorporateEmail()
    {
        var domain = GetDomain();
        var corporateExtensions = new[] { "com", "net", "org", "edu", "gov", "mil" };
        return corporateExtensions.Contains(GetDomainExtension());
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value.ToLowerInvariant();
    }

    public override string ToString() => Value;

    public static implicit operator string(Email email) => email?.Value ?? string.Empty;

    public static explicit operator Email(string email) => Create(email);
}