import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, forwardRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface DatePickerConfig {
  format?: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MMM DD, YYYY';
  minDate?: Date | string;
  maxDate?: Date | string;
  disabled?: boolean;
  readonly?: boolean;
  placeholder?: string;
  showTime?: boolean;
  timeFormat?: '12h' | '24h';
  timezone?: string;
  locale?: string;
  theme?: 'light' | 'dark';
  size?: 'small' | 'medium' | 'large';
  validation?: {
    required?: boolean;
    minAge?: number;
    maxAge?: number;
    futureOnly?: boolean;
    pastOnly?: boolean;
    customValidator?: (value: Date) => boolean | string;
  };
}

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DatePickerComponent),
    multi: true
  }],
  template: `
    <div class="date-picker-container" [ngClass]="containerClassName">
      <!-- Input Field -->
      <div class="relative">
        <input
          #dateInput
          [id]="id"
          type="text"
          [formControl]="control"
          [placeholder]="placeholder"
          [readonly]="readonly"
          [disabled]="disabled"
          [ngClass]="inputClassName"
          (focus)="onFocus()"
          (blur)="onBlur()"
          (keydown)="onKeyDown($event)"
          class="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
          autocomplete="off"
        />
        
        <!-- Calendar Icon -->
        <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg class="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      <!-- Calendar Dropdown -->
      <div 
        *ngIf="showCalendar" 
        class="absolute z-10 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg"
        [style.top.px]="calendarTop"
        [style.left.px]="calendarLeft"
      >
        <!-- Calendar Header -->
        <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            type="button"
            (click)="previousMonth()"
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <svg class="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ currentMonthName }} {{ currentYear }}
          </h2>
          
          <button
            type="button"
            (click)="nextMonth()"
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <svg class="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>

        <!-- Year Selector -->
        <div *ngIf="showYearSelector" class="flex items-center justify-center p-4 border-b border-gray-200 dark:border-gray-700">
          <select 
            [value]="currentYear" 
            (change)="selectYear($event.target.value)"
            class="bg-transparent text-lg font-semibold text-gray-900 dark:text-white border-none focus:outline-none"
          >
            <option *ngFor="let year of availableYears" [value]="year">{{ year }}</option>
          </select>
        </div>

        <!-- Calendar Grid -->
        <div class="p-4">
          <!-- Day Headers -->
          <div class="grid grid-cols-7 gap-1 mb-2">
            <div *ngFor="let day of dayHeaders" class="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
              {{ day }}
            </div>
          </div>
          
          <!-- Calendar Days -->
          <div class="grid grid-cols-7 gap-1">
            <!-- Previous month days -->
            <button
              *ngFor="let day of previousMonthDays"
              type="button"
              (click)="selectDate(day.date)"
              class="p-2 text-sm text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              {{ day.day }}
            </button>
            
            <!-- Current month days -->
            <button
              *ngFor="let day of currentMonthDays"
              type="button"
              (click)="selectDate(day.date)"
              [ngClass]="getDayClass(day.date)"
              class="p-2 text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {{ day.day }}
            </button>
            
            <!-- Next month days -->
            <button
              *ngFor="let day of nextMonthDays"
              type="button"
              (click)="selectDate(day.date)"
              class="p-2 text-sm text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              {{ day.day }}
            </button>
          </div>
        </div>

        <!-- Time Selector -->
        <div *ngIf="showTime && selectedDate" class="border-t border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center justify-center space-x-4">
            <div class="flex items-center space-x-2">
              <label class="text-sm text-gray-700 dark:text-gray-300">Hour:</label>
              <select 
                [value]="selectedDate.getHours()" 
                (change)="setHour($event.target.value)"
                class="bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm text-gray-900 dark:text-white"
              >
                <option *ngFor="let hour of hours" [value]="hour">{{ formatHour(hour) }}</option>
              </select>
            </div>
            
            <div class="flex items-center space-x-2">
              <label class="text-sm text-gray-700 dark:text-gray-300">Minute:</label>
              <select 
                [value]="selectedDate.getMinutes()" 
                (change)="setMinute($event.target.value)"
                class="bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm text-gray-900 dark:text-white"
              >
                <option *ngFor="let minute of minutes" [value]="minute">{{ formatMinute(minute) }}</option>
              </select>
            </div>
            
            <div *ngIf="timeFormat === '12h'" class="flex items-center space-x-2">
              <select 
                [value]="selectedDate.getHours() >= 12 ? 'PM' : 'AM'" 
                (change)="setPeriod($event.target.value)"
                class="bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm text-gray-900 dark:text-white"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-between">
          <button
            type="button"
            (click)="clearDate()"
            class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Clear
          </button>
          
          <button
            type="button"
            (click)="setToday()"
            class="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Today
          </button>
        </div>
      </div>

      <!-- Overlay -->
      <div 
        *ngIf="showCalendar" 
        class="fixed inset-0 z-0" 
        (click)="closeCalendar()"
      ></div>
    </div>

    <!-- Error Message -->
    <div *ngIf="showError" class="mt-2">
      <p class="text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>
    </div>
  `,
  styles: [`
    .date-picker-container {
      position: relative;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    
    .date-picker-small {
      @apply text-sm;
    }
    
    .date-picker-large {
      @apply text-lg;
    }
    
    .calendar-day-selected {
      @apply bg-blue-600 text-white hover:bg-blue-700;
    }
    
    .calendar-day-today {
      @apply border-2 border-blue-500;
    }
    
    .calendar-day-disabled {
      @apply text-gray-300 dark:text-gray-600 cursor-not-allowed;
    }
    
    .calendar-day-disabled:hover {
      @apply bg-transparent;
    }
  `]
})
export class DatePickerComponent implements ControlValueAccessor, OnInit, OnDestroy {
  @ViewChild('dateInput') dateInput!: ElementRef<HTMLInputElement>;
  
