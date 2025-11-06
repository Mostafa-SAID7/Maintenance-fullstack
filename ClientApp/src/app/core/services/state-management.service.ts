import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { CacheService } from './cache.service';

export interface StateSlice<T> {
  data: T;
  loading: boolean;
  error: string | null;
  lastUpdated: Date;
  version: number;
}

export interface AppState {
  auth: AuthState;
  cars: CarsState;
  maintenance: MaintenanceState;
  notifications: NotificationsState;
  ui: UIState;
}

export interface AuthState {
  user: any | null;
  isAuthenticated: boolean;
  permissions: string[];
  token: string | null;
  refreshToken: string | null;
  tokenExpiry: Date | null;
}

export interface CarsState {
  cars: any[];
  selectedCar: any | null;
  loading: boolean;
  error: string | null;
  filters: any;
  pagination: {
    page: number;
    size: number;
    total: number;
  };
}

export interface MaintenanceState {
  records: any[];
  selectedRecord: any | null;
  upcomingMaintenance: any[];
  loading: boolean;
  error: string | null;
  filters: any;
}

export interface NotificationsState {
  notifications: any[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  settings: any | null;
}

export interface UIState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  loading: {
    global: boolean;
    cars: boolean;
    maintenance: boolean;
    notifications: boolean;
  };
  breadcrumbs: Array<{
    label: string;
    url?: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class StateManagementService {
  private state: Partial<AppState> = {};
  private stateSubject = new BehaviorSubject<Partial<AppState>>(this.state);
  
  public state$ = this.stateSubject.asObservable();
  public appState$ = this.stateSubject.asObservable();

  constructor(private cacheService: CacheService) {
    this.initializeState();
  }

  /**
   * Get a specific state slice
   */
  select<K extends keyof AppState>(key: K): Observable<AppState[K] | undefined> {
    return this.state$.pipe(
      map(state => state[key]),
      distinctUntilChanged()
    );
  }

  /**
   * Get current state value
   */
  getState<K extends keyof AppState>(key: K): AppState[K] | undefined {
    return this.state[key];
  }

  /**
   * Set a state slice
   */
  setState<K extends keyof AppState>(key: K, value: AppState[K]): void {
    (this.state as any)[key] = {
      ...value,
      lastUpdated: new Date()
    };
    
    this.persistState(key, (this.state as any)[key]);
    this.notifyStateChange();
  }

  /**
   * Update state slice with partial data
   */
  patchState<K extends keyof AppState>(key: K, updates: Partial<AppState[K]>): void {
    const currentValue = this.state[key] as any;
    if (currentValue) {
      this.setState(key, {
        ...currentValue,
        ...updates
      } as any);
    }
  }

  /**
   * Reset a specific state slice
   */
  resetState<K extends keyof AppState>(key: K): void {
    delete this.state[key];
    this.cacheService.delete(`state_${key}`);
    this.notifyStateChange();
  }

  /**
   * Reset all state
   */
  resetAllState(): void {
    this.state = {};
    this.cacheService.clear();
    this.notifyStateChange();
  }

  /**
   * Select specific properties from state
   */
  selectProp<K extends keyof AppState, P extends keyof AppState[K]>(
    stateKey: K,
    prop: P
  ): Observable<AppState[K][P] | undefined> {
    return this.select(stateKey).pipe(
      map(state => state?.[prop]),
      distinctUntilChanged()
    );
  }

  /**
   * Get current property value
   */
  getProp<K extends keyof AppState, P extends keyof AppState[K]>(
    stateKey: K,
    prop: P
  ): AppState[K][P] | undefined {
    const state = this.getState(stateKey);
    return (state as any)?.[prop];
  }

  /**
   * Set specific property in state
   */
  setProp<K extends keyof AppState, P extends keyof AppState[K]>(
    stateKey: K,
    prop: P,
    value: AppState[K][P]
  ): void {
    const currentState = this.getState(stateKey) as any;
    if (currentState) {
      this.patchState(stateKey, { [prop]: value } as any);
    }
  }

  /**
   * Create derived state selector
   */
  createSelector<K extends keyof AppState, T>(
    stateKey: K,
    selector: (state: AppState[K]) => T
  ): Observable<T> {
    return this.select(stateKey).pipe(
      map(state => state ? selector(state) : undefined as T),
      distinctUntilChanged()
    );
  }

  /**
   * Combine multiple state slices
   */
  combineStates<K1 extends keyof AppState, K2 extends keyof AppState, T>(
    key1: K1,
    key2: K2,
    combiner: (state1: AppState[K1] | undefined, state2: AppState[K2] | undefined) => T
  ): Observable<T> {
    return new Observable(observer => {
      let state1: AppState[K1] | undefined;
      let state2: AppState[K2] | undefined;

      const sub1 = this.select(key1).subscribe(s1 => {
        state1 = s1;
        this.notifyCombined(observer, state1, state2, combiner);
      });

      const sub2 = this.select(key2).subscribe(s2 => {
        state2 = s2;
        this.notifyCombined(observer, state1, state2, combiner);
      });

      return () => {
        sub1.unsubscribe();
        sub2.unsubscribe();
      };
    });
  }

  /**
   * State history for debugging
   */
  private stateHistory: Array<{ timestamp: Date; state: Partial<AppState> }> = [];

  /**
   * Get state history
   */
  getStateHistory(): Array<{ timestamp: Date; state: Partial<AppState> }> {
    return [...this.stateHistory];
  }

  /**
   * Initialize state from cache
   */
  private initializeState(): void {
    // Load persisted state from cache
    const persistedKeys: (keyof AppState)[] = ['auth', 'cars', 'maintenance', 'notifications', 'ui'];
    
    persistedKeys.forEach(key => {
      const cached = this.cacheService.get(`state_${key}`);
      if (cached) {
        (this.state as any)[key] = cached;
      }
    });

    this.notifyStateChange();
  }

  /**
   * Persist state to cache
   */
  private persistState<K extends keyof AppState>(key: K, value: any): void {
    this.cacheService.set(`state_${key}`, value, {
      ttl: 30 * 60 * 1000 // 30 minutes
    });
  }

  /**
   * Notify state change to subscribers
   */
  private notifyStateChange(): void {
    // Add to history for debugging
    this.stateHistory.push({
      timestamp: new Date(),
      state: { ...this.state }
    });

    // Keep only last 50 state changes
    if (this.stateHistory.length > 50) {
      this.stateHistory.shift();
    }

    this.stateSubject.next({ ...this.state });
  }

  /**
   * Notify combined state update
   */
  private notifyCombined<K1 extends keyof AppState, K2 extends keyof AppState, T>(
    observer: any,
    state1: AppState[K1] | undefined,
    state2: AppState[K2] | undefined,
    combiner: (state1: AppState[K1] | undefined, state2: AppState[K2] | undefined) => T
  ): void {
    if (state1 !== undefined && state2 !== undefined) {
      observer.next(combiner(state1, state2));
    }
  }

  // Convenience methods for common state operations

  /**
   * Auth state helpers
   */
  isAuthenticated$(): Observable<boolean | undefined> {
    return this.selectProp('auth', 'isAuthenticated');
  }

  getCurrentUser$(): Observable<any | undefined> {
    return this.selectProp('auth', 'user');
  }

  /**
   * Cars state helpers
   */
  getCars$(): Observable<any[] | undefined> {
    return this.selectProp('cars', 'cars');
  }

  isCarsLoading$(): Observable<boolean | undefined> {
    return this.selectProp('cars', 'loading');
  }

  /**
   * UI state helpers
   */
  isSidebarCollapsed$(): Observable<boolean | undefined> {
    return this.selectProp('ui', 'sidebarCollapsed');
  }

  getCurrentTheme$(): Observable<'light' | 'dark' | 'auto' | undefined> {
    return this.selectProp('ui', 'theme');
  }

  isGlobalLoading$(): Observable<boolean> {
    return this.selectProp('ui', 'loading').pipe(
      map(loading => loading?.global || false)
    );
  }
}