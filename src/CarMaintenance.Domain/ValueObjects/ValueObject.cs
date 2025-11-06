namespace CarMaintenance.Domain.ValueObjects;

/// <summary>
/// Base class for value objects following the Value Object pattern
/// </summary>
public abstract class ValueObject
{
    /// <summary>
    /// Gets the components that determine the equality of this value object
    /// </summary>
    /// <returns>Collection of equality components</returns>
    protected abstract IEnumerable<object> GetEqualityComponents();

    /// <summary>
    /// Determines whether this value object equals another object
    /// </summary>
    /// <param name="obj">The object to compare</param>
    /// <returns>True if objects are equal, false otherwise</returns>
    public override bool Equals(object? obj)
    {
        if (obj is null || obj.GetType() != GetType())
            return false;

        var other = (ValueObject)obj;

        return this.GetEqualityComponents().SequenceEqual(other.GetEqualityComponents());
    }

    /// <summary>
    /// Gets the hash code for this value object
    /// </summary>
    /// <returns>Hash code based on equality components</returns>
    public override int GetHashCode()
    {
        return GetEqualityComponents()
            .Select(x => x?.GetHashCode() ?? 0)
            .Aggregate((x, y) => x ^ y);
    }

    /// <summary>
    /// Creates a deep copy of this value object
    /// </summary>
    /// <returns>Deep copy of the value object</returns>
    public ValueObject GetCopy()
    {
        return this.MemberwiseClone() as ValueObject
            ?? throw new InvalidOperationException("Could not copy value object");
    }
}