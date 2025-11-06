import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface VehicleLocation {
  id: string;
  name: string;
  vehicleId?: string;
  vin?: string;
  licensePlate?: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  speed?: number;
  heading?: number;
  status: 'active' | 'idle' | 'maintenance' | 'stolen' | 'unknown';
  batteryLevel?: number;
  fuelLevel?: number;
  odometer?: number;
  driverName?: string;
  notes?: string;
  alerts?: AlertInfo[];
}

export interface AlertInfo {
  id: string;
  type: 'speeding' | 'geofence' | 'maintenance' | 'battery' | 'fuel' | 'device';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged?: boolean;
}

export interface GeofenceArea {
  id: string;
  name: string;
  type: 'home' | 'work' | 'custom' | 'restricted';
  coordinates: Array<{ lat: number; lng: number }>;
  radius?: number; // for circular geofences
  isActive: boolean;
  alerts: boolean;
}

export interface TrackingConfig {
  center?: {
    lat: number;
    lng: number;
  };
  zoom?: number;
  mapType?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
  style?: 'default' | 'dark' | 'minimal' | 'outdoor';
  showTraffic?: boolean;
  showSatellite?: boolean;
  showGeofences?: boolean;
  followVehicle?: string; // vehicle ID to follow
  clusterMarkers?: boolean;
  maxHistoryPoints?: number;
  updateInterval?: number; // seconds
}