  @Input() id = `date-picker-${Math.random().toString(36).substr(2, 9)}`;
  @Input() config: DatePickerConfig = {};
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() placeholder = 'Select date';
  
  @Output() dateChange = new EventEmitter<Date | null>();
  @Output() dateBlur = new EventEmitter<Date | null>();
  @Output() open = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  // ControlValueAccessor
  private onChange = (value: Date | null) => {};
  private onTouched = () => {};
  private isDisabled = false;

  control = new FormControl<Date | null>(null);
  
  private destroy$ = new Subject<void>();
  
  // Calendar state
  showCalendar = false;
  showYearSelector = false;
  currentDate = new Date();
  selectedDate: Date | null = null;
  calendarTop = 0;
  calendarLeft = 0;
  
  // Configuration
  format = 'MM/DD/YYYY';
  showTime = false;
  timeFormat: '12h' | '24h' = '12h';
  size: 'small' | 'medium' | 'large' = 'medium';
  
  // Calendar data
  dayHeaders: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  previousMonthDays: Array<{ date: Date; day: number }> = [];
  currentMonthDays: Array<{ date: Date; day: number }> = [];
  nextMonthDays: Array<{ date: Date; day: number }> = [];
  currentMonthName = '';
  currentYear = new Date().getFullYear();
  availableYears: number[] = [];
  
  // Time picker data
  hours = Array.from({ length: 24 }, (_, i) => i);
  minutes = Array.from({ length: 60 }, (_, i) => i);
  
  // Validation
  showError = false;
  errorMessage = '';

  constructor() {
    this.generateAvailableYears();
  }

