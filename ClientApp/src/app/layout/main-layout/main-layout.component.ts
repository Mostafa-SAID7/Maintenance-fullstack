import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  template: `
    <div class="main-layout flex h-screen bg-gray-50 dark:bg-gray-900">
      <!-- Sidebar -->
      <app-sidebar class="hidden lg:flex lg:flex-shrink-0"></app-sidebar>

      <!-- Mobile sidebar overlay -->
      <div *ngIf="sidebarOpen" class="fixed inset-0 flex z-40 lg:hidden">
        <div class="fixed inset-0 bg-gray-600 bg-opacity-75" (click)="closeSidebar()"></div>
        <div class="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800">
          <div class="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              class="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              (click)="closeSidebar()"
            >
              <span class="sr-only">Close sidebar</span>
              <svg class="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <app-sidebar (navigationClick)="closeSidebar()"></app-sidebar>
        </div>
      </div>

      <!-- Main content area -->
      <div class="flex flex-col flex-1 overflow-hidden">
        <!-- Navbar -->
        <div class="relative z-10 flex-shrink-0 flex h-16 bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
          <button
            type="button"
            class="px-4 border-r border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
            (click)="openSidebar()"
          >
            <span class="sr-only">Open sidebar</span>
            <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div class="flex-1 px-4 flex justify-between">
            <div class="flex-1 flex items-center">
              <!-- Breadcrumb will be rendered here -->
              <app-breadcrumb class="hidden md:block"></app-breadcrumb>
            </div>
            <div class="ml-4 flex items-center md:ml-6 space-x-4">
              <!-- Notification Bell -->
              <app-notification-bell class="hidden sm:block"></app-notification-bell>

              <!-- Theme Toggle -->
              <button
                type="button"
                class="bg-gray-100 dark:bg-gray-700 p-1 rounded-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                (click)="toggleTheme()"
                [attr.aria-label]="'Switch to ' + (isDarkMode ? 'light' : 'dark') + ' theme'"
              >
                <svg *ngIf="!isDarkMode" class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                <svg *ngIf="isDarkMode" class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </button>

              <!-- User menu -->
              <div class="relative ml-3">
                <div>
                  <button
                    type="button"
                    class="max-w-xs bg-gray-200 dark:bg-gray-700 rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    (click)="toggleUserMenu()"
                    [attr.aria-expanded]="userMenuOpen"
                  >
                    <span class="sr-only">Open user menu</span>
                    <img class="h-8 w-8 rounded-full" [src]="userAvatar" [alt]="userName">
                  </button>
                </div>

                <!-- Dropdown menu -->
                <div *ngIf="userMenuOpen" class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <a href="#" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Your Profile</a>
                  <a href="#" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Settings</a>
                  <a href="#" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Sign out</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Main content -->
        <main class="flex-1 relative overflow-y-auto focus:outline-none">
          <div class="py-6">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <!-- Page content -->
              <router-outlet></router-outlet>
            </div>
          </div>
        </main>

        <!-- Footer -->
        <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 md:px-8">
            <div class="flex justify-between items-center">
              <div class="flex items-center space-x-4">
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  © {{ currentYear }} Car Maintenance System. All rights reserved.
                </p>
              </div>
              <div class="flex items-center space-x-4">
                <a href="#" class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Privacy</a>
                <a href="#" class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Terms</a>
                <a href="#" class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Support</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .main-layout {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    .focus\\:outline-none:focus {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }

    .focus\\:ring-2:focus {
      box-shadow: 0 0 0 2px var(--ring-color);
    }

    .focus\\:ring-inset:focus {
      box-shadow: inset 0 0 0 2px var(--ring-color);
    }

    .focus\\:ring-offset-2:focus {
      box-shadow: 0 0 0 2px var(--ring-offset-color);
    }
  `]
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  sidebarOpen = false;
  userMenuOpen = false;
  isDarkMode = false;
  currentYear = new Date().getFullYear();
  
  userName = 'John Doe'; // This would come from auth service
  userAvatar = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facepad&facepad=2&w=256&h=256&q=80';

  constructor() {}

  ngOnInit(): void {
    // Initialize theme from localStorage or system preference
    this.initializeTheme();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeTheme(): void {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    this.isDarkMode = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
    this.updateTheme();
  }

  private updateTheme(): void {
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    this.updateTheme();
  }

  openSidebar(): void {
    this.sidebarOpen = true;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  // Close dropdowns when clicking outside
  onClickOutside(): void {
    this.userMenuOpen = false;
    if (window.innerWidth < 1024) {
      this.sidebarOpen = false;
    }
  }
}