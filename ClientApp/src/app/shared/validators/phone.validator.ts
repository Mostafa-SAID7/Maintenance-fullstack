import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class PhoneValidator {
  static validate(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      
      if (!value) {
        return null; // Let required validator handle empty values
      }

      // Remove all non-numeric characters for validation
      const cleanPhone = value.toString().replace(/\D/g, '');
      
      if (cleanPhone.length === 0) {
        return { phoneInvalid: 'Phone number is required' };
      }

      // Check for valid international phone number patterns
      if (!this.isValidPhoneNumber(cleanPhone)) {
        return { phoneInvalid: 'Please enter a valid phone number' };
      }

      return null;
    };
  }

  static international(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      
      if (!value) {
        return null;
      }

      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      const cleanPhone = value.toString().replace(/\D/g, '');
      
      if (!phoneRegex.test(cleanPhone)) {
        return { phoneInternational: 'Please enter a valid international phone number' };
      }

      return null;
    };
  }

  static usFormat(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      
      if (!value) {
        return null;
      }

      // US phone number patterns: (123) 456-7890, 123-456-7890, 123.456.7890, 1234567890
      const usPhoneRegex = /^(\+?1-?)?(\([0-9]{3}\)|[0-9]{3})[-.]?([0-9]{3})[-.]?([0-9]{4})$/;
      const cleanPhone = value.toString().replace(/\D/g, '');
      
      if (cleanPhone.length !== 10) {
        return { phoneUsFormat: 'US phone number must be 10 digits' };
      }

      if (!usPhoneRegex.test(value.toString())) {
        return { phoneUsFormat: 'Please enter a valid US phone number format' };
      }

      return null;
    };
  }

  static countryCode(countryCode: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      
      if (!value) {
        return null;
      }

      const cleanPhone = value.toString().replace(/\D/g, '');
      
      // Check if phone starts with country code
      if (!cleanPhone.startsWith(countryCode.replace('+', ''))) {
        return { phoneCountryCode: `Phone number must start with ${countryCode}` };
      }

      return null;
    };
  }

  private static isValidPhoneNumber(phone: string): boolean {
    // Basic validation rules for international phone numbers
    const minLength = 7; // Minimum international phone number length
    const maxLength = 15; // Maximum international phone number length (E.164)
    
    if (phone.length < minLength || phone.length > maxLength) {
      return false;
    }

    // Don't allow phone numbers that start with 0 (country code indicator)
    if (phone.startsWith('0')) {
      return false;
    }

    // Don't allow sequential repeated digits (likely fake numbers)
    const repeatedDigitRegex = /(.)\1{4,}/;
    if (repeatedDigitRegex.test(phone)) {
      return false;
    }

    return true;
  }

  static formatPhoneNumber(phone: string, format: 'international' | 'us' = 'international'): string {
    if (!phone) return '';
    
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (format === 'us' && cleanPhone.length === 10) {
      // US format: (123) 456-7890
      return `(${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`;
    } else if (cleanPhone.length > 10) {
      // International format with country code
      const countryCode = cleanPhone.slice(0, cleanPhone.length - 10);
      const number = cleanPhone.slice(-10);
      return `+${countryCode} (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
    }
    
    return phone; // Return original if formatting fails
  }
}