@Component({
  selector: 'app-vehicle-location-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="vehicle-location-map-container">
      <!-- Map Controls -->
      <div class="map-controls absolute top-4 left-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-sm">
        <!-- Vehicle Selector -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Track Vehicle
          </label>
          <select
            [(ngModel)]="selectedVehicleId"
            (change)="onVehicleSelect()"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Vehicles</option>
            <option *ngFor="let vehicle of vehicles" [value]="vehicle.id">
              {{ vehicle.name }} ({{ vehicle.licensePlate || 'No Plate' }})
            </option>
          </select>
        </div>

        <!-- Status Filter -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <div class="space-y-1">
            <label *ngFor="let status of vehicleStatuses" class="flex items-center">
              <input
                type="checkbox"
                [checked]="selectedStatuses.includes(status)"
                (change)="toggleStatus(status, $event.target.checked)"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="ml-2 text-sm text-gray-600 dark:text-gray-400 capitalize">{{ status }}</span>
              <span class="ml-auto text-xs text-gray-400">
                {{ getVehicleCountByStatus(status) }}
              </span>
            </label>
          </div>
        </div>

        <!-- Map Options -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Map Options
          </label>
          <div class="space-y-2">
            <label class="flex items-center">
              <input
                type="checkbox"
                [checked]="config.showGeofences"
                (change)="updateConfig('showGeofences', $event.target.checked)"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">Show geofences</span>
            </label>

            <label class="flex items-center">
              <input
                type="checkbox"
                [checked]="config.showTraffic"
                (change)="updateConfig('showTraffic', $event.target.checked)"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">Show traffic</span>
            </label>

            <label class="flex items-center">
              <input
                type="checkbox"
                [checked]="config.showSatellite"
                (change)="updateConfig('showSatellite', $event.target.checked)"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">Satellite view</span>
            </label>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="grid grid-cols-2 gap-2 mb-4">
          <button
            (click)="centerOnUser()"
            class="inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            My Location
          </button>

          <button
            (click)="fitAllVehicles()"
            class="inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
            </svg>
            Fit All
          </button>
        </div>

        <!-- Live Tracking Status -->
        <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Last updated: {{ lastUpdate | date:'short' }}</span>
          <div class="flex items-center">
            <div class="w-2 h-2 rounded-full mr-2" [ngClass]="isLiveTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'"></div>
            {{ isLiveTracking ? 'Live' : 'Static' }}
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="mt-4 flex space-x-2">
          <button
            (click)="refreshLocations()"
            class="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <!-- Map Container -->
      <div #mapContainer class="map-container w-full h-full rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800 relative">
        <!-- Map Placeholder with Vehicle Icons -->
        <div class="absolute inset-0 p-4 overflow-hidden">
          <div class="relative w-full h-full bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 rounded-lg">
            <!-- Vehicle markers would be rendered here in a real implementation -->
            <div 
              *ngFor="let vehicle of visibleVehicles; trackBy: trackByVehicle" 
              class="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              [style.left.%]="getRelativePosition(vehicle).x"
              [style.top.%]="getRelativePosition(vehicle).y"
              (click)="selectVehicle(vehicle)"
            >
              <!-- Vehicle Icon -->
              <div class="relative">
                <div 
                  [ngClass]="getVehicleIconClass(vehicle.status)"
                  class="w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
                >
                  <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"></path>
                    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z"></path>
                  </svg>
                </div>

                <!-- Status Indicator -->
                <div 
                  [ngClass]="getStatusIndicatorClass(vehicle.status)"
                  class="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white"
                ></div>

                <!-- Alert Indicator -->
                <div *ngIf="vehicle.alerts && vehicle.alerts.length > 0" 
                     class="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span class="text-xs text-white font-bold">{{ vehicle.alerts.length }}</span>
                </div>

                <!-- Battery/Fuel Indicator -->
                <div *ngIf="vehicle.batteryLevel || vehicle.fuelLevel" 
                     class="absolute -bottom-6 left-1/2 transform -translate-x-1/2 px-1 py-0.5 text-xs rounded text-white"
                     [ngClass]="getFuelLevelClass(vehicle.batteryLevel || vehicle.fuelLevel || 0)">
                  {{ (vehicle.batteryLevel || vehicle.fuelLevel || 0) }}%
                </div>
              </div>

              <!-- Vehicle Label -->
              <div class="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-md text-xs whitespace-nowrap">
                <div class="font-medium text-gray-900 dark:text-white">{{ vehicle.name }}</div>
                <div class="text-gray-500 dark:text-gray-400 text-xs">
                  {{ vehicle.speed ? vehicle.speed + ' mph' : 'Stationary' }}
                </div>
              </div>
            </div>

            <!-- Geofence Areas -->
            <div *ngFor="let geofence of geofences" 
                 class="absolute border-2 border-dashed rounded-lg"
                 [style.left.%]="getGeofenceBounds(geofence).left"
                 [style.top.%]="getGeofenceBounds(geofence).top"
                 [style.width.%]="getGeofenceBounds(geofence).width"
                 [style.height.%]="getGeofenceBounds(geofence).height"
                 [ngClass]="getGeofenceClass(geofence.type)">
              <div class="absolute top-0 left-0 transform -translate-y-full -translate-x-1 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-md text-xs">
                {{ geofence.name }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Vehicle Detail Panel -->
      <div *ngIf="selectedVehicle" class="vehicle-panel absolute bottom-4 left-4 right-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-h-80 overflow-y-auto">
        <div class="flex justify-between items-start mb-4">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ selectedVehicle.name }}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ selectedVehicle.licensePlate || 'No plate' }} • {{ selectedVehicle.vin || 'No VIN' }}
            </p>
            <div class="flex items-center mt-1 space-x-4">
              <span class="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <div class="w-2 h-2 rounded-full mr-2" [ngClass]="getStatusIndicatorClass(selectedVehicle.status)"></div>
                {{ selectedVehicle.status | titlecase }}
              </span>
              <span *ngIf="selectedVehicle.timestamp" class="text-sm text-gray-500 dark:text-gray-400">
                {{ selectedVehicle.timestamp | date:'short' }}
              </span>
            </div>
          </div>
          <button
            (click)="closeVehiclePanel()"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Vehicle Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div *ngIf="selectedVehicle.speed !== undefined" class="text-center">
            <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ selectedVehicle.speed }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">Speed (mph)</div>
          </div>
          
          <div *ngIf="selectedVehicle.odometer" class="text-center">
            <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ selectedVehicle.odometer | number }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">Odometer</div>
          </div>
          
          <div *ngIf="selectedVehicle.batteryLevel" class="text-center">
            <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ selectedVehicle.batteryLevel }}%</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">Battery</div>
          </div>
          
          <div *If="selectedVehicle.fuelLevel" class="text-center">
            <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ selectedVehicle.fuelLevel }}%</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">Fuel</div>
          </div>
        </div>

        <!-- Alerts -->
        <div *ngIf="selectedVehicle.alerts && selectedVehicle.alerts.length > 0" class="mb-4">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Active Alerts ({{ selectedVehicle.alerts.length }})
          </h4>
          <div class="space-y-2">
            <div *ngFor="let alert of selectedVehicle.alerts" 
                 class="flex items-start p-2 rounded"
                 [ngClass]="getAlertBgClass(alert.severity)">
              <div class="flex-shrink-0 mr-2">
                <div 
                  [ngClass]="getAlertIconClass(alert.severity)"
                  class="w-2 h-2 rounded-full"
                ></div>
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ alert.type | titlecase }}</p>
                <p class="text-xs text-gray-600 dark:text-gray-400">{{ alert.message }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-500">{{ alert.timestamp | date:'short' }}</p>
              </div>
              <button 
                *ngIf="!alert.acknowledged"
                (click)="acknowledgeAlert(alert.id)"
                class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Acknowledge
              </button>
            </div>
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
            Directions
          </button>
          
          <button
            (click)="viewHistory()"
            class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            History
          </button>
        </div>
      </div>

      <!-- Loading Overlay -->
      <div *ngIf="isLoading" class="loading-overlay absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-3">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span class="text-gray-900 dark:text-white">Loading vehicle locations...</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .vehicle-location-map-container {
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
    
    .vehicle-panel {
      max-width: 500px;
    }
    
    .loading-overlay {
      backdrop-filter: blur(2px);
    }
  `]
})
export class VehicleLocationMapComponent implements OnInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  
  @Input() vehicles: VehicleLocation[] = [];
  @Input() geofences: GeofenceArea[] = [];
  @Input() config: TrackingConfig = {};
  @Input() userLocation?: { lat: number; lng: number };
  
  @Output() vehicleSelected = new EventEmitter<VehicleLocation>();
  @Output() vehicleFocused = new EventEmitter<string>(); // vehicle ID
  @Output() directionsRequested = new EventEmitter<VehicleLocation>();
  @Output() historyRequested = new EventEmitter<VehicleLocation>();
  @Output() alertAcknowledged = new EventEmitter<{ vehicleId: string; alertId: string }>();

  private destroy$ = new Subject<void>();
  private trackingInterval?: any;
  
  // Component state
  isLoading = false;
  selectedVehicle: VehicleLocation | null = null;
  selectedVehicleId = '';
  visibleVehicles: VehicleLocation[] = [];
  lastUpdate = new Date();
  isLiveTracking = false;
  
  // Filters
  selectedStatuses: string[] = ['active', 'idle'];
  vehicleStatuses = ['active', 'idle', 'maintenance', 'stolen', 'unknown'];
  
  // Map configuration defaults
  private defaultConfig: TrackingConfig = {
    center: { lat: 39.8283, lng: -98.5795 },
    zoom: 10,
    showTraffic: false,
    showSatellite: false,
    showGeofences: true,
    clusterMarkers: true,
    maxHistoryPoints: 100,
    updateInterval: 30 // 30 seconds
  };

  constructor() {}

  ngOnInit(): void {
    this.config = { ...this.defaultConfig, ...this.config };
    this.visibleVehicles = [...this.vehicles];
    this.startLiveTracking();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
    }
  }

  // ========== Vehicle Management ==========

  onVehicleSelect(): void {
    if (this.selectedVehicleId) {
      const vehicle = this.vehicles.find(v => v.id === this.selectedVehicleId);
      if (vehicle) {
        this.selectVehicle(vehicle);
        this.focusOnVehicle(vehicle.id);
      }
    } else {
      this.clearSelection();
    }
  }

  selectVehicle(vehicle: VehicleLocation): void {
    this.selectedVehicle = vehicle;
    this.selectedVehicleId = vehicle.id;
    this.vehicleSelected.emit(vehicle);
  }

  closeVehiclePanel(): void {
    this.selectedVehicle = null;
    this.selectedVehicleId = '';
  }

  focusOnVehicle(vehicleId: string): void {
    this.vehicleFocused.emit(vehicleId);
  }

  clearSelection(): void {
    this.selectedVehicle = null;
    this.selectedVehicleId = '';
  }

  // ========== Filtering ==========

  toggleStatus(status: string, checked: boolean): void {
    if (checked) {
      if (!this.selectedStatuses.includes(status)) {
        this.selectedStatuses.push(status);
      }
    } else {
      this.selectedStatuses = this.selectedStatuses.filter(s => s !== status);
    }
    this.updateVisibleVehicles();
  }

  getVehicleCountByStatus(status: string): number {
    return this.vehicles.filter(v => v.status === status).length;
  }

  private updateVisibleVehicles(): void {
    this.visibleVehicles = this.vehicles.filter(vehicle => {
      // Status filter
      if (!this.selectedStatuses.includes(vehicle.status)) {
        return false;
      }
      
      // Vehicle ID filter
      if (this.selectedVehicleId && vehicle.id !== this.selectedVehicleId) {
        return false;
      }
      
      return true;
    });
  }

  // ========== Map Configuration ==========

  updateConfig(key: keyof TrackingConfig, value: any): void {
    this.config[key] = value;
    if (key === 'followVehicle') {
      this.focusOnVehicle(value);
    }
  }

  // ========== Live Tracking ==========

  private startLiveTracking(): void {
    if (this.config.updateInterval && this.config.updateInterval > 0) {
      this.isLiveTracking = true;
      this.trackingInterval = setInterval(() => {
        this.refreshLocations();
      }, this.config.updateInterval! * 1000);
    }
  }

  refreshLocations(): void {
    this.isLoading = true;
    this.lastUpdate = new Date();
    
    // Simulate API call
    setTimeout(() => {
      // In real implementation, this would fetch updated location data
      this.updateVisibleVehicles();
      this.isLoading = false;
    }, 1000);
  }

  // ========== Navigation ==========

  centerOnUser(): void {
    if (this.userLocation) {
      // In real implementation, this would center the map on user's location
      console.log('Centering on user location:', this.userLocation);
    }
  }

  fitAllVehicles(): void {
    if (this.visibleVehicles.length === 0) return;
    
    // In real implementation, this would fit all vehicles in the viewport
    console.log('Fitting all vehicles in view');
  }

  // ========== Actions ==========

  getDirections(): void {
    if (this.selectedVehicle) {
      this.directionsRequested.emit(this.selectedVehicle);
      
      // Open directions in external app
      const url = `https://www.google.com/maps/dir/?api=1&destination=${this.selectedVehicle.latitude},${this.selectedVehicle.longitude}`;
      window.open(url, '_blank');
    }
  }

  viewHistory(): void {
    if (this.selectedVehicle) {
      this.historyRequested.emit(this.selectedVehicle);
    }
  }

  acknowledgeAlert(alertId: string): void {
    if (this.selectedVehicle) {
      this.alertAcknowledged.emit({
        vehicleId: this.selectedVehicle.id,
        alertId
      });
      
      // Update local state
      const alert = this.selectedVehicle.alerts?.find(a => a.id === alertId);
      if (alert) {
        alert.acknowledged = true;
      }
    }
  }

  // ========== Utility Methods ==========

  getVehicleIconClass(status: string): string {
    const baseClass = 'w-8 h-8 rounded-full flex items-center justify-center';
    
    switch (status) {
      case 'active':
        return `${baseClass} bg-green-500`;
      case 'idle':
        return `${baseClass} bg-yellow-500`;
      case 'maintenance':
        return `${baseClass} bg-blue-500`;
      case 'stolen':
        return `${baseClass} bg-red-500`;
      default:
        return `${baseClass} bg-gray-500`;
    }
  }

  getStatusIndicatorClass(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-400';
      case 'idle':
        return 'bg-yellow-400';
      case 'maintenance':
        return 'bg-blue-400';
      case 'stolen':
        return 'bg-red-400';
      default:
        return 'bg-gray-400';
    }
  }

  getFuelLevelClass(level: number): string {
    if (level > 50) return 'bg-green-500';
    if (level > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  getGeofenceClass(type: string): string {
    switch (type) {
      case 'home':
        return 'border-green-400 bg-green-100 dark:bg-green-900';
      case 'work':
        return 'border-blue-400 bg-blue-100 dark:bg-blue-900';
      case 'restricted':
        return 'border-red-400 bg-red-100 dark:bg-red-900';
      default:
        return 'border-gray-400 bg-gray-100 dark:bg-gray-700';
    }
  }

  getAlertBgClass(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800';
      case 'high':
        return 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800';
      case 'medium':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800';
    }
  }

  getAlertIconClass(severity: string): string {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  }

  getRelativePosition(vehicle: VehicleLocation): { x: number; y: number } {
    // Mock implementation - in real app, this would calculate relative position
    const x = Math.random() * 80 + 10; // 10-90%
    const y = Math.random() * 80 + 10; // 10-90%
    return { x, y };
  }

  getGeofenceBounds(geofence: GeofenceArea): { left: number; top: number; width: number; height: number } {
    // Mock implementation - in real app, this would calculate geofence bounds
    return {
      left: 20,
      top: 30,
      width: 40,
      height: 30
    };
  }

  trackByVehicle(index: number, vehicle: VehicleLocation): string {
    return vehicle.id;
  }

  // ========== Public API ==========

  updateVehicles(vehicles: VehicleLocation[]): void {
    this.vehicles = vehicles;
    this.updateVisibleVehicles();
  }

  updateGeofences(geofences: GeofenceArea[]): void {
    this.geofences = geofences;
  }

  setUserLocation(lat: number, lng: number): void {
    this.userLocation = { lat, lng };
  }

  startTracking(): void {
    this.isLiveTracking = true;
    this.startLiveTracking();
  }

  stopTracking(): void {
    this.isLiveTracking = false;
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = undefined;
    }
  }

  exportMapData(): any {
    return {
      vehicles: this.visibleVehicles,
      geofences: this.geofences,
      config: this.config,
      userLocation: this.userLocation,
      selectedVehicle: this.selectedVehicle,
      lastUpdate: this.lastUpdate,
      isLiveTracking: this.isLiveTracking
    };
  }
}