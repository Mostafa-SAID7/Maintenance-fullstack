import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of, timer } from 'rxjs';
import { catchError, filter, take, switchMap, mergeMap, delayWhen } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<any>(null);

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Add auth header with JWT token if available
    const authToken = this.authService.getToken();
    if (authToken && this.shouldAddToken(request)) {
      request = this.addTokenToRequest(request, authToken);
    }

    return next.handle(request).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.handle401Error(request, next);
        }
        return throwError(error);
      })
    );
  }

  /**
   * Check if token should be added to the request
   */
  private shouldAddToken(request: HttpRequest<any>): boolean {
    // Skip token addition for auth endpoints (login, register, refresh)
    const skipTokenEndpoints = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/forgot-password', '/auth/reset-password'];
    const shouldSkip = skipTokenEndpoints.some(endpoint => request.url.includes(endpoint));
    
    // Skip token addition for public endpoints
    const publicEndpoints = ['/auth/verify', '/public'];
    const isPublic = publicEndpoints.some(endpoint => request.url.includes(endpoint));
    
    // Skip for non-API requests (assets, etc.)
    const isNonApi = !request.url.includes('/api/') && !request.url.includes(environment?.apiUrl || '');
    
    return !shouldSkip && !isPublic && !isNonApi;
  }

  /**
   * Add token to request header
   */
  private addTokenToRequest(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  /**
   * Handle 401 Unauthorized errors
   */
  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((token: any) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(token);
          
          if (token) {
            // Retry the original request with new token
            return next.handle(this.addTokenToRequest(request, token));
          } else {
            // If refresh failed, logout user
            this.authService.logout();
            return throwError('Token refresh failed');
          }
        }),
        catchError((error) => {
          this.isRefreshing = false;
          this.authService.logout();
          return throwError(error);
        })
      );
    } else {
      // If refresh is in progress, wait for the new token
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(token => {
          return next.handle(this.addTokenToRequest(request, token));
        })
      );
    }
  }

  /**
   * Check if request needs authentication
   */
  private needsAuth(request: HttpRequest<any>): boolean {
    return !request.url.includes('/auth/') && !request.url.includes('/public/');
  }

  /**
   * Add CSRF token if available (for state-changing requests)
   */
  private addCsrfToken(request: HttpRequest<any>): HttpRequest<any> {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      const csrfToken = this.getCsrfToken();
      if (csrfToken) {
        request = request.clone({
          setHeaders: {
            'X-CSRF-Token': csrfToken
          }
        });
      }
    }
    return request;
  }

  /**
   * Get CSRF token from meta tag or cookie
   */
  private getCsrfToken(): string | null {
    // Try to get from meta tag first
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      return metaTag.getAttribute('content');
    }

    // Try to get from cookie
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'XSRF-TOKEN' || name === '_csrf') {
        return value;
      }
    }

    return null;
  }

  /**
   * Add custom headers to request
   */
  private addCustomHeaders(request: HttpRequest<any>): HttpRequest<any> {
    const customHeaders: { [key: string]: string } = {
      'X-Client-Version': '1.0.0',
      'X-Request-Source': 'web-app'
    };

    // Add user agent
    customHeaders['User-Agent'] = navigator.userAgent;

    // Add timestamp
    customHeaders['X-Request-Time'] = new Date().toISOString();

    // Add correlation ID for request tracing
    customHeaders['X-Correlation-ID'] = this.generateCorrelationId();

    let modifiedRequest = request;
    Object.entries(customHeaders).forEach(([key, value]) => {
      modifiedRequest = modifiedRequest.clone({
        setHeaders: { [key]: value }
      });
    });

    return modifiedRequest;
  }

  /**
   * Generate unique correlation ID for request tracing
   */
  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add timeout to request
   */
  private addTimeout(request: HttpRequest<any>, timeoutMs: number = 30000): Observable<HttpEvent<any>> {
    // Note: This would typically be handled by a timeout interceptor
    // For now, we'll just ensure the request has proper timeout headers
    return of(); // Return empty observable for now
  }

  /**
   * Handle request retries with exponential backoff
   */
  private retryRequest(request: HttpRequest<any>, next: HttpHandler, maxRetries: number = 3): Observable<HttpEvent<any>> {
    let retryCount = 0;

    return next.handle(request).pipe(
      catchError(error => {
        if (retryCount < maxRetries && this.shouldRetry(error)) {
          retryCount++;
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          
          return timer(delay).pipe(
            mergeMap(() => this.retryRequest(request, next, maxRetries))
          );
        }
        return throwError(error);
      })
    );
  }

  /**
   * Check if error should trigger a retry
   */
  private shouldRetry(error: HttpErrorResponse): boolean {
    // Retry on server errors and timeouts
    return error.status >= 500 || error.status === 0 || error.status === 408;
  }

  /**
   * Add request logging
   */
  private logRequest(request: HttpRequest<any>): void {
    if (environment?.production !== true) {
      console.log(`[AuthInterceptor] ${request.method} ${request.url}`, {
        headers: request.headers.keys(),
        body: request.body
      });
    }
  }

  /**
   * Handle token expiration gracefully
   */
  private handleTokenExpiration(): void {
    // Notify user about token expiration
    console.warn('Authentication token has expired');
    
    // Could show a toast notification here
    // this.notificationService.showWarning('Your session has expired. Please log in again.');
  }

  /**
   * Check if user is still authenticated
   */
  private isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  /**
   * Get request metadata for logging
   */
  private getRequestMetadata(request: HttpRequest<any>): any {
    return {
      method: request.method,
      url: request.url,
      timestamp: new Date().toISOString(),
      correlationId: request.headers.get('X-Correlation-ID'),
      userAgent: request.headers.get('User-Agent')
    };
  }
}