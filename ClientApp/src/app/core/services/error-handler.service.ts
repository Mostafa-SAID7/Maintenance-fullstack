import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { NotificationService, NotificationType } from './notification.service';

export interface ErrorInfo {
  id: string;
  timestamp: Date;
  message: string;
  details?: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'network' | 'validation' | 'authentication' | 'authorization' | 'server' | 'client' | 'unknown';
  retryable: boolean;
  context?: string;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableStatuses: number[];
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  private errors$ = new BehaviorSubject<ErrorInfo[]>([]);
  private readonly retryConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryableStatuses: [408, 429, 500, 502, 503, 504]
  };

  constructor(private notificationService: NotificationService) {}

  /**
   * Get all errors as observable
   */
  getErrors(): Observable<ErrorInfo[]> {
    return this.errors$.asObservable();
  }

  /**
   * Handle HTTP errors with user-friendly messages
   */
  handleHttpError(error: HttpErrorResponse, context?: string): ErrorInfo {
    const errorInfo = this.createErrorInfo(error, context);
    this.addError(errorInfo);
    this.showUserNotification(errorInfo);
    return errorInfo;
  }

  /**
   * Handle general errors
   */
  handleError(error: any, context?: string): ErrorInfo {
    const errorInfo: ErrorInfo = {
      id: this.generateId(),
      timestamp: new Date(),
      message: this.getErrorMessage(error),
      details: error,
      severity: this.getErrorSeverity(error),
      type: this.getErrorType(error),
      retryable: this.isRetryable(error),
      context
    };

    this.addError(errorInfo);
    this.showUserNotification(errorInfo);
    return errorInfo;
  }

  /**
   * Handle validation errors specifically
   */
  handleValidationError(errors: { [key: string]: string[] }, context?: string): ErrorInfo {
    const message = Object.entries(errors)
      .map(([field, fieldErrors]) => `${field}: ${fieldErrors.join(', ')}`)
      .join('; ');

    const errorInfo: ErrorInfo = {
      id: this.generateId(),
      timestamp: new Date(),
      message: `Validation failed: ${message}`,
      details: errors,
      severity: 'medium',
      type: 'validation',
      retryable: false,
      context
    };

    this.addError(errorInfo);
    this.showUserNotification(errorInfo);
    return errorInfo;
  }

  /**
   * Execute function with automatic retry logic
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    context?: string,
    config?: Partial<RetryConfig>
  ): Promise<T> {
    const retryConfig = { ...this.retryConfig, ...config };
    let lastError: any;

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === retryConfig.maxAttempts || !this.isRetryable(error, retryConfig)) {
          this.handleError(error, context);
          break;
        }

        const delay = this.calculateDelay(attempt - 1, retryConfig);
        await this.sleep(delay);
        
        if (attempt < retryConfig.maxAttempts) {
          this.showRetryNotification(attempt, retryConfig.maxAttempts);
        }
      }
    }

    throw lastError;
  }

  /**
   * Clear errors older than specified time
   */
  clearOldErrors(olderThanMinutes: number = 60): void {
    const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);
    const currentErrors = this.errors$.value;
    const filteredErrors = currentErrors.filter(error => error.timestamp > cutoff);
    this.errors$.next(filteredErrors);
  }

  /**
   * Clear specific error by ID
   */
  clearError(id: string): void {
    const currentErrors = this.errors$.value;
    const filteredErrors = currentErrors.filter(error => error.id !== id);
    this.errors$.next(filteredErrors);
  }

  /**
   * Clear all errors
   */
  clearAllErrors(): void {
    this.errors$.next([]);
  }

  private createErrorInfo(error: HttpErrorResponse, context?: string): ErrorInfo {
    return {
      id: this.generateId(),
      timestamp: new Date(),
      message: this.getHttpErrorMessage(error),
      details: error,
      severity: this.getHttpErrorSeverity(error),
      type: this.getHttpErrorType(error),
      retryable: this.isHttpRetryable(error),
      context
    };
  }

  private getHttpErrorMessage(error: HttpErrorResponse): string {
    if (error.error?.message) {
      return error.error.message;
    }

    switch (error.status) {
      case 0:
        return 'Unable to connect to the server. Please check your internet connection.';
      case 400:
        return 'The request was invalid. Please check your input.';
      case 401:
        return 'You are not authorized to perform this action. Please log in again.';
      case 403:
        return 'You do not have permission to access this resource.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'The request conflicts with the current state of the resource.';
      case 422:
        return 'The request contains invalid data.';
      case 429:
        return 'Too many requests. Please wait a moment before trying again.';
      case 500:
        return 'A server error occurred. Please try again later.';
      case 502:
      case 503:
      case 504:
        return 'The server is temporarily unavailable. Please try again later.';
      default:
        return `An error occurred (${error.status}). Please try again.`;
    }
  }

  private getHttpErrorSeverity(error: HttpErrorResponse): ErrorInfo['severity'] {
    if (error.status === 0) return 'critical';
    if (error.status >= 500) return 'high';
    if (error.status >= 400) return 'medium';
    return 'low';
  }

  private getHttpErrorType(error: HttpErrorResponse): ErrorInfo['type'] {
    if (error.status === 0) return 'network';
    if (error.status === 401) return 'authentication';
    if (error.status === 403) return 'authorization';
    if (error.status === 422) return 'validation';
    if (error.status >= 500) return 'server';
    if (error.status >= 400) return 'client';
    return 'unknown';
  }

  private isHttpRetryable(error: HttpErrorResponse): boolean {
    return this.retryConfig.retryableStatuses.includes(error.status) || error.status === 0;
  }

  private getErrorMessage(error: any): string {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    return 'An unexpected error occurred';
  }

  private getErrorSeverity(error: any): ErrorInfo['severity'] {
    if (error?.severity) return error.severity;
    return 'medium';
  }

  private getErrorType(error: any): ErrorInfo['type'] {
    if (error?.type) return error.type;
    return 'unknown';
  }

  private isRetryable(error: any, config?: RetryConfig): boolean {
    const retryConfig = config || this.retryConfig;
    if (error?.retryable !== undefined) return error.retryable;
    if (error instanceof HttpErrorResponse) {
      return this.isHttpRetryable(error);
    }
    return false;
  }

  private calculateDelay(attempt: number, config: RetryConfig): number {
    const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
    return Math.min(delay, config.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private addError(error: ErrorInfo): void {
    const currentErrors = this.errors$.value;
    this.errors$.next([...currentErrors, error]);
  }

  private showUserNotification(error: ErrorInfo): void {
    const message = this.getUserFriendlyMessage(error);
    
    // Use console for now since the existing notification service is for system notifications
    console.error('Application Error:', message, error);
    
    // You could also create a system notification for critical errors
    if (error.severity === 'critical' || error.severity === 'high') {
      this.notificationService.createSystemNotification(
        'Error',
        message,
        error.severity === 'critical' ? NotificationType.Error : NotificationType.Warning
      ).subscribe();
    }
  }

  private showRetryNotification(attempt: number, maxAttempts: number): void {
    console.info(`Retrying... (${attempt}/${maxAttempts})`);
  }

  private getUserFriendlyMessage(error: ErrorInfo): string {
    switch (error.type) {
      case 'network':
        return 'Connection problem. Check your internet connection and try again.';
      case 'authentication':
        return 'Your session has expired. Please log in again.';
      case 'authorization':
        return 'You do not have permission to perform this action.';
      case 'validation':
        return error.message;
      case 'server':
        return 'Server error occurred. Our team has been notified.';
      default:
        return error.message;
    }
  }

  private getSnackBarClass(severity: ErrorInfo['severity']): string {
    switch (severity) {
      case 'critical':
        return 'error-notification';
      case 'high':
        return 'error-notification';
      case 'medium':
        return 'warning-notification';
      case 'low':
        return 'info-notification';
      default:
        return 'default-notification';
    }
  }

  private handleRetry(error: ErrorInfo): void {
    // Implementation would depend on the context
    // This could trigger a refresh of the failed operation
    console.log('Retrying operation for error:', error);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}