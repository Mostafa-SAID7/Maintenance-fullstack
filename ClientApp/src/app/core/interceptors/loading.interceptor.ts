import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';

export interface LoadingState {
  isLoading: boolean;
  loadingCount: number;
  loadingRequests: Set<string>;
}

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private loadingSubject = new BehaviorSubject<LoadingState>({
    isLoading: false,
    loadingCount: 0,
    loadingRequests: new Set()
  });

  public loading$ = this.loadingSubject.asObservable();

  constructor() {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip loading indicator for certain requests
    if (this.shouldSkipLoading(request)) {
      return next.handle(request);
    }

    const requestId = this.generateRequestId(request);
    this.addLoadingRequest(requestId);

    return next.handle(request).pipe(
      tap((event: HttpEvent<any>) => {
        // Could track specific events here if needed
        if (event instanceof HttpResponse) {
          // Request completed successfully
        }
      }),
      finalize(() => {
        this.removeLoadingRequest(requestId);
      })
    );
  }

  /**
   * Check if loading indicator should be skipped for this request
   */
  private shouldSkipLoading(request: HttpRequest<any>): boolean {
    // Skip for background requests
    const skipHeaders = ['x-skip-loading', 'x-background-request'];
    if (skipHeaders.some(header => request.headers.has(header))) {
      return true;
    }

    // Skip for certain endpoints
    const skipEndpoints = [
      '/api/analytics',
      '/api/heartbeat',
      '/api/health',
      '/api/status'
    ];

    return skipEndpoints.some(endpoint => request.url.includes(endpoint));
  }

  /**
   * Generate unique request ID for tracking
   */
  private generateRequestId(request: HttpRequest<any>): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${request.method}_${timestamp}_${random}`;
  }

  /**
   * Add request to loading state
   */
  private addLoadingRequest(requestId: string): void {
    const currentState = this.loadingSubject.value;
    const updatedRequests = new Set(currentState.loadingRequests);
    updatedRequests.add(requestId);

    this.loadingSubject.next({
      isLoading: updatedRequests.size > 0,
      loadingCount: updatedRequests.size,
      loadingRequests: updatedRequests
    });
  }

  /**
   * Remove request from loading state
   */
  private removeLoadingRequest(requestId: string): void {
    const currentState = this.loadingSubject.value;
    const updatedRequests = new Set(currentState.loadingRequests);
    updatedRequests.delete(requestId);

    this.loadingSubject.next({
      isLoading: updatedRequests.size > 0,
      loadingCount: updatedRequests.size,
      loadingRequests: updatedRequests
    });
  }

  /**
   * Get current loading state
   */
  getCurrentLoadingState(): LoadingState {
    return this.loadingSubject.value;
  }

  /**
   * Check if any requests are currently loading
   */
  isCurrentlyLoading(): boolean {
    return this.loadingSubject.value.loadingCount > 0;
  }

  /**
   * Get loading count
   */
  getLoadingCount(): number {
    return this.loadingSubject.value.loadingCount;
  }

  /**
   * Force set loading state (useful for manual control)
   */
  setLoadingState(isLoading: boolean, requestId?: string): void {
    if (isLoading && requestId) {
      this.addLoadingRequest(requestId);
    } else if (!isLoading && requestId) {
      this.removeLoadingRequest(requestId);
    } else if (!isLoading && !requestId) {
      // Clear all loading requests
      this.loadingSubject.next({
        isLoading: false,
        loadingCount: 0,
        loadingRequests: new Set()
      });
    }
  }

  /**
   * Track specific request types with different loading behaviors
   */
  private getRequestPriority(request: HttpRequest<any>): 'high' | 'normal' | 'low' {
    // High priority requests that should always show loading
    const highPriorityMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (highPriorityMethods.includes(request.method)) {
      return 'high';
    }

    // Low priority requests (background tasks)
    const lowPriorityEndpoints = ['/api/analytics', '/api/telemetry'];
    if (lowPriorityEndpoints.some(endpoint => request.url.includes(endpoint))) {
      return 'low';
    }

    return 'normal';
  }

  /**
   * Get loading message based on request
   */
  getLoadingMessage(request: HttpRequest<any>): string {
    const priority = this.getRequestPriority(request);
    
    switch (priority) {
      case 'high':
        if (request.method === 'POST') return 'Saving...';
        if (request.method === 'PUT') return 'Updating...';
        if (request.method === 'PATCH') return 'Updating...';
        if (request.method === 'DELETE') return 'Deleting...';
        return 'Processing...';
      
      case 'normal':
        return 'Loading...';
      
      case 'low':
        return 'Syncing...';
      
      default:
        return 'Loading...';
    }
  }

  /**
   * Check if request should show global loading (vs local loading)
   */
  shouldShowGlobalLoading(request: HttpRequest<any>): boolean {
    // Show global loading for important requests
    const globalLoadingMethods = ['POST', 'PUT', 'PATCH'];
    if (globalLoadingMethods.includes(request.method)) {
      return true;
    }

    // Show global loading for critical GET requests
    const criticalEndpoints = ['/api/cars', '/api/maintenance', '/api/dashboard'];
    if (criticalEndpoints.some(endpoint => request.url.includes(endpoint))) {
      return true;
    }

    return false;
  }

  /**
   * Create loading context for components
   */
  createLoadingContext(request: HttpRequest<any>): any {
    return {
      requestId: this.generateRequestId(request),
      priority: this.getRequestPriority(request),
      message: this.getLoadingMessage(request),
      showGlobal: this.shouldShowGlobalLoading(request),
      skipLoading: this.shouldSkipLoading(request)
    };
  }

  /**
   * Monitor loading states with timeouts
   */
  private setupLoadingTimeout(requestId: string, timeoutMs: number = 30000): void {
    setTimeout(() => {
      const currentState = this.loadingSubject.value;
      if (currentState.loadingRequests.has(requestId)) {
        console.warn(`Request ${requestId} has been loading for ${timeoutMs}ms`);
        // Could trigger timeout handling here
      }
    }, timeoutMs);
  }

  /**
   * Get loading statistics
   */
  getLoadingStatistics(): any {
    const state = this.loadingSubject.value;
    return {
      isLoading: state.isLoading,
      loadingCount: state.loadingCount,
      activeRequests: Array.from(state.loadingRequests),
      averageLoadingTime: this.calculateAverageLoadingTime(),
      totalRequestsHandled: this.getTotalRequestsHandled()
    };
  }

  /**
   * Calculate average loading time (would need to track timing data)
   */
  private calculateAverageLoadingTime(): number {
    // This would require tracking start/end times for requests
    return 0; // Placeholder
  }

  /**
   * Get total requests handled (would need to track this)
   */
  private getTotalRequestsHandled(): number {
    // This would require maintaining a counter
    return 0; // Placeholder
  }

  /**
   * Reset all loading state
   */
  resetLoadingState(): void {
    this.loadingSubject.next({
      isLoading: false,
      loadingCount: 0,
      loadingRequests: new Set()
    });
  }

  /**
   * Subscribe to loading changes with callback
   */
  onLoadingChange(callback: (state: LoadingState) => void): void {
    this.loading$.subscribe(callback);
  }

  /**
   * Get loading state as promise (useful for testing)
   */
  getLoadingStateAsync(): Promise<LoadingState> {
    return new Promise((resolve) => {
      this.loading$.subscribe(state => {
        resolve(state);
      });
    });
  }
}