using System.Text.RegularExpressions;

namespace CarMaintenance.Domain.ValueObjects;

/// <summary>
/// Value object representing a phone number
/// </summary>
public class PhoneNumber : ValueObject
{
    private static readonly Regex PhoneRegex = new(@"^\+?[1-9]\d{1,14}$", RegexOptions.Compiled);

    public string Value { get; private set; }
    public string CountryCode { get; private set; }
    public string NationalNumber { get; private set; }
    public string FormattedValue { get; private set; }

    private PhoneNumber(string phoneNumber, string countryCode, string nationalNumber, string formattedValue)
    {
        Value = phoneNumber;
        CountryCode = countryCode;
        NationalNumber = nationalNumber;
        FormattedValue = formattedValue;
    }

    /// <summary>
    /// Creates a new phone number value object
    /// </summary>
    /// <param name="phoneNumber">The phone number</param>
    /// <returns>Phone number value object</returns>
    /// <exception cref="ArgumentException">Thrown when phone number is invalid</exception>
    public static PhoneNumber Create(string phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber))
            throw new ArgumentException("Phone number cannot be empty", nameof(phoneNumber));

        var cleanNumber = new string(phoneNumber.Where(char.IsDigit).ToArray());
        var originalNumber = phoneNumber.Trim();

        if (cleanNumber.Length < 10 || cleanNumber.Length > 15)
            throw new ArgumentException("Phone number must be between 10 and 15 digits", nameof(phoneNumber));

        // Extract country code
        string countryCode = string.Empty;
        string nationalNumber = cleanNumber;

        if (originalNumber.StartsWith("+"))
        {
            // International format
            if (cleanNumber.Length > 10)
            {
                countryCode = cleanNumber[..^10];
                nationalNumber = cleanNumber[^10..];
            }
        }
        else if (originalNumber.StartsWith("1") && cleanNumber.Length == 11)
        {
            // US/Canada with country code
            countryCode = "1";
            nationalNumber = cleanNumber[1..];
        }

        // Validate the number
        if (!IsValidPhoneNumber(nationalNumber, countryCode))
            throw new ArgumentException("Invalid phone number format", nameof(phoneNumber));

        return new PhoneNumber(cleanNumber, countryCode, nationalNumber, FormatPhoneNumber(cleanNumber, countryCode));
    }

    /// <summary>
    /// Creates a phone number with explicit country code
    /// </summary>
    /// <param name="nationalNumber">The national number</param>
    /// <param name="countryCode">The country code</param>
    /// <returns>Phone number value object</returns>
    public static PhoneNumber CreateWithCountryCode(string nationalNumber, string countryCode = "1")
    {
        if (string.IsNullOrWhiteSpace(nationalNumber))
            throw new ArgumentException("National number cannot be empty", nameof(nationalNumber));

        var cleanNational = new string(nationalNumber.Where(char.IsDigit).ToArray());
        
        if (cleanNational.Length < 10 || cleanNational.Length > 12)
            throw new ArgumentException("National number must be between 10 and 12 digits", nameof(nationalNumber));

        var fullNumber = countryCode + cleanNational;
        return Create("+" + fullNumber);
    }

    private static bool IsValidPhoneNumber(string nationalNumber, string countryCode)
    {
        // Basic validation rules
        if (countryCode == "1") // US/Canada
        {
            return nationalNumber.Length == 10 && nationalNumber[0] != '0' && nationalNumber[0] != '1';
        }

        // For other countries, ensure at least 10 digits
        return nationalNumber.Length >= 10;
    }

    private static string FormatPhoneNumber(string number, string countryCode)
    {
        if (countryCode == "1" && number.Length == 11)
        {
            // US/Canada format: (XXX) XXX-XXXX
            return $"+{countryCode} ({number[1..4]}) {number[4..7]}-{number[7..]}";
        }
        else if (number.Length == 10)
        {
            // Domestic US format
            return $"({number[..3]}) {number[3..6]}-{number[6..]}";
        }

        return number;
    }

    /// <summary>
    /// Gets whether this is a mobile number
    /// </summary>
    /// <returns>True if mobile number</returns>
    public bool IsMobile()
    {
        if (CountryCode == "1")
        {
            // US mobile numbers typically start with 2-9 in the first digit after country code
            return NationalNumber[0] >= '2' && NationalNumber[0] <= '9';
        }

        // For other countries, this would need country-specific logic
        return true; // Assume mobile by default for non-US numbers
    }

    /// <summary>
    /// Gets whether this is a landline number
    /// </summary>
    /// <returns>True if landline number</returns>
    public bool IsLandline()
    {
        return !IsMobile();
    }

    /// <summary>
    /// Gets the phone number in international format
    /// </summary>
    /// <returns>International format phone number</returns>
    public string ToInternationalFormat()
    {
        return $"+{CountryCode}{NationalNumber}";
    }

    /// <summary>
    /// Gets the phone number in national format
    /// </summary>
    /// <returns>National format phone number</returns>
    public string ToNationalFormat()
    {
        return FormattedValue;
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }

    public override string ToString() => FormattedValue;

    public static implicit operator string(PhoneNumber phoneNumber) => phoneNumber?.FormattedValue ?? string.Empty;

    public static explicit operator PhoneNumber(string phoneNumber) => Create(phoneNumber);
}