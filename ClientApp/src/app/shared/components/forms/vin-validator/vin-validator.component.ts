import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, forwardRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface VINValidationConfig {
  country?: string;
  manufacturer?: string;
  allowPartial?: boolean;
  autoFormat?: boolean;
  showSuggestions?: boolean;
  showDecodedInfo?: boolean;
  validation?: {
    required?: boolean;
    autoCorrect?: boolean;
    customValidator?: (vin: string, config: VINValidationConfig) => boolean | string;
  };
  placeholder?: string;
  helpText?: string;
}

export interface VINDecodedInfo {
  manufacturer: string;
  country: string;
  plant: string;
  modelYear: number;
  serialNumber: string;
  engineType?: string;
  transmission?: string;
  bodyType?: string;
}

export interface VINSuggestion {
  vin: string;
  vehicle: string;
  year: number;
  manufacturer: string;
}

@Component({
  selector: 'app-vin-validator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => VINValidatorComponent),
    multi: true
  }],
  template: `
    <div class="vin-validator-container">
      <!-- Input Field -->
      <div class="relative">
        <input
          #vinInput
          [id]="id"
          type="text"
          [formControl]="control"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [readonly]="readonly"
          [ngClass]="inputClassName"
          (focus)="onFocus()"
          (blur)="onBlur()"
          (keydown)="onKeyDown($event)"
          (input)="onInput($event)"
          class="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white uppercase tracking-wider"
          maxlength="17"
          autocomplete="off"
        />
        
        <!-- Validation Indicator -->
        <div class="absolute inset-y-0 right-0 flex items-center pr-3">
          <div *ngIf="control.value && control.value.length > 0" class="flex items-center">
            <!-- Valid VIN -->
            <div *ngIf="isValidVIN" class="flex items-center">
              <svg class="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span class="ml-1 text-xs text-green-600 dark:text-green-400">Valid</span>
            </div>
            
            <!-- Invalid VIN -->
            <div *ngIf="control.value && control.value.length >= 10 && !isValidVIN && isVINComplete" class="flex items-center">
              <svg class="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
              <span class="ml-1 text-xs text-red-600 dark:text-red-400">Invalid</span>
            </div>
            
            <!-- Partially Valid -->
            <div *ngIf="control.value && !isVINComplete" class="flex items-center">
              <svg class="h-5 w-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
              <span class="ml-1 text-xs text-yellow-600 dark:text-yellow-400">{{ control.value.length }}/17</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Help Text -->
      <p *ngIf="helpText" class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        {{ helpText }}
      </p>

      <!-- VIN Suggestions -->
      <div *ngIf="showSuggestions && vinSuggestions.length > 0" class="mt-3">
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Suggested VINs</h4>
        <div class="space-y-2 max-h-40 overflow-y-auto">
          <div *ngFor="let suggestion of vinSuggestions; trackBy: trackBySuggestion" 
               (click)="useSuggestion(suggestion)"
               class="p-2 bg-gray-50 dark:bg-gray-800 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
            <div class="flex justify-between items-start">
              <div>
                <p class="text-sm font-mono font-medium text-gray-900 dark:text-white">{{ suggestion.vin }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ suggestion.vehicle }}</p>
              </div>
              <span class="text-xs text-gray-400">{{ suggestion.year }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- VIN Decoded Info -->
      <div *ngIf="showDecodedInfo && decodedInfo" class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Vehicle Information</h4>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span class="text-blue-700 dark:text-blue-300">Manufacturer:</span>
            <span class="ml-1 text-blue-900 dark:text-blue-100">{{ decodedInfo.manufacturer }}</span>
          </div>
          <div>
            <span class="text-blue-700 dark:text-blue-300">Country:</span>
            <span class="ml-1 text-blue-900 dark:text-blue-100">{{ decodedInfo.country }}</span>
          </div>
          <div>
            <span class="text-blue-700 dark:text-blue-300">Plant:</span>
            <span class="ml-1 text-blue-900 dark:text-blue-100">{{ decodedInfo.plant }}</span>
          </div>
          <div>
            <span class="text-blue-700 dark:text-blue-300">Model Year:</span>
            <span class="ml-1 text-blue-900 dark:text-blue-100">{{ decodedInfo.modelYear }}</span>
          </div>
          <div>
            <span class="text-blue-700 dark:text-blue-300">Serial:</span>
            <span class="ml-1 text-blue-900 dark:text-blue-100">{{ decodedInfo.serialNumber }}</span>
          </div>
          <div *ngIf="decodedInfo.engineType">
            <span class="text-blue-700 dark:text-blue-300">Engine:</span>
            <span class="ml-1 text-blue-900 dark:text-blue-100">{{ decodedInfo.engineType }}</span>
          </div>
        </div>
      </div>

      <!-- Character Count -->
      <div class="mt-2 flex justify-between items-center">
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ control.value ? control.value.length : 0 }}/17 characters
        </p>
        <p class="text-xs text-gray-400 dark:text-gray-500">
          Uppercase letters and numbers only
        </p>
      </div>

      <!-- Error Message -->
      <div *ngIf="showError" class="mt-2">
        <p class="text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>
      </div>

      <!-- Success Message -->
      <div *ngIf="showSuccess" class="mt-2">
        <p class="text-sm text-green-600 dark:text-green-400">{{ successMessage }}</p>
      </div>
    </div>
  `,
  styles: [`
    .vin-validator-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    
    .input-error {
      @apply border-red-300 focus:border-red-500 focus:ring-red-500;
    }
    
    .input-success {
      @apply border-green-300 focus:border-green-500 focus:ring-green-500;
    }
    
    .input-warning {
      @apply border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500;
    }
  `]
})
export class VINValidatorComponent implements ControlValueAccessor, OnInit, OnDestroy {
  @ViewChild('vinInput') vinInput!: ElementRef<HTMLInputElement>;
  
