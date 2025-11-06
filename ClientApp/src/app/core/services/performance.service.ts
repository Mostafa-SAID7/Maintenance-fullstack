import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { CacheService } from './cache.service';

export interface PerformanceMetrics {
  memoryUsage: MemoryInfo | null;
  connectionType: string;
  deviceInfo: DeviceInfo;
  cacheHitRate: number;
  averageResponseTime: number;
  errorRate: number;
  lastUpdated: Date;
}

export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  screenResolution: string;
  pixelRatio: number;
  isMobile: boolean;
  isLowEndDevice: boolean;
}

export interface PerformanceThresholds {
  memoryWarningMB: number;
  memoryCriticalMB: number;
  responseTimeWarningMs: number;
  responseTimeCriticalMs: number;
  errorRateWarningPercent: number;
  errorRateCriticalPercent: number;
  cacheHitRateMinimum: number;
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private metricsSubject = new BehaviorSubject<PerformanceMetrics>({
    memoryUsage: null,
    connectionType: 'unknown',
    deviceInfo: this.getDeviceInfo(),
    cacheHitRate: 0,
    averageResponseTime: 0,
    errorRate: 0,
    lastUpdated: new Date()
  });

  public metrics$ = this.metricsSubject.asObservable();

  private readonly thresholds: PerformanceThresholds = {
    memoryWarningMB: 100,
    memoryCriticalMB: 200,
    responseTimeWarningMs: 1000,
    responseTimeCriticalMs: 3000,
    errorRateWarningPercent: 5,
    errorRateCriticalPercent: 10,
    cacheHitRateMinimum: 80
  };

  private responseTimes: number[] = [];
  private errorCount = 0;
  private totalRequests = 0;
  private performanceHistory: PerformanceMetrics[] = [];

  constructor(private cacheService: CacheService) {
    this.initializePerformanceMonitoring();
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): PerformanceMetrics {
    return this.metricsSubject.value;
  }

  /**
   * Record response time for performance tracking
   */
  recordResponseTime(responseTime: number): void {
    this.responseTimes.push(responseTime);
    this.totalRequests++;

    // Keep only last 100 response times
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }

