import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { User } from '../../core/models/user.model';
import { ThemeService, ThemeConfig } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';

interface NavigationItem {
  label: string;
  route?: string;
  icon: string;
  children?: NavigationItem[];
  roles?: string[];
  isActive?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="h-full flex flex-col">
      <!-- Logo and Brand -->
      <div class="flex items-center flex-shrink-0 px-4 py-6">
        <img class="h-8 w-auto" src="https://tailwindui.com/img/logos/workflow-logo-indigo-600-mark-gray-800-text" alt="Car Maintenance System">
        <span class="ml-2 text-xl font-semibold text-gray-900 dark:text-white">Car Care</span>
      </div>

      <!-- Navigation Menu -->
      <div class="flex-grow flex flex-col overflow-y-auto">
        <nav class="flex-1 px-2 space-y-1 bg-white dark:bg-gray-800">
          <div *ngFor="let item of navigationItems" class="space-y-1">
            <!-- Item with children -->
            <div *ngIf="item.children && item.children.length > 0">
              <button
                type="button"
                class="group w-full flex items-center pl-2 pr-1 py-2 text-left text-sm font-medium rounded-md transition-colors duration-150 ease-in-out"
                [ngClass]="getItemClasses(item)"
                (click)="toggleSubmenu(item)"
              >
                <svg [innerHTML]="item.icon" class="mr-3 h-6 w-6 flex-shrink-0 transition-colors duration-150 ease-in-out"></svg>
                <span class="flex-1">{{ item.label }}</span>
                <svg
                  class="ml-3 h-5 w-5 transition-transform duration-150 ease-in-out transform"
                  [ngClass]="{'rotate-90': item.isActive}"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <!-- Submenu -->
              <div class="space-y-1 mt-1" *ngIf="item.isActive">
                <a
                  *ngFor="let child of item.children"
                  [routerLink]="child.route"
                  class="group w-full flex items-center pl-11 pr-2 py-2 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out"
                  [ngClass]="getItemClasses(child)"
                  (click)="onNavigationClick()"
                >
                  <svg [innerHTML]="child.icon" class="mr-3 h-4 w-4 flex-shrink-0 transition-colors duration-150 ease-in-out"></svg>
                  {{ child.label }}
                </a>
              </div>
            </div>

            <!-- Single item -->
            <a
              *ngIf="!item.children || item.children.length === 0"
              [routerLink]="item.route"
              class="group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out"
              [ngClass]="getItemClasses(item)"
              (click)="onNavigationClick()"
            >
              <svg [innerHTML]="item.icon" class="mr-3 h-6 w-6 flex-shrink-0 transition-colors duration-150 ease-in-out"></svg>
              {{ item.label }}
            </a>
          </div>
        </nav>
      </div>

      <!-- User info and logout -->
      <div class="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
        <div class="flex-shrink-0 w-full group block">
          <div class="flex items-center">
            <div>
              <img class="h-8 w-8 rounded-full" [src]="currentUser?.avatar || '/assets/images/placeholder-avatar.png'" [alt]="getUserDisplayName()">
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white">
                {{ getUserDisplayName() }}
              </p>
              <button
                type="button"
                class="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-150"
                (click)="logout()"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    /* Active states */
    .active-item {
      @apply bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100;
    }
    
    .active-item svg {
      @apply text-blue-600 dark:text-blue-300;
    }
    
    /* Hover states */
    .hover-item {
      @apply text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white;
    }
    
    /* Transition classes */
    .transition-colors {
      transition-property: color, background-color, border-color;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-duration: 150ms;
    }
    
    .transition-transform {
      transition-property: transform;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-duration: 150ms;
    }
  `]
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() compact = false;
  @Input() showLabels = true;
  
  private destroy$ = new Subject<void>();
  
  currentUser: User | null = null;
  isDarkMode = false;

  navigationItems: NavigationItem[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z" />',
      isActive: false
    },
    {
      label: 'Cars',
      route: '/cars',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2M5 12h14" />',
      isActive: false
    },
    {
      label: 'Maintenance',
      route: '/maintenance',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />',
      isActive: false
    },
    {
      label: 'Owners',
      route: '/owners',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />',
      isActive: false
    },
    {
      label: 'Reports',
      route: '/reports',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />',
      isActive: false
    },
    {
      label: 'Analytics',
      route: '/analytics',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />',
      isActive: false
    },
    {
      label: 'Notifications',
      route: '/notifications',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM10.07 2.82l-.03-.06a15.247 15.247 0 01-3.79-4.53 15.247 15.247 0 01-.05-.06C1.58 2.71 1 3.12 1 4.38v.55c0 1.26.58 1.67 1.21 2.13l.05.06a15.247 15.247 0 003.79 4.53l.03.06c.54.64.54 1.58 0 2.22l-.03.06a15.247 15.247 0 01-3.79 4.53l-.05.06c-.63.46-1.21.87-1.21 2.13v.55c0 1.26.58 1.67 1.21 2.13l.05.06a15.247 15.247 0 003.79 4.53 15.247 15.247 0 00.05.06c.63.46 1.71.05 1.71-1.3v-.55c0-1.26-.58-1.67-1.21-2.13l-.05-.06a15.247 15.247 0 01-3.79-4.53l-.03-.06a15.247 15.247 0 010-2.22l.03-.06a15.247 15.247 0 013.79-4.53l.05-.06c.63-.46 1.21-.87 1.21-2.13v-.55c0-1.26-.58-1.67-1.21-2.13z" />',
      isActive: false
    },
    {
      label: 'Settings',
      route: '/settings',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />',
      isActive: false
    },
    {
      label: 'Admin',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />',
      roles: ['Admin'],
      isActive: false
    }
  ];

  constructor(
    private authService: AuthService,
    private themeService: ThemeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get current user
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user: User | null) => {
        this.currentUser = user;
      });

    // Subscribe to theme changes
    this.themeService.currentTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe((theme: ThemeConfig | null) => {
        this.isDarkMode = theme?.isDark || false;
      });

    // Set active state based on current route
    this.updateActiveState();
    
    // Listen to route changes
    this.router.events
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateActiveState();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateActiveState(): void {
    const currentUrl = this.router.url;
    
    this.navigationItems.forEach(item => {
      if (item.route) {
        item.isActive = currentUrl.startsWith(item.route);
      } else if (item.children) {
        item.isActive = item.children.some(child => currentUrl.startsWith(child.route || ''));
      }
    });
  }

  getItemClasses(item: NavigationItem): string {
    const baseClasses = 'transition-colors duration-150 ease-in-out';
    
    if (item.isActive) {
      return `${baseClasses} active-item`;
    }
    
    if (item.roles && !this.hasRequiredRole(item.roles)) {
      return `${baseClasses} text-gray-400 dark:text-gray-500 cursor-not-allowed`;
    }
    
    return `${baseClasses} hover-item`;
  }

  private hasRequiredRole(roles: string[]): boolean {
    if (!this.currentUser?.role) return false;
    return roles.includes(this.currentUser.role);
  }

  toggleSubmenu(item: NavigationItem): void {
    if (item.children && item.children.length > 0) {
      item.isActive = !item.isActive;
    }
  }

  onNavigationClick(): void {
    // Emit event for parent component to handle (e.g., close mobile sidebar)
    // This will be handled by the MainLayout component
  }

  logout(): void {
    this.authService.logout();
  }

  getUserDisplayName(): string {
    if (!this.currentUser) return 'User';
    return `${this.currentUser.firstName} ${this.currentUser.lastName}`.trim() || this.currentUser.email;
  }
}