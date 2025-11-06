import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';
import { AnalyticsService } from '../services/analytics.service';
import { environment } from '../../../environments/environment';

export interface RequestLog {
  id: string;
  timestamp: Date;
  method: string;
  url: string;
  headers: { [key: string]: string };
  body?: any;
  responseStatus?: number;
  responseTime: number;
  responseSize?: number;
  error?: string;
  userId?: string;
  sessionId: string;
  userAgent: string;
  isCached: boolean;
  requestSize: number;
}

export interface LogStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  totalDataTransferred: number;
  cacheHitRate: number;
  errorRate: number;
  topEndpoints: { url: string; count: number }[];
}

@Injectable()
export class LoggingInterceptor implements HttpInterceptor {
  private requestCounter = 0;
  private logs: RequestLog[] = [];
  private readonly maxLogs = 1000; // Keep last 1000 logs in memory

  constructor(private analyticsService: AnalyticsService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    const isDevelopment = !environment.production;

    // Create initial log entry
    const logEntry: RequestLog = {
      id: requestId,
      timestamp: new Date(),
      method: request.method,
      url: request.url,
      headers: this.sanitizeHeaders(request.headers),
      body: this.sanitizeRequestBody(request.body),
      responseTime: 0,
      userId: this.getCurrentUserId(),
      sessionId: this.getCurrentSessionId(),
      userAgent: navigator.userAgent,
      isCached: false,
      requestSize: this.calculateRequestSize(request)
    };

    // Log request in development
    if (isDevelopment) {
      this.logRequest(request, logEntry);
    }

    return next.handle(request).pipe(
      tap({
        next: (event: HttpEvent<any>) => {
          if (event instanceof HttpResponse) {
            this.logResponse(event, logEntry, startTime);
          }
        },
        error: (error: HttpErrorResponse) => {
          this.logError(error, logEntry, startTime);
        }
      }),
      finalize(() => {
        this.addToLogs(logEntry);
        
        // Log performance analytics
        this.trackPerformance(logEntry);
      })
    );
  }

  /**
   * Log HTTP request
   */
  private logRequest(request: HttpRequest<any>, logEntry: RequestLog): void {
    const isRedacted = this.shouldRedactRequest(request);
    
    console.group(`🌐 HTTP Request #${logEntry.id}`);
    console.log('Method:', request.method);
    console.log('URL:', request.url);
    console.log('Headers:', this.formatHeaders(request.headers));
    
    if (!isRedacted && request.body) {
      console.log('Body:', request.body);
    } else if (isRedacted) {
      console.log('Body: [REDACTED - Sensitive Data]');
    } else {
      console.log('Body: [Empty]');
    }
    
    console.log('Timestamp:', logEntry.timestamp.toISOString());
    console.log('Request ID:', logEntry.id);
    console.groupEnd();
  }

  /**
   * Log HTTP response
   */
  private logResponse(response: HttpResponse<any>, logEntry: RequestLog, startTime: number): void {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    logEntry.responseStatus = response.status;
    logEntry.responseTime = responseTime;
    logEntry.responseSize = this.calculateResponseSize(response);
    
    const isDevelopment = !environment.production;
    
    if (isDevelopment) {
      console.group(`✅ HTTP Response #${logEntry.id} (${responseTime}ms)`);
      console.log('Status:', response.status, response.statusText);
      console.log('Headers:', this.formatHeaders(response.headers));
      console.log('Response Time:', `${responseTime}ms`);
      console.log('Response Size:', this.formatBytes(logEntry.responseSize));
      
      if (response.body && this.shouldLogResponseBody(response)) {
        console.log('Body:', response.body);
      }
      
      console.groupEnd();
    }
  }

