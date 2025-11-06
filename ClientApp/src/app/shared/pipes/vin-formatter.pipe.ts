import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'vinFormatter',
  standalone: true
})
export class VinFormatterPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value || value.length === 0) {
      return '';
    }

    // VIN should be 17 characters long
    const vin = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (vin.length !== 17) {
      return vin; // Return as-is if not exactly 17 characters
    }

    // Format as groups: XXXX XXXXX XXXXXXX
    return `${vin.slice(0, 4)} ${vin.slice(4, 9)} ${vin.slice(9, 17)}`;
  }
}