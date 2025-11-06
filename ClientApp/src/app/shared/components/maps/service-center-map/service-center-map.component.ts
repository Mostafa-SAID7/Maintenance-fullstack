import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface ServiceCenter {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  email?: string;
  website?: string;
  services: string[];
  rating?: number;
  distance?: number;
  isOpen?: boolean;
  hours?: {
    [key: string]: string; // day: time range
  };
  specialties?: string[];
  certifications?: string[];
  reviews?: {
    rating: number;
    count: number;
  };
}

export interface MapConfig {
  center?: {
    lat: number;
    lng: number;
  };
  zoom?: number;
  mapType?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
  style?: 'default' | 'dark' | 'minimal' | 'outdoor';
  showTraffic?: boolean;
  showTransit?: boolean;
  showBicycling?: boolean;
  showDirections?: boolean;
  clusterMarkers?: boolean;
  maxMarkers?: number;
}

export interface MapFilters {
  services?: string[];
  radius?: number; // in km
  openNow?: boolean;
  rating?: number;
  distance?: number;
  specialties?: string[];
}

@Component({
  selector: 'app-service-center-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="service-center-map-container">
      <!-- Map Controls -->
      <div class="map-controls absolute top-4 left-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-xs">
        <!-- Search -->
        <div class="mb-4">
          <div class="relative">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (input)="onSearchChange()"
              placeholder="Search service centers..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="space-y-3">
          <!-- Radius Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search Radius: {{ filters.radius || 25 }} km
            </label>
            <input
              type="range"
              [value]="filters.radius || 25"
              (input)="updateRadius($event.target.value)"
              min="5"
              max="100"
              step="5"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
          </div>

          <!-- Services Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Services
            </label>
            <div class="space-y-1 max-h-32 overflow-y-auto">
              <label *ngFor="let service of availableServices" class="flex items-center">
                <input
                  type="checkbox"
                  [checked]="filters.services?.includes(service)"
                  (change)="toggleService(service, $event.target.checked)"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">{{ service }}</span>
              </label>
            </div>
          </div>

          <!-- Additional Filters -->
          <div class="space-y-2">
            <label class="flex items-center">
              <input
                type="checkbox"
                [checked]="filters.openNow"
                (change)="updateFilter('openNow', $event.target.checked)"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">Open now</span>
            </label>

            <label class="flex items-center">
              <input
                type="checkbox"
                [checked]="filters.showTraffic"
                (change)="updateFilter('showTraffic', $event.target.checked)"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">Show traffic</span>
            </label>
          </div>
        </div>

        <!-- Results Count -->
        <div class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ filteredCenters.length }} service centers found
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="mt-4 flex space-x-2">
          <button
            (click)="showCurrentLocation()"
            class="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            My Location
          </button>
          
          <button
            (click)="clearFilters()"
            class="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Clear
          </button>
        </div>
      </div>

      <!-- Map Container -->
      <div #mapContainer class="map-container w-full h-full rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
        <div class="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <div class="text-center">
            <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
            </svg>
            <p class="mt-2 text-sm">Map Loading...</p>
            <p class="text-xs text-gray-400 dark:text-gray-500">Interactive map would be rendered here</p>
          </div>
        </div>
      </div>

      <!-- Service Center Info Panel -->
      <div *ngIf="selectedCenter" class="info-panel absolute bottom-4 left-4 right-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-h-60 overflow-y-auto">
        <div class="flex justify-between items-start mb-3">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ selectedCenter.name }}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">{{ selectedCenter.address }}</p>
            <div class="flex items-center mt-1 space-x-4">
              <span *ngIf="selectedCenter.distance !== undefined" class="text-sm text-blue-600 dark:text-blue-400">
                {{ selectedCenter.distance.toFixed(1) }} km away
              </span>
              <span *ngIf="selectedCenter.rating" class="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <svg class="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                {{ selectedCenter.rating.toFixed(1) }}
              </span>
            </div>
          </div>
          <button
            (click)="closeInfoPanel()"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Services -->
        <div *ngIf="selectedCenter.services.length > 0" class="mb-3">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Services</h4>
          <div class="flex flex-wrap gap-1">
            <span *ngFor="let service of selectedCenter.services" 
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {{ service }}
            </span>
          </div>
        </div>

        <!-- Contact Information -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 text-sm">
          <div *ngIf="selectedCenter.phone" class="flex items-center">
            <svg class="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
            </svg>
            <a [href]="'tel:' + selectedCenter.phone" class="text-blue-600 dark:text-blue-400 hover:underline">
              {{ selectedCenter.phone }}
            </a>
          </div>

          <div *ngIf="selectedCenter.website" class="flex items-center">
            <svg class="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
            </svg>
            <a [href]="selectedCenter.website" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline">
              Website
            </a>
          </div>

          <div *ngIf="selectedCenter.email" class="flex items-center">
            <svg class="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
            <a [href]="'mailto:' + selectedCenter.email" class="text-blue-600 dark:text-blue-400 hover:underline">
              Email
            </a>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex space-x-2">
          <button
            (click)="getDirections()"
            class="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            Get Directions
          </button>
          
          <button
            (click)="callCenter()"
            *ngIf="selectedCenter.phone"
            class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
            </svg>
            Call
          </button>
        </div>
      </div>

      <!-- Loading Overlay -->
      <div *ngIf="isLoading" class="loading-overlay absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-3">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span class="text-gray-900 dark:text-white">Loading service centers...</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .service-center-map-container {
      position: relative;
      width: 100%;
      height: 100%;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    
    .map-container {
      min-height: 400px;
    }
    
    .map-controls {
      max-height: 70vh;
      overflow-y: auto;
    }
    
    .info-panel {
      max-width: 400px;
    }
    
    .loading-overlay {
      backdrop-filter: blur(2px);
    }
  `]
})
export class ServiceCenterMapComponent implements OnInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  
  @Input() serviceCenters: ServiceCenter[] = [];
  @Input() config: MapConfig = {};
  @Input() userLocation?: { lat: number; lng: number };
  
  @Output() centerSelected = new EventEmitter<ServiceCenter>();
  @Output() directionsRequested = new EventEmitter<ServiceCenter>();
  @Output() locationFound = new EventEmitter<{ lat: number; lng: number }>();

  private destroy$ = new Subject<void>();
  
  // Component state
  isLoading = false;
  selectedCenter: ServiceCenter | null = null;
  filteredCenters: ServiceCenter[] = [];
  
  // Search and filters
  searchQuery = '';
  filters: MapFilters = {
    radius: 25,
    services: [],
    openNow: false,
    showTraffic: false
  };
  
  // Available services for filtering
  availableServices: string[] = [
    'Oil Change',
    'Brake Service',
    'Transmission',
    'Engine Diagnostics',
    'Air Conditioning',
    'Tire Service',
    'Battery Service',
    'Suspension',
    'Electrical',
    'Body Work',
    'Detailing',
    'Inspection',
    'Tune-up',
    'Cooling System',
    'Fuel System'
  ];
  
  // Map configuration defaults
  private defaultConfig: MapConfig = {
    center: { lat: 39.8283, lng: -98.5795 }, // Center of US
    zoom: 10,
    mapType: 'roadmap',
    showTraffic: false,
    showTransit: false,
    showBicycling: false,
    showDirections: true,
    clusterMarkers: true,
    maxMarkers: 100
  };

  constructor() {}

  ngOnInit(): void {
    this.config = { ...this.defaultConfig, ...this.config };
    this.filteredCenters = [...this.serviceCenters];
    this.calculateDistances();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========== Search and Filtering ==========

  onSearchChange(): void {
    this.filterServiceCenters();
  }

  updateRadius(radius: string): void {
    this.filters.radius = parseInt(radius);
    this.filterServiceCenters();
  }

  toggleService(service: string, checked: boolean): void {
    if (!this.filters.services) {
      this.filters.services = [];
    }
    
    if (checked) {
      if (!this.filters.services.includes(service)) {
        this.filters.services.push(service);
      }
    } else {
      this.filters.services = this.filters.services.filter(s => s !== service);
    }
    
    this.filterServiceCenters();
  }

  updateFilter(key: keyof MapFilters, value: any): void {
    this.filters[key] = value;
    this.filterServiceCenters();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.filters = {
      radius: 25,
      services: [],
      openNow: false,
      showTraffic: false
    };
    this.filterServiceCenters();
  }

  private filterServiceCenters(): void {
    let filtered = [...this.serviceCenters];
    
    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(center =>
        center.name.toLowerCase().includes(query) ||
        center.address.toLowerCase().includes(query) ||
        center.services.some(service => service.toLowerCase().includes(query))
      );
    }
    
    // Services filter
    if (this.filters.services && this.filters.services.length > 0) {
      filtered = filtered.filter(center =>
        this.filters.services!.some(service =>
          center.services.some(cs => cs.toLowerCase().includes(service.toLowerCase()))
        )
      );
    }
    
    // Open now filter
    if (this.filters.openNow && filtered.length > 0) {
      filtered = filtered.filter(center => center.isOpen);
    }
    
    // Radius filter
    if (this.filters.radius && this.userLocation) {
      filtered = filtered.filter(center => {
        if (center.distance === undefined) return false;
        return center.distance <= this.filters.radius!;
      });
    }
    
    // Rating filter
    if (this.filters.rating && this.filters.rating > 0) {
      filtered = filtered.filter(center => 
        center.rating && center.rating >= this.filters.rating!
      );
    }
    
    this.filteredCenters = filtered;
    this.calculateDistances();
  }

  private calculateDistances(): void {
    if (!this.userLocation) return;
    
    this.filteredCenters.forEach(center => {
      center.distance = this.calculateDistance(
        this.userLocation!.lat,
        this.userLocation!.lng,
        center.latitude,
        center.longitude
      );
    });
    
    // Sort by distance
    this.filteredCenters.sort((a, b) => {
      if (a.distance === undefined && b.distance === undefined) return 0;
      if (a.distance === undefined) return 1;
      if (b.distance === undefined) return -1;
      return a.distance - b.distance;
    });
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // ========== Location Services ==========

  showCurrentLocation(): void {
    this.isLoading = true;
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          this.userLocation = location;
          this.locationFound.emit(location);
          this.calculateDistances();
          this.isLoading = false;
        },
        (error) => {
          console.error('Geolocation error:', error);
          this.isLoading = false;
          // Fallback to default location or handle error
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser');
      this.isLoading = false;
    }
  }

  // ========== Center Interaction ==========

  selectCenter(center: ServiceCenter): void {
    this.selectedCenter = center;
    this.centerSelected.emit(center);
  }

  closeInfoPanel(): void {
    this.selectedCenter = null;
  }

  getDirections(): void {
    if (this.selectedCenter) {
      this.directionsRequested.emit(this.selectedCenter);
      
      // Open directions in external app
      const url = `https://www.google.com/maps/dir/?api=1&destination=${this.selectedCenter.latitude},${this.selectedCenter.longitude}`;
      window.open(url, '_blank');
    }
  }

  callCenter(): void {
    if (this.selectedCenter?.phone) {
      window.location.href = `tel:${this.selectedCenter.phone}`;
    }
  }

  // ========== Utility Methods ==========

  getMarkerIcon(center: ServiceCenter): string {
    if (center.isOpen) {
      return '🟢'; // Green for open
    }
    return '🔴'; // Red for closed
  }

  isWithinRadius(center: ServiceCenter): boolean {
    if (!this.filters.radius || !center.distance) return true;
    return center.distance <= this.filters.radius;
  }

  // ========== Public API ==========

  updateCenters(centers: ServiceCenter[]): void {
    this.serviceCenters = centers;
    this.filterServiceCenters();
  }

  setUserLocation(lat: number, lng: number): void {
    this.userLocation = { lat, lng };
    this.calculateDistances();
  }

  focusOnCenter(centerId: string): void {
    const center = this.serviceCenters.find(c => c.id === centerId);
    if (center) {
      this.selectCenter(center);
    }
  }

  clearSelection(): void {
    this.selectedCenter = null;
  }

  exportMapData(): any {
    return {
      centers: this.filteredCenters,
      userLocation: this.userLocation,
      filters: this.filters,
      config: this.config
    };
  }
}