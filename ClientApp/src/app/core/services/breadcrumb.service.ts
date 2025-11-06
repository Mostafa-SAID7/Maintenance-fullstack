import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, map } from 'rxjs/operators';

export interface BreadcrumbItem {
  label: string;
  url: string;
  icon?: string;
  isActive: boolean;
  level: number;
  metadata?: any;
}

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  private breadcrumbSubject = new BehaviorSubject<BreadcrumbItem[]>([]);
  public breadcrumb$ = this.breadcrumbSubject.asObservable();

  private homeLabel = 'Home';
  private homeIcon = 'home';
  private defaultIcon = 'chevron-right';

  constructor(private router: Router) {
    this.initializeBreadcrumbTracking();
  }

  /**
   * Initialize breadcrumb tracking based on route changes
   */
  private initializeBreadcrumbTracking(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(() => this.createBreadcrumbs())
      )
      .subscribe(breadcrumbs => {
        this.breadcrumbSubject.next(breadcrumbs);
      });

    // Initialize on service creation
    this.breadcrumbSubject.next(this.createBreadcrumbs());
  }

  /**
   * Create breadcrumbs from current route
   */
  private createBreadcrumbs(): BreadcrumbItem[] {
    const breadcrumbs: BreadcrumbItem[] = [];
    
    // Add home breadcrumb
    breadcrumbs.push({
      label: this.homeLabel,
      url: '/',
      icon: this.homeIcon,
      isActive: this.router.url === '/',
      level: 0
    });

    // Get current route segments
    const urlSegments = this.router.url.split('/').filter(segment => segment);
    let currentUrl = '';

    urlSegments.forEach((segment, index) => {
      currentUrl += `/${segment}`;
      const route = this.getRouteData(segment);
      
      if (route) {
        breadcrumbs.push({
          label: route.breadcrumb || this.formatSegmentLabel(segment),
          url: currentUrl,
          icon: route.icon,
          isActive: index === urlSegments.length - 1,
          level: index + 1,
          metadata: route
        });
      }
    });

    return breadcrumbs;
  }

  /**
   * Get route data for breadcrumb configuration
   */
  private getRouteData(segment: string): any {
    const route = this.router.config.find(r => 
      r.path === segment || (r.path && r.path.includes(segment))
    );
    return route?.data || {};
  }

  /**
   * Format segment label for display
   */
  private formatSegmentLabel(segment: string): string {
    // Convert kebab-case or camelCase to Title Case
    return segment
      .replace(/[-_]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Set custom breadcrumbs for current page
   */
  setBreadcrumbs(breadcrumbs: Partial<BreadcrumbItem>[]): void {
    const formattedBreadcrumbs: BreadcrumbItem[] = [];

    // Always start with home
    formattedBreadcrumbs.push({
      label: this.homeLabel,
      url: '/',
      icon: this.homeIcon,
      isActive: breadcrumbs.length === 0,
      level: 0
    });

    // Add custom breadcrumbs
    breadcrumbs.forEach((breadcrumb, index) => {
      formattedBreadcrumbs.push({
        label: breadcrumb.label || 'Unknown',
        url: breadcrumb.url || '#',
        icon: breadcrumb.icon,
        isActive: index === breadcrumbs.length - 1,
        level: index + 1,
        metadata: breadcrumb.metadata
      });
    });

    this.breadcrumbSubject.next(formattedBreadcrumbs);
  }

  /**
   * Add breadcrumb dynamically
   */
  addBreadcrumb(breadcrumb: Partial<BreadcrumbItem>): void {
    const currentBreadcrumbs = this.breadcrumbSubject.value;
    const newBreadcrumb: BreadcrumbItem = {
      label: breadcrumb.label || 'Unknown',
      url: breadcrumb.url || '#',
      icon: breadcrumb.icon,
      isActive: true,
      level: currentBreadcrumbs.length,
      metadata: breadcrumb.metadata
    };

    // Mark all previous breadcrumbs as inactive
    const updatedBreadcrumbs = currentBreadcrumbs.map(b => ({
      ...b,
      isActive: false
    }));

    updatedBreadcrumbs.push(newBreadcrumb);
    this.breadcrumbSubject.next(updatedBreadcrumbs);
  }

  /**
   * Remove last breadcrumb
   */
  removeLastBreadcrumb(): void {
    const currentBreadcrumbs = this.breadcrumbSubject.value;
    if (currentBreadcrumbs.length > 1) {
      const updatedBreadcrumbs = currentBreadcrumbs.slice(0, -1);
      // Mark the new last breadcrumb as active
      if (updatedBreadcrumbs.length > 0) {
        updatedBreadcrumbs[updatedBreadcrumbs.length - 1].isActive = true;
      }
      this.breadcrumbSubject.next(updatedBreadcrumbs);
    }
  }

  /**
   * Update breadcrumb at specific index
   */
  updateBreadcrumb(index: number, breadcrumb: Partial<BreadcrumbItem>): void {
    const currentBreadcrumbs = this.breadcrumbSubject.value;
    if (index >= 0 && index < currentBreadcrumbs.length) {
      currentBreadcrumbs[index] = {
        ...currentBreadcrumbs[index],
        ...breadcrumb
      };
      this.breadcrumbSubject.next([...currentBreadcrumbs]);
    }
  }

  /**
   * Clear all breadcrumbs except home
   */
  clearBreadcrumbs(): void {
    this.breadcrumbSubject.next([{
      label: this.homeLabel,
      url: '/',
      icon: this.homeIcon,
      isActive: true,
      level: 0
    }]);
  }

  /**
   * Get current breadcrumbs
   */
  getCurrentBreadcrumbs(): BreadcrumbItem[] {
    return this.breadcrumbSubject.value;
  }

  /**
   * Check if current page has breadcrumbs
   */
  hasBreadcrumbs(): boolean {
    return this.breadcrumbSubject.value.length > 1;
  }

  /**
   * Get breadcrumb by level
   */
  getBreadcrumbByLevel(level: number): BreadcrumbItem | undefined {
    return this.breadcrumbSubject.value.find(breadcrumb => breadcrumb.level === level);
  }

  /**
   * Get parent breadcrumb of current active breadcrumb
   */
  getParentBreadcrumb(): BreadcrumbItem | undefined {
    const breadcrumbs = this.breadcrumbSubject.value;
    const activeIndex = breadcrumbs.findIndex(b => b.isActive);
    return activeIndex > 0 ? breadcrumbs[activeIndex - 1] : undefined;
  }

  /**
   * Navigate to breadcrumb
   */
  navigateToBreadcrumb(breadcrumb: BreadcrumbItem): void {
    if (breadcrumb.url && breadcrumb.url !== '#') {
      this.router.navigate([breadcrumb.url]);
    }
  }

  /**
   * Navigate to parent breadcrumb
   */
  navigateToParent(): void {
    const parent = this.getParentBreadcrumb();
    if (parent) {
      this.navigateToBreadcrumb(parent);
    }
  }

  /**
   * Generate breadcrumb HTML for server-side rendering
   */
  generateBreadcrumbHTML(): string {
    const breadcrumbs = this.breadcrumbSubject.value;
    const html = breadcrumbs.map((breadcrumb, index) => {
      if (breadcrumb.isActive) {
        return `<span class="breadcrumb-item active">${breadcrumb.label}</span>`;
      } else {
        return `<a href="${breadcrumb.url}" class="breadcrumb-item">${breadcrumb.label}</a>`;
      }
    }).join('<span class="breadcrumb-separator">/</span>');

    return `<nav class="breadcrumb">${html}</nav>`;
  }

  /**
   * Export breadcrumbs as JSON
   */
  exportBreadcrumbs(): string {
    return JSON.stringify(this.breadcrumbSubject.value, null, 2);
  }

  /**
   * Import breadcrumbs from JSON
   */
  importBreadcrumbs(breadcrumbsJson: string): boolean {
    try {
      const breadcrumbs = JSON.parse(breadcrumbsJson);
      if (Array.isArray(breadcrumbs)) {
        this.breadcrumbSubject.next(breadcrumbs);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import breadcrumbs:', error);
      return false;
    }
  }

  /**
   * Subscribe to breadcrumb changes
   */
  onBreadcrumbChange(): Observable<BreadcrumbItem[]> {
    return this.breadcrumb$;
  }

  /**
   * Create breadcrumb from route parameters
   */
  createBreadcrumbFromParams(route: ActivatedRoute, params: any): Partial<BreadcrumbItem> {
    let label = '';
    
    // Try to get breadcrumb from route data first
    if (route.snapshot.data['breadcrumb']) {
      label = route.snapshot.data['breadcrumb'];
    } else {
      // Generate from route path
      label = this.formatSegmentLabel(route.snapshot.routeConfig?.path || '');
    }

    // Replace parameter placeholders with actual values
    Object.keys(params).forEach(key => {
      const placeholder = `:${key}`;
      if (label.includes(placeholder)) {
        label = label.replace(placeholder, params[key]);
      }
    });

    return {
      label,
      url: route.snapshot.url.map(segment => segment.path).join('/'),
      metadata: {
        route: route.snapshot.routeConfig?.path,
        params: params
      }
    };
  }

  /**
   * Set custom configuration
   */
  configure(options: {
    homeLabel?: string;
    homeIcon?: string;
    defaultIcon?: string;
  }): void {
    if (options.homeLabel) this.homeLabel = options.homeLabel;
    if (options.homeIcon) this.homeIcon = options.homeIcon;
    if (options.defaultIcon) this.defaultIcon = options.defaultIcon;
    
    // Refresh breadcrumbs with new configuration
    this.breadcrumbSubject.next(this.createBreadcrumbs());
  }
}