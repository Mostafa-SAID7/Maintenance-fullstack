import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, merge } from 'rxjs';
import { map, debounceTime } from 'rxjs/operators';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';

export interface AnalyticsEvent {
  id?: string;
  name: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  customData?: { [key: string]: any };
  timestamp: Date;
  userId?: string;
  sessionId: string;
  pageUrl: string;
  referrer?: string;
  userAgent: string;
  viewport: { width: number; height: number };
}

export interface PerformanceMetrics {
  pageLoadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  timeToInteractive: number;
  totalBlockingTime: number;
}

export interface UserSession {
  id: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  pageViews: number;
  events: AnalyticsEvent[];
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  device: DeviceInfo;
  location?: string;
}

export interface DeviceInfo {
  type: 'desktop' | 'tablet' | 'mobile' | 'unknown';
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  screenResolution: string;
  viewport: { width: number; height: number };
  language: string;
  timezone: string;
}

export interface PageView {
  page: string;
  title: string;
  url: string;
  timestamp: Date;
  duration?: number;
  referrer?: string;
  userId?: string;
  sessionId: string;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly storageKey = 'analytics-events';
  private readonly sessionKey = 'analytics-session';
  private readonly eventsBuffer: AnalyticsEvent[] = [];
  private readonly maxBufferSize = 50;
  private flushInterval = 30000; // 30 seconds
  private sessionId: string;
  private currentSession!: UserSession;
  
  private eventsSubject = new BehaviorSubject<AnalyticsEvent[]>([]);
  private sessionSubject = new BehaviorSubject<UserSession | null>(null);
  private pageViewsSubject = new BehaviorSubject<PageView[]>([]);
  
