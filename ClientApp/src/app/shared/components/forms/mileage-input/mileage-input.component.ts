import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, forwardRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface MileageInputConfig {
  unit?: 'km' | 'miles';
  decimalPlaces?: number;
  maxValue?: number;
  minValue?: number;
  showUnit?: boolean;
  showHistory?: boolean;
  allowNegative?: boolean;
  validation?: {
    required?: boolean;
    maxValue?: number;
    minValue?: number;
    stepSize?: number;
    reasonableMileage?: boolean;
    customValidator?: (value: number, unit: string) => boolean | string;
  };
  placeholder?: string;
  helpText?: string;
}

export interface MileageHistoryEntry {
  date: Date;
  mileage: number;
  unit: 'km' | 'miles';
  notes?: string;
  source?: 'manual' | 'imported' | 'integration';
}

@Component({
  selector: 'app-mileage-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => MileageInputComponent),
    multi: true
  }],
  template: `
    <div class="mileage-input-container">
      <!-- Input Field -->
      <div class="relative">
        <div class="relative rounded-md shadow-sm">
          <input
            #mileageInput
            [id]="id"
            type="number"
            [formControl]="control"
            [placeholder]="placeholder"
            [step]="stepSize"
            [min]="minValue"
            [max]="maxValue"
            [disabled]="disabled"
            [readonly]="readonly"
            [ngClass]="inputClassName"
            (focus)="onFocus()"
            (blur)="onBlur()"
            (keydown)="onKeyDown($event)"
            (input)="onInput($event)"
            class="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
          
          <!-- Unit Display -->
          <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none" *ngIf="showUnit">
            <span class="text-gray-500 dark:text-gray-400 sm:text-sm">
              {{ unit === 'km' ? 'km' : 'mi' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Help Text -->
      <p *ngIf="helpText" class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        {{ helpText }}
      </p>

      <!-- Quick Action Buttons -->
      <div *ngIf="showQuickActions" class="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          (click)="setPreviousMileage()"
          class="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Use Previous
        </button>
        
        <button
          type="button"
          (click)="addMileageIncrement()"
          class="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          +{{ stepSize }}
        </button>
        
        <button
          type="button"
          (click)="subtractMileageIncrement()"
          class="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          -{{ stepSize }}
        </button>
      </div>

      <!-- Mileage History -->
      <div *ngIf="showHistory && mileageHistory.length > 0" class="mt-4">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white">Recent Entries</h4>
          <button
            type="button"
            (click)="toggleHistory()"
            class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500"
          >
            {{ showHistoryDetails ? 'Hide' : 'Show' }} History
          </button>
        </div>
        
        <div *ngIf="showHistoryDetails" class="mt-2 space-y-2 max-h-40 overflow-y-auto">
          <div *ngFor="let entry of mileageHistory.slice(0, 5); trackBy: trackByEntry" 
               class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ formatMileage(entry.mileage) }} {{ entry.unit }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ entry.date | date:'short' }}
                <span *ngIf="entry.notes" class="ml-2">• {{ entry.notes }}</span>
              </p>
            </div>
            <button
              type="button"
              (click)="useHistoryEntry(entry)"
              class="ml-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500"
            >
              Use
            </button>
          </div>
        </div>
      </div>

      <!-- Conversion Calculator -->
      <div *ngIf="showConversionCalculator" class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Quick Conversion</h4>
        <div class="text-sm text-blue-800 dark:text-blue-200">
          <span *ngIf="control.value">
            {{ formatMileage(control.value) }} {{ unit }} = 
            {{ formatMileage(convertToUnit(control.value, unit === 'km' ? 'miles' : 'km')) }} {{ unit === 'km' ? 'mi' : 'km' }}
          </span>
          <span *ngIf="!control.value" class="text-gray-500 dark:text-gray-400">
            Enter mileage to see conversion
          </span>
        </div>
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
    .mileage-input-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    
    .mileage-input-small {
      @apply text-sm;
    }
    
    .mileage-input-large {
      @apply text-lg;
    }
    
    .input-error {
      @apply border-red-300 focus:border-red-500 focus:ring-red-500;
    }
    
    .input-success {
      @apply border-green-300 focus:border-green-500 focus:ring-green-500;
    }
  `]
})
export class MileageInputComponent implements ControlValueAccessor, OnInit, OnDestroy {
  @ViewChild('mileageInput') mileageInput!: ElementRef<HTMLInputElement>;
  
  @Input() id = `mileage-input-${Math.random().toString(36).substr(2, 9)}`;
  @Input() config: MileageInputConfig = {};
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() placeholder = 'Enter mileage';
  @Input() helpText = '';
  
