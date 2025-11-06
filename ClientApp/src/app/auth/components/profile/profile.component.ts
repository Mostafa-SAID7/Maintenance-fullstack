import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/ui/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="max-w-4xl mx-auto space-y-6">
      <!-- Page Header -->
      <div class="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Manage your personal information and account settings
        </p>
      </div>

      <!-- Success Alert -->
      <div *ngIf="successMessage" class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-green-700 dark:text-green-300">{{ successMessage }}</p>
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
            <p class="text-sm text-red-700 dark:text-red-300">{{ errorMessage }}</p>
          </div>
        </div>
      </div>

      <!-- Profile Form -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div class="px-4 py-5 sm:p-6">
          <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <!-- Avatar Section -->
            <div class="flex items-center space-x-6">
              <div class="relative">
                <div class="h-20 w-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <img *ngIf="currentUser?.avatar" [src]="currentUser.avatar" [alt]="currentUser.name" class="h-20 w-20 object-cover">
                  <svg *ngIf="!currentUser?.avatar" class="h-10 w-10 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <button
                  type="button"
                  class="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1.5 shadow-md transition-colors duration-150"
                  title="Change avatar"
                >
                  <svg class="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
              <div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ currentUser?.name || 'User' }}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ currentUser?.email }}</p>
                <button type="button" class="mt-2 text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                  Change avatar
                </button>
              </div>
            </div>

            <!-- Name Fields Row -->
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <!-- First Name -->
              <div>
                <label for="firstName" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  First Name
                </label>
                <div class="mt-1">
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    formControlName="firstName"
                    class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    [ngClass]="{
                      'border-red-300 dark:border-red-600': hasFieldError('firstName'),
                      'dark:bg-gray-700': true
                    }"
                    placeholder="Enter your first name"
                  >
                </div>
                <div *ngIf="hasFieldError('firstName')" class="mt-2 text-sm text-red-600 dark:text-red-400">
                  <p>{{ getFieldError('firstName') }}</p>
                </div>
              </div>

              <!-- Last Name -->
              <div>
                <label for="lastName" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Last Name
                </label>
                <div class="mt-1">
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    formControlName="lastName"
                    class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    [ngClass]="{
                      'border-red-300 dark:border-red-600': hasFieldError('lastName'),
                      'dark:bg-gray-700': true
                    }"
                    placeholder="Enter your last name"
                  >
                </div>
                <div *ngIf="hasFieldError('lastName')" class="mt-2 text-sm text-red-600 dark:text-red-400">
                  <p>{{ getFieldError('lastName') }}</p>
                </div>
              </div>
            </div>

            <!-- Email Field (Read-only) -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <div class="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  formControlName="email"
                  readonly
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 sm:text-sm cursor-not-allowed"
                >
              </div>
              <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Email address cannot be changed. Contact support if you need to update it.
              </p>
            </div>

            <!-- Phone Field -->
            <div>
              <label for="phone" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone Number
              </label>
              <div class="mt-1">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  formControlName="phone"
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  placeholder="Enter your phone number"
                >
              </div>
              <div *ngIf="hasFieldError('phone')" class="mt-2 text-sm text-red-600 dark:text-red-400">
                <p>{{ getFieldError('phone') }}</p>
              </div>
            </div>

            <!-- Bio Field -->
            <div>
              <label for="bio" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Bio
              </label>
              <div class="mt-1">
                <textarea
                  id="bio"
                  name="bio"
                  rows="4"
                  formControlName="bio"
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  placeholder="Tell us about yourself..."
                ></textarea>
              </div>
              <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {{ profileForm.get('bio')?.value?.length || 0 }}/500 characters
              </p>
            </div>

            <!-- Account Information -->
            <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">Account Information</h3>
              <dl class="mt-4 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Member Since</dt>
                  <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                    {{ currentUser?.createdAt | date:'longDate' }}
                  </dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Last Login</dt>
                  <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                    {{ currentUser?.lastLoginAt | date:'medium' }}
                  </dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Account Status</dt>
                  <dd class="mt-1">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          [ngClass]="{
                            'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300': currentUser?.isActive,
                            'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300': !currentUser?.isActive
                          }">
                      {{ currentUser?.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Role</dt>
                  <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                    <span *ngFor="let role of currentUser?.roles; let last = last" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 mr-2">
                      {{ role | titlecase }}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            <!-- Submit Button -->
            <div class="flex justify-end">
              <button
                type="submit"
                [disabled]="profileForm.invalid || isLoading || !profileForm.dirty"
                class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 dark:disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors duration-150"
              >
                <span class="absolute left-0 inset-y-0 flex items-center pl-3" *ngIf="!isLoading">
                  <svg class="h-5 w-5 text-blue-500 group-hover:text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </span>
                <app-loading-spinner *ngIf="isLoading" class="w-5 h-5 text-white"></app-loading-spinner>
                <span *ngIf="!isLoading">Save Changes</span>
                <span *ngIf="isLoading">Saving...</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Change Password Section -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Change Password</h3>
          
          <!-- Change Password Form -->
          <form [formGroup]="passwordForm" (ngSubmit)="onChangePassword()" class="space-y-6">
            <!-- Current Password -->
            <div>
              <label for="currentPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Current Password
              </label>
              <div class="mt-1 relative">
                <input
                  id="currentPassword"
                  name="currentPassword"
                  [type]="showCurrentPassword ? 'text' : 'password'"
                  required
                  formControlName="currentPassword"
                  class="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  placeholder="Enter your current password"
                >
                <button
                  type="button"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center"
                  (click)="toggleCurrentPasswordVisibility()"
                  [attr.aria-label]="showCurrentPassword ? 'Hide password' : 'Show password'"
                >
                  <svg *ngIf="!showCurrentPassword" class="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg *ngIf="showCurrentPassword" class="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m3.121 3.121L21 21m-8.879-8.879l4.242 4.242" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- New Password -->
            <div>
              <label for="newPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                New Password
              </label>
              <div class="mt-1 relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  [type]="showNewPassword ? 'text' : 'password'"
                  required
                  formControlName="newPassword"
                  class="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  placeholder="Enter your new password"
                >
                <button
                  type="button"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center"
                  (click)="toggleNewPasswordVisibility()"
                  [attr.aria-label]="showNewPassword ? 'Hide password' : 'Show password'"
                >
                  <svg *ngIf="!showNewPassword" class="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg *ngIf="showNewPassword" class="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m3.121 3.121L21 21m-8.879-8.879l4.242 4.242" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Confirm New Password -->
            <div>
              <label for="confirmNewPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm New Password
              </label>
              <div class="mt-1 relative">
                <input
                  id="confirmNewPassword"
                  name="confirmNewPassword"
                  [type]="showConfirmNewPassword ? 'text' : 'password'"
                  required
                  formControlName="confirmNewPassword"
                  class="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  placeholder="Confirm your new password"
                >
                <button
                  type="button"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center"
                  (click)="toggleConfirmNewPasswordVisibility()"
                  [attr.aria-label]="showConfirmNewPassword ? 'Hide password' : 'Show password'"
                >
                  <svg *ngIf="!showConfirmNewPassword" class="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg *ngIf="showConfirmNewPassword" class="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m3.121 3.121L21 21m-8.879-8.879l4.242 4.242" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Change Password Submit Button -->
            <div class="flex justify-end">
              <button
                type="submit"
                [disabled]="passwordForm.invalid || isChangingPassword"
                class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 dark:disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors duration-150"
              >
                <app-loading-spinner *ngIf="isChangingPassword" class="w-5 h-5 text-white mr-2"></app-loading-spinner>
                <span *ngIf="!isChangingPassword">Change Password</span>
                <span *ngIf="isChangingPassword">Changing...</span>
              </button>
            </div>
          </form>
        </div>
      </div>
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

    /* Avatar hover effect */
    .relative:hover .absolute {
      opacity: 100;
    }
  `]
})
export class ProfileComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  profileForm: FormGroup;
  passwordForm: FormGroup;
  currentUser: any = null;
  
  isLoading = false;
  isChangingPassword = false;
  errorMessage = '';
  successMessage = '';
  
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmNewPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService
  ) {
    this.profileForm = this.createProfileForm();
    this.passwordForm = this.createPasswordForm();
  }

  ngOnInit(): void {
    // Load current user data
    this.currentUser = this.authService.getCurrentUser();
    
    if (this.currentUser) {
      this.populateProfileForm();
    }

    // Subscribe to user changes
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (user) {
          this.populateProfileForm();
        }
      });

    // Clear messages on init
    this.errorMessage = '';
    this.successMessage = '';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createProfileForm(): FormGroup {
    return this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^[+]?[\d\s\-\(\)]+$/)]],
      bio: ['', [Validators.maxLength(500)]]
    });
  }

  private createPasswordForm(): FormGroup {
    return this.formBuilder.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [
        Validators.required, 
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      ]],
      confirmNewPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private passwordMatchValidator(formGroup: FormGroup) {
    const newPassword = formGroup.get('newPassword');
    const confirmNewPassword = formGroup.get('confirmNewPassword');
    
    if (!newPassword || !confirmNewPassword) return null;
    
    if (newPassword.value !== confirmNewPassword.value) {
      confirmNewPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      // Remove passwordMismatch error but keep other validation errors
      if (confirmNewPassword.errors) {
        delete confirmNewPassword.errors['passwordMismatch'];
        if (Object.keys(confirmNewPassword.errors).length === 0) {
          confirmNewPassword.setErrors(null);
        }
      }
      return null;
    }
  }

  private populateProfileForm(): void {
    if (this.currentUser) {
      this.profileForm.patchValue({
        firstName: this.currentUser.firstName || '',
        lastName: this.currentUser.lastName || '',
        email: this.currentUser.email || '',
        phone: this.currentUser.phone || '',
        bio: this.currentUser.bio || ''
      });
    }
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.markFormGroupTouched(this.profileForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const profileData = this.profileForm.value;

    this.authService.updateProfile(profileData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.successMessage = 'Profile updated successfully!';
            this.profileForm.markAsPristine();
          } else {
            this.errorMessage = response.message || 'Failed to update profile. Please try again.';
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Profile update error:', error);
          this.errorMessage = error.message || 'An unexpected error occurred. Please try again.';
        }
      });
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.markFormGroupTouched(this.passwordForm);
      return;
    }

    this.isChangingPassword = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { currentPassword, newPassword } = this.passwordForm.value;

    this.authService.changePassword(currentPassword, newPassword)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isChangingPassword = false;
          if (response.success) {
            this.successMessage = 'Password changed successfully!';
            this.passwordForm.reset();
          } else {
            this.errorMessage = response.message || 'Failed to change password. Please try again.';
          }
        },
        error: (error) => {
          this.isChangingPassword = false;
          console.error('Password change error:', error);
          this.errorMessage = error.message || 'An unexpected error occurred. Please try again.';
        }
      });
  }

  toggleCurrentPasswordVisibility(): void {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmNewPasswordVisibility(): void {
    this.showConfirmNewPassword = !this.showConfirmNewPassword;
  }

  private markFormGroupTouched(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      control?.markAsTouched();
    });
  }

  // Helper methods for error handling
  hasFieldError(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.profileForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required.`;
      }
      if (field.errors['minlength']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${field.errors['minlength'].requiredLength} characters long.`;
      }
      if (field.errors['maxlength']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must not exceed ${field.errors['maxlength'].requiredLength} characters.`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address.';
      }
      if (field.errors['pattern']) {
        return 'Please enter a valid phone number.';
      }
    }
    return '';
  }
}