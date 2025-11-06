import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, merge, of } from 'rxjs';
import { map, distinctUntilChanged, startWith, catchError, tap } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { StorageService } from './storage.service';
import { ApiService } from './api.service';

export interface OfflineQueueItem {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers: { [key: string]: string };
  body?: any;
  timestamp: number;
  retryCount: number;
  priority: 'high' | 'normal' | 'low';
}

export interface CacheInfo {
  key: string;
  url: string;
  timestamp: number;
  size: number;
  headers: { [key: string]: string };
  type: 'api' | 'asset' | 'page' | 'data';
}

export interface NetworkStatus {
  isOnline: boolean;
  connectionType: 'wifi' | '4g' | '3g' | '2g' | 'unknown';
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class OfflineService {
  private readonly storageKey = 'offline-queue';
  private readonly cacheKey = 'offline-cache';
  private readonly maxCacheSize = 50 * 1024 * 1024; // 50MB
  private readonly maxQueueSize = 100;
  
  private networkStatusSubject = new BehaviorSubject<NetworkStatus>({
    isOnline: navigator.onLine,
    connectionType: 'unknown'
  });
  
  private queueSubject = new BehaviorSubject<OfflineQueueItem[]>([]);
  private syncInProgressSubject = new BehaviorSubject<boolean>(false);
  
  public networkStatus$ = this.networkStatusSubject.asObservable();
  public queue$ = this.queueSubject.asObservable();
  public syncInProgress$ = this.syncInProgressSubject.asObservable();

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private apiService: ApiService
  ) {
    this.initializeNetworkMonitoring();
    this.loadQueueFromStorage();
    this.setupServiceWorker();
  }