  /**
   * Log HTTP error
   */
  private logError(error: HttpErrorResponse, logEntry: RequestLog, startTime: number): void {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    logEntry.responseStatus = error.status;
    logEntry.responseTime = responseTime;
    logEntry.error = this.formatError(error);
    
    const isDevelopment = !environment.production;
    
    if (isDevelopment) {
      console.group(`❌ HTTP Error #${logEntry.id} (${responseTime}ms)`);
      console.log('Status:', error.status, error.statusText);
      console.log('Error:', error.message);
      
      if (error.error) {
        console.log('Error Details:', error.error);
      }
      
      console.log('URL:', logEntry.url);
      console.log('Response Time:', `${responseTime}ms`);
      console.groupEnd();
    }

    // Track error for analytics
    this.analyticsService.trackError(
      `HTTP ${error.status}: ${error.message}`,
      'http_error'
    );
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    this.requestCounter++;
    return `req_${Date.now()}_${this.requestCounter}`;
  }

  /**
   * Sanitize headers for logging
   */
  private sanitizeHeaders(headers: any): { [key: string]: string } {
    const sanitized: { [key: string]: string } = {};
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    
    headers.keys().forEach((key: string) => {
      const value = headers.get(key);
      if (sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    });
    
    return sanitized;
  }

  /**
   * Sanitize request body for logging
   */
  private sanitizeRequestBody(body: any): any {
    if (!body) return null;
    
    // Deep clone to avoid modifying original
    const sanitized = JSON.parse(JSON.stringify(body));
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    this.removeSensitiveData(sanitized, sensitiveFields);
    
    return sanitized;
  }

  /**
   * Remove sensitive data recursively
   */
  private removeSensitiveData(obj: any, sensitiveFields: string[]): void {
    if (typeof obj !== 'object' || obj === null) return;
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const lowerKey = key.toLowerCase();
        
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          this.removeSensitiveData(obj[key], sensitiveFields);
        }
      }
    }
  }

  /**
   * Check if request should be redacted
   */
  private shouldRedactRequest(request: HttpRequest<any>): boolean {
    const sensitiveEndpoints = ['/auth/login', '/auth/register', '/auth/refresh'];
    return sensitiveEndpoints.some(endpoint => request.url.includes(endpoint));
  }

  /**
   * Format headers for console output
   */
  private formatHeaders(headers: any): { [key: string]: string } {
    const formatted: { [key: string]: string } = {};
    headers.keys().forEach((key: string) => {
      formatted[key] = headers.get(key);
    });
    return formatted;
  }

  /**
   * Check if response body should be logged
   */
  private shouldLogResponseBody(response: HttpResponse<any>): boolean {
    // Don't log large responses
    if (response.body && JSON.stringify(response.body).length > 10000) {
      return false;
    }
    
    // Don't log binary responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/octet-stream')) {
      return false;
    }
    
    return true;
  }

  /**
   * Calculate request size
   */
  private calculateRequestSize(request: HttpRequest<any>): number {
    if (!request.body) return 0;
    return JSON.stringify(request.body).length;
  }

  /**
   * Calculate response size
   */
  private calculateResponseSize(response: HttpResponse<any>): number {
    if (!response.body) return 0;
    return JSON.stringify(response.body).length;
  }

  /**
   * Format bytes for display
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format error for logging
   */
  private formatError(error: HttpErrorResponse): string {
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      return `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      return `Server Error ${error.status}: ${error.message}`;
    }
  }

  /**
   * Get current user ID
   */
  private getCurrentUserId(): string | undefined {
    // This would typically get from auth service
    return undefined;
  }

  /**
   * Get current session ID
   */
  private getCurrentSessionId(): string {
    // Get from analytics service or generate
    return `session_${Date.now()}`;
  }

  /**
   * Add log entry to memory
   */
  private addToLogs(logEntry: RequestLog): void {
    this.logs.push(logEntry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * Track performance metrics
   */
  private trackPerformance(logEntry: RequestLog): void {
    const metrics = {
      request_id: logEntry.id,
      response_time: logEntry.responseTime,
      request_size: logEntry.requestSize,
      response_size: logEntry.responseSize,
      status_code: logEntry.responseStatus,
      endpoint: this.getEndpointPattern(logEntry.url),
      method: logEntry.method
    };

    this.analyticsService.trackEvent('http_performance', 'system', 'request_completed', undefined, undefined, metrics);
  }

  /**
   * Get endpoint pattern for grouping
   */
  private getEndpointPattern(url: string): string {
    // Extract endpoint pattern for analytics grouping
    const urlObj = new URL(url, window.location.origin);
    const pathname = urlObj.pathname;
    
    // Remove query parameters and IDs
    return pathname.replace(/\/\d+/g, '/:id').replace(/\?.*$/, '');
  }

  /**
   * Get all logs
   */
  getLogs(): RequestLog[] {
    return [...this.logs];
  }

  /**
   * Get logs filtered by criteria
   */
  getFilteredLogs(filter: {
    method?: string;
    statusCode?: number;
    startDate?: Date;
    endDate?: Date;
    urlPattern?: string;
  }): RequestLog[] {
    return this.logs.filter(log => {
      if (filter.method && log.method !== filter.method) return false;
      if (filter.statusCode && log.responseStatus !== filter.statusCode) return false;
      if (filter.startDate && log.timestamp < filter.startDate) return false;
      if (filter.endDate && log.timestamp > filter.endDate) return false;
      if (filter.urlPattern && !log.url.includes(filter.urlPattern)) return false;
      return true;
    });
  }

  /**
   * Get logging statistics
   */
  getLogStats(): LogStats {
    const now = Date.now();
    const last24Hours = new Date(now - 24 * 60 * 60 * 1000);
    
    const recentLogs = this.logs.filter(log => log.timestamp >= last24Hours);
    
    const successfulRequests = recentLogs.filter(log => 
      log.responseStatus && log.responseStatus >= 200 && log.responseStatus < 300
    ).length;
    
    const failedRequests = recentLogs.filter(log => 
      log.responseStatus && log.responseStatus >= 400
    ).length;
    
    const averageResponseTime = recentLogs.length > 0 
      ? recentLogs.reduce((sum, log) => sum + log.responseTime, 0) / recentLogs.length 
      : 0;
    
    const totalDataTransferred = recentLogs.reduce((sum, log) => 
      sum + (log.requestSize || 0) + (log.responseSize || 0), 0
    );
    
    // Group by endpoint pattern
    const endpointCounts: { [key: string]: number } = {};
    recentLogs.forEach(log => {
      const pattern = this.getEndpointPattern(log.url);
      endpointCounts[pattern] = (endpointCounts[pattern] || 0) + 1;
    });
    
    const topEndpoints = Object.entries(endpointCounts)
      .map(([url, count]) => ({ url, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      totalRequests: recentLogs.length,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      totalDataTransferred,
      cacheHitRate: 0, // Would need to track cache hits
      errorRate: recentLogs.length > 0 ? (failedRequests / recentLogs.length) * 100 : 0,
      topEndpoints
    };
  }

  /**
   * Export logs to file
   */
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    } else {
      // Convert to CSV
      const headers = ['ID', 'Timestamp', 'Method', 'URL', 'Status', 'Response Time (ms)', 'Request Size', 'Response Size'];
      const rows = this.logs.map(log => [
        log.id,
        log.timestamp.toISOString(),
        log.method,
        log.url,
        log.responseStatus || '',
        log.responseTime,
        log.requestSize,
        log.responseSize || ''
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    this.requestCounter = 0;
  }

  /**
   * Enable/disable logging based on environment
   */
  shouldLog(): boolean {
    return !environment.production || localStorage.getItem('enable_http_logging') === 'true';
  }

  /**
   * Log memory usage
   */
  private logMemoryUsage(): void {
    if ((performance as any).memory) {
      const memory = (performance as any).memory;
      console.log('Memory Usage:', {
        used: this.formatBytes(memory.usedJSHeapSize),
        total: this.formatBytes(memory.totalJSHeapSize),
        limit: this.formatBytes(memory.jsHeapSizeLimit)
      });
    }
  }
}