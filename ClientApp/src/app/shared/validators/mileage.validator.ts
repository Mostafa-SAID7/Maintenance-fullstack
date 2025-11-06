import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Custom validator for mileage input
 * Validates that mileage is a valid number within specified range
 */
export class MileageValidator {
  /**
   * Validates that the input is a valid number
   */
  static numeric(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Don't validate empty values
      }
      
      const value = control.value;
      if (typeof value !== 'string' && typeof value !== 'number') {
        return { numeric: 'Value must be a number' };
      }
      
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      
      if (isNaN(numValue)) {
        return { numeric: 'Value must be a valid number' };
      }
      
      return null;
    };
  }

  /**
   * Validates minimum mileage value
   */
  static min(minValue: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Don't validate empty values
      }
      
      const numValue = typeof control.value === 'string' 
        ? parseFloat(control.value) 
        : control.value;
      
      if (isNaN(numValue)) {
        return null; // Numeric validation will catch this
      }
      
      if (numValue < minValue) {
        return { 
          min: {
            actual: numValue,
            min: minValue
          }
        };
      }
      
      return null;
    };
  }

  /**
   * Validates maximum mileage value
   */
  static max(maxValue: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Don't validate empty values
      }
      
      const numValue = typeof control.value === 'string' 
        ? parseFloat(control.value) 
        : control.value;
      
      if (isNaN(numValue)) {
        return null; // Numeric validation will catch this
      }
      
      if (numValue > maxValue) {
        return { 
          max: {
            actual: numValue,
            max: maxValue
          }
        };
      }
      
      return null;
    };
  }

  /**
   * Validates mileage range (min and max)
   */
  static range(minValue: number, maxValue: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Don't validate empty values
      }
      
      const numValue = typeof control.value === 'string' 
        ? parseFloat(control.value) 
        : control.value;
      
      if (isNaN(numValue)) {
        return null; // Numeric validation will catch this
      }
      
      if (numValue < minValue || numValue > maxValue) {
        return { 
          range: {
            actual: numValue,
            min: minValue,
            max: maxValue
          }
        };
      }
      
      return null;
    };
  }

  /**
   * Validates that mileage is a reasonable value for a vehicle
   */
  static reasonable(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Don't validate empty values
      }
      
      const numValue = typeof control.value === 'string' 
        ? parseFloat(control.value) 
        : control.value;
      
      if (isNaN(numValue)) {
        return null; // Numeric validation will catch this
      }
      
      // Reasonable mileage ranges for vehicles
      const minMileage = 0;
      const maxMileage = 1000000; // 1 million miles maximum
      
      if (numValue < minMileage || numValue > maxMileage) {
        return { 
          reasonable: {
            actual: numValue,
            min: minMileage,
            max: maxMileage,
            message: `Mileage must be between ${minMileage.toLocaleString()} and ${maxMileage.toLocaleString()} miles`
          }
        };
      }
      
      return null;
    };
  }

  /**
   * Validates no negative mileage values
   */
  static nonNegative(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Don't validate empty values
      }
      
      const numValue = typeof control.value === 'string' 
        ? parseFloat(control.value) 
        : control.value;
      
      if (isNaN(numValue)) {
        return null; // Numeric validation will catch this
      }
      
      if (numValue < 0) {
        return { 
          nonNegative: {
            actual: numValue,
            message: 'Mileage cannot be negative'
          }
        };
      }
      
      return null;
    };
  }

  /**
   * Validates decimal places for mileage (useful for precision control)
   */
  static decimalPlaces(maxDecimalPlaces: number = 1): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Don't validate empty values
      }
      
      const value = control.value.toString();
      const decimalMatch = value.match(/\.(\d+)/);
      
      if (decimalMatch) {
        const decimalPlaces = decimalMatch[1].length;
        if (decimalPlaces > maxDecimalPlaces) {
          return { 
            decimalPlaces: {
              actual: decimalPlaces,
              max: maxDecimalPlaces,
              message: `Mileage can have at most ${maxDecimalPlaces} decimal place${maxDecimalPlaces !== 1 ? 's' : ''}`
            }
          };
        }
      }
      
      return null;
    };
  }

  /**
   * Combined mileage validator with multiple checks
   */
  static comprehensive(options: {
    min?: number;
    max?: number;
    decimalPlaces?: number;
    allowNegative?: boolean;
    reasonable?: boolean;
  } = {}): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Don't validate empty values
      }
      
      const numValue = typeof control.value === 'string' 
        ? parseFloat(control.value) 
        : control.value;
      
      if (isNaN(numValue)) {
        return { numeric: 'Value must be a valid number' };
      }
      
      const errors: ValidationErrors = {};
      
      // Check minimum value
      if (options.min !== undefined && numValue < options.min) {
        errors['min'] = {
          actual: numValue,
          min: options.min
        };
      }
      
      // Check maximum value
      if (options.max !== undefined && numValue > options.max) {
        errors['max'] = {
          actual: numValue,
          max: options.max
        };
      }
      
      // Check negative values
      if (!options.allowNegative && numValue < 0) {
        errors['nonNegative'] = {
          actual: numValue,
          message: 'Mileage cannot be negative'
        };
      }
      
      // Check decimal places
      if (options.decimalPlaces !== undefined) {
        const decimalMatch = control.value.toString().match(/\.(\d+)/);
        if (decimalMatch && decimalMatch[1].length > options.decimalPlaces) {
          errors['decimalPlaces'] = {
            actual: decimalMatch[1].length,
            max: options.decimalPlaces
          };
        }
      }
      
      // Check reasonable range
      if (options.reasonable !== false) {
        const minMileage = 0;
        const maxMileage = 1000000;
        
        if (numValue < minMileage || numValue > maxMileage) {
          errors['reasonable'] = {
            actual: numValue,
            min: minMileage,
            max: maxMileage
          };
        }
      }
      
      return Object.keys(errors).length > 0 ? errors : null;
    };
  }
}