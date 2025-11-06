import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <!-- Background Pattern -->
      <div class="absolute inset-0 overflow-hidden">
        <svg class="absolute right-0 top-0 h-96 w-96 text-blue-200 dark:text-blue-900 transform translate-x-32 -translate-y-32 opacity-50" fill="currentColor" viewBox="0 0 256 256">
          <path d="M128 40c-48.6 0-88 39.4-88 88s39.4 88 88 88 88-39.4 88-88S176.6 40 128 40zm0 16c39.8 0 72 32.2 72 72s-32.2 72-72 72-72-32.2-72-72 32.2-72 72-72z"/>
          <path d="M128 76c-28.7 0-52 23.3-52 52s23.3 52 52 52 52-23.3 52-52-23.3-52-52-52zm0 16c19.9 0 36 16.1 36 36s-16.1 36-36 36-36-16.1-36-36 16.1-36 36-36z"/>
        </svg>
        <svg class="absolute left-0 bottom-0 h-64 w-64 text-indigo-200 dark:text-indigo-900 transform -translate-x-16 translate-y-16 opacity-50" fill="currentColor" viewBox="0 0 256 256">
          <path d="M128 32c-53 0-96 43-96 96s43 96 96 96 96-43 96-96-43-96-96-96zm0 16c44.2 0 80 35.8 80 80s-35.8 80-80 80-80-35.8-80-80 35.8-80 80-80z"/>
        </svg>
      </div>

      <!-- Main Content Container -->
      <div class="relative sm:mx-auto sm:w-full sm:max-w-md">
        <!-- Logo Section -->
        <div class="text-center">
          <div class="mx-auto h-16 w-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg class="h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2M5 12h14" />
            </svg>
          </div>
          <h2 class="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Car Maintenance System
          </h2>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage your vehicle maintenance efficiently
          </p>
        </div>

        <!-- Auth Card Container -->
        <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div class="bg-white dark:bg-gray-800 py-8 px-4 shadow-2xl sm:rounded-lg sm:px-10 border border-gray-200 dark:border-gray-700">
            <!-- Breadcrumb Navigation -->
            <nav class="mb-6" aria-label="Breadcrumb">
              <ol class="inline-flex items-center space-x-1 md:space-x-3">
                <li class="inline-flex items-center">
                  <a routerLink="/" class="inline-flex items-center text-sm font-medium text-gray-700 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500">
                    <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                    </svg>
                    Home
                  </a>
                </li>
                <li>
                  <div class="flex items-center">
                    <svg class="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
                    </svg>
                    <span class="ml-1 text-sm font-medium text-gray-500 dark:text-gray-400 md:ml-2">{{ getCurrentPageTitle() }}</span>
                  </div>
                </li>
              </ol>
            </nav>

            <!-- Router Outlet for Auth Pages -->
            <div class="space-y-6">
              <router-outlet></router-outlet>
            </div>

            <!-- Additional Links Section -->
            <div class="mt-8">
              <div class="relative">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div class="relative flex justify-center text-sm">
                  <span class="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    Or continue with
                  </span>
                </div>
              </div>

              <div class="mt-6 grid grid-cols-2 gap-3">
                <button type="button" class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clip-rule="evenodd"></path>
                  </svg>
                  <span class="ml-2">Google</span>
                </button>

                <button type="button" class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                  <span class="ml-2">Twitter</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Links -->
        <div class="mt-8 text-center">
          <div class="flex justify-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
            <a href="#" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-150">Privacy Policy</a>
            <a href="#" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-150">Terms of Service</a>
            <a href="#" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-150">Support</a>
          </div>
        </div>
      </div>

      <!-- Loading Overlay -->
      <div *ngIf="isLoading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-4">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span class="text-gray-900 dark:text-white font-medium">Loading...</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .min-h-screen {
      min-height: 100vh;
    }

    .bg-gradient-to-br {
      background-image: linear-gradient(to bottom right, var(--tw-gradient-stops));
    }

    /* Animation for loading overlay */
    .fixed {
      position: fixed;
    }

    .inset-0 {
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
    }

    .animate-spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    /* Custom scrollbar for auth card if needed */
    .overflow-y-auto::-webkit-scrollbar {
      width: 6px;
    }

    .overflow-y-auto::-webkit-scrollbar-track {
      background: transparent;
    }

    .overflow-y-auto::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 3px;
    }

    .dark .overflow-y-auto::-webkit-scrollbar-thumb {
      background: #4b5563;
    }
  `]
})
export class AuthLayoutComponent implements OnInit {
  isLoading = false;
  currentPageTitle = 'Authentication';

  constructor() {}

  ngOnInit(): void {
    // Initialize any auth layout specific functionality
    this.updatePageTitle();
  }

  private updatePageTitle(): void {
    // This will be enhanced when we have the router data
    // For now, using a default title
    this.currentPageTitle = this.getCurrentPageTitle();
  }

  getCurrentPageTitle(): string {
    // This will be enhanced when we implement routing
    // For now, return a default based on URL or static text
    const path = window.location.pathname;
    
    if (path.includes('login')) {
      return 'Sign In';
    } else if (path.includes('register')) {
      return 'Create Account';
    } else if (path.includes('forgot-password')) {
      return 'Reset Password';
    } else if (path.includes('reset-password')) {
      return 'Set New Password';
    } else {
      return 'Authentication';
    }
  }

  showLoading(): void {
    this.isLoading = true;
  }

  hideLoading(): void {
    this.isLoading = false;
  }
}