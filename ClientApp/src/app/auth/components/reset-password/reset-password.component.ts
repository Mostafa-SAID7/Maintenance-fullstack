import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/ui/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterModule,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="text-center">
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white">Reset your password</h3>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Enter your new password below
        </p>
      </div>

      <!-- Invalid Token Alert -->
      <div *ngIf="invalidToken" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Invalid or Expired Link</h3>
            <div class="mt-2 text-sm text-red-700 dark:text-red-300">
              <p>The password reset link you used is invalid or has expired. Please request a new password reset link.</p>
            </div>
            <div class="mt-4">
              <button
                type="button"
                (click)="requestNewResetLink()"
                class="text-sm font-medium text-red-800 dark:text-red-200 hover:text-red-600 dark:hover:text-red-400 underline"
              >
                Request New Reset Link
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Success Message -->
      <div *ngIf="passwordResetSuccess" class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-green-800 dark:text-green-200">Password Reset Successful!</h3>
            <div class="mt-2 text-sm text-green-700 dark:text-green-300">
              <p>Your password has been successfully reset. You can now sign in with your new password.</p>
            </div>
            <div class="mt-4">
              <button
                type="button"
                (click)="goToLogin()"
                class="text-sm font-medium text-green-800 dark:text-green-200 hover:text-green-600 dark:hover:text-green-400 underline"
              >
                Sign In with New Password
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Alert -->
      <div *ngIf="errorMessage" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
            <div class="mt-2 text-sm text-red-700 dark:text-red-300">
              <p>{{ errorMessage }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Reset Password Form -->
      <form *ngIf="!invalidToken && !passwordResetSuccess" [formGroup]="resetPasswordForm" (ngSubmit)="onSubmit()" class="space-y-6">
        <!-- Password Field -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            New Password
          </label>
          <div class="mt-1 relative">
            <input
              id="password"
              name="password"
              [type]="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              required
              formControlName="password"
              class="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              [ngClass]="{
                'border-red-300 dark:border-red-600': hasFieldError('password'),
                'dark:bg-gray-700': true
              }"
              placeholder="Enter your new password"
            >
            <button
              type="button"
              class="absolute inset-y-0 right-0 pr-3 flex items-center"
              (click)="togglePasswordVisibility()"
              [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'"
            >
              <svg *ngIf="!showPassword" class="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <svg *ngIf="showPassword" class="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m3.121 3.121L21 21m-8.879-8.879l4.242 4.242" />
              </svg>
            </button>
          </div>
          <div *ngIf="hasFieldError('password')" class="mt-2 text-sm text-red-600 dark:text-red-400">
            <p>{{ getFieldError('password') }}</p>
          </div>
          
          <!-- Password Strength Indicator -->
          <div class="mt-2" *ngIf="resetPasswordForm.get('password')?.value">
            <div class="flex items-center space-x-2">
              <span class="text-xs text-gray-500 dark:text-gray-400">Password strength:</span>
              <div class="flex space-x-1">
                <div *ngFor="let segment of passwordStrength.segments; let i = index" 
                     class="h-1 w-8 rounded-full"
                     [ngClass]="{
                       'bg-red-400': passwordStrength.strength === 'weak',
                       'bg-yellow-400': passwordStrength.strength === 'medium',
                       'bg-green-400': passwordStrength.strength === 'strong',
                       'bg-gray-200 dark:bg-gray-600': !segment
                     }"></div>
              </div>
              <span class="text-xs font-medium"
                    [ngClass]="{
                      'text-red-600 dark:text-red-400': passwordStrength.strength === 'weak',
                      'text-yellow-600 dark:text-yellow-400': passwordStrength.strength === 'medium',
                      'text-green-600 dark:text-green-400': passwordStrength.strength === 'strong'
                    }">
                {{ passwordStrength.strength | titlecase }}
              </span>
            </div>
          </div>
        </div>

        <!-- Confirm Password Field -->
        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Confirm New Password
          </label>
          <div class="mt-1 relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              [type]="showConfirmPassword ? 'text' : 'password'"
              autocomplete="new-password"
              required
              formControlName="confirmPassword"
              class="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              [ngClass]="{
                'border-red-300 dark:border-red-600': hasFieldError('confirmPassword'),
                'dark:bg-gray-700': true
              }"
              placeholder="Confirm your new password"
            >
            <button
              type="button"
              class="absolute inset-y-0 right-0 pr-3 flex items-center"
              (click)="toggleConfirmPasswordVisibility()"
              [attr.aria-label]="showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'"
            >
              <svg *ngIf="!showConfirmPassword" class="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <svg *ngIf="showConfirmPassword" class="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m3.121 3.121L21 21m-8.879-8.879l4.242 4.242" />
              </svg>
            </button>
          </div>
          <div *ngIf="hasFieldError('confirmPassword')" class="mt-2 text-sm text-red-600 dark:text-red-400">
            <p>{{ getFieldError('confirmPassword') }}</p>
          </div>
        </div>

        <!-- Password Requirements -->
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-blue-800 dark:text-blue-200">Password Requirements</h3>
              <div class="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <ul class="list-disc list-inside space-y-1">
                  <li>At least 8 characters long</li>
                  <li>Contains uppercase and lowercase letters</li>
                  <li>Contains at least one number</li>
                  <li>Contains at least one special character (!@#$%^&*)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <div>
          <button
            type="submit"
            [disabled]="resetPasswordForm.invalid || isLoading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 dark:disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors duration-150"
          >
            <span class="absolute left-0 inset-y-0 flex items-center pl-3" *ngIf="!isLoading">
              <svg class="h-5 w-5 text-blue-500 group-hover:text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
              </svg>
            </span>
            <app-loading-spinner *ngIf="isLoading" class="w-5 h-5 text-white"></app-loading-spinner>
            <span *ngIf="!isLoading">Reset password</span>
            <span *ngIf="isLoading">Resetting...</span>
          </button>
        </div>

        <!-- Back to Login Link -->
        <div class="text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Remember your password?
            <a routerLink="/auth/login" class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
              Sign in here
            </a>
          </p>
        </div>
      </form>
    </div>
  `,
  styles: [`
    /* Custom focus states */
    .focus\\:ring-blue-500:focus {
      --tw-ring-color: rgb(59 130 246 / 0.5);
    }

    /* Form validation styles */
    .border-red-300 {
      border-color: rgb(252 165 165);
    }

    .dark .border-red-600 {
      border-color: rgb(220 38 38);
    }

    .text-red-600 {
      color: rgb(220 38 38);
    }

    .dark .text-red-400 {
      color: rgb(248 113 113);
    }

    /* Loading spinner integration */
    :host ::ng-deep .loading-spinner {
      width: 1.25rem;
      height: 1.25rem;
    }

    /* Password strength indicator */
    .bg-red-400 {
      background-color: rgb(248 113 113);
    }

    .bg-yellow-400 {
      background-color: rgb(250 204 21);
    }

    .bg-green-400 {
      background-color: rgb(74 222 128);
    }
  `]
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private resetToken = '';
  
  resetPasswordForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  invalidToken = false;
  passwordResetSuccess = false;
  showPassword = false;
  showConfirmPassword = false;
  
  passwordStrength = {
    strength: 'weak' as 'weak' | 'medium' | 'strong',
    segments: [false, false, false]
  };

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.resetPasswordForm = this.createForm();
  }

  ngOnInit(): void {
    // Redirect if already authenticated
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    // Get reset token from URL
    this.resetToken = this.route.snapshot.queryParams['token'] || '';
    
    if (!this.resetToken) {
      this.invalidToken = true;
      return;
    }

    // Clear any existing errors
    this.errorMessage = '';

    // Watch password changes for strength calculation
    this.resetPasswordForm.get('password')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(password => {
        this.calculatePasswordStrength(password);
      });

    // Cross-field validation for password confirmation
    this.resetPasswordForm.get('confirmPassword')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updatePasswordConfirmationValidation();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.formBuilder.group({
      password: ['', [
        Validators.required, 
        Validators.minLength(8),
        this.createPasswordStrengthValidator()
      ]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private createPasswordStrengthValidator() {
    return (control: AbstractControl) => {
      const value = control.value;
      if (!value) return null;
      
      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumeric = /[0-9]/.test(value);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
      
      const score = [hasUpperCase, hasLowerCase, hasNumeric, hasSpecial].filter(Boolean).length;
      
      if (value.length >= 8 && score >= 3) {
        return null; // Valid
      }
      
      return { passwordStrength: true };
    };
  }

  private passwordMatchValidator(formGroup: AbstractControl) {
    const password = formGroup.get('password');
    const confirmPassword = formGroup.get('confirmPassword');
    
    if (!password || !confirmPassword) return null;
    
    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      // Remove passwordMismatch error but keep other validation errors
      if (confirmPassword.errors) {
        delete confirmPassword.errors['passwordMismatch'];
        if (Object.keys(confirmPassword.errors).length === 0) {
          confirmPassword.setErrors(null);
        }
      }
      return null;
    }
  }

  private updatePasswordConfirmationValidation(): void {
    this.resetPasswordForm.updateValueAndValidity();
  }

  private calculatePasswordStrength(password: string): void {
    if (!password) {
      this.passwordStrength = { strength: 'weak', segments: [false, false, false] };
      return;
    }

    let score = 0;
    
    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    
    // Character variety
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    let strength: 'weak' | 'medium' | 'strong';
    let segments: boolean[];
    
    if (score <= 3) {
      strength = 'weak';
      segments = [true, false, false];
    } else if (score <= 5) {
      strength = 'medium';
      segments = [true, true, false];
    } else {
      strength = 'strong';
      segments = [true, true, true];
    }
    
    this.passwordStrength = { strength, segments };
  }

  onSubmit(): void {
    if (this.resetPasswordForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { password } = this.resetPasswordForm.value;

    this.authService.resetPassword(this.resetToken, password)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.passwordResetSuccess = true;
          } else {
            this.errorMessage = response.message || 'Failed to reset password. Please try again.';
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Password reset error:', error);
          this.errorMessage = error.message || 'An unexpected error occurred. Please try again.';
        }
      });
  }

  requestNewResetLink(): void {
    this.router.navigate(['/auth/forgot-password']);
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.resetPasswordForm.controls).forEach(key => {
      const control = this.resetPasswordForm.get(key);
      control?.markAsTouched();
    });
  }

  // Helper method to check if field has error
  hasFieldError(fieldName: string): boolean {
    const field = this.resetPasswordForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  // Get field error message
  getFieldError(fieldName: string): string {
    const field = this.resetPasswordForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return 'Password is required.';
      }
      if (field.errors['minlength']) {
        return 'Password must be at least 8 characters long.';
      }
      if (field.errors['passwordStrength']) {
        return 'Password must contain uppercase, lowercase, numbers, and special characters.';
      }
      if (field.errors['passwordMismatch']) {
        return 'Passwords do not match.';
      }
    }
    return '';
  }
}