  ngOnInit(): void {
    this.initializeConfig();
    this.setupControlValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========== ControlValueAccessor ==========

  writeValue(value: Date | null): void {
    this.selectedDate = value;
    this.control.setValue(value);
    this.updateCalendar();
    this.updateInputDisplay();
  }

  registerOnChange(fn: (value: Date | null) => void): void {
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
    const defaults: Partial<DatePickerConfig> = {
      format: 'MM/DD/YYYY',
      showTime: false,
      timeFormat: '12h',
      theme: 'light',
      size: 'medium'
    };

    this.config = { ...defaults, ...this.config };
    this.format = this.config.format!;
    this.showTime = this.config.showTime!;
    this.timeFormat = this.config.timeFormat!;
    this.size = this.config.size!;
  }

  private setupControlValidation(): void {
    const validators = [];
    
    if (this.config.validation?.required) {
      validators.push(Validators.required);
    }
    
    if (this.config.validation?.minAge) {
      validators.push((control: FormControl) => {
        if (!control.value) return null;
        const age = this.calculateAge(control.value);
        return age >= this.config.validation!.minAge! ? null : { minAge: true };
      });
    }
    
    if (this.config.validation?.maxAge) {
      validators.push((control: FormControl) => {
        if (!control.value) return null;
        const age = this.calculateAge(control.value);
        return age <= this.config.validation!.maxAge! ? null : { maxAge: true };
      });
    }
    
    if (this.config.validation?.futureOnly) {
      validators.push((control: FormControl) => {
        if (!control.value) return null;
        return control.value > new Date() ? null : { futureOnly: true };
      });
    }
    
    if (this.config.validation?.pastOnly) {
      validators.push((control: FormControl) => {
        if (!control.value) return null;
        return control.value < new Date() ? null : { pastOnly: true };
      });
    }
    
    if (this.config.validation?.customValidator) {
      validators.push((control: FormControl) => {
        if (!control.value) return null;
        return this.config.validation!.customValidator!(control.value);
      });
    }

    this.control.setValidators(validators);
    
    this.control.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateValidationState();
      });
  }

  // ========== Calendar Logic ==========

  private updateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    this.currentMonthName = this.currentDate.toLocaleDateString('en-US', { month: 'long' });
    this.currentYear = year;
    
    this.generateCalendarDays(year, month);
  }

  private generateCalendarDays(year: number, month: number): void {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    this.previousMonthDays = [];
    this.currentMonthDays = [];
    this.nextMonthDays = [];
    
    const current = new Date(startDate);
    while (current <= endDate) {
      const dayData = {
        date: new Date(current),
        day: current.getDate()
      };
      
      if (current.getMonth() < month) {
        this.previousMonthDays.push(dayData);
      } else if (current.getMonth() > month) {
        this.nextMonthDays.push(dayData);
      } else {
        this.currentMonthDays.push(dayData);
      }
      
      current.setDate(current.getDate() + 1);
    }
  }

  private generateAvailableYears(): void {
    const currentYear = new Date().getFullYear();
    this.availableYears = [];
    
    for (let i = currentYear - 100; i <= currentYear + 50; i++) {
      this.availableYears.push(i);
    }
  }

  // ========== Event Handlers ==========

  onFocus(): void {
    if (!this.disabled && !this.readonly) {
      this.openCalendar();
    }
  }

  onBlur(): void {
    this.onTouched();
    this.dateBlur.emit(this.selectedDate);
  }

  onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.toggleCalendar();
        break;
      case 'Escape':
        this.closeCalendar();
        break;
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        this.navigateCalendar(event.key);
        break;
    }
  }

  openCalendar(): void {
    if (this.disabled || this.readonly) return;
    
    this.showCalendar = true;
    this.calculateCalendarPosition();
    this.open.emit();
    
    // Focus first day of current month
    setTimeout(() => {
      const firstDayButton = document.querySelector('.calendar-day-today') as HTMLElement;
      if (firstDayButton) {
        firstDayButton.focus();
      }
    });
    
    // Close when clicking outside
    setTimeout(() => {
      document.addEventListener('click', this.handleOutsideClick);
    });
  }

  closeCalendar(): void {
    this.showCalendar = false;
    this.showYearSelector = false;
    this.close.emit();
    
    document.removeEventListener('click', this.handleOutsideClick);
  }

  toggleCalendar(): void {
    if (this.showCalendar) {
      this.closeCalendar();
    } else {
      this.openCalendar();
    }
  }

  private handleOutsideClick = (event: MouseEvent): void => {
    const target = event.target as Element;
    if (!target.closest('.date-picker-container')) {
      this.closeCalendar();
    }
  };

  previousMonth(): void {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.updateCalendar();
  }

  nextMonth(): void {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.updateCalendar();
  }

  selectYear(year: string): void {
    this.currentDate.setFullYear(parseInt(year));
    this.showYearSelector = false;
    this.updateCalendar();
  }

  selectDate(date: Date): void {
    this.selectedDate = date;
    this.control.setValue(date);
    this.updateInputDisplay();
    
    if (!this.showTime) {
      this.closeCalendar();
      this.onChange(date);
      this.dateChange.emit(date);
    }
  }

  clearDate(): void {
    this.selectedDate = null;
    this.control.setValue(null);
    this.updateInputDisplay();
    this.onChange(null);
    this.dateChange.emit(null);
    this.closeCalendar();
  }

  setToday(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.selectDate(today);
  }

  setHour(hour: string): void {
    if (this.selectedDate) {
      this.selectedDate.setHours(parseInt(hour));
      this.updateInputDisplay();
    }
  }

  setMinute(minute: string): void {
    if (this.selectedDate) {
      this.selectedDate.setMinutes(parseInt(minute));
      this.updateInputDisplay();
    }
  }

  setPeriod(period: string): void {
    if (this.selectedDate) {
      const hours = this.selectedDate.getHours();
      if (period === 'PM' && hours < 12) {
        this.selectedDate.setHours(hours + 12);
      } else if (period === 'AM' && hours >= 12) {
        this.selectedDate.setHours(hours - 12);
      }
      this.updateInputDisplay();
    }
  }

  // ========== Navigation ==========

  private navigateCalendar(key: string): void {
    if (!this.showCalendar) return;
    
    const currentDate = this.selectedDate || this.currentDate;
    const newDate = new Date(currentDate);
    
    switch (key) {
      case 'ArrowLeft':
        newDate.setDate(currentDate.getDate() - 1);
        break;
      case 'ArrowRight':
        newDate.setDate(currentDate.getDate() + 1);
        break;
      case 'ArrowUp':
        newDate.setDate(currentDate.getDate() - 7);
        break;
      case 'ArrowDown':
        newDate.setDate(currentDate.getDate() + 7);
        break;
    }
    
    this.selectDate(newDate);
    
    // Update calendar view if date is in different month
    if (newDate.getMonth() !== this.currentDate.getMonth()) {
      this.currentDate = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
      this.updateCalendar();
    }
  }

  // ========== Utility Methods ==========

  private calculateCalendarPosition(): void {
    const inputRect = this.dateInput.nativeElement.getBoundingClientRect();
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    this.calendarTop = inputRect.bottom + scrollY + 5;
    this.calendarLeft = inputRect.left;
  }

  private updateInputDisplay(): void {
    if (this.selectedDate) {
      const formatted = this.formatDate(this.selectedDate);
      this.dateInput.nativeElement.value = formatted;
    } else {
      this.dateInput.nativeElement.value = '';
    }
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  getDayClass(date: Date): string {
    const classes = ['text-gray-900 dark:text-white'];
    
    if (this.selectedDate && this.isSameDate(date, this.selectedDate)) {
      classes.push('calendar-day-selected');
    }
    
    if (this.isToday(date)) {
      classes.push('calendar-day-today');
    }
    
    if (this.isDateDisabled(date)) {
      classes.push('calendar-day-disabled');
    }
    
    return classes.join(' ');
  }

  private isSameDate(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  private isToday(date: Date): boolean {
    const today = new Date();
    return this.isSameDate(date, today);
  }

  private isDateDisabled(date: Date): boolean {
    if (this.config.minDate) {
      const minDate = new Date(this.config.minDate);
      if (date < minDate) return true;
    }
    
    if (this.config.maxDate) {
      const maxDate = new Date(this.config.maxDate);
      if (date > maxDate) return true;
    }
    
    return false;
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  private updateValidationState(): void {
    this.showError = this.control.invalid && this.control.touched;
    this.errorMessage = this.getErrorMessage();
  }

  private getErrorMessage(): string {
    const errors = this.control.errors;
    if (!errors) return '';
    
    if (errors['required']) return 'Date is required';
    if (errors['minAge']) return `Age must be at least ${this.config.validation!.minAge} years`;
    if (errors['maxAge']) return `Age must not exceed ${this.config.validation!.maxAge} years`;
    if (errors['futureOnly']) return 'Date must be in the future';
    if (errors['pastOnly']) return 'Date must be in the past';
    if (errors['customValidator']) {
      const result = this.config.validation!.customValidator!(this.control.value);
      return typeof result === 'string' ? result : 'Invalid date';
    }
    
    return 'Invalid date';
  }

  // ========== Computed Properties ==========

  get containerClassName(): string {
    return `date-picker-${this.size}`;
  }

  get inputClassName(): string {
    const baseClass = 'pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm';
    
    if (this.disabled) {
      return `${baseClass} bg-gray-100 dark:bg-gray-800 cursor-not-allowed`;
    }
    
    if (this.showError) {
      return `${baseClass} border-red-300 focus:border-red-500 focus:ring-red-500`;
    }
    
    if (this.readonly) {
      return `${baseClass} bg-gray-50 dark:bg-gray-800`;
    }
    
    return baseClass;
  }

  formatHour(hour: number): string {
    if (this.timeFormat === '12h') {
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:00 ${period}`;
    }
    return hour.toString().padStart(2, '0') + ':00';
  }

  formatMinute(minute: number): string {
    return minute.toString().padStart(2, '0');
  }
}