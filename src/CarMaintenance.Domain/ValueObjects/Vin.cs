using System.Text.RegularExpressions;

namespace CarMaintenance.Domain.ValueObjects;

/// <summary>
/// Value object representing a Vehicle Identification Number
/// </summary>
public class Vin : ValueObject
{
    private static readonly Regex VinRegex = new(@"^[A-HJ-NPR-Z0-9]{17}$", RegexOptions.Compiled);

    public string Value { get; private set; }

    private Vin(string value)
    {
        Value = value;
    }

    /// <summary>
    /// Creates a new VIN value object
    /// </summary>
    /// <param name="vin">The VIN string</param>
    /// <returns>VIN value object</returns>
    /// <exception cref="ArgumentException">Thrown when VIN is invalid</exception>
    public static Vin Create(string vin)
    {
        if (string.IsNullOrWhiteSpace(vin))
            throw new ArgumentException("VIN cannot be empty", nameof(vin));

        var cleanVin = vin.Replace(" ", "").Replace("-", "").ToUpperInvariant();

        if (cleanVin.Length != 17)
            throw new ArgumentException("VIN must be exactly 17 characters", nameof(vin));

        if (!VinRegex.IsMatch(cleanVin))
            throw new ArgumentException("VIN contains invalid characters. Valid characters: A-Z (excluding I,O,Q) and 0-9", nameof(vin));

        // Check VIN check digit (9th position)
        if (!IsValidCheckDigit(cleanVin))
            throw new ArgumentException("VIN check digit is invalid", nameof(vin));

        return new Vin(cleanVin);
    }

    /// <summary>
    /// Creates a VIN value object from an existing validated VIN
    /// </summary>
    /// <param name="vin">The validated VIN</param>
    /// <returns>VIN value object</returns>
    internal static Vin FromValidated(string vin)
    {
        return new Vin(vin);
    }

    /// <summary>
    /// Validates the VIN check digit
    /// </summary>
    /// <param name="vin">The VIN to validate</param>
    /// <returns>True if check digit is valid</returns>
    private static bool IsValidCheckDigit(string vin)
    {
        const string weights = "8765432X09834567";
        const string map = "0123456789X";

        int sum = 0;
        for (int i = 0; i < 17; i++)
        {
            char vinChar = vin[i];
            char weightChar = weights[i];
            int weight = map.IndexOf(weightChar);

            int value = map.IndexOf(vinChar);
            if (value == -1) return false;

            sum += value * weight;
        }

        int checkDigit = sum % 11;
        char expectedCheckDigit = checkDigit == 10 ? 'X' : char.Parse(checkDigit.ToString());

        return vin[8] == expectedCheckDigit;
    }

    /// <summary>
    /// Gets the WMI (World Manufacturer Identifier) from the VIN
    /// </summary>
    /// <returns>WMI portion of the VIN</returns>
    public string GetWmi() => Value[..3];

    /// <summary>
    /// Gets the VDS (Vehicle Descriptor Section) from the VIN
    /// </summary>
    /// <returns>VDS portion of the VIN</returns>
    public string GetVds() => Value[3..8];

    /// <summary>
    /// Gets the VIS (Vehicle Identifier Section) from the VIN
    /// </summary>
    /// <returns>VIS portion of the VIN</returns>
    public string GetVis() => Value[8..17];

    /// <summary>
    /// Gets the model year from the VIN
    /// </summary>
    /// <returns>Model year (4-digit)</returns>
    public int GetModelYear()
    {
        char yearCode = Value[9];
        return yearCode switch
        {
            'A' => 2010, 'B' => 2011, 'C' => 2012, 'D' => 2013, 'E' => 2014,
            'F' => 2015, 'G' => 2016, 'H' => 2017, 'J' => 2018, 'K' => 2019,
            'L' => 2020, 'M' => 2021, 'N' => 2022, 'P' => 2023, 'R' => 2024,
            'S' => 2025, 'T' => 2026, 'V' => 2027, 'W' => 2028, 'X' => 2029,
            'Y' => 2030, '1' => 2031, '2' => 2032, '3' => 2033, '4' => 2034,
            '5' => 2035, '6' => 2036, '7' => 2037, '8' => 2038, '9' => 2039,
            _ => throw new InvalidOperationException($"Invalid year code: {yearCode}")
        };
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }

    public override string ToString() => Value;

    public static implicit operator string(Vin vin) => vin?.Value ?? string.Empty;

    public static explicit operator Vin(string vin) => Create(vin);
}