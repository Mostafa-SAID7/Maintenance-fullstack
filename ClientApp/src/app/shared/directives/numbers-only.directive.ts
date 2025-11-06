import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appNumbersOnly]',
  standalone: true
})
export class NumbersOnlyDirective {
  @Input() allowDecimal = false;
  @Input() allowNegative = false;

  constructor(private el: ElementRef<HTMLInputElement>) {}

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    
    // Remove non-numeric characters
    let newValue = value;
    
    if (!this.allowDecimal && !this.allowNegative) {
      // Only whole numbers
      newValue = value.replace(/[^0-9]/g, '');
    } else if (this.allowDecimal && !this.allowNegative) {
      // Positive numbers with decimals
      newValue = value.replace(/[^0-9.]/g, '');
      // Ensure only one decimal point
      const parts = newValue.split('.');
      if (parts.length > 2) {
        newValue = parts[0] + '.' + parts.slice(1).join('');
      }
    } else if (!this.allowDecimal && this.allowNegative) {
      // Negative whole numbers
      newValue = value.replace(/[^0-9-]/g, '');
      // Ensure only one minus sign at the beginning
      newValue = newValue.replace(/(?!^)-/g, '');
    } else {
      // Positive and negative numbers with decimals
      newValue = value.replace(/[^0-9.-]/g, '');
      // Ensure only one decimal point and one minus sign at the beginning
      const parts = newValue.split('.');
      if (parts.length > 2) {
        newValue = parts[0] + '.' + parts.slice(1).join('');
      }
      newValue = newValue.replace(/(?!^)-/g, '');
    }
    
    if (value !== newValue) {
      input.value = newValue;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
}