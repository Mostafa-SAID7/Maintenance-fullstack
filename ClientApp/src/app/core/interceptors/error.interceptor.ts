import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NotificationService, NotificationType } from '../services/notification.service';
import { AuthService } from '../services/auth.service';
import { AnalyticsService } from '../services/analytics.service';
import { environment } from '../../../environments/environment';

export interface ErrorInfo {
  message: string;
  statusCode: number;
  url: string;
  method: string;
  timestamp: Date;
  userAgent: string;
  correlationId?: string;
  retryCount?: number;
}

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private router: Router,
    private notificationService: NotificationService,
    private authService: AuthService,
    private analyticsService: AnalyticsService
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        this.handleError(error, request);
        return throwError(() => error);
      })
    );
  }

  /**
   * Handle HTTP errors globally
   */
  private handleError(error: HttpErrorResponse, request: HttpRequest<any>): void {
    const errorInfo: ErrorInfo = this.createErrorInfo(error, request);
    
    // Log error for analytics
    this.logError(errorInfo);
    
    // Show user notification based on error type
    this.showUserNotification(error);
    
    // Handle specific error cases
    this.handleSpecificErrors(error);
    
    // Track error for analytics
    this.trackError(errorInfo);
  }

  /**
   * Create error information object
   */
  private createErrorInfo(error: HttpErrorResponse, request: HttpRequest<any>): ErrorInfo {
    return {
      message: this.getErrorMessage(error),
      statusCode: error.status,
      url: request.url,
      method: request.method,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      correlationId: request.headers.get('X-Correlation-ID') || undefined,
      retryCount: parseInt(request.headers.get('X-Retry-Count') || '0')
    };
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      return `Network error: ${error.error.message}`;
    }

    // Server-side error
    switch (error.status) {
      case 0:
        return 'Unable to connect to the server. Please check your internet connection.';
      case 400:
        return error.error?.message || 'Invalid request. Please check your input.';
      case 401:
        return 'Your session has expired. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return error.error?.message || 'A conflict occurred. The resource may have been modified.';
      case 422:
        return this.formatValidationErrors(error.error?.errors) || 'Validation failed. Please check your input.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Internal server error. Please try again later.';
      case 502:
        return 'Bad gateway. The server is temporarily unavailable.';
      case 503:
        return 'Service temporarily unavailable. Please try again later.';
      case 504:
        return 'Request timeout. Please try again.';
      default:
        return error.error?.message || `An error occurred (${error.status}). Please try again.`;
    }
  }

  /**
   * Format validation errors
   */
  private formatValidationErrors(errors: any): string | null {
    if (!errors || typeof errors !== 'object') {
      return null;
    }

    const errorMessages: string[] = [];
    Object.keys(errors).forEach(field => {
      if (Array.isArray(errors[field])) {
        errors[field].forEach((msg: string) => errorMessages.push(`${field}: ${msg}`));
      } else {
        errorMessages.push(`${field}: ${errors[field]}`);
      }
    });

    return errorMessages.length > 0 ? errorMessages.join(', ') : null;
  }

  /**
   * Show user notification
   */
  private showUserNotification(error: HttpErrorResponse): void {
    const message = this.getErrorMessage(error);
    
    switch (error.status) {
      case 0:
        this.createSystemNotification('Connection Error', message, NotificationType.Error);
        break;
      case 401:
        // Don't show notification for auth errors, redirect silently
        break;
      case 403:
        this.createSystemNotification('Access Denied', message, NotificationType.Warning);
        break;
      case 404:
        this.createSystemNotification('Not Found', message, NotificationType.Info);
        break;
      case 429:
        this.createSystemNotification('Rate Limited', message, NotificationType.Warning);
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        this.createSystemNotification('Server Error', message, NotificationType.Error);
        break;
      default:
        if (error.status >= 400) {
          this.createSystemNotification('Error', message, NotificationType.Error);
        }
        break;
    }
  }

  /**
   * Create system notification
   */
  private createSystemNotification(title: string, message: string, type: NotificationType): void {
    // Create a simple notification object
    const notification = {
      title,
      message,
      type,
      isPersistent: type === NotificationType.Error
    };
    
    this.notificationService.createSystemNotification(title, message, type).subscribe({
      error: (err) => console.warn('Failed to create notification:', err)
    });

    // Also log to console for immediate feedback
    console.log(`[Notification] ${title}: ${message}`);
  }

  /**
   * Handle specific error cases
   */
  private handleSpecificErrors(error: HttpErrorResponse): void {
    switch (error.status) {
      case 401:
        // Unauthorized - logout user
        this.authService.logout();
        break;
      case 403:
        // Forbidden - redirect to unauthorized page
        this.router.navigate(['/unauthorized']);
        break;
      case 404:
        // Not Found - could redirect to 404 page for certain requests
        if (this.isApiRequest(error.url || '')) {
          // For API requests, don't redirect, just show notification
          break;
        }
        break;
      case 429:
        // Too Many Requests - could implement rate limiting logic
        this.handleRateLimit(error);
        break;
    }
  }

  /**
   * Handle rate limiting
   */
  private handleRateLimit(error: HttpErrorResponse): void {
    const retryAfter = error.headers.get('Retry-After');
    if (retryAfter) {
      console.warn(`Rate limited. Retry after ${retryAfter} seconds.`);
      // Could implement client-side rate limiting here
    }
  }

  /**
   * Check if URL is an API request
   */
  private isApiRequest(url: string): boolean {
    return url.includes('/api/') || url.includes('/auth/');
  }

  /**
   * Log error for debugging
   */
  private logError(errorInfo: ErrorInfo): void {
    if (!environment.production) {
      console.group('🚨 HTTP Error');
      console.error('Status:', errorInfo.statusCode);
      console.error('Message:', errorInfo.message);
      console.error('URL:', errorInfo.url);
      console.error('Method:', errorInfo.method);
      console.error('Timestamp:', errorInfo.timestamp);
      console.error('Correlation ID:', errorInfo.correlationId);
      console.groupEnd();
    }
  }

  /**
   * Track error for analytics
   */
  private trackError(errorInfo: ErrorInfo): void {
    // Track error with analytics service
    this.analyticsService.trackEvent('http_error', 'system', errorInfo.statusCode.toString(), errorInfo.message, undefined, {
      url: errorInfo.url,
      method: errorInfo.method,
      timestamp: errorInfo.timestamp.toISOString()
    });

    // Track critical errors separately
    if (this.isCriticalError(errorInfo.statusCode)) {
      this.analyticsService.trackEvent('critical_error', 'system', errorInfo.statusCode.toString(), errorInfo.message, undefined, {
        url: errorInfo.url
      });
    }
  }

  /**
   * Check if error is critical (server errors, etc.)
   */
  private isCriticalError(statusCode: number): boolean {
    return statusCode >= 500 || statusCode === 0;
  }

  /**
   * Get error details for logging
   */
  private getErrorDetails(error: HttpErrorResponse): any {
    const details: any = {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      name: error.name,
      message: error.message
    };

    // Add error body if available
    if (error.error) {
      details.error = error.error;
    }

    // Add headers for debugging
    if (!environment.production) {
      details.headers = error.headers;
    }

    return details;
  }

  /**
   * Handle network errors specifically
   */
  private handleNetworkError(error: HttpErrorResponse): void {
    if (error.status === 0) {
      // Network error - could show offline indicator
      console.warn('Network connectivity issue detected');
      
      // Track offline events
      this.analyticsService.trackEvent('network_error', 'system', 'connectivity', error.url || 'unknown', undefined, {
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Handle timeout errors
   */
  private handleTimeoutError(error: HttpErrorResponse): void {
    if (error.status === 504) {
      this.createSystemNotification(
        'Request Timeout',
        'The request took too long to complete. Please try again.',
        NotificationType.Warning
      );
    }
  }

  /**
   * Handle validation errors specifically
   */
  private handleValidationError(error: HttpErrorResponse): void {
    if (error.status === 422) {
      const errors = error.error?.errors;
      if (errors && typeof errors === 'object') {
        // Could show field-specific validation messages
        console.warn('Validation errors:', errors);
      }
    }
  }

  /**
   * Create retry strategy for certain errors
   */
  private shouldRetry(error: HttpErrorResponse): boolean {
    // Retry server errors and timeouts
    return error.status >= 500 || error.status === 0 || error.status === 408;
  }

  /**
   * Get retry delay for exponential backoff
   */
  private getRetryDelay(retryCount: number): number {
    return Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30 seconds
  }

  /**
   * Check if error is from our API
   */
  private isOurApiError(error: HttpErrorResponse): boolean {
    const apiUrl = environment.apiUrl || '';
    return error.url?.includes(apiUrl) || false;
  }

  /**
   * Handle CORS errors
   */
  private handleCorsError(error: HttpErrorResponse): void {
    if (error.status === 0 && error.message.includes('CORS')) {
      this.createSystemNotification(
        'CORS Error',
        'Cross-origin request blocked. Please contact support.',
        NotificationType.Error
      );
    }
  }

  /**
   * Global error handler that can be called from other parts of the app
   */
  public static handleGlobalError(error: any, context?: string): void {
    console.error(`Global error${context ? ` in ${context}` : ''}:`, error);
    
    // Could implement global error reporting here
    if (typeof error === 'string') {
      console.error('String error:', error);
    } else if (error instanceof Error) {
      console.error('Error object:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    } else {
      console.error('Unknown error type:', typeof error, error);
    }
  }
}