  @Output() mileageChange = new EventEmitter<number | null>();
  @Output() mileageBlur = new EventEmitter<number | null>();
  @Output() unitChange = new EventEmitter<'km' | 'miles'>();

  // ControlValueAccessor
  private onChange = (value: number | null) => {};
  private onTouched = () => {};
  private isDisabled = false;

  control = new FormControl<number | null>(null);
  
  private destroy$ = new Subject<void>();
  
  // Configuration
  unit: 'km' | 'miles' = 'miles';
  decimalPlaces = 0;
  minValue: number | null = null;
  maxValue: number | null = null;
  showUnit = true;
  showHistory = false;
  showQuickActions = true;
  showConversionCalculator = false;
  allowNegative = false;
  stepSize = 1;
  placeholder = 'Enter mileage';
  
  // History
  mileageHistory: MileageHistoryEntry[] = [];
  showHistoryDetails = false;
  
  // Validation
  showError = false;
  showSuccess = false;
  errorMessage = '';
  successMessage = '';

  constructor() {}

  ngOnInit(): void {
    this.initializeConfig();
    this.setupControlValidation();
    this.loadMileageHistory();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========== ControlValueAccessor ==========

  writeValue(value: number | null): void {
    this.control.setValue(value);
    this.updateValidationState();
  }

  registerOnChange(fn: (value: number | null) => void): void {
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
    const defaults: Partial<MileageInputConfig> = {
      unit: 'miles',
      decimalPlaces: 0,
      showUnit: true,
      showHistory: false,
      showQuickActions: true,
      allowNegative: false,
      placeholder: 'Enter mileage',
      stepSize: 1
    };

    this.config = { ...defaults, ...this.config };
    this.unit = this.config.unit!;
    this.decimalPlaces = this.config.decimalPlaces!;
    this.minValue = this.config.minValue ?? 0;
    this.maxValue = this.config.maxValue ?? null;
    this.showUnit = this.config.showUnit!;
    this.showHistory = this.config.showHistory!;
    this.showQuickActions = this.config.showQuickActions!;
    this.allowNegative = this.config.allowNegative!;
    this.stepSize = this.config.stepSize!;
    this.placeholder = this.config.placeholder!;
    this.helpText = this.config.helpText || '';
  }

  private setupControlValidation(): void {
    const validators = [];
    
    if (this.config.validation?.required) {
      validators.push(Validators.required);
    }
    
    if (this.config.validation?.minValue !== undefined) {
      validators.push(Validators.min(this.config.validation.minValue));
    }
    
    if (this.config.validation?.maxValue !== undefined) {
      validators.push(Validators.max(this.config.validation.maxValue));
    }
    
    if (this.config.validation?.reasonableMileage) {
      validators.push((control: any) => {
        const value = control.value;
        if (!value || value < 0) return null;
        
        // Basic sanity check: car mileage should be reasonable
        if (value > 500000) { // More than 500,000 units
          return { unreasonableMileage: true };
        }
        
        if (this.unit === 'miles' && value > 300000) {
          return { unreasonableMileage: true };
        }
        
        return null;
      });
    }
    
    if (this.config.validation?.customValidator) {
      validators.push((control: any) => {
        const value = control.value;
        if (value === null || value === undefined) return null;
        return this.config.validation!.customValidator!(value, this.unit);
      });
    }
    
    // Only allow negative if explicitly configured
    if (!this.allowNegative) {
      validators.push(Validators.min(0));
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
    this.mileageBlur.emit(value);
    this.saveToHistory(value);
    this.updateValidationState();
  }

  onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        this.incrementMileage();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.decrementMileage();
        break;
      case 'Enter':
        this.onBlur();
        break;
    }
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = parseFloat(target.value);
    
    if (!isNaN(value)) {
      this.onChange(value);
      this.mileageChange.emit(value);
    } else if (target.value === '') {
      this.onChange(null);
      this.mileageChange.emit(null);
    }
    
    this.updateValidationState();
  }

  // ========== Mileage Operations ==========

  incrementMileage(): void {
    const currentValue = this.control.value || 0;
    const newValue = currentValue + this.stepSize;
    this.setMileage(newValue);
  }

  decrementMileage(): void {
    const currentValue = this.control.value || 0;
    const newValue = Math.max(0, currentValue - this.stepSize);
    this.setMileage(newValue);
  }

  setMileage(value: number | null): void {
    this.control.setValue(value);
    this.onChange(value);
    this.mileageChange.emit(value);
    this.updateValidationState();
  }

  addMileageIncrement(): void {
    this.incrementMileage();
    this.mileageInput.nativeElement.focus();
  }

  subtractMileageIncrement(): void {
    this.decrementMileage();
    this.mileageInput.nativeElement.focus();
  }