    this.updateMetrics();
  }

  /**
   * Record error for error rate calculation
   */
  recordError(): void {
    this.errorCount++;
    this.totalRequests++;
    this.updateMetrics();
  }

  /**
   * Record successful request
   */
  recordSuccess(): void {
    this.totalRequests++;
    this.updateMetrics();
  }

  /**
   * Get performance recommendations
   */
  getRecommendations(): string[] {
    const metrics = this.getCurrentMetrics();
    const recommendations: string[] = [];

    // Memory usage recommendations
    if (metrics.memoryUsage && metrics.memoryUsage.usedJSHeapSize > this.thresholds.memoryCriticalMB * 1024 * 1024) {
      recommendations.push('Critical memory usage detected. Consider clearing cache or refreshing the page.');
    } else if (metrics.memoryUsage && metrics.memoryUsage.usedJSHeapSize > this.thresholds.memoryWarningMB * 1024 * 1024) {
      recommendations.push('High memory usage detected. Monitor memory consumption.');
    }

    // Response time recommendations
    if (metrics.averageResponseTime > this.thresholds.responseTimeCriticalMs) {
      recommendations.push('Critical response times detected. Check network connection and API performance.');
    } else if (metrics.averageResponseTime > this.thresholds.responseTimeWarningMs) {
      recommendations.push('Slow response times detected. Consider implementing more aggressive caching.');
    }

    // Error rate recommendations
    if (metrics.errorRate > this.thresholds.errorRateCriticalPercent) {
      recommendations.push('High error rate detected. Review error handling and API stability.');
    } else if (metrics.errorRate > this.thresholds.errorRateWarningPercent) {
      recommendations.push('Elevated error rate detected. Monitor error patterns.');
    }

    // Cache performance recommendations
    if (metrics.cacheHitRate < this.thresholds.cacheHitRateMinimum) {
      recommendations.push('Low cache hit rate detected. Consider adjusting cache TTL or strategy.');
    }

    // Device-specific recommendations
    if (metrics.deviceInfo.isLowEndDevice) {
      recommendations.push('Low-end device detected. Consider reducing animations and optimising performance.');
    }

    if (metrics.deviceInfo.isMobile) {
      recommendations.push('Mobile device detected. Consider reducing data usage and optimising for touch.');
    }

    return recommendations;
  }

  /**
   * Get performance score (0-100)
   */
  getPerformanceScore(): number {
    const metrics = this.getCurrentMetrics();
    let score = 100;

    // Deduct points for poor memory usage
    if (metrics.memoryUsage) {
      const memoryMB = metrics.memoryUsage.usedJSHeapSize / (1024 * 1024);
      if (memoryMB > this.thresholds.memoryCriticalMB) {
        score -= 30;
      } else if (memoryMB > this.thresholds.memoryWarningMB) {
        score -= 15;
      }
    }

    // Deduct points for slow response times
    if (metrics.averageResponseTime > this.thresholds.responseTimeCriticalMs) {
      score -= 25;
    } else if (metrics.averageResponseTime > this.thresholds.responseTimeWarningMs) {
      score -= 10;
    }

    // Deduct points for high error rate
    if (metrics.errorRate > this.thresholds.errorRateCriticalPercent) {
      score -= 20;
    } else if (metrics.errorRate > this.thresholds.errorRateWarningPercent) {
      score -= 10;
    }

    // Deduct points for low cache hit rate
    if (metrics.cacheHitRate < 50) {
      score -= 15;
    } else if (metrics.cacheHitRate < this.thresholds.cacheHitRateMinimum) {
      score -= 8;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Clear performance history
   */
  clearHistory(): void {
    this.performanceHistory = [];
  }

  /**
   * Get performance history
   */
  getHistory(): PerformanceMetrics[] {
    return [...this.performanceHistory];
  }

  /**
   * Enable performance monitoring
   */
  enableMonitoring(): void {
    this.initializePerformanceMonitoring();
  }

  /**
   * Disable performance monitoring
   */
  disableMonitoring(): void {
    // Stop monitoring (implement cleanup if needed)
  }

  private initializePerformanceMonitoring(): void {
    // Update metrics every 30 seconds
    interval(30000).subscribe(() => {
      this.updateMetrics();
    });

    // Initial metrics update
    this.updateMetrics();
  }

  private updateMetrics(): void {
    const memoryInfo = this.getMemoryInfo();
    const connectionType = this.getConnectionType();
    const cacheStats = this.cacheService.getStats();
    
    // Calculate average response time
    const averageResponseTime = this.responseTimes.length > 0
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
      : 0;

    // Calculate error rate
    const errorRate = this.totalRequests > 0
      ? (this.errorCount / this.totalRequests) * 100
      : 0;

    // Calculate cache hit rate
    const cacheHitRate = this.calculateCacheHitRate(cacheStats);

    const metrics: PerformanceMetrics = {
      memoryUsage: memoryInfo,
      connectionType,
      deviceInfo: this.getDeviceInfo(),
      cacheHitRate,
      averageResponseTime,
      errorRate,
      lastUpdated: new Date()
    };

    this.metricsSubject.next(metrics);
    
    // Add to history
    this.performanceHistory.push(metrics);
    
    // Keep only last 100 history entries
    if (this.performanceHistory.length > 100) {
      this.performanceHistory.shift();
    }
  }

  private getMemoryInfo(): MemoryInfo | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  private getConnectionType(): string {
    if ('connection' in navigator) {
      return (navigator as any).connection?.effectiveType || 'unknown';
    }
    return 'unknown';
  }

  private getDeviceInfo(): DeviceInfo {
    const ua = navigator.userAgent;
    const platform = navigator.platform;
    const screenResolution = `${window.screen.width}x${window.screen.height}`;
    const pixelRatio = window.devicePixelRatio || 1;
    
    // Simple mobile detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    
    // Simple low-end device detection
    const isLowEndDevice = isMobile && (
      /Android.*[45]\.|iPhone OS [4-9]\.|BlackBerry.*[4-6]\./.test(ua) ||
      (navigator as any).deviceMemory < 2
    );

    return {
      userAgent: ua,
      platform,
      screenResolution,
      pixelRatio,
      isMobile,
      isLowEndDevice
    };
  }

  private calculateCacheHitRate(cacheStats: any): number {
    if (!cacheStats) return 0;
    
    // This is a simplified calculation
    // In a real implementation, you'd track actual hits vs misses
    const totalEntries = cacheStats.entryCount;
    if (totalEntries === 0) return 0;
    
    // Estimate based on cache size and activity
    const hitRate = Math.min(100, Math.max(0, 90 - (totalEntries * 2)));
    return Math.round(hitRate);
  }
}