  /**
   * Initialize network monitoring
   */
  private initializeNetworkMonitoring(): void {
    // Monitor online/offline status
    merge(
      fromEvent(window, 'online'),
      fromEvent(window, 'offline')
    ).pipe(
      map(() => navigator.onLine),
      distinctUntilChanged(),
      startWith(navigator.onLine)
    ).subscribe(isOnline => {
      this.updateNetworkStatus(isOnline);
      if (isOnline) {
        this.processQueue();
      }
    });

    // Monitor connection quality (if supported)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.updateConnectionInfo(connection);
      
      connection.addEventListener('change', () => {
        this.updateConnectionInfo(connection);
      });
    }
  }

  /**
   * Update network status
   */
  private updateNetworkStatus(isOnline: boolean): void {
    const currentStatus = this.networkStatusSubject.value;
    this.networkStatusSubject.next({
      ...currentStatus,
      isOnline
    });
  }

  /**
   * Update connection information
   */
  private updateConnectionInfo(connection: any): void {
    const status: NetworkStatus = {
      isOnline: navigator.onLine,
      connectionType: this.getConnectionType(connection),
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
      saveData: connection?.saveData
    };
    
    this.networkStatusSubject.next(status);
  }

  /**
   * Get connection type from connection API
   */
  private getConnectionType(connection: any): 'wifi' | '4g' | '3g' | '2g' | 'unknown' {
    if (!connection) return 'unknown';
    
    const effectiveType = connection.effectiveType;
    switch (effectiveType) {
      case '4g': return '4g';
      case '3g': return '3g';
      case '2g': return '2g';
      default: return 'unknown';
    }
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return this.networkStatusSubject.value.isOnline;
  }

  /**
   * Get current network status
   */
  getNetworkStatus(): NetworkStatus {
    return this.networkStatusSubject.value;
  }

  /**
   * Add request to offline queue
   */
  addToQueue(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    body?: any,
    headers?: { [key: string]: string },
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): string {
    const queueItem: OfflineQueueItem = {
      id: this.generateId(),
      url,
      method,
      headers: headers || {},
      body,
      timestamp: Date.now(),
      retryCount: 0,
      priority
    };

    const currentQueue = this.queueSubject.value;
    
    // Add to queue (respecting priority and max size)
    let updatedQueue = [...currentQueue, queueItem];
    
    if (updatedQueue.length > this.maxQueueSize) {
      // Remove lowest priority items if queue is full
      updatedQueue = updatedQueue
        .sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority))
        .slice(0, this.maxQueueSize);
    }
    
    this.queueSubject.next(updatedQueue);
    this.saveQueueToStorage();
    
    return queueItem.id;
  }

  /**
   * Get priority weight for sorting
   */
  private getPriorityWeight(priority: 'high' | 'normal' | 'low'): number {
    switch (priority) {
      case 'high': return 3;
      case 'normal': return 2;
      case 'low': return 1;
      default: return 1;
    }
  }

  /**
   * Process offline queue
   */
  async processQueue(): Promise<void> {
    if (this.syncInProgressSubject.value || !this.isOnline()) {
      return;
    }

    this.syncInProgressSubject.next(true);
    
    try {
      const queue = this.queueSubject.value;
      const sortedQueue = [...queue].sort((a, b) => {
        // Sort by priority first, then by timestamp
        const priorityDiff = this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority);
        if (priorityDiff !== 0) return priorityDiff;
        return a.timestamp - b.timestamp;
      });

      const processedIds: string[] = [];
      
      for (const item of sortedQueue) {
        try {
          await this.processQueueItem(item);
          processedIds.push(item.id);
        } catch (error) {
          console.error('Failed to process queue item:', error);
          // Increment retry count
          item.retryCount++;
          
          // Remove if max retries exceeded
          if (item.retryCount >= 3) {
            processedIds.push(item.id);
          }
        }
      }

      // Remove processed items from queue
      if (processedIds.length > 0) {
        const remainingQueue = queue.filter(item => !processedIds.includes(item.id));
        this.queueSubject.next(remainingQueue);
        this.saveQueueToStorage();
      }
    } catch (error) {
      console.error('Failed to process queue:', error);
    } finally {
      this.syncInProgressSubject.next(false);
    }
  }

  /**
   * Process individual queue item
   */
  private async processQueueItem(item: OfflineQueueItem): Promise<void> {
    const headers = new HttpHeaders(item.headers);
    
    let response;
    switch (item.method) {
      case 'GET':
        response = await this.http.get(item.url, { headers }).toPromise();
        break;
      case 'POST':
        response = await this.http.post(item.url, item.body, { headers }).toPromise();
        break;
      case 'PUT':
        response = await this.http.put(item.url, item.body, { headers }).toPromise();
        break;
      case 'PATCH':
        response = await this.http.patch(item.url, item.body, { headers }).toPromise();
        break;
      case 'DELETE':
        response = await this.http.delete(item.url, { headers }).toPromise();
        break;
      default:
        throw new Error(`Unsupported method: ${item.method}`);
    }
    
    return void response;
  }

  /**
   * Clear offline queue
   */
  clearQueue(): void {
    this.queueSubject.next([]);
    this.storageService.remove(this.storageKey);
  }

  /**
   * Get queue items
   */
  getQueueItems(): OfflineQueueItem[] {
    return this.queueSubject.value;
  }

  /**
   * Remove item from queue
   */
  removeFromQueue(itemId: string): void {
    const currentQueue = this.queueSubject.value;
    const updatedQueue = currentQueue.filter(item => item.id !== itemId);
    this.queueSubject.next(updatedQueue);
    this.saveQueueToStorage();
  }

  /**
   * Cache API response
   */
  async cacheApiResponse(url: string, response: any, headers?: { [key: string]: string }): Promise<void> {
    const cacheInfo: CacheInfo = {
      key: this.getCacheKey(url),
      url,
      timestamp: Date.now(),
      size: JSON.stringify(response).length,
      headers: headers || {},
      type: 'api'
    };

    const cache = this.getCache();
    cache.set(url, { data: response, info: cacheInfo });
    this.saveCacheToStorage();
    
    // Manage cache size
    this.manageCacheSize();
  }

  /**
   * Get cached API response
   */
  getCachedResponse(url: string): any | null {
    const cache = this.getCache();
    const cached = cache.get(url);
    
    if (cached && this.isCacheValid(cached.info)) {
      return cached.data;
    }
    
    return null;
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(cacheInfo: CacheInfo): boolean {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    return Date.now() - cacheInfo.timestamp < maxAge;
  }

  /**
   * Get API request with offline support
   */
  getWithOfflineSupport<T>(url: string, forceRefresh = false): Observable<T> {
    if (!this.isOnline() || forceRefresh) {
      // Return cached response if available
      const cached = this.getCachedResponse(url);
      if (cached) {
        return of(cached);
      }
    }

    return this.http.get<T>(url).pipe(
      tap(response => {
        if (this.isOnline()) {
          this.cacheApiResponse(url, response);
        }
      }),
      catchError(error => {
        // Fallback to cache on error
        const cached = this.getCachedResponse(url);
        if (cached) {
          return of(cached);
        }
        throw error;
      })
    );
  }

  /**
   * Setup service worker for offline support
   */
  private setupServiceWorker(): void {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then(registration => {
        // Register background sync
        return (registration as any).sync.register('background-sync');
      }).catch(error => {
        console.warn('Background sync not supported:', error);
      });
    }
  }

  /**
   * Request persistent storage
   */
  async requestPersistentStorage(): Promise<boolean> {
    if ('storage' in navigator && 'persist' in (navigator.storage as any)) {
      try {
        const isPersistent = await (navigator.storage as any).persist();
        return isPersistent;
      } catch (error) {
        console.error('Failed to request persistent storage:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Get storage usage estimate
   */
  async getStorageEstimate(): Promise<StorageEstimate | null> {
    if ('storage' in navigator && 'estimate' in (navigator.storage as any)) {
      try {
        return await (navigator.storage as any).estimate();
      } catch (error) {
        console.error('Failed to get storage estimate:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Cache management
   */
  private getCache(): Map<string, { data: any; info: CacheInfo }> {
    return new Map(Object.entries(this.storageService.get(this.cacheKey) || {}));
  }

  private saveCacheToStorage(): void {
    const cache = this.getCache();
    const cacheObject = Object.fromEntries(cache.entries());
    this.storageService.set(this.cacheKey, cacheObject);
  }

  private manageCacheSize(): void {
    const cache = this.getCache();
    const entries = Array.from(cache.entries());
    
    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a[1].info.timestamp - b[1].info.timestamp);
    
    let totalSize = entries.reduce((sum, entry) => sum + entry[1].info.size, 0);
    
    // Remove oldest entries if cache is too large
    while (totalSize > this.maxCacheSize && entries.length > 0) {
      const [url, entry] = entries.shift()!;
      cache.delete(url);
      totalSize -= entry.info.size;
    }
    
    this.saveCacheToStorage();
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.storageService.remove(this.cacheKey);
  }

  /**
   * Generate cache key from URL
   */
  private getCacheKey(url: string): string {
    return btoa(url).replace(/[+/=]/g, '').substring(0, 16);
  }

  /**
   * Save queue to storage
   */
  private saveQueueToStorage(): void {
    this.storageService.set(this.storageKey, this.queueSubject.value);
  }

  /**
   * Load queue from storage
   */
  private loadQueueFromStorage(): void {
    const savedQueue = this.storageService.get<OfflineQueueItem[]>(this.storageKey);
    if (savedQueue) {
      this.queueSubject.next(savedQueue);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Preload critical resources
   */
  preloadResources(resources: string[]): void {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = resource;
      document.head.appendChild(link);
    });
  }

  /**
   * Download and cache resource for offline use
   */
  async cacheResource(url: string): Promise<void> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Store in IndexedDB or cache API
      if ('caches' in window) {
        const cache = await caches.open('offline-resources');
        await cache.put(url, new Response(blob));
      }
    } catch (error) {
      console.error('Failed to cache resource:', error);
      throw error;
    }
  }

  /**
   * Check if resource is cached
   */
  async isResourceCached(url: string): Promise<boolean> {
    if ('caches' in window) {
      const cache = await caches.open('offline-resources');
      const response = await cache.match(url);
      return !!response;
    }
    return false;
  }

  /**
   * Get offline statistics
   */
  getOfflineStats(): {
    queueSize: number;
    cacheSize: number;
    networkStatus: NetworkStatus;
    isOnline: boolean;
  } {
    return {
      queueSize: this.queueSubject.value.length,
      cacheSize: this.getCache().size,
      networkStatus: this.networkStatusSubject.value,
      isOnline: this.isOnline()
    };
  }

  /**
   * Enable/disable offline mode for specific requests
   */
  setOfflineMode(enabled: boolean): void {
    if (enabled) {
      this.updateNetworkStatus(false);
    } else {
      this.updateNetworkStatus(navigator.onLine);
    }
  }

  /**
   * Setup offline indicators
   */
  setupOfflineIndicators(): void {
    // Add online/offline classes to body
    document.body.classList.add(this.isOnline() ? 'online' : 'offline');
    
    this.networkStatus$.subscribe(status => {
      document.body.classList.remove('online', 'offline');
      document.body.classList.add(status.isOnline ? 'online' : 'offline');
    });
  }

  /**
   * Cleanup
   */
  ngOnDestroy(): void {
    // Clean up event listeners if needed
  }
}