  public events$ = this.eventsSubject.asObservable();
  public session$ = this.sessionSubject.asObservable();
  public pageViews$ = this.pageViewsSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private storageService: StorageService
  ) {
    this.sessionId = this.generateSessionId();
    this.initializeSession();
    this.setupEventListeners();
    this.startFlushTimer();
    this.loadStoredEvents();
  }

  /**
   * Track page view
   */
  trackPageView(page: string, title?: string, url?: string): void {
    const pageView: PageView = {
      page,
      title: title || document.title,
      url: url || window.location.href,
      timestamp: new Date(),
      referrer: document.referrer,
      userId: this.getCurrentUserId(),
      sessionId: this.sessionId
    };

    this.currentSession.pageViews++;
    this.updatePageViewInSession(pageView);
    
    // Track as event
    this.trackEvent('page_view', 'navigation', page, pageView.title, undefined, {
      page_title: pageView.title,
      page_url: pageView.url,
      referrer: pageView.referrer
    });
  }

  /**
   * Track custom event
   */
  trackEvent(name: string, category: string, action: string, label?: string, value?: number, customData?: { [key: string]: any }): void {
    const event: AnalyticsEvent = {
      name,
      category,
      action,
      label,
      value,
      customData,
      timestamp: new Date(),
      userId: this.getCurrentUserId(),
      sessionId: this.sessionId,
      pageUrl: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    this.addEventToBuffer(event);
  }

  /**
   * Track user interaction
   */
  trackClick(elementId: string, elementText?: string, elementClass?: string): void {
    this.trackEvent('click', 'user_interaction', 'element_click', elementText, undefined, {
      element_id: elementId,
      element_text: elementText,
      element_class: elementClass,
      page_url: window.location.href
    });
  }

  /**
   * Track form submission
   */
  trackFormSubmission(formName: string, formData?: { [key: string]: any }): void {
    this.trackEvent('form_submit', 'user_interaction', formName, undefined, undefined, {
      form_data_keys: formData ? Object.keys(formData).join(',') : '',
      page_url: window.location.href
    });
  }

  /**
   * Track search
   */
  trackSearch(searchTerm: string, resultsCount: number): void {
    this.trackEvent('search', 'user_interaction', 'search_performed', searchTerm, resultsCount, {
      results_count: resultsCount,
      page_url: window.location.href
    });
  }

  /**
   * Track error
   */
  trackError(errorMessage: string, errorType: string, stackTrace?: string): void {
    this.trackEvent('error', 'system', errorType, errorMessage, undefined, {
      stack_trace: stackTrace,
      page_url: window.location.href,
      user_agent: navigator.userAgent
    });
  }

  /**
   * Track performance metrics
   */
  trackPerformance(): void {
    if (!window.performance || !window.performance.timing) {
      return;
    }

    const timing = window.performance.timing;
    const metrics: PerformanceMetrics = {
      pageLoadTime: timing.loadEventEnd - timing.navigationStart,
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      firstPaint: this.getFirstPaint(),
      firstContentfulPaint: this.getFirstContentfulPaint(),
      largestContentfulPaint: this.getLargestContentfulPaint(),
      cumulativeLayoutShift: this.getCumulativeLayoutShift(),
      firstInputDelay: this.getFirstInputDelay(),
      timeToInteractive: timing.domInteractive - timing.navigationStart,
      totalBlockingTime: this.getTotalBlockingTime()
    };

    this.trackEvent('performance', 'system', 'page_performance', undefined, undefined, metrics);
  }

  /**
   * Track user engagement
   */
  trackEngagement(action: string, duration?: number): void {
    this.trackEvent('engagement', 'user_behavior', action, undefined, duration, {
      session_duration: this.getSessionDuration(),
      page_url: window.location.href
    });
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(featureName: string, action: string, metadata?: { [key: string]: any }): void {
    this.trackEvent('feature_usage', 'application', action, featureName, undefined, metadata);
  }

  /**
   * Get current session
   */
  getCurrentSession(): UserSession | null {
    return this.currentSession;
  }

  /**
   * Get device info
   */
  getDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent;
    const screen = window.screen;
    
    return {
      type: this.getDeviceType(userAgent),
      browser: this.getBrowser(userAgent),
      browserVersion: this.getBrowserVersion(userAgent),
      os: this.getOS(userAgent),
      osVersion: this.getOSVersion(userAgent),
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  /**
   * Start new session
   */
  startNewSession(userId?: string): void {
    this.endCurrentSession();
    this.sessionId = this.generateSessionId();
    this.initializeSession(userId);
  }

  /**
   * End current session
   */
  endCurrentSession(): void {
    if (this.currentSession) {
      this.currentSession.endTime = new Date();
      this.currentSession.duration = this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime();
      this.saveSession();
    }
  }

  /**
   * Flush events buffer
   */
  flushEvents(): void {
    if (this.eventsBuffer.length === 0) {
      return;
    }

    const events = [...this.eventsBuffer];
    this.eventsBuffer.length = 0;

    // Send events to analytics endpoint
    this.apiService.post('/api/analytics/events', events).subscribe({
      next: (response) => {
        console.log('Analytics events flushed successfully');
      },
      error: (error) => {
        console.error('Failed to flush analytics events:', error);
        // Restore events to buffer for retry
        this.eventsBuffer.unshift(...events);
      }
    });
  }

  /**
   * Get stored events
   */
  getStoredEvents(): AnalyticsEvent[] {
    const stored = this.storageService.get<AnalyticsEvent[]>(this.storageKey);
    return stored || [];
  }

  /**
   * Clear stored events
   */
  clearStoredEvents(): void {
    this.storageService.remove(this.storageKey);
    this.eventsSubject.next([]);
  }

  /**
   * Set UTM parameters from URL
   */
  setUTMFromURL(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source');
    const utmMedium = urlParams.get('utm_medium');
    const utmCampaign = urlParams.get('utm_campaign');

    if (utmSource || utmMedium || utmCampaign) {
      this.currentSession.utmSource = utmSource || undefined;
      this.currentSession.utmMedium = utmMedium || undefined;
      this.currentSession.utmCampaign = utmCampaign || undefined;
      
      this.trackEvent('utm', 'acquisition', 'utm_detected', undefined, undefined, {
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign
      });
    }
  }

  private initializeSession(userId?: string): void {
    this.currentSession = {
      id: this.sessionId,
      userId: userId || this.getCurrentUserId(),
      startTime: new Date(),
      pageViews: 0,
      events: [],
      referrer: document.referrer,
      device: this.getDeviceInfo()
    };

    this.sessionSubject.next(this.currentSession);
    this.saveSession();
    this.setUTMFromURL();
  }

  private setupEventListeners(): void {
    // Track page visibility changes
    merge(
      fromEvent(document, 'visibilitychange'),
      fromEvent(window, 'beforeunload'),
      fromEvent(window, 'pagehide')
    ).subscribe(() => {
      if (document.visibilityState === 'hidden') {
        this.flushEvents();
        this.endCurrentSession();
      }
    });

    // Track mouse movements (throttled)
    fromEvent(document, 'mousemove')
      .pipe(debounceTime(1000))
      .subscribe(() => {
        this.trackEngagement('mouse_move');
      });

    // Track scroll depth
    fromEvent(window, 'scroll')
      .pipe(debounceTime(1000))
      .subscribe(() => {
        const scrollPercentage = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
        if (scrollPercentage % 25 === 0) { // Track at 25%, 50%, 75%, 100%
          this.trackEngagement('scroll_depth', scrollPercentage);
        }
      });

    // Track performance on page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.trackPerformance();
      }, 0);
    });
  }

  private startFlushTimer(): void {
    setInterval(() => {
      this.flushEvents();
    }, this.flushInterval);
  }

  private loadStoredEvents(): void {
    const stored = this.getStoredEvents();
    if (stored.length > 0) {
      stored.forEach(event => {
        this.addEventToBuffer(event);
      });
      this.flushEvents();
    }
  }

  private addEventToBuffer(event: AnalyticsEvent): void {
    this.eventsBuffer.push(event);
    this.eventsSubject.next([...this.eventsBuffer]);

    // Store locally as backup
    const storedEvents = this.getStoredEvents();
    storedEvents.push(event);
    this.storageService.set(this.storageKey, storedEvents);

    // Auto-flush if buffer is full
    if (this.eventsBuffer.length >= this.maxBufferSize) {
      this.flushEvents();
    }
  }

  private updatePageViewInSession(pageView: PageView): void {
    const pageViews = this.pageViewsSubject.value;
    pageViews.push(pageView);
    this.pageViewsSubject.next(pageViews);
    this.currentSession.events.push({
      name: 'page_view',
      category: 'navigation',
      action: pageView.page,
      timestamp: pageView.timestamp,
      userId: pageView.userId,
      sessionId: pageView.sessionId,
      pageUrl: pageView.url,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });
  }

  private saveSession(): void {
    this.storageService.set(this.sessionKey, this.currentSession);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentUserId(): string | undefined {
    // This would typically get the user ID from an auth service
    // For now, return undefined
    return undefined;
  }

  private getSessionDuration(): number {
    return Date.now() - this.currentSession.startTime.getTime();
  }

  // Performance measurement methods
  private getFirstPaint(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : 0;
  }

  private getFirstContentfulPaint(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return firstContentfulPaint ? firstContentfulPaint.startTime : 0;
  }

  private getLargestContentfulPaint(): number {
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    return lcpEntries.length > 0 ? lcpEntries[lcpEntries.length - 1].startTime : 0;
  }

  private getCumulativeLayoutShift(): number {
    const clsEntries = performance.getEntriesByType('layout-shift');
    return clsEntries.reduce((total, entry) => total + (entry as any).value, 0);
  }

  private getFirstInputDelay(): number {
    const fidEntries = performance.getEntriesByType('first-input');
    return fidEntries.length > 0 ? (fidEntries[0] as any).processingStart - fidEntries[0].startTime : 0;
  }

  private getTotalBlockingTime(): number {
    const longTaskEntries = performance.getEntriesByType('longtask');
    return longTaskEntries.reduce((total, entry) => total + entry.duration, 0);
  }

  // Device detection methods
  private getDeviceType(userAgent: string): 'desktop' | 'tablet' | 'mobile' | 'unknown' {
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet';
    }
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      return 'mobile';
    }
    return 'desktop';
  }

  private getBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera';
    return 'Unknown';
  }

  private getBrowserVersion(userAgent: string): string {
    const browser = this.getBrowser(userAgent);
    const regex = new RegExp(`${browser}[\\/\\s](\\d+\\.\\d+)`);
    const match = userAgent.match(regex);
    return match ? match[1] : 'Unknown';
  }

  private getOS(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
    return 'Unknown';
  }

  private getOSVersion(userAgent: string): string {
    const os = this.getOS(userAgent);
    let version = 'Unknown';
    
    switch (os) {
      case 'Windows':
        const windowsMatch = userAgent.match(/Windows NT (\d+\.\d+)/);
        if (windowsMatch) {
          version = this.getWindowsVersion(windowsMatch[1]);
        }
        break;
      case 'macOS':
        const macMatch = userAgent.match(/Mac OS X (\d+_\d+)/);
        if (macMatch) {
          version = macMatch[1].replace('_', '.');
        }
        break;
      case 'iOS':
        const iosMatch = userAgent.match(/OS (\d+_\d+)/);
        if (iosMatch) {
          version = iosMatch[1].replace('_', '.');
        }
        break;
    }
    
    return version;
  }

  private getWindowsVersion(ntVersion: string): string {
    const versions: { [key: string]: string } = {
      '6.1': '7',
      '6.2': '8',
      '6.3': '8.1',
      '10.0': '10',
      '6.0': 'Vista',
      '5.1': 'XP'
    };
    return versions[ntVersion] || ntVersion;
  }

  ngOnDestroy(): void {
    this.flushEvents();
    this.endCurrentSession();
  }
}