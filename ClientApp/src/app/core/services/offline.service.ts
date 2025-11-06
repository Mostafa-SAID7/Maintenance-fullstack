import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, merge, of } from 'rxjs';
import { map, distinctUntilChanged, startWith } from 'rxjs/operators';
import { CacheService } from './cache.service';
import { STORAGE_KEYS } from '../constants/storage-keys.constants';

export interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  data: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
}

export interface SyncResult {
  success: boolean;
  actionId: string;
  error?: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class OfflineService {
  private isOnlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
  public isOnline$ = this.isOnlineSubject.asObservable();
  
  private offlineQueueSubject = new BehaviorSubject<OfflineAction[]>([]);
  public offlineQueue$ = this.offlineQueueSubject.asObservable();
  
  private syncInProgressSubject = new BehaviorSubject<boolean>(false);
  public syncInProgress$ = this.syncInProgressSubject.asObservable();

  private readonly maxRetries = 3;
  private readonly retryDelay = 5000; // 5 seconds

  constructor(private cacheService: CacheService) {
    this.initializeOnlineStatus();
    this.loadOfflineQueue();
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return this.isOnlineSubject.value;
  }

  /**
   * Get current offline queue
   */
  getOfflineQueue(): OfflineAction[] {
    return this.offlineQueueSubject.value;
  }

  /**
   * Add action to offline queue
   */
  queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount' | 'maxRetries'>): void {
    const offlineAction: OfflineAction = {
      ...action,
      id: this.generateId(),
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: this.maxRetries
    };

    const currentQueue = this.offlineQueueSubject.value;
    const updatedQueue = [...currentQueue, offlineAction];
    
    this.updateOfflineQueue(updatedQueue);
    this.persistOfflineQueue(updatedQueue);
    
    console.log('Action queued for offline sync:', offlineAction);
  }

  /**
   * Execute action immediately if online, queue if offline
   */
  async executeOrQueue<T>(
    action: () => Promise<T>,
    fallback: () => void,
    actionType: 'create' | 'update' | 'delete',
    endpoint: string,
    data: any
  ): Promise<T | void> {
    if (this.isOnline()) {
      try {
        return await action();
      } catch (error) {
        console.error('Online action failed, queueing for later:', error);
        this.queueAction({ type: actionType, endpoint, data });
        return fallback();
      }
    } else {
      this.queueAction({ type: actionType, endpoint, data });
      return fallback();
    }
  }

  /**
   * Sync offline queue with server
   */
  async syncOfflineQueue(): Promise<SyncResult[]> {
    if (!this.isOnline() || this.syncInProgressSubject.value) {
      return [];
    }

    this.syncInProgressSubject.next(true);
    const queue = [...this.offlineQueueSubject.value];
    const results: SyncResult[] = [];

    try {
      for (const action of queue) {
        const result = await this.syncAction(action);
        results.push(result);
        
        if (result.success) {
          await this.removeFromQueue(action.id);
        } else {
          await this.incrementRetryCount(action.id);
        }
      }
    } finally {
      this.syncInProgressSubject.next(false);
    }

    return results;
  }

  /**
   * Force sync (typically called when coming back online)
   */
  async forceSync(): Promise<void> {
    if (this.isOnline()) {
      console.log('Force syncing offline queue...');
      const results = await this.syncOfflineQueue();
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      console.log(`Sync completed: ${successful} successful, ${failed} failed`);
    }
  }

  /**
   * Clear offline queue
   */
  clearOfflineQueue(): void {
    this.updateOfflineQueue([]);
    this.persistOfflineQueue([]);
  }

  /**
   * Get offline storage usage
   */
  getOfflineStorageInfo() {
    const queue = this.offlineQueueSubject.value;
    const cacheStats = this.cacheService.getStats();
    
    return {
      queueSize: queue.length,
      queueDataSize: JSON.stringify(queue).length,
      cacheStats,
      totalOfflineSize: JSON.stringify(queue).length + cacheStats.totalSizeBytes
    };
  }

