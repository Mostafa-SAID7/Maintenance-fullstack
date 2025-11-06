import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'mileageFormat',
  standalone: true
})
export class MileageFormatPipe implements PipeTransform {
  transform(value: number | string | null | undefined, unit: string = 'km'): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numericValue)) {
      return '';
    }

    // Format with thousands separator
    const formatted = new Intl.NumberFormat('en-US').format(numericValue);
    
    return `${formatted} ${unit}`;
  }
}