  @Input() id = `vin-validator-${Math.random().toString(36).substr(2, 9)}`;
  @Input() config: VINValidationConfig = {};
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() placeholder = 'Enter 17-character VIN';
  @Input() helpText = '';
  
  @Output() vinChange = new EventEmitter<string | null>();
  @Output() vinBlur = new EventEmitter<string | null>();
  @Output() vinValidation = new EventEmitter<{ vin: string; isValid: boolean; decodedInfo?: VINDecodedInfo }>();

  // ControlValueAccessor
  private onChange = (value: string | null) => {};
  private onTouched = () => {};
  private isDisabled = false;

  control = new FormControl<string | null>(null);
  
  private destroy$ = new Subject<void>();
  
  // VIN state
  isValidVIN = false;
  isVINComplete = false;
  decodedInfo: VINDecodedInfo | null = null;
  vinSuggestions: VINSuggestion[] = [];
  
  // Configuration
  allowPartial = false;
  autoFormat = true;
  showSuggestions = false;
  showDecodedInfo = true;
  placeholder = 'Enter 17-character VIN';
  
  // Validation
  showError = false;
  showSuccess = false;
  errorMessage = '';
  successMessage = '';

  // VIN checking utilities
  private readonly forbiddenChars = ['I', 'O', 'Q'];
  private readonly countryCodes: { [key: string]: string } = {
    'A-H': 'Africa',
    'J-R': 'Asia',
    'S-Z': 'Europe',
    '1-5': 'North America',
    '6-7': 'Oceania',
    '8-9': 'South America'
  };

  constructor() {}

