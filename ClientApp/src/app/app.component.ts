import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

// Core Services
import { ThemeService } from './core/services/theme.service';
import { AuthService } from './core/services/auth.service';
import { SignalRService } from './core/services/signalr.service';
import { NotificationService } from './core/services/notification.service';
import { SEOService } from './core/services/seo.service';
import { OfflineService } from './core/services/offline.service';
import { AnalyticsService } from './core/services/analytics.service';
import { BreadcrumbService } from './core/services/breadcrumb.service';

// Layout Components
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MainLayoutComponent,
    AuthLayoutComponent
  ],
  template: `
    <!-- Main Application Container -->
    <div class="app-container" [attr.data-theme]="currentTheme">
      
      <!-- Skip to main content link for accessibility -->
      <a class="skip-link" href="#main-content" tabindex="0">
        Skip to main content
      </a>
      
      <!-- Loading Indicator -->
      <div *ngIf="isLoading" class="app-loading">
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p class="loading-text">Loading...</p>
        </div>
      </div>
      
      <!-- Error Boundary -->
      <div *ngIf="hasError" class="app-error">
        <div class="error-container">
          <div class="error-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <h1 class="error-title">Something went wrong</h1>
          <p class="error-description">{{ errorMessage }}</p>
          <div class="error-actions">
            <button class="btn btn-primary" (click)="reloadApp()">
              Reload App
            </button>
            <button class="btn btn-secondary" (click)="goToHome()">
              Go Home
            </button>
          </div>
        </div>
      </div>
      
      <!-- Offline Indicator -->
      <div *ngIf="!isOnline" class="offline-indicator">
        <div class="offline-content">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
            <line x1="6" y1="1" x2="6" y2="4"/>
            <line x1="10" y1="1" x2="10" y2="4"/>
            <line x1="14" y1="1" x2="14" y2="4"/>
          </svg>
          <span>Offline</span>
        </div>
      </div>
      
      <!-- Main Content Router -->
      <main id="main-content" class="main-content" role="main">
        
        <!-- Auth Layout (for login, register, etc.) -->
        <app-auth-layout *ngIf="isAuthRoute"></app-auth-layout>
        
        <!-- Main Layout (for authenticated users) -->
        <app-main-layout *ngIf="!isAuthRoute && isAuthenticated"></app-main-layout>
        
        <!-- Loading placeholder for routes -->
        <div *ngIf="!isAuthRoute && !isAuthenticated && !isLoading" class="auth-loading">
          <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Verifying authentication...</p>
          </div>
        </div>
        
      </main>
      
      <!-- Toast Notifications -->
      <div id="toast-container" class="toast-container" aria-live="polite" aria-atomic="true">
        <div
          *ngFor="let toast of toastNotifications; trackBy: trackToast"
          class="toast"
          [ngClass]="'toast-' + toast.type"
          [attr.role]="getToastRole(toast.type)"
        >
          <div class="toast-icon">
            <svg *ngIf="toast.type === 'success'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <svg *ngIf="toast.type === 'error'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <svg *ngIf="toast.type === 'warning'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <svg *ngIf="toast.type === 'info'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </div>
          <div class="toast-content">
            <div class="toast-title">{{ toast.title }}</div>
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          <button class="toast-close" (click)="dismissToast(toast.id)" aria-label="Dismiss notification">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
      
    </div>
  `,
  styles: [`
    /* App Container */
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #ffffff;
      color: #1e293b;
      transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
    }
    
    /* Skip Link for Accessibility */
    .skip-link {
      position: absolute;
      top: -40px;
      left: 6px;
      background: #3b82f6;
      color: white;
      padding: 8px;
      text-decoration: none;
      border-radius: 0.375rem;
      z-index: 1070;
      transition: top 0.15s ease-in-out;
    }
    
    .skip-link:focus {
      top: 6px;
    }
    
    /* Main Content */
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    
    /* Loading States */
    .app-loading {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1050;
    }
    
    .loading-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
    }
    
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    .loading-text {
      color: #64748b;
      font-size: 0.875rem;
      margin: 0;
    }
    
    .auth-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 50vh;
    }
    
    /* Error States */
    .app-error {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1050;
      padding: 1.5rem;
    }
    
    .error-container {
      text-align: center;
      max-width: 500px;
      width: 100%;
    }
    
    .error-icon {
      color: #ef4444;
      margin-bottom: 1.5rem;
      display: flex;
      justify-content: center;
    }
    
    .error-title {
      font-size: 1.875rem;
      font-weight: 700;
      line-height: 1.25;
      margin-bottom: 0.75rem;
      color: #1e293b;
    }
    
    .error-description {
      font-size: 1rem;
      font-weight: 400;
      line-height: 1.5;
      color: #64748b;
      margin-bottom: 2rem;
      line-height: 1.75;
    }
    
    .error-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
      flex-wrap: wrap;
    }
    
    /* Offline Indicator */
    .offline-indicator {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background-color: #f59e0b;
      color: white;
      padding: 0.5rem 1rem;
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1030;
      font-size: 0.875rem;
    }
    
    .offline-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    /* Toast Notifications */
    .toast-container {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 1080;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      max-width: 400px;
      width: calc(100% - 2rem);
    }
    
    .toast {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 0.75rem;
      border-radius: 0.5rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      animation: slideInRight 0.3s ease-out;
      transition: all 0.2s ease-in-out;
    }
    
    .toast-success {
      border-left: 4px solid #10b981;
      background-color: #f0fdf4;
    }
    
    .toast-error {
      border-left: 4px solid #ef4444;
      background-color: #fef2f2;
    }
    
    .toast-warning {
      border-left: 4px solid #f59e0b;
      background-color: #fffbeb;
    }
    
    .toast-info {
      border-left: 4px solid #3b82f6;
      background-color: #eff6ff;
    }
    
    .toast-icon {
      flex-shrink: 0;
      margin-top: 2px;
    }
    
    .toast-success .toast-icon {
      color: #10b981;
    }
    
    .toast-error .toast-icon {
      color: #ef4444;
    }
    
    .toast-warning .toast-icon {
      color: #f59e0b;
    }
    
    .toast-info .toast-icon {
      color: #3b82f6;
    }
    
    .toast-content {
      flex: 1;
      min-width: 0;
    }
    
    .toast-title {
      font-weight: 600;
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
    }
    
    .toast-message {
      font-size: 0.875rem;
      line-height: 1.5;
      opacity: 0.9;
    }
    
    .toast-close {
      flex-shrink: 0;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.25rem;
      color: #94a3b8;
      transition: all 0.15s ease-in-out;
    }
    
    .toast-close:hover {
      background-color: rgba(0, 0, 0, 0.1);
      color: #64748b;
    }
    
    /* Animations */
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    /* Responsive Design */
    @media (max-width: 767px) {
      .toast-container {
        top: 0.75rem;
        left: 0.75rem;
        right: 0.75rem;
        max-width: none;
        width: auto;
      }
      
      .error-actions {
        flex-direction: column;
      }
      
      .offline-indicator {
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
      }
    }
    
    /* Dark theme */
    [data-theme="dark"] {
      background-color: #111827;
      color: #f9fafb;
    }
    
    [data-theme="dark"] .app-loading,
    [data-theme="dark"] .app-error {
      background-color: #111827;
    }
    
    [data-theme="dark"] .spinner {
      border-color: #374151;
      border-top-color: #60a5fa;
    }
    
    [data-theme="dark"] .toast {
      background-color: #1f2937;
      border-color: #374151;
      color: #f9fafb;
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Injected Services
  private themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private router = inject(Router);
  
  // Component State
  isLoading = true;
  hasError = false;
  errorMessage = '';
  currentTheme = 'light';
  isOnline = navigator.onLine;
  isAuthenticated = false;
  isAuthRoute = false;
  
  // Toast Notifications
  toastNotifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: Date;
  }> = [];
  
  ngOnInit(): void {
    this.initializeApp();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private initializeApp(): void {
    // Set up error handling
    window.addEventListener('error', (event) => {
      this.handleError(event.error);
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason);
    });
    
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.showToast('success', 'Back Online', 'Your connection has been restored.');
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showToast('warning', 'Offline', 'You are currently offline. Some features may be limited.');
    });
    
    // Initialize core services
    this.initializeServices();
    
    // Set up route change detection
    this.setupRouteDetection();
    
    // Mark app as loaded
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }
  
  private initializeServices(): void {
    // Theme service
    this.themeService.currentTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(theme => {
        this.currentTheme = theme?.name || 'light';
      });
    
    // Auth service
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.isAuthenticated = !!user;
      });
  }
  
  private setupRouteDetection(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        const url = this.router.url;
        this.isAuthRoute = this.isAuthRouteUrl(url);
      });
  }
  
  private isAuthRouteUrl(url: string): boolean {
    const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
    return authRoutes.some(route => url.startsWith(route));
  }
  
  private handleError(error: any): void {
    console.error('Global error:', error);
    
    this.hasError = true;
    this.errorMessage = error?.message || 'An unexpected error occurred';
  }
  
  public reloadApp(): void {
    window.location.reload();
  }
  
  public goToHome(): void {
    this.router.navigate(['/dashboard']);
  }
  
  public showToast(type: 'success' | 'error' | 'warning' | 'info', title: string, message: string): void {
    const id = Date.now().toString();
    const toast = {
      id,
      type,
      title,
      message,
      timestamp: new Date()
    };
    
    this.toastNotifications.push(toast);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      this.dismissToast(id);
    }, 5000);
  }
  
  public dismissToast(id: string): void {
    const index = this.toastNotifications.findIndex(toast => toast.id === id);
    if (index > -1) {
      this.toastNotifications.splice(index, 1);
    }
  }
  
  public trackToast(index: number, toast: any): string {
    return toast.id;
  }
  
  public getToastRole(type: string): string {
    const roleMap: Record<string, string> = {
      'success': 'status',
      'error': 'alert',
      'warning': 'alert',
      'info': 'status'
    };
    
    return roleMap[type] || 'status';
  }
}