import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'file';
  label: string;
  placeholder?: string;
  value?: any;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string | RegExp;
  options?: { value: any; label: string }[];
  multiple?: boolean;
  rows?: number;
  cols?: number;
  accept?: string;
  description?: string;
  helpText?: string;
  errorMessage?: string;
  validations?: Array<{
    name: string;
    validator: any;
    message: string;
  }>;
  conditional?: {
    field: string;
    operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
    value: any;
  };
  order?: number;
  className?: string;
  customAttributes?: { [key: string]: any };
}

export interface FormConfig {
  fields: FormField[];
  layout?: 'vertical' | 'horizontal' | 'inline';
  showSubmitButton?: boolean;
  submitButtonText?: string;
  showResetButton?: boolean;
  resetButtonText?: string;
  showCancelButton?: boolean;
  cancelButtonText?: string;
  cancelButtonAction?: () => void;
  submitButtonClass?: string;
  resetButtonClass?: string;
  cancelButtonClass?: string;
  formClassName?: string;
  fieldClassName?: string;
  labelClassName?: string;
  submitOnEnter?: boolean;
  validationOnBlur?: boolean;
  validationOnChange?: boolean;
}

export interface FormSubmission {
  data: { [key: string]: any };
  isValid: boolean;
  errors: { [key: string]: string[] };
}

