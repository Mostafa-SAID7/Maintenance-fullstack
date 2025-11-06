import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';
import { StorageService } from '../services/storage.service';

export interface CacheEntry {
  url: string;
  response: HttpResponse<any>;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  headers: { [key: string]: string };
  requestMethod: string;
  size: number;
}

export interface CacheConfig {
  ttl: number; // Default TTL in milliseconds
  maxSize: number; // Maximum cache entries
  maxMemory: number; // Maximum memory usage in bytes
  includeHeaders: boolean;
  excludePatterns: string[];
  customKeys: { [pattern: string]: string };
}

@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  private readonly CACHE_PREFIX = 'http_cache_';
  private readonly CACHE_INDEX_KEY = 'cache_index';
  
  private config: CacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutes default
    maxSize: 100,
    maxMemory: 10 * 1024 * 1024, // 10MB
    includeHeaders: true,
    excludePatterns: [
      '/auth/login',
      '/auth/register',
      '/auth/refresh',
      '/api/analytics',
      '/api/telemetry',
      '/heartbeat'
    ],
    customKeys: {
      '/api/cars?page=1': 'cars_page_1',
      '/api/maintenance?status=pending': 'maintenance_pending'
    }
  };

  constructor(private storageService: StorageService) {
    this.initializeCache();
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip caching for non-GET requests
    if (request.method !== 'GET') {
      return next.handle(request);
    }

    // Skip caching for excluded patterns
    if (this.shouldSkipCache(request)) {
      return next.handle(request);
    }

    // Check if we have a valid cached response
    const cacheKey = this.getCacheKey(request);
    const cachedResponse = this.getCachedResponse(cacheKey);

    if (cachedResponse) {
      // Return cached response
      return of(cachedResponse.response.clone());
    }

    // Make the request and cache the response
    return next.handle(request).pipe(
      tap((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          this.cacheResponse(request, event, cacheKey);
        }
      }),
      shareReplay(1) // Share the response with multiple subscribers
    );
  }

  /**
   * Check if caching should be skipped for this request
   */
  private shouldSkipCache(request: HttpRequest<any>): boolean {
    // Check exclude patterns
    return this.config.excludePatterns.some(pattern => 
      request.url.includes(pattern)
    );
  }

  /**
   * Generate cache key for the request
   */
  private getCacheKey(request: HttpRequest<any>): string {
    // Check for custom keys
    for (const [pattern, customKey] of Object.entries(this.config.customKeys)) {
      if (request.url.includes(pattern)) {
        return `${this.CACHE_PREFIX}${customKey}`;
      }
    }

    // Generate standard key from URL and headers
    let key = `${request.method}_${request.url}`;
    
    // Include relevant headers in cache key
    const importantHeaders = ['Accept', 'Accept-Language', 'Authorization'];
    for (const header of importantHeaders) {
      const value = request.headers.get(header);
      if (value) {
        key += `_${header}:${value}`;
      }
    }

    return `${this.CACHE_PREFIX}${this.hashString(key)}`;
  }

  /**
   * Get cached response if valid
   */
  private getCachedResponse(cacheKey: string): CacheEntry | null {
    try {
      const cached = this.storageService.get<CacheEntry>(cacheKey);
      if (!cached) return null;

      // Check if cache entry is still valid
      const now = Date.now();
      if (now - cached.timestamp > cached.ttl) {
        this.removeCacheEntry(cacheKey);
        return null;
      }

      return cached;
    } catch (error) {
      console.error('Error retrieving cached response:', error);
      return null;
    }
  }

  /**
   * Cache the response
   */
  private cacheResponse(request: HttpRequest<any>, response: HttpResponse<any>, cacheKey: string): void {
    try {
      // Check cache size limits
      this.enforceCacheLimits();

      const cacheEntry: CacheEntry = {
        url: request.url,
        response: response.clone(),
        timestamp: Date.now(),
        ttl: this.getTTL(request),
        headers: this.config.includeHeaders ? this.extractHeaders(response) : {},
        requestMethod: request.method,
        size: this.calculateResponseSize(response)
      };

      // Store the cache entry
      this.storageService.set(cacheKey, cacheEntry);
      
      // Update cache index
      this.updateCacheIndex(cacheKey);

      console.log(`[Cache] Cached response for: ${request.url}`);
    } catch (error) {
      console.error('Error caching response:', error);
    }
  }

  /**
   * Get TTL for specific request
   */
  private getTTL(request: HttpRequest<any>): number {
    // Check for custom TTL in headers
    const cacheControl = request.headers.get('Cache-Control');
    if (cacheControl) {
      const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
      if (maxAgeMatch) {
        return parseInt(maxAgeMatch[1]) * 1000;
      }
    }

    // Determine TTL based on endpoint
    if (request.url.includes('/api/cars')) {
      return 2 * 60 * 1000; // 2 minutes for cars
    }
    if (request.url.includes('/api/maintenance')) {
      return 3 * 60 * 1000; // 3 minutes for maintenance
    }
    if (request.url.includes('/api/dashboard')) {
      return 1 * 60 * 1000; // 1 minute for dashboard
    }

    return this.config.ttl;
  }

  /**
   * Extract relevant headers from response
   */
  private extractHeaders(response: HttpResponse<any>): { [key: string]: string } {
    const headers: { [key: string]: string } = {};
    const relevantHeaders = ['Cache-Control', 'ETag', 'Last-Modified', 'Vary'];

    for (const header of relevantHeaders) {
      const value = response.headers.get(header);
      if (value) {
        headers[header] = value;
      }
    }

    return headers;
  }

  /**
   * Calculate response size in bytes
   */
  private calculateResponseSize(response: HttpResponse<any>): number {
    try {
      if (response.body) {
        return JSON.stringify(response.body).length;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Enforce cache size and memory limits
   */
  private enforceCacheLimits(): void {
    const index = this.getCacheIndex();
    
    // Remove expired entries
    this.removeExpiredEntries(index);
    
    // Enforce max size
    if (index.length > this.config.maxSize) {
      this.removeOldestEntries(index, this.config.maxSize);
    }
    
    // Enforce memory limit
    this.enforceMemoryLimit(index);
  }

  /**
   * Get cache index
   */
  private getCacheIndex(): string[] {
    return this.storageService.get<string[]>(this.CACHE_INDEX_KEY) || [];
  }

  /**
   * Update cache index
   */
  private updateCacheIndex(cacheKey: string): void {
    const index = this.getCacheIndex();
    if (!index.includes(cacheKey)) {
      index.push(cacheKey);
      this.storageService.set(this.CACHE_INDEX_KEY, index);
    }
  }

  /**
   * Remove expired cache entries
   */
  private removeExpiredEntries(index: string[]): void {
    const now = Date.now();
    const validEntries: string[] = [];

    for (const cacheKey of index) {
      const cached = this.storageService.get<CacheEntry>(cacheKey);
      if (cached && now - cached.timestamp <= cached.ttl) {
        validEntries.push(cacheKey);
      } else {
        this.removeCacheEntry(cacheKey);
      }
    }

    this.storageService.set(this.CACHE_INDEX_KEY, validEntries);
  }

  /**
   * Remove oldest cache entries to maintain size limit
   */
  private removeOldestEntries(index: string[], maxSize: number): void {
    const sortedIndex = index
      .map(key => {
        const cached = this.storageService.get<CacheEntry>(key);
        return { key, timestamp: cached?.timestamp || 0 };
      })
      .sort((a, b) => a.timestamp - b.timestamp);

    const entriesToRemove = sortedIndex.slice(0, index.length - maxSize);
    
    for (const entry of entriesToRemove) {
      this.removeCacheEntry(entry.key);
    }

    // Update index with remaining entries
    const remainingKeys = sortedIndex.slice(index.length - maxSize).map(e => e.key);
    this.storageService.set(this.CACHE_INDEX_KEY, remainingKeys);
  }

  /**
   * Enforce memory usage limit
   */
  private enforceMemoryLimit(index: string[]): void {
    let totalMemory = 0;
    const memoryEntries: { key: string; size: number }[] = [];

    // Calculate total memory usage
    for (const cacheKey of index) {
      const cached = this.storageService.get<CacheEntry>(cacheKey);
      if (cached) {
        const size = cached.size || JSON.stringify(cached).length;
        totalMemory += size;
        memoryEntries.push({ key: cacheKey, size });
      }
    }

    // If over memory limit, remove oldest entries
    if (totalMemory > this.config.maxMemory) {
      memoryEntries.sort((a, b) => a.size - b.size);
      
      for (const entry of memoryEntries) {
        if (totalMemory <= this.config.maxMemory) break;
        
        this.removeCacheEntry(entry.key);
        totalMemory -= entry.size;
        
        // Update index
        const updatedIndex = index.filter(key => key !== entry.key);
        this.storageService.set(this.CACHE_INDEX_KEY, updatedIndex);
      }
    }
  }

  /**
   * Remove single cache entry
   */
  private removeCacheEntry(cacheKey: string): void {
    this.storageService.remove(cacheKey);
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    const index = this.getCacheIndex();
    for (const cacheKey of index) {
      this.storageService.remove(cacheKey);
    }
    this.storageService.remove(this.CACHE_INDEX_KEY);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): any {
    const index = this.getCacheIndex();
    let totalSize = 0;
    let expiredCount = 0;
    const now = Date.now();

    for (const cacheKey of index) {
      const cached = this.storageService.get<CacheEntry>(cacheKey);
      if (cached) {
        const size = cached.size || JSON.stringify(cached).length;
        totalSize += size;
        
        if (now - cached.timestamp > cached.ttl) {
          expiredCount++;
        }
      }
    }

    return {
      totalEntries: index.length,
      expiredEntries: expiredCount,
      validEntries: index.length - expiredCount,
      totalMemory: totalSize,
      maxMemory: this.config.maxMemory,
      memoryUsagePercent: (totalSize / this.config.maxMemory) * 100,
      maxSize: this.config.maxSize,
      sizeUsagePercent: (index.length / this.config.maxSize) * 100
    };
  }

  /**
   * Invalidate cache for specific patterns
   */
  invalidateCache(pattern: string): void {
    const index = this.getCacheIndex();
    const keysToRemove = index.filter(key => key.includes(pattern));
    
    for (const key of keysToRemove) {
      this.removeCacheEntry(key);
    }

    // Update index
    const remainingKeys = index.filter(key => !keysToRemove.includes(key));
    this.storageService.set(this.CACHE_INDEX_KEY, remainingKeys);
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): CacheConfig {
    return { ...this.config };
  }

  /**
   * Initialize cache system
   */
  private initializeCache(): void {
    // Clean up expired entries on startup
    setTimeout(() => {
      this.enforceCacheLimits();
    }, 1000);

    // Periodic cache cleanup
    setInterval(() => {
      this.enforceCacheLimits();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Simple hash function for cache keys
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Check if response is cacheable
   */
  private isCacheableResponse(response: HttpResponse<any>): boolean {
    // Don't cache error responses
    if (response.status >= 400) {
      return false;
    }

    // Check cache control headers
    const cacheControl = response.headers.get('Cache-Control');
    if (cacheControl) {
      if (cacheControl.includes('no-cache') || cacheControl.includes('no-store')) {
        return false;
      }
    }

    return true;
  }

  /**
   * Prefetch data for better performance
   */
  prefetch(url: string, headers?: { [key: string]: string }): void {
    // This would typically make a request to prefetch data
    // Implementation depends on specific use case
    console.log(`[Cache] Prefetching: ${url}`);
  }
}