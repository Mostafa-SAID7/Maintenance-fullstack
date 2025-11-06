import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class DateRangeValidator {
  static minDate(minDate: Date): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      
      if (!value) {
        return null; // Let required validator handle empty values
      }

      const selectedDate = new Date(value);
      
      if (selectedDate < minDate) {
        return { dateMin: `Date must be on or after ${minDate.toLocaleDateString()}` };
      }

      return null;
    };
  }

  static maxDate(maxDate: Date): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      
      if (!value) {
        return null; // Let required validator handle empty values
      }

      const selectedDate = new Date(value);
      
      if (selectedDate > maxDate) {
        return { dateMax: `Date must be on or before ${maxDate.toLocaleDateString()}` };
      }

      return null;
    };
  }

  static range(minDate: Date, maxDate: Date): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      
      if (!value) {
        return null; // Let required validator handle empty values
      }

      const selectedDate = new Date(value);
      
      if (selectedDate < minDate) {
        return { dateMin: `Date must be on or after ${minDate.toLocaleDateString()}` };
      }

      if (selectedDate > maxDate) {
        return { dateMax: `Date must be on or before ${maxDate.toLocaleDateString()}` };
      }

      return null;
    };
  }

  static notInPast(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      
      if (!value) {
        return null;
      }

      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      
      if (selectedDate < today) {
        return { dateInPast: 'Date cannot be in the past' };
      }

      return null;
    };
  }

  static notInFuture(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      
      if (!value) {
        return null;
      }

      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Set to end of day
      
      if (selectedDate > today) {
        return { dateInFuture: 'Date cannot be in the future' };
      }

      return null;
    };
  }

  static before(endDateControlName: string): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const startDateControl = group.get('startDate');
      const endDateControl = group.get(endDateControlName);
      
      if (!startDateControl || !endDateControl) {
        return null;
      }

      const startDate = new Date(startDateControl.value);
      const endDate = new Date(endDateControl.value);
      
      if (startDate >= endDate) {
        endDateControl.setErrors({ dateBefore: 'End date must be after start date' });
        return { dateRangeInvalid: 'Start date must be before end date' };
      }

      // Clear the error if it was previously set
      if (endDateControl.errors?.['dateBefore']) {
        const errors = { ...endDateControl.errors };
        delete errors['dateBefore'];
        endDateControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }

      return null;
    };
  }

  static after(startDateControlName: string): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const startDateControl = group.get(startDateControlName);
      const endDateControl = group.get('endDate');
      
      if (!startDateControl || !endDateControl) {
        return null;
      }

      const startDate = new Date(startDateControl.value);
      const endDate = new Date(endDateControl.value);
      
      if (endDate <= startDate) {
        startDateControl.setErrors({ dateAfter: 'Start date must be before end date' });
        return { dateRangeInvalid: 'End date must be after start date' };
      }

      // Clear the error if it was previously set
      if (startDateControl.errors?.['dateAfter']) {
        const errors = { ...startDateControl.errors };
        delete errors['dateAfter'];
        startDateControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }

      return null;
    };
  }

  static withinDays(days: number, referenceDate: Date = new Date()): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      
      if (!value) {
        return null;
      }

      const selectedDate = new Date(value);
      const minDate = new Date(referenceDate);
      const maxDate = new Date(referenceDate);
      
      minDate.setDate(minDate.getDate() - days);
      maxDate.setDate(maxDate.getDate() + days);
      
      if (selectedDate < minDate || selectedDate > maxDate) {
        return { 
          dateRange: `Date must be within ${days} days of ${referenceDate.toLocaleDateString()}` 
        };
      }

      return null;
    };
  }

  static weekendAllowed(allowed: boolean = false): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      
      if (!value) {
        return null;
      }

      const selectedDate = new Date(value);
      const dayOfWeek = selectedDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
      
      if (isWeekend && !allowed) {
        return { dateWeekend: 'Weekend dates are not allowed' };
      }

      return null;
    };
  }

  static businessDaysOnly(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      
      if (!value) {
        return null;
      }

      const selectedDate = new Date(value);
      const dayOfWeek = selectedDate.getDay();
      
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
        return { dateBusinessDay: 'Only business days (Monday-Friday) are allowed' };
      }

      return null;
    };
  }

  static maxRange(days: number): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const startDateControl = group.get('startDate');
      const endDateControl = group.get('endDate');
      
      if (!startDateControl || !endDateControl) {
        return null;
      }

      const startDate = new Date(startDateControl.value);
      const endDate = new Date(endDateControl.value);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return null;
      }

      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > days) {
        return { dateRangeMax: `Date range cannot exceed ${days} days` };
      }

      return null;
    };
  }
}