  ngOnInit(): void {
    this.initializeConfig();
    this.setupControlValidation();
    this.loadVINSuggestions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========== ControlValueAccessor ==========

  writeValue(value: string | null): void {
    this.control.setValue(value);
    this.updateValidationState();
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.disabled = isDisabled;
  }

  // ========== Configuration ==========

  private initializeConfig(): void {
    const defaults: Partial<VINValidationConfig> = {
      allowPartial: false,
      autoFormat: true,
      showSuggestions: false,
      showDecodedInfo: true,
      placeholder: 'Enter 17-character VIN'
    };

    this.config = { ...defaults, ...this.config };
    this.allowPartial = this.config.allowPartial!;
    this.autoFormat = this.config.autoFormat!;
    this.showSuggestions = this.config.showSuggestions!;
    this.showDecodedInfo = this.config.showDecodedInfo!;
    this.placeholder = this.config.placeholder!;
    this.helpText = this.config.helpText || '';
  }

  private setupControlValidation(): void {
    const validators = [];
    
    if (this.config.validation?.required) {
      validators.push(Validators.required);
    }
    
    if (!this.allowPartial) {
      validators.push((control: any) => {
        const value = control.value;
        if (!value) return null;
        return value.length === 17 ? null : { incompleteVIN: true };
      });
    }
    
    if (this.config.validation?.customValidator) {
      validators.push((control: any) => {
        const value = control.value;
        if (!value) return null;
        return this.config.validation!.customValidator!(value, this.config);
      });
    }

    this.control.setValidators(validators);
    
    this.control.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateValidationState();
      });
  }

  // ========== Event Handlers ==========

  onFocus(): void {
    this.onTouched();
  }

  onBlur(): void {
    const value = this.control.value;
    this.vinBlur.emit(value);
    this.updateValidationState();
  }

  onKeyDown(event: KeyboardEvent): void {
    // Prevent certain keys
    if (['I', 'i', 'O', 'o', 'Q', 'q'].includes(event.key)) {
      event.preventDefault();
      return;
    }
    
    // Auto-format on certain inputs
    if (this.autoFormat && event.key.length === 1) {
      setTimeout(() => {
        this.formatVIN();
      }, 0);
    }
    
    // Navigation keys
    switch (event.key) {
      case 'Enter':
        this.validateAndDecode();
        break;
    }
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    let value = target.value.toUpperCase();
    
    // Remove forbidden characters
    this.forbiddenChars.forEach(char => {
      value = value.replace(new RegExp(char, 'g'), '');
    });
    
    // Limit to 17 characters
    if (value.length > 17) {
      value = value.substring(0, 17);
    }
    
    this.control.setValue(value);
    this.onChange(value);
    this.vinChange.emit(value);
    
    this.updateVINState();
    this.updateValidationState();
  }

  // ========== VIN Processing ==========

  private formatVIN(): void {
    const value = this.control.value;
    if (!value || !this.autoFormat) return;
    
    // Remove spaces and special characters, convert to uppercase
    let formatted = value.replace(/[^A-Z0-9]/g, '').toUpperCase();
    
    // Remove forbidden characters
    this.forbiddenChars.forEach(char => {
      formatted = formatted.replace(new RegExp(char, 'g'), '');
    });
    
    // Limit to 17 characters
    if (formatted.length > 17) {
      formatted = formatted.substring(0, 17);
    }
    
    if (formatted !== value) {
      this.control.setValue(formatted);
      this.onChange(formatted);
      this.vinChange.emit(formatted);
      this.updateVINState();
    }
  }

  private updateVINState(): void {
    const value = this.control.value || '';
    this.isVINComplete = value.length === 17;
    this.isValidVIN = this.isVINComplete ? this.validateVINStructure(value) : false;
    
    if (this.isValidVIN) {
      this.decodeVIN(value);
    } else {
      this.decodedInfo = null;
    }
    
    this.vinValidation.emit({
      vin: value,
      isValid: this.isValidVIN,
      decodedInfo: this.decodedInfo || undefined
    });
  }

  private validateVINStructure(vin: string): boolean {
    if (vin.length !== 17) return false;
    
    // Check for forbidden characters
    for (const char of vin) {
      if (this.forbiddenChars.includes(char)) {
        return false;
      }
    }
    
    // Basic structure validation
    const validPattern = /^[A-HJ-NPR-Z0-9]{17}$/;
    return validPattern.test(vin);
  }

  private decodeVIN(vin: string): void {
    // Basic VIN decoding (simplified)
    const manufacturerCode = vin.substring(0, 3);
    const wmi = manufacturerCode; // World Manufacturer Identifier
    
    const modelYearCode = vin.substring(9, 10);
    const modelYear = this.decodeModelYear(modelYearCode);
    
    const plantCode = vin.substring(10, 11);
    const serialNumber = vin.substring(11, 17);
    
    const manufacturer = this.decodeManufacturer(wmi);
    const country = this.decodeCountry(wmi);
    const plant = this.decodePlant(plantCode);
    
    this.decodedInfo = {
      manufacturer,
      country,
      plant,
      modelYear,
      serialNumber
    };
  }

  private decodeManufacturer(wmi: string): string {
    // Simplified manufacturer lookup
    const manufacturers: { [key: string]: string } = {
      '1HG': 'Honda',
      '1FA': 'Ford',
      '1FT': 'Ford',
      '1G1': 'Chevrolet',
      '1GC': 'Chevrolet',
      'JTD': 'Toyota',
      'JTM': 'Toyota',
      'JM1': 'Mazda',
      'JN1': 'Nissan',
      'JHM': 'Honda',
      'WDB': 'Mercedes-Benz',
      'WAU': 'Audi',
      'WVW': 'Volkswagen',
      'SAJ': 'Jaguar',
      'SAL': 'Land Rover'
    };
    
    return manufacturers[wmi] || `Unknown (${wmi})`;
  }

  private decodeCountry(wmi: string): string {
    const firstChar = wmi.charAt(0);
    for (const [range, country] of Object.entries(this.countryCodes)) {
      const [start, end] = range.split('-');
      if (firstChar >= start && firstChar <= end) {
        return country;
      }
    }
    return 'Unknown';
  }

  private decodePlant(plantCode: string): string {
    const plants: { [key: string]: string } = {
      'A': 'Alabama',
      'B': 'Brazil',
      'C': 'Ontario',
      'F': 'Ohio',
      'G': 'Ontario',
      'H': 'Honda Plant',
      'K': 'Korea',
      'L': 'Kentucky',
      'M': 'Mexico',
      'N': 'Mississippi',
      'S': 'UK',
      'T': 'Texas',
      'U': 'Hungary',
      'V': 'France',
      'W': 'Germany',
      'Y': 'Sweden'
    };
    
    return plants[plantCode] || `Unknown (${plantCode})`;
  }

  private decodeModelYear(yearCode: string): number {
    const currentYear = new Date().getFullYear();
    const currentCentury = Math.floor(currentYear / 100) * 100;
    const currentYearInCentury = currentYear % 100;
    
    const yearMap: { [key: string]: number } = {
      'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014,
      'F': 2015, 'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019,
      'L': 2020, 'M': 2021, 'N': 2022, 'P': 2023, 'R': 2024,
      'S': 2025, 'T': 2026, 'V': 2027, 'W': 2028, 'X': 2029,
      'Y': 2030
    };
    
    let decodedYear = yearMap[yearCode];
    if (!decodedYear) {
      // For older codes, we need to calculate
      const code = yearCode.charCodeAt(0) - 'A'.charCodeAt(0);
      const yearInSequence = (code * 10) % 100;
      decodedYear = currentCentury + yearInSequence;
      
      // Adjust for future dates
      if (decodedYear > currentYear) {
        decodedYear -= 100;
      }
    }
    
    return decodedYear;
  }

  private validateAndDecode(): void {
    const vin = this.control.value;
    if (vin && vin.length === 17) {
      this.isValidVIN = this.validateVINStructure(vin);
      if (this.isValidVIN) {
        this.decodeVIN(vin);
      }
    }
  }

  // ========== Suggestions ==========

  private loadVINSuggestions(): void {
    if (!this.showSuggestions) return;
    
    // In a real app, this would be loaded from a service
    this.vinSuggestions = [];
  }

  useSuggestion(suggestion: VINSuggestion): void {
    this.control.setValue(suggestion.vin);
    this.onChange(suggestion.vin);
    this.vinChange.emit(suggestion.vin);
    this.updateVINState();
    this.vinInput.nativeElement.blur();
  }

  // ========== Validation ==========

  private updateValidationState(): void {
    const hasValue = !!this.control.value;
    this.showError = this.control.invalid && this.control.touched;
    this.showSuccess = hasValue && this.isValidVIN;
    this.errorMessage = this.getErrorMessage();
    this.successMessage = this.getSuccessMessage();
  }

  private getErrorMessage(): string {
    const errors = this.control.errors;
    if (!errors) return '';
    
    if (errors['required']) return 'VIN is required';
    if (errors['incompleteVIN']) return 'VIN must be exactly 17 characters';
    if (errors['forbiddenChar']) return 'VIN cannot contain I, O, or Q';
    if (errors['customValidator']) {
      const result = this.config.validation!.customValidator!(this.control.value!, this.config);
      return typeof result === 'string' ? result : 'Invalid VIN';
    }
    
    return 'Invalid VIN format';
  }

  private getSuccessMessage(): string {
    if (this.control.value && this.isValidVIN) {
      return 'Valid VIN format';
    }
    return '';
  }

  // ========== Utility Methods ==========

  trackBySuggestion(index: number, suggestion: VINSuggestion): string {
    return suggestion.vin;
  }

  // ========== Computed Properties ==========

  get inputClassName(): string {
    const baseClass = 'pl-3 pr-20 py-2 border shadow-sm focus:outline-none focus:ring-1 sm:text-sm tracking-wider font-mono';
    
    if (this.disabled) {
      return `${baseClass} bg-gray-100 dark:bg-gray-800 cursor-not-allowed border-gray-300 dark:border-gray-600`;
    }
    
    if (this.showError) {
      return `${baseClass} input-error`;
    }
    
    if (this.showSuccess) {
      return `${baseClass} input-success`;
    }
    
    if (this.control.value && !this.isValidVIN && this.isVINComplete) {
      return `${baseClass} input-warning`;
    }
    
    if (this.readonly) {
      return `${baseClass} bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600`;
    }
    
    return `${baseClass} border-gray-300 dark:border-gray-600`;
  }
}