@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form 
      [formGroup]="dynamicForm" 
      [ngClass]="getFormClassName()"
      (ngSubmit)="onSubmit()"
      (keydown.enter)="handleEnterKey($event)"
      novalidate
    >
      <!-- Loading State -->
      <div *ngIf="isLoading" class="flex justify-center items-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-2 text-gray-600 dark:text-gray-400">Loading form...</span>
      </div>

      <!-- Form Fields -->
      <div *ngIf="!isLoading" class="space-y-6">
        <div 
          *ngFor="let field of visibleFields; trackBy: trackByFieldId"
          [ngClass]="getFieldClassName(field)"
          [hidden]="isFieldHidden(field)"
        >
          <!-- Label -->
          <label 
            [for]="field.id"
            [ngClass]="getLabelClassName(field)"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {{ field.label }}
            <span *ngIf="field.required" class="text-red-500 ml-1">*</span>
          </label>

          <!-- Help Text -->
          <p *ngIf="field.helpText" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ field.helpText }}
          </p>

          <!-- Form Control Container -->
          <div class="mt-1 relative">
            <!-- Text Input -->
            <input
              *ngIf="field.type === 'text' || field.type === 'email' || field.type === 'password' || field.type === 'number' || field.type === 'date'"
              [id]="field.id"
              [type]="getInputType(field.type)"
              [formControlName]="field.id"
              [placeholder]="field.placeholder"
              [min]="field.min"
              [max]="field.max"
              [minlength]="field.minLength"
              [maxlength]="field.maxLength"
              [pattern]="field.pattern"
              [readonly]="field.readonly"
              [disabled]="field.disabled"
              [ngClass]="getInputClassName(field)"
              (blur)="onFieldBlur(field)"
              (change)="onFieldChange(field)"
              class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            />

            <!-- Textarea -->
            <textarea
              *ngIf="field.type === 'textarea'"
              [id]="field.id"
              [formControlName]="field.id"
              [placeholder]="field.placeholder"
              [rows]="field.rows || 4"
              [cols]="field.cols"
              [readonly]="field.readonly"
              [disabled]="field.disabled"
              [ngClass]="getInputClassName(field)"
              (blur)="onFieldBlur(field)"
              (change)="onFieldChange(field)"
              class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            ></textarea>

            <!-- Select -->
            <select
              *ngIf="field.type === 'select'"
              [id]="field.id"
              [formControlName]="field.id"
              [multiple]="field.multiple"
              [disabled]="field.disabled"
              [ngClass]="getInputClassName(field)"
              (blur)="onFieldBlur(field)"
              (change)="onFieldChange(field)"
              class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            >
              <option value="">{{ field.placeholder || 'Select an option' }}</option>
              <option *ngFor="let option of field.options" [value]="option.value">
                {{ option.label }}
              </option>
            </select>

            <!-- Checkbox -->
            <div *ngIf="field.type === 'checkbox'" class="flex items-center">
              <input
                [id]="field.id"
                type="checkbox"
                [formControlName]="field.id"
                [disabled]="field.disabled"
                [ngClass]="getInputClassName(field)"
                (blur)="onFieldBlur(field)"
                (change)="onFieldChange(field)"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label [for]="field.id" class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                {{ field.description || field.label }}
              </label>
            </div>

            <!-- Radio Group -->
            <div *ngIf="field.type === 'radio'" class="space-y-2">
              <div *ngFor="let option of field.options" class="flex items-center">
                <input
                  [id]="field.id + '_' + option.value"
                  type="radio"
                  [name]="field.id"
                  [value]="option.value"
                  [formControlName]="field.id"
                  [disabled]="field.disabled"
                  [ngClass]="getInputClassName(field)"
                  (blur)="onFieldBlur(field)"
                  (change)="onFieldChange(field)"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                />
                <label [for]="field.id + '_' + option.value" class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {{ option.label }}
                </label>
              </div>
            </div>

            <!-- File Upload -->
            <div *ngIf="field.type === 'file'" class="space-y-2">
              <input
                [id]="field.id"
                type="file"
                [formControlName]="field.id"
                [accept]="field.accept"
                [disabled]="field.disabled"
                [ngClass]="getInputClassName(field)"
                (blur)="onFieldBlur(field)"
                (change)="onFieldChange(field)"
                class="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-300"
              />
              <div *ngIf="field.description" class="text-sm text-gray-500 dark:text-gray-400">
                {{ field.description }}
              </div>
            </div>

            <!-- Error Message -->
            <div *ngIf="showFieldError(field)" class="mt-2">
              <p 
                *ngFor="let error of getFieldErrors(field)" 
                class="text-sm text-red-600 dark:text-red-400"
              >
                {{ error }}
              </p>
            </div>

            <!-- Success Message -->
            <div *ngIf="showFieldSuccess(field)" class="mt-2">
              <p class="text-sm text-green-600 dark:text-green-400">
                {{ field.label }} is valid
              </p>
            </div>
          </div>

          <!-- Description -->
          <p *ngIf="field.description && field.type !== 'checkbox' && field.type !== 'radio'" class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {{ field.description }}
          </p>
        </div>
      </div>

      <!-- Form Actions -->
      <div *ngIf="!isLoading && (showSubmitButton || showResetButton || showCancelButton)" class="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <!-- Reset Button -->
        <button
          *ngIf="showResetButton"
          type="button"
          [ngClass]="resetButtonClass"
          (click)="onReset()"
          class="inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {{ resetButtonText }}
        </button>

        <!-- Cancel Button -->
        <button
          *ngIf="showCancelButton"
          type="button"
          [ngClass]="cancelButtonClass"
          (click)="onCancel()"
          class="inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {{ cancelButtonText }}
        </button>

        <!-- Submit Button -->
        <button
          *ngIf="showSubmitButton"
          type="submit"
          [disabled]="isSubmitting || dynamicForm.invalid"
          [ngClass]="submitButtonClass"
          class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <!-- Loading Spinner -->
          <svg 
            *ngIf="isSubmitting" 
            class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ submitButtonText }}
        </button>
      </div>
    </form>
  `,
  styles: [`
    .form-vertical .field-group {
      @apply space-y-1;
    }
    
    .form-horizontal .field-group {
      @apply grid grid-cols-1 gap-y-0 gap-x-4 sm:grid-cols-3 items-start;
    }
    
    .form-horizontal label {
      @apply sm:pt-2;
    }
    
    .form-inline .field-group {
      @apply flex items-center space-x-4;
    }
    
    .form-inline label {
      @apply flex-shrink-0;
    }
    
    .field-error input,
    .field-error select,
    .field-error textarea {
      @apply border-red-300 focus:border-red-500 focus:ring-red-500;
    }
    
    .field-success input,
    .field-success select,
    .field-success textarea {
      @apply border-green-300 focus:border-green-500 focus:ring-green-500;
    }
  `]
})
export class DynamicFormComponent implements OnInit, OnDestroy, OnChanges {
  @Input() config: FormConfig = { fields: [] };
  @Input() initialData: { [key: string]: any } = {};
  @Input() isLoading = false;
  @Input() isSubmitting = false;
  @Input() submitOnEnter = true;
  @Input() validationOnBlur = true;
  @Input() validationOnChange = false;
  @Input() customValidationRules: { [key: string]: any } = {};

  @Output() formSubmit = new EventEmitter<FormSubmission>();
  @Output() formReset = new EventEmitter<void>();
  @Output() formCancel = new EventEmitter<void>();
  @Output() fieldChange = new EventEmitter<{ field: FormField; value: any }>();
  @Output() fieldBlur = new EventEmitter<FormField>();
  @Output() validationError = new EventEmitter<{ field: string; errors: string[] }>();

  private destroy$ = new Subject<void>();
  private conditionalFields: Set<string> = new Set();

  dynamicForm!: FormGroup;
  visibleFields: FormField[] = [];
  
  // Button configuration
  showSubmitButton = true;
  showResetButton = false;
  showCancelButton = false;
  submitButtonText = 'Submit';
  resetButtonText = 'Reset';
  cancelButtonText = 'Cancel';
  submitButtonClass = '';
  resetButtonClass = '';
  cancelButtonClass = '';
  formClassName = '';
  fieldClassName = '';
  labelClassName = '';

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.initializeConfig();
    this.buildForm();
    this.setInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] && !changes['config'].firstChange) {
      this.initializeConfig();
      this.buildForm();
    }

    if (changes['initialData'] && !changes['initialData'].firstChange) {
      this.setInitialData();
    }
  }

  private initializeConfig(): void {
    const defaults: Partial<FormConfig> = {
      layout: 'vertical',
      showSubmitButton: true,
      showResetButton: false,
      showCancelButton: false,
      submitButtonText: 'Submit',
      resetButtonText: 'Reset',
      cancelButtonText: 'Cancel',
      submitOnEnter: true,
      validationOnBlur: true,
      validationOnChange: false,
      submitButtonClass: '',
      resetButtonClass: '',
      cancelButtonClass: '',
      formClassName: '',
      fieldClassName: '',
      labelClassName: ''
    };

    this.config = { ...defaults, ...this.config };

    // Apply configuration to component properties
    this.showSubmitButton = this.config.showSubmitButton!;
    this.showResetButton = this.config.showResetButton!;
    this.showCancelButton = this.config.showCancelButton!;
    this.submitButtonText = this.config.submitButtonText!;
    this.resetButtonText = this.config.resetButtonText!;
    this.cancelButtonText = this.config.cancelButtonText!;
    this.submitButtonClass = this.config.submitButtonClass!;
    this.resetButtonClass = this.config.resetButtonClass!;
    this.cancelButtonClass = this.config.cancelButtonClass!;
    this.formClassName = this.config.formClassName!;
    this.fieldClassName = this.config.fieldClassName!;
    this.labelClassName = this.config.labelClassName!;

    // Sort fields by order
    this.config.fields.sort((a, b) => (a.order || 0) - (b.order || 0));
    this.visibleFields = [...this.config.fields];
  }

  private buildForm(): void {
    const formGroupConfig: { [key: string]: FormControl } = {};

    this.config.fields.forEach(field => {
      const validators = this.getValidators(field);
      formGroupConfig[field.id] = new FormControl(
        { value: field.value || '', disabled: field.disabled || false },
        validators
      );

      // Check for conditional fields
      if (field.conditional) {
        this.conditionalFields.add(field.id);
      }
    });

    this.dynamicForm = this.formBuilder.group(formGroupConfig);

    // Subscribe to conditional field changes
    this.setupConditionalFields();
  }

  private getValidators(field: FormField): any[] {
    const validators: any[] = [];

    if (field.required) {
      validators.push(Validators.required);
    }

    if (field.min !== undefined) {
      validators.push(Validators.min(field.min));
    }

    if (field.max !== undefined) {
      validators.push(Validators.max(field.max));
    }

    if (field.minLength !== undefined) {
      validators.push(Validators.minLength(field.minLength));
    }

    if (field.maxLength !== undefined) {
      validators.push(Validators.maxLength(field.maxLength));
    }

    if (field.pattern) {
      validators.push(Validators.pattern(field.pattern));
    }

    // Add custom validations
    if (field.validations) {
      field.validations.forEach(validation => {
        validators.push(validation.validator);
      });
    }

    // Add custom validation rules
    if (this.customValidationRules[field.id]) {
      validators.push(this.customValidationRules[field.id]);
    }

    return validators;
  }

  private setupConditionalFields(): void {
    this.conditionalFields.forEach(fieldId => {
      const field = this.config.fields.find(f => f.id === fieldId);
      if (field && field.conditional) {
        const dependencyControl = this.dynamicForm.get(field.conditional.field);
        
        if (dependencyControl) {
          dependencyControl.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
              this.updateConditionalVisibility();
            });
        }
      }
    });
  }

  private updateConditionalVisibility(): void {
    this.config.fields.forEach(field => {
      if (field.conditional) {
        const dependencyValue = this.dynamicForm.get(field.conditional.field)?.value;
        const shouldShow = this.evaluateCondition(dependencyValue, field.conditional);
        
        const control = this.dynamicForm.get(field.id);
        if (control) {
          if (shouldShow) {
            control.enable();
          } else {
            control.disable();
            control.setValue('');
          }
        }
      }
    });
  }

  private evaluateCondition(value: any, condition: FormField['conditional']): boolean {
    if (!condition) return true;

    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'notEquals':
        return value !== condition.value;
      case 'contains':
        return String(value).includes(String(condition.value));
      case 'greaterThan':
        return Number(value) > Number(condition.value);
      case 'lessThan':
        return Number(value) < Number(condition.value);
      default:
        return true;
    }
  }

  private setInitialData(): void {
    if (Object.keys(this.initialData).length > 0) {
      this.dynamicForm.patchValue(this.initialData);
    }
  }

  // ========== EVENT HANDLERS ==========

  onSubmit(): void {
    if (this.dynamicForm.invalid) {
      this.markAllFieldsAsTouched();
      this.reportValidationErrors();
      return;
    }

    const formData = this.dynamicForm.getRawValue();
    const isValid = this.dynamicForm.valid;
    const errors = this.getValidationErrors();

    this.formSubmit.emit({
      data: formData,
      isValid,
      errors
    });
  }

  onReset(): void {
    this.dynamicForm.reset();
    this.formReset.emit();
  }

  onCancel(): void {
    this.formCancel.emit();
    if (this.config.cancelButtonAction) {
      this.config.cancelButtonAction();
    }
  }

  onFieldChange(field: FormField): void {
    const value = this.dynamicForm.get(field.id)?.value;
    this.fieldChange.emit({ field, value });
    
    if (this.validationOnChange && field.conditional) {
      this.updateConditionalVisibility();
    }
  }

  onFieldBlur(field: FormField): void {
    this.fieldBlur.emit(field);
  }

  handleEnterKey(event: KeyboardEvent): void {
    if (this.submitOnEnter && event.target instanceof HTMLInputElement) {
      event.preventDefault();
      this.onSubmit();
    }
  }

  // ========== VALIDATION HELPERS ==========

  private markAllFieldsAsTouched(): void {
    Object.keys(this.dynamicForm.controls).forEach(key => {
      this.dynamicForm.get(key)?.markAsTouched();
    });
  }

  private reportValidationErrors(): void {
    Object.keys(this.dynamicForm.controls).forEach(key => {
      const control = this.dynamicForm.get(key);
      if (control && control.invalid && control.touched) {
        const errors = this.getControlErrors(key);
        if (errors.length > 0) {
          this.validationError.emit({ field: key, errors });
        }
      }
    });
  }

  private getValidationErrors(): { [key: string]: string[] } {
    const errors: { [key: string]: string[] } = {};
    
    Object.keys(this.dynamicForm.controls).forEach(key => {
      const controlErrors = this.getControlErrors(key);
      if (controlErrors.length > 0) {
        errors[key] = controlErrors;
      }
    });

    return errors;
  }

  private getControlErrors(controlName: string): string[] {
    const control = this.dynamicForm.get(controlName);
    const field = this.config.fields.find(f => f.id === controlName);
    
    if (!control || !field) return [];

    const errors: string[] = [];

    if (control.errors) {
      Object.keys(control.errors).forEach(errorKey => {
        switch (errorKey) {
          case 'required':
            errors.push(`${field.label} is required`);
            break;
          case 'minlength':
            const minLengthError = control.errors[errorKey] as any;
            errors.push(`${field.label} must be at least ${minLengthError?.requiredLength || ''} characters`);
            break;
          case 'maxlength':
            errors.push(`${field.label} must not exceed ${control.errors[errorKey].requiredLength} characters`);
            break;
          case 'min':
            errors.push(`${field.label} must be at least ${control.errors[errorKey].min}`);
            break;
          case 'max':
            errors.push(`${field.label} must not exceed ${control.errors[errorKey].max}`);
            break;
          case 'pattern':
            errors.push(`${field.label} format is invalid`);
            break;
          case 'email':
            errors.push('Please enter a valid email address');
            break;
          default:
            // Check for custom validation messages
            const customValidation = field.validations?.find(v => v.name === errorKey);
            if (customValidation) {
              errors.push(customValidation.message);
            } else {
              errors.push(`${field.label} is invalid`);
            }
        }
      });
    }

    return errors;
  }

  // ========== UI HELPER METHODS ==========

  getFormClassName(): string {
    const layout = this.config.layout || 'vertical';
    return `form-${layout} ${this.formClassName}`;
  }

  getFieldClassName(field: FormField): string {
    const control = this.dynamicForm.get(field.id);
    const baseClass = 'field-group';
    const customClass = field.className || '';
    
    let stateClass = '';
    if (control?.touched && control?.invalid) {
      stateClass = 'field-error';
    } else if (control?.touched && control?.valid) {
      stateClass = 'field-success';
    }

    return `${baseClass} ${customClass} ${stateClass}`.trim();
  }

  getLabelClassName(field: FormField): string {
    const baseClass = 'field-label';
    const customClass = this.labelClassName || '';
    const requiredClass = field.required ? 'field-required' : '';
    
    return `${baseClass} ${customClass} ${requiredClass}`.trim();
  }

  getInputClassName(field: FormField): string {
    const control = this.dynamicForm.get(field.id);
    let stateClass = '';
    
    if (control?.touched && control?.invalid) {
      stateClass = 'border-red-300 focus:border-red-500 focus:ring-red-500';
    } else if (control?.touched && control?.valid) {
      stateClass = 'border-green-300 focus:border-green-500 focus:ring-green-500';
    }

    return stateClass;
  }

  getInputType(fieldType: string): string {
    if (fieldType === 'password') return 'password';
    if (fieldType === 'email') return 'email';
    if (fieldType === 'number') return 'number';
    if (fieldType === 'date') return 'date';
    return 'text';
  }

  showFieldError(field: FormField): boolean {
    const control = this.dynamicForm.get(field.id);
    return !!(control?.invalid && control?.touched);
  }

  showFieldSuccess(field: FormField): boolean {
    const control = this.dynamicForm.get(field.id);
    return !!(control?.valid && control?.touched);
  }

  isFieldHidden(field: FormField): boolean {
    if (!field.conditional) return false;
    
    const dependencyValue = this.dynamicForm.get(field.conditional.field)?.value;
    return !this.evaluateCondition(dependencyValue, field.conditional);
  }

  getFieldErrors(field: FormField): string[] {
    return this.getControlErrors(field.id);
  }

  trackByFieldId(index: number, field: FormField): string {
    return field.id;
  }

  // ========== PUBLIC API ==========

  getFormData(): { [key: string]: any } {
    return this.dynamicForm.getRawValue();
  }

  isFormValid(): boolean {
    return this.dynamicForm.valid;
  }

  setFieldValue(fieldId: string, value: any): void {
    const control = this.dynamicForm.get(fieldId);
    if (control) {
      control.setValue(value);
    }
  }

  getFieldValue(fieldId: string): any {
    return this.dynamicForm.get(fieldId)?.value;
  }

  validateField(fieldId: string): boolean {
    const control = this.dynamicForm.get(fieldId);
    if (control) {
      control.markAsTouched();
      control.updateValueAndValidity();
      return control.valid;
    }
    return false;
  }

  focusField(fieldId: string): void {
    const element = document.getElementById(fieldId);
    if (element) {
      element.focus();
    }
  }

  resetForm(): void {
    this.dynamicForm.reset();
    this.initializeConfig();
  }

  submitForm(): void {
    this.onSubmit();
  }
}