import { AbstractControl, FormGroup } from '@angular/forms';

export class FormUtils {
  /**
   * Marks all controls in a form as touched
   */
  static markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Resets form and clears validation states
   */
  static resetForm(formGroup: any): void {
    formGroup.reset();
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control.setErrors(null);
    });
  }

  /**
   * Gets form validation error messages
   */
  static getFormValidationErrors(formGroup: any): { [key: string]: string } {
    const errors: { [key: string]: string } = {};
    
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control && control.errors) {
        Object.keys(control.errors).forEach(errorKey => {
          if (errorKey === 'required') {
            errors[key] = `${key} is required`;
          } else if (errorKey === 'email') {
            errors[key] = `${key} is invalid`;
          } else if (errorKey === 'minlength') {
            errors[key] = `${key} must be at least ${control.errors[errorKey].requiredLength} characters`;
          } else if (errorKey === 'maxlength') {
            errors[key] = `${key} cannot exceed ${control.errors[errorKey].requiredLength} characters`;
          } else if (errorKey === 'pattern') {
            errors[key] = `${key} format is invalid`;
          } else {
            errors[key] = `${key} is invalid`;
          }
        });
      }
    });
    
    return errors;
  }

  /**
   * Compares two password fields for equality
   */
  static passwordMatchValidator(controlName: string, matchingControlName: string) {
    return (formGroup: any) => {
      const control = formGroup.get(controlName);
      const matchingControl = formGroup.get(matchingControlName);
      
      if (matchingControl.errors && !matchingControl.errors['passwordMismatch']) {
        return null;
      }
      
      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ passwordMismatch: true });
      } else {
        matchingControl.setErrors({ passwordMismatch: null });
      }
      
      return null;
    };
  }

  /**
   * Validates VIN format
   */
  static vinValidator() {
    return (control: any) => {
      const vin = control.value;
      if (!vin) return null;
      
      const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
      if (!vinRegex.test(vin.toUpperCase())) {
        return { vinInvalid: 'Invalid VIN format' };
      }
      
      return null;
    };
  }

  /**
   * Validates mileage range
   */
  static mileageValidator(min: number = 0, max: number = 1000000) {
    return (control: any) => {
      const value = control.value;
      if (!value) return null;
      
      const numericValue = parseFloat(value);
      if (isNaN(numericValue)) {
        return { mileageInvalid: 'Please enter a valid number' };
      }
      
      if (numericValue < min) {
        return { mileageMin: `Mileage must be at least ${min}` };
      }
      
      if (numericValue > max) {
        return { mileageMax: `Mileage cannot exceed ${max}` };
      }
      
      return null;
    };
  }

  /**
   * Validates phone number
   */
  static phoneValidator() {
    return (control: any) => {
      const phone = control.value;
      if (!phone) return null;
      
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      const cleanPhone = phone.replace(/\D/g, '');
      
      if (!phoneRegex.test(cleanPhone)) {
        return { phoneInvalid: 'Please enter a valid phone number' };
      }
      
      return null;
    };
  }

  /**
   * Validates date range
   */
  static dateRangeValidator() {
    return (formGroup: any) => {
      const startDate = formGroup.get('startDate')?.value;
      const endDate = formGroup.get('endDate')?.value;
      
      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        formGroup.get('endDate')?.setErrors({ dateRange: 'End date must be after start date' });
      }
      
      return null;
    };
  }

  /**
   * Creates a conditional required validator
   */
  static conditionalRequired(condition: () => boolean) {
    return (control: any) => {
      if (condition() && (!control.value || control.value.toString().trim() === '')) {
        return { required: true };
      }
      return null;
    };
  }

  /**
   * Validates URL format
   */
  static urlValidator() {
    return (control: any) => {
      const url = control.value;
      if (!url) return null;
      
      try {
        new URL(url);
        return null;
      } catch {
        return { urlInvalid: 'Please enter a valid URL' };
      }
    };
  }

  /**
   * Validates alphanumeric string
   */
  static alphanumericValidator() {
    return (control: any) => {
      const value = control.value;
      if (!value) return null;
      
      const alphanumericRegex = /^[a-zA-Z0-9]+$/;
      if (!alphanumericRegex.test(value)) {
        return { alphanumeric: 'Only alphanumeric characters are allowed' };
      }
      
      return null;
    };
  }

  /**
   * Validates against blacklisted values
   */
  static blacklistValidator(blacklistedValues: string[]) {
    return (control: any) => {
      const value = control.value;
      if (!value) return null;
      
      if (blacklistedValues.includes(value.toLowerCase())) {
        return { blacklisted: 'This value is not allowed' };
      }
      
      return null;
    };
  }

  /**
   * Validates minimum age
   */
  static minAgeValidator(minAge: number) {
    return (control: any) => {
      const birthDate = control.value;
      if (!birthDate) return null;
      
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      if (age < minAge) {
        return { minAge: `Must be at least ${minAge} years old` };
      }
      
      return null;
    };
  }

  /**
   * Validates maximum file size
   */
  static maxFileSizeValidator(maxSizeInMB: number) {
    return (control: any) => {
      const file = control.value;
      if (!file) return null;
      
      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        return { maxFileSize: `File size cannot exceed ${maxSizeInMB}MB` };
      }
      
      return null;
    };
  }

  /**
   * Validates file type
   */
  static fileTypeValidator(allowedTypes: string[]) {
    return (control: any) => {
      const file = control.value;
      if (!file) return null;
      
      if (!allowedTypes.some(type => file.type.startsWith(type))) {
        return { fileType: 'File type not allowed' };
      }
      
      return null;
    };
  }
}