import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class VinValidator {
  static validate(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      
      if (!value) {
        return null; // Let required validator handle empty values
      }

      const vin = value.toString().toUpperCase().replace(/[^A-Z0-9]/g, '');
      
      if (vin.length !== 17) {
        return { vinInvalid: 'VIN must be exactly 17 characters long' };
      }

      // VIN validation using industry standard checks
      if (!this.isValidVin(vin)) {
        return { vinInvalid: 'Invalid VIN format' };
      }

      return null;
    };
  }

  private static isValidVin(vin: string): boolean {
    // Basic VIN format validation
    // VIN characters 1-8 and 10-17 can be alphanumeric except I, O, Q
    // Character 9 is a check digit
    
    const validCharacters = /^[A-HJ-NPR-Z0-9]+$/;
    if (!validCharacters.test(vin)) {
      return false;
    }

    // Check digit validation (simplified)
    const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
    const mapping: { [key: string]: number } = {
      'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8,
      'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'P': 7, 'R': 9,
      'S': 2, 'T': 3, 'U': 4, 'V': 5, 'W': 6, 'X': 7, 'Y': 8, 'Z': 9,
      '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '0': 0
    };

    let sum = 0;
    for (let i = 0; i < 17; i++) {
      const char = vin[i];
      const weight = weights[i];
      const value = mapping[char];
      sum += value * weight;
    }

    const checkDigit = sum % 11;
    return checkDigit === 0;
  }

  static formatVin(vin: string): string {
    if (!vin) return '';
    const cleaned = vin.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return cleaned.slice(0, 4) + ' ' + cleaned.slice(4, 9) + ' ' + cleaned.slice(9, 17);
  }
}