  setPreviousMileage(): void {
    if (this.mileageHistory.length > 0) {
      const previousEntry = this.mileageHistory[0];
      this.setMileage(previousEntry.mileage);
      this.unit = previousEntry.unit;
      this.unitChange.emit(this.unit);
    }
  }

  useHistoryEntry(entry: MileageHistoryEntry): void {
    this.setMileage(entry.mileage);
    this.unit = entry.unit;
    this.unitChange.emit(this.unit);
  }

  // ========== Unit Conversion ==========

  convertToUnit(value: number, targetUnit: 'km' | 'miles'): number {
    if (this.unit === targetUnit) return value;
    
    if (this.unit === 'km' && targetUnit === 'miles') {
      return value * 0.621371; // km to miles
    } else if (this.unit === 'miles' && targetUnit === 'km') {
      return value * 1.60934; // miles to km
    }
    
    return value;
  }

  toggleUnit(): void {
    const newUnit = this.unit === 'km' ? 'miles' : 'km';
    const currentValue = this.control.value;
    
    if (currentValue !== null) {
      // Convert the value to new unit
      const convertedValue = this.convertToUnit(currentValue, newUnit);
      this.setMileage(Math.round(convertedValue * Math.pow(10, this.decimalPlaces)) / Math.pow(10, this.decimalPlaces));
    }
    
    this.unit = newUnit;
    this.unitChange.emit(this.unit);
    this.updateValidationState();
  }

  // ========== History Management ==========

  private loadMileageHistory(): void {
    const saved = localStorage.getItem(`mileage-history-${this.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.mileageHistory = parsed.map((entry: any) => ({
          ...entry,
          date: new Date(entry.date)
        }));
      } catch (error) {
        console.error('Failed to parse mileage history:', error);
        this.mileageHistory = [];
      }
    }
  }

  private saveToHistory(value: number | null): void {
    if (value === null || value === undefined) return;
    
    const entry: MileageHistoryEntry = {
      date: new Date(),
      mileage: value,
      unit: this.unit,
      source: 'manual'
    };
    
    // Add to beginning of history
    this.mileageHistory.unshift(entry);
    
    // Keep only last 50 entries
    this.mileageHistory = this.mileageHistory.slice(0, 50);
    
    // Save to localStorage
    localStorage.setItem(`mileage-history-${this.id}`, JSON.stringify(this.mileageHistory));
  }

  clearHistory(): void {
    this.mileageHistory = [];
    localStorage.removeItem(`mileage-history-${this.id}`);
  }

  toggleHistory(): void {
    this.showHistoryDetails = !this.showHistoryDetails;
  }

  // ========== Validation ==========

  private updateValidationState(): void {
    this.showError = this.control.invalid && this.control.touched;
    this.showSuccess = this.control.valid && this.control.touched;
    this.errorMessage = this.getErrorMessage();
    this.successMessage = this.getSuccessMessage();
  }

  private getErrorMessage(): string {
    const errors = this.control.errors;
    if (!errors) return '';
    
    if (errors['required']) return 'Mileage is required';
    if (errors['min']) return `Mileage must be at least ${errors['min'].min}`;
    if (errors['max']) return `Mileage must not exceed ${errors['max'].max}`;
    if (errors['unreasonableMileage']) return 'Mileage value seems unreasonable';
    if (errors['customValidator']) {
      const result = this.config.validation!.customValidator!(this.control.value!, this.unit);
      return typeof result === 'string' ? result : 'Invalid mileage value';
    }
    
    return 'Invalid mileage value';
  }

  private getSuccessMessage(): string {
    if (this.control.valid && this.control.value !== null) {
      return 'Mileage value is valid';
    }
    return '';
  }

  // ========== Utility Methods ==========

  formatMileage(value: number): string {
    return value.toFixed(this.decimalPlaces);
  }

  trackByEntry(index: number, entry: MileageHistoryEntry): string {
    return entry.date.getTime().toString();
  }

  // ========== Computed Properties ==========

  get inputClassName(): string {
    const baseClass = 'pl-3 pr-12 py-2 border shadow-sm focus:outline-none focus:ring-1 sm:text-sm';
    
    if (this.disabled) {
      return `${baseClass} bg-gray-100 dark:bg-gray-800 cursor-not-allowed border-gray-300 dark:border-gray-600`;
    }
    
    if (this.showError) {
      return `${baseClass} input-error`;
    }
    
    if (this.showSuccess) {
      return `${baseClass} input-success`;
    }
    
    if (this.readonly) {
      return `${baseClass} bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600`;
    }
    
    return `${baseClass} border-gray-300 dark:border-gray-600`;
  }
}