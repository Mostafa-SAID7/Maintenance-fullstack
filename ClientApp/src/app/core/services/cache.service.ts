import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
  key: string;
}

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum cache size
  enableAutoCleanup: boolean; // Enable automatic cleanup
  cleanupInterval: number; // Cleanup interval in milliseconds
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private cacheSubject = new BehaviorSubject<Map<string, CacheEntry<any>>>(this.cache);
  
  public cache$ = this.cacheSubject.asObservable();
  
  private readonly defaultConfig: CacheConfig = {
    ttl: environment.cacheExpiryMinutes * 60 * 1000, // Convert to milliseconds
    maxSize: 100,
    enableAutoCleanup: true,
    cleanupInterval: 5 * 60 * 1000 // 5 minutes
  };

  constructor() {
    if (this.defaultConfig.enableAutoCleanup) {
      this.startAutoCleanup();
    }
  }

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (this.isExpired(entry)) {
      this.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, config?: Partial<CacheConfig>): void {
    const cacheConfig = { ...this.defaultConfig, ...config };
    
    // Check if cache is at max size
    if (this.cache.size >= cacheConfig.maxSize && !this.cache.has(key)) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + cacheConfig.ttl,
      key
    };

    this.cache.set(key, entry);
    this.notifyCacheChange();
  }

  /**
   * Set data in cache with conditional update
   */
  setIfAbsent<T>(key: string, dataFactory: () => T, config?: Partial<CacheConfig>): T {
    const existing = this.get<T>(key);
    if (existing !== null) {
      return existing;
    }

    const data = dataFactory();
    this.set(key, data, config);
    return data;
  }

  /**
   * Remove data from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.notifyCacheChange();
    }
    return deleted;
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.notifyCacheChange();
  }

  /**
   * Get cache size
   */
  size(): number {
    this.cleanupExpired();
    return this.cache.size;
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    this.cleanupExpired();
    return Array.from(this.cache.keys());
  }

  /**
   * Invalidate cache entries matching pattern
   */
  invalidatePattern(pattern: string): number {
    const regex = new RegExp(pattern);
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    this.cleanupExpired();
    const now = Date.now();
    let totalSize = 0;

    for (const entry of this.cache.values()) {
      totalSize += JSON.stringify(entry.data).length;
    }

    return {
      entryCount: this.cache.size,
      totalSizeBytes: totalSize,
      oldestEntry: this.getOldestEntryTimestamp(),
      newestEntry: this.getNewestEntryTimestamp(),
      expiredEntries: this.getExpiredEntryCount()
    };
  }

  /**
   * Preload data into cache
   */
  preload<T>(key: string, dataFactory: () => Promise<T>, config?: Partial<CacheConfig>): Promise<T> {
    return dataFactory().then(data => {
      this.set(key, data, config);
      return data;
    });
  }

  /**
   * Get or load data (with optional preload)
   */
  getOrLoad<T>(
    key: string, 
    loader: () => Promise<T>, 
    config?: Partial<CacheConfig>
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return Promise.resolve(cached);
    }

    return this.preload(key, loader, config);
  }

  /**
   * Start automatic cache cleanup
   */
  private startAutoCleanup(): void {
    timer(0, this.defaultConfig.cleanupInterval).subscribe(() => {
      this.cleanupExpired();
    });
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.cache.delete(key);
    }

    if (expiredKeys.length > 0) {
      this.notifyCacheChange();
    }
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.expiry;
  }

  /**
   * Evict oldest entry
   */
  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Get oldest entry timestamp
   */
  private getOldestEntryTimestamp(): number | null {
    if (this.cache.size === 0) {
      return null;
    }

    let oldestTime = Date.now();

    for (const entry of this.cache.values()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
      }
    }

    return oldestTime;
  }

  /**
   * Get newest entry timestamp
   */
  private getNewestEntryTimestamp(): number | null {
    if (this.cache.size === 0) {
      return null;
    }

    let newestTime = 0;

    for (const entry of this.cache.values()) {
      if (entry.timestamp > newestTime) {
        newestTime = entry.timestamp;
      }
    }

    return newestTime;
  }

  /**
   * Get expired entry count
   */
  private getExpiredEntryCount(): number {
    const now = Date.now();
    let count = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiry) {
        count++;
      }
    }

    return count;
  }

  /**
   * Notify cache change to subscribers
   */
  private notifyCacheChange(): void {
    this.cacheSubject.next(new Map(this.cache));
  }
}