  /**
   * Initialize online/offline status monitoring
   */
  private initializeOnlineStatus(): void {
    // Monitor online/offline events
    merge(
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    )
    .pipe(
      startWith(navigator.onLine),
      distinctUntilChanged()
    )
    .subscribe(isOnline => {
      this.isOnlineSubject.next(isOnline);
      
      if (isOnline) {
        console.log('Back online, initiating sync...');
        this.forceSync();
      }
    });
  }

  /**
   * Load offline queue from cache
   */
  private loadOfflineQueue(): void {
    const cached = this.cacheService.get(STORAGE_KEYS.OFFLINE_QUEUE);
    if (cached && Array.isArray(cached)) {
      // Convert timestamp strings back to Date objects
      const queue = cached.map((action: any) => ({
        ...action,
        timestamp: new Date(action.timestamp)
      }));
      this.updateOfflineQueue(queue);
    }
  }

  /**
   * Persist offline queue to cache
   */
  private persistOfflineQueue(queue: OfflineAction[]): void {
    this.cacheService.set(STORAGE_KEYS.OFFLINE_QUEUE, queue, {
      ttl: 24 * 60 * 60 * 1000 // 24 hours
    });
  }

  /**
   * Update offline queue subject
   */
  private updateOfflineQueue(queue: OfflineAction[]): void {
    this.offlineQueueSubject.next(queue);
  }

  /**
   * Remove action from queue
   */
  private async removeFromQueue(actionId: string): Promise<void> {
    const currentQueue = this.offlineQueueSubject.value;
    const updatedQueue = currentQueue.filter(action => action.id !== actionId);
    this.updateOfflineQueue(updatedQueue);
    this.persistOfflineQueue(updatedQueue);
  }

  /**
   * Increment retry count for action
   */
  private async incrementRetryCount(actionId: string): Promise<void> {
    const currentQueue = this.offlineQueueSubject.value;
    const updatedQueue = currentQueue.map(action => {
      if (action.id === actionId) {
        const newRetryCount = action.retryCount + 1;
        
        // Remove from queue if max retries exceeded
        if (newRetryCount >= action.maxRetries) {
          console.warn('Max retries exceeded for action:', action);
          return null; // Mark for removal
        }
        
        return { ...action, retryCount: newRetryCount };
      }
      return action;
    }).filter(Boolean) as OfflineAction[];
    
    this.updateOfflineQueue(updatedQueue);
    this.persistOfflineQueue(updatedQueue);
  }

  /**
   * Sync individual action with server
   */
  private async syncAction(action: OfflineAction): Promise<SyncResult> {
    try {
      // This would integrate with your HTTP service
      // For now, simulate the sync process
      await this.simulateSync(action);
      
      return {
        success: true,
        actionId: action.id,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        actionId: action.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  /**
   * Simulate sync process (replace with actual HTTP calls)
   */
  private async simulateSync(action: OfflineAction): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate occasional failures for testing
    if (Math.random() < 0.1) { // 10% failure rate
      throw new Error('Simulated network error');
    }
    
    console.log('Synced action:', action);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get sync statistics
   */
  getSyncStats() {
    const queue = this.offlineQueueSubject.value;
    const retryCounts = queue.map(action => action.retryCount);
    const avgRetries = retryCounts.length > 0 
      ? retryCounts.reduce((a, b) => a + b, 0) / retryCounts.length 
      : 0;

    return {
      totalQueued: queue.length,
      averageRetries: Math.round(avgRetries * 100) / 100,
      oldestAction: queue.length > 0 ? Math.min(...queue.map(a => a.timestamp.getTime())) : null,
      newestAction: queue.length > 0 ? Math.max(...queue.map(a => a.timestamp.getTime())) : null,
      isOnline: this.isOnline(),
      syncInProgress: this.syncInProgressSubject.value
    };
  }
}