import { Injectable } from '@angular/core';

export interface StorageItem {
  key: string;
  value: any;
  expiry?: number; // Unix timestamp
  compressed?: boolean;
}

export interface CacheItem {
  data: any;
  timestamp: number;
  expiry: number;
  size: number;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly memoryCache = new Map<string, CacheItem>();
  private readonly maxMemoryCacheSize = 50 * 1024 * 1024; // 50MB
  private currentMemoryCacheSize = 0;

  constructor() {
    this.initializeCleanup();
  }

  // ========== LOCAL STORAGE ==========

  /**
   * Set item in local storage with optional expiry
   */
  set(key: string, value: any, expiry?: number): void {
    try {
      const item: StorageItem = {
        key,
        value: JSON.stringify(value),
        expiry
      };

      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error('Error setting localStorage item:', error);
      // Fallback to memory cache if localStorage fails
      this.setMemoryCache(key, value, expiry);
    }
  }

  /**
   * Get item from local storage
   */
  get<T>(key: string): T | null {
    try {
      const itemStr = localStorage.getItem(key);
      if (!itemStr) {
        return null;
      }

      const item: StorageItem = JSON.parse(itemStr);
      
      // Check expiry
      if (item.expiry && Date.now() > item.expiry) {
        this.remove(key);
        return null;
      }

      return JSON.parse(item.value);
    } catch (error) {
      console.error('Error getting localStorage item:', error);
      // Fallback to memory cache
      return this.getMemoryCache(key);
    }
  }

  /**
   * Remove item from local storage
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing localStorage item:', error);
    }
  }

  /**
   * Clear all local storage items
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
    this.clearMemoryCache();
  }

  // ========== SESSION STORAGE ==========

  /**
   * Set item in session storage
   */
  setSession(key: string, value: any): void {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error setting sessionStorage item:', error);
    }
  }

  /**
   * Get item from session storage
   */
  getSession<T>(key: string): T | null {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error getting sessionStorage item:', error);
      return null;
    }
  }

  /**
   * Remove item from session storage
   */
  removeSession(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing sessionStorage item:', error);
    }
  }

  /**
   * Clear all session storage items
   */
  clearSession(): void {
    try {
      sessionStorage.clear();
    } catch (error) {
      console.error('Error clearing sessionStorage:', error);
    }
  }

  // ========== MEMORY CACHE ==========

  /**
   * Set item in memory cache with optional expiry
   */
  setMemoryCache(key: string, value: any, expiryMs?: number): void {
    try {
      const dataStr = JSON.stringify(value);
      const size = new Blob([dataStr]).size;
      
      // Calculate expiry timestamp
      const expiry = expiryMs ? Date.now() + expiryMs : Date.now() + (60 * 60 * 1000); // 1 hour default

      // Remove old item if it exists
      const oldItem = this.memoryCache.get(key);
      if (oldItem) {
        this.currentMemoryCacheSize -= oldItem.size;
      }

      // Check if adding new item would exceed cache size
      while (this.currentMemoryCacheSize + size > this.maxMemoryCacheSize && this.memoryCache.size > 0) {
        this.evictOldestItem();
      }

      const cacheItem: CacheItem = {
        data: value,
        timestamp: Date.now(),
        expiry,
        size
      };

      this.memoryCache.set(key, cacheItem);
      this.currentMemoryCacheSize += size;
    } catch (error) {
      console.error('Error setting memory cache item:', error);
    }
  }

  /**
   * Get item from memory cache
   */
  getMemoryCache<T>(key: string): T | null {
    try {
      const item = this.memoryCache.get(key);
      if (!item) {
        return null;
      }

      // Check expiry
      if (Date.now() > item.expiry) {
        this.memoryCache.delete(key);
        this.currentMemoryCacheSize -= item.size;
        return null;
      }

      return item.data;
    } catch (error) {
      console.error('Error getting memory cache item:', error);
      return null;
    }
  }

  /**
   * Remove item from memory cache
   */
  removeMemoryCache(key: string): void {
    const item = this.memoryCache.get(key);
    if (item) {
      this.memoryCache.delete(key);
      this.currentMemoryCacheSize -= item.size;
    }
  }

  /**
   * Clear all memory cache items
   */
  clearMemoryCache(): void {
    this.memoryCache.clear();
    this.currentMemoryCacheSize = 0;
  }

  // ========== COOKIES ==========

  /**
   * Set cookie
   */
  setCookie(name: string, value: string, days?: number): void {
    let expires = '';
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = '; expires=' + date.toUTCString();
    }
    document.cookie = `${name}=${value}${expires}; path=/; SameSite=Lax`;
  }

  /**
   * Get cookie
   */
  getCookie(name: string): string | null {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  /**
   * Remove cookie
   */
  removeCookie(name: string): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }

  // ========== INDEXEDDB ==========

  /**
   * Initialize IndexedDB
   */
  private async initIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('CarCommunDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Store file in IndexedDB
   */
  async storeFile(id: string, file: Blob, metadata?: any): Promise<void> {
    try {
      const db = await this.initIndexedDB();
      const transaction = db.transaction(['files'], 'readwrite');
      const store = transaction.objectStore('files');
      
      await store.put({
        id,
        file,
        metadata,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error storing file in IndexedDB:', error);
      throw error;
    }
  }

  /**
   * Get file from IndexedDB
   */
  async getFile(id: string): Promise<Blob | null> {
    try {
      const db = await this.initIndexedDB();
      const transaction = db.transaction(['files'], 'readonly');
      const store = transaction.objectStore('files');
      
      return new Promise((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.file : null);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error getting file from IndexedDB:', error);
      return null;
    }
  }

  /**
   * Delete file from IndexedDB
   */
  async deleteFile(id: string): Promise<void> {
    try {
      const db = await this.initIndexedDB();
      const transaction = db.transaction(['files'], 'readwrite');
      const store = transaction.objectStore('files');
      
      await store.delete(id);
    } catch (error) {
      console.error('Error deleting file from IndexedDB:', error);
    }
  }

  // ========== UTILITY METHODS ==========

  /**
   * Check if local storage is available
   */
  isLocalStorageAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if session storage is available
   */
  isSessionStorageAvailable(): boolean {
    try {
      const test = '__sessionStorage_test__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get storage usage info
   */
  getStorageInfo(): { localStorage: number; sessionStorage: number; memoryCache: number; maxMemoryCache: number } {
    try {
      let localStorageSize = 0;
      let sessionStorageSize = 0;
      
      // Calculate localStorage size
      if (this.isLocalStorageAvailable()) {
        for (let key in localStorage) {
          if (localStorage.hasOwnProperty(key)) {
            localStorageSize += localStorage[key].length + key.length;
          }
        }
      }
      
      // Calculate sessionStorage size
      if (this.isSessionStorageAvailable()) {
        for (let key in sessionStorage) {
          if (sessionStorage.hasOwnProperty(key)) {
            sessionStorageSize += sessionStorage[key].length + key.length;
          }
        }
      }
      
      return {
        localStorage: localStorageSize,
        sessionStorage: sessionStorageSize,
        memoryCache: this.currentMemoryCacheSize,
        maxMemoryCache: this.maxMemoryCacheSize
      };
    } catch (error) {
      console.error('Error calculating storage info:', error);
      return { localStorage: 0, sessionStorage: 0, memoryCache: 0, maxMemoryCache: this.maxMemoryCacheSize };
    }
  }

  /**
   * Clean expired items
   */
  private initializeCleanup(): void {
    // Clean expired items every 5 minutes
    setInterval(() => {
      this.cleanExpiredItems();
    }, 5 * 60 * 1000);
  }

  private cleanExpiredItems(): void {
    const now = Date.now();
    
    // Clean localStorage expired items
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}');
          if (item.expiry && now > item.expiry) {
            keysToRemove.push(key);
          }
        } catch {
          // Invalid JSON, skip this item
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clean memory cache expired items
    const expiredKeys: string[] = [];
    this.memoryCache.forEach((item, key) => {
      if (now > item.expiry) {
        expiredKeys.push(key);
      }
    });
    
    expiredKeys.forEach(key => this.removeMemoryCache(key));
  }

  private evictOldestItem(): void {
    let oldestKey = '';
    let oldestTimestamp = Date.now();
    
    this.memoryCache.forEach((item, key) => {
      if (item.timestamp < oldestTimestamp) {
        oldestTimestamp = item.timestamp;
        oldestKey = key;
      }
    });
    
    if (oldestKey) {
      this.removeMemoryCache(oldestKey);
    }
  }

  /**
   * Clear all storage (local, session, memory, cookies)
   */
  clearAll(): void {
    this.clear();
    this.clearSession();
    this.clearMemoryCache();
    
    // Clear cookies
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      this.removeCookie(name);
    }
  }
}