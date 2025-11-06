import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/ui/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-forgot-password',
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
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white">Forgot your password?</h3>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <!-- Success Message -->
      <div *ngIf="resetEmailSent" class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-green-800 dark:text-green-200">Reset Email Sent!</h3>
            <div class="mt-2 text-sm text-green-700 dark:text-green-300">
              <p>We've sent a password reset link to <strong>{{ emailSentTo }}</strong>. Please check your email and follow the instructions to reset your password.</p>
            </div>
            <div class="mt-4">
              <div class="flex space-x-3">
                <button
                  type="button"
                  (click)="resendEmail()"
                  [disabled]="isResending"
                  class="text-sm font-medium text-green-800 dark:text-green-200 hover:text-green-600 dark:hover:text-green-400 underline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span *ngIf="!isResending">Resend email</span>
                  <span *ngIf="isResending">Sending...</span>
                </button>
                <button
                  type="button"
                  (click)="goToLogin()"
                  class="text-sm font-medium text-green-800 dark:text-green-200 hover:text-green-600 dark:hover:text-green-400 underline"
                >
                  Back to Sign In
                </button>
              </div>
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

      <!-- Forgot Password Form -->
      <form *ngIf="!resetEmailSent" [formGroup]="forgotPasswordForm" (ngSubmit)="onSubmit()" class="space-y-6">
        <!-- Email Field -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email address
          </label>
          <div class="mt-1 relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autocomplete="email"
              required
              formControlName="email"
              class="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              [ngClass]="{
                'border-red-300 dark:border-red-600': hasFieldError('email'),
                'dark:bg-gray-700': true
              }"
              placeholder="Enter your email address"
            >
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none" *ngIf="hasFieldError('email')">
              <svg class="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
          <div *ngIf="hasFieldError('email')" class="mt-2 text-sm text-red-600 dark:text-red-400">
            <p>{{ getFieldError('email') }}</p>
          </div>
        </div>

        <!-- Help Text -->
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-blue-800 dark:text-blue-200">Instructions</h3>
              <div class="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p>After submitting, you'll receive an email with a password reset link. The link will expire in 1 hour for security reasons.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <div>
          <button
            type="submit"
            [disabled]="forgotPasswordForm.invalid || isLoading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 dark:disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors duration-150"
          >
            <span class="absolute left-0 inset-y-0 flex items-center pl-3" *ngIf="!isLoading">
              <svg class="h-5 w-5 text-blue-500 group-hover:text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </span>
            <app-loading-spinner *ngIf="isLoading" class="w-5 h-5 text-white"></app-loading-spinner>
            <span *ngIf="!isLoading">Send reset link</span>
            <span *ngIf="isLoading">Sending...</span>
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

        <!-- Register Link -->
        <div class="text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?
            <a routerLink="/auth/register" class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
              Create an account
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

    /* Email icon positioning */
    .pl-10 {
      padding-left: 2.5rem;
    }
  `]
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  forgotPasswordForm: FormGroup;
  isLoading = false;
  isResending = false;
  errorMessage = '';
  resetEmailSent = false;
  emailSentTo = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.forgotPasswordForm = this.createForm();
  }

  ngOnInit(): void {
    // Redirect if already authenticated
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }

    // Clear any existing errors
    this.errorMessage = '';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { email } = this.forgotPasswordForm.value;

    this.authService.requestPasswordReset(email)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.resetEmailSent = true;
            this.emailSentTo = email;
          } else {
            this.errorMessage = response.message || 'Failed to send reset email. Please try again.';
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Password reset request error:', error);
          this.errorMessage = error.message || 'An unexpected error occurred. Please try again.';
        }
      });
  }

  resendEmail(): void {
    if (!this.emailSentTo) return;

    this.isResending = true;
    this.errorMessage = '';

    this.authService.requestPasswordReset(this.emailSentTo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isResending = false;
          if (!response.success) {
            this.errorMessage = response.message || 'Failed to resend email. Please try again.';
          }
        },
        error: (error) => {
          this.isResending = false;
          console.error('Resend email error:', error);
          this.errorMessage = error.message || 'Failed to resend email. Please try again.';
        }
      });
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.forgotPasswordForm.controls).forEach(key => {
      const control = this.forgotPasswordForm.get(key);
      control?.markAsTouched();
    });
  }

  // Helper method to check if field has error
  hasFieldError(fieldName: string): boolean {
    const field = this.forgotPasswordForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  // Get field error message
  getFieldError(fieldName: string): string {
    const field = this.forgotPasswordForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return 'Email is required.';
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address.';
      }
    }
    return '';
  }
}