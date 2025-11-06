import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-maintenance-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="maintenance-stats-container p-6">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Maintenance Statistics</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          Detailed breakdown of maintenance costs and trends
        </p>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>

      <!-- Content -->
      <div *ngIf="!loading && maintenanceStats" class="maintenance-stats-content">
        <!-- Stats Overview -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div class="card">
            <div class="card-body">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <i class="fas fa-dollar-sign text-2xl text-green-500"></i>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Cost</p>
                  <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ formatCurrency(maintenanceStats.totalCost) }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-body">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <i class="fas fa-calendar-check text-2xl text-blue-500"></i>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</p>
                  <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ formatCurrency(maintenanceStats.monthlyCost) }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-body">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <i class="fas fa-chart-line text-2xl text-purple-500"></i>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Average Cost</p>
                  <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ formatCurrency(maintenanceStats.averageCost) }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-body">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <i class="fas fa-tachometer-alt text-2xl text-orange-500"></i>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Trend</p>
                  <div class="flex items-center">
                    <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ getTrendPercentage() }}%</p>
                    <i [class]="getTrendIcon()" class="ml-2"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Period Filter -->
        <div class="flex justify-between items-center mb-6">
          <div class="flex space-x-1">
            <button 
              *ngFor="let period of periods" 
              [class]="getPeriodButtonClass(period)"
              (click)="selectedPeriod = period">
              {{ period | titlecase }}
            </button>
          </div>
          
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-600 dark:text-gray-400">
              {{ maintenanceStats.totalRecords }} total records
            </span>
            <button class="btn btn-sm btn-secondary" (click)="exportStats()">
              <i class="fas fa-download mr-1"></i>
              Export
            </button>
          </div>
        </div>

        <!-- Charts Section Placeholder -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <!-- Monthly Trend Chart -->
          <div class="card">
            <div class="card-body">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                <i class="fas fa-chart-line mr-2 text-blue-500"></i>
                Cost Trend
              </h3>
              <div class="chart-placeholder h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div class="text-center">
                  <i class="fas fa-chart-bar text-4xl text-gray-400 mb-2"></i>
                  <p class="text-gray-500 dark:text-gray-400">Chart will be implemented here</p>
                  <p class="text-sm text-gray-400">Monthly cost trend over time</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Service Type Distribution -->
          <div class="card">
            <div class="card-body">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                <i class="fas fa-chart-pie mr-2 text-purple-500"></i>
                Service Type Distribution
              </h3>
              <div class="chart-placeholder h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div class="text-center">
                  <i class="fas fa-chart-pie text-4xl text-gray-400 mb-2"></i>
                  <p class="text-gray-500 dark:text-gray-400">Chart will be implemented here</p>
                  <p class="text-sm text-gray-400">Distribution by service type</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Service Type Breakdown -->
        <div class="card mb-8">
          <div class="card-body">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              <i class="fas fa-list-alt mr-2 text-green-500"></i>
              Service Type Breakdown
            </h3>
            
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Service Type
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Count
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total Cost
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Avg Cost
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Last Service
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  <tr *ngFor="let serviceType of serviceTypeBreakdown" class="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="flex-shrink-0 h-8 w-8">
                          <div [ngClass]="getServiceTypeIconClass(serviceType.type)" class="h-8 w-8 rounded-full flex items-center justify-center">
                            <i [class]="getServiceTypeIcon(serviceType.type)"></i>
                          </div>
                        </div>
                        <div class="ml-4">
                          <div class="text-sm font-medium text-gray-900 dark:text-white">{{ serviceType.type | titlecase }}</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {{ serviceType.count }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {{ formatCurrency(serviceType.totalCost) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {{ formatCurrency(serviceType.averageCost) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {{ serviceType.lastService | date:'mediumDate' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Cost Analysis by Car -->
        <div class="card">
          <div class="card-body">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              <i class="fas fa-car mr-2 text-blue-500"></i>
              Cost Analysis by Vehicle
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div *ngFor="let car of carCostAnalysis" class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div class="flex items-center mb-3">
                  <div class="flex-shrink-0">
                    <i class="fas fa-car text-2xl text-blue-500"></i>
                  </div>
                  <div class="ml-3">
                    <h4 class="text-sm font-medium text-gray-900 dark:text-white">{{ car.carName }}</h4>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ car.year }} {{ car.make }} {{ car.model }}</p>
                  </div>
                </div>
                
                <div class="space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600 dark:text-gray-400">Total Cost:</span>
                    <span class="font-medium text-gray-900 dark:text-white">{{ formatCurrency(car.totalCost) }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600 dark:text-gray-400">Services:</span>
                    <span class="font-medium text-gray-900 dark:text-white">{{ car.serviceCount }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600 dark:text-gray-400">Avg per Service:</span>
                    <span class="font-medium text-gray-900 dark:text-white">{{ formatCurrency(car.averageCost) }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600 dark:text-gray-400">Cost per Mile:</span>
                    <span class="font-medium text-gray-900 dark:text-white">{{ formatCurrency(car.costPerMile) }}</span>
                  </div>
                </div>
                
                <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div class="flex items-center">
                    <span class="text-xs text-gray-500 dark:text-gray-400 mr-2">Mileage:</span>
                    <div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div [style.width.%]="getMileagePercentage(car.currentMileage, car.estimatedMileage)" 
                           class="bg-blue-500 h-2 rounded-full"></div>
                    </div>
                    <span class="text-xs text-gray-600 dark:text-gray-400 ml-2">{{ formatMileage(car.currentMileage) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!maintenanceStats" class="text-center py-12">
          <i class="fas fa-chart-bar text-6xl text-gray-400 mb-4"></i>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No maintenance data</h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            No maintenance statistics available for the selected period.
          </p>
          <button class="btn btn-primary" (click)="refreshStats()">
            <i class="fas fa-refresh mr-2"></i>
            Refresh Statistics
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .maintenance-stats-container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .btn {
      @apply px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200;
    }

    .btn-primary {
      @apply bg-blue-600 text-white hover:bg-blue-700;
    }

    .btn-secondary {
      @apply bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600;
    }

    .btn-sm {
      @apply px-3 py-1.5 text-xs;
    }

    .card {
      @apply bg-white dark:bg-gray-800 rounded-lg shadow-md;
    }

    .card-body {
      @apply p-6;
    }

    .period-btn {
      @apply px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200;
    }

    .period-btn.active {
      @apply bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300;
    }

    .period-btn:not(.active) {
      @apply bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600;
    }

    .chart-placeholder {
      @apply flex flex-col items-center justify-center text-center;
    }
  `]
})
export class MaintenanceStatsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  loading = true;
  maintenanceStats: any = null;
  serviceTypeBreakdown: any[] = [];
  carCostAnalysis: any[] = [];
  selectedPeriod = 'month';
  periods = ['week', 'month', 'quarter', 'year', 'all'];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadMaintenanceStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadMaintenanceStats(): void {
    this.loading = true;
    
    this.dashboardService.maintenanceStats$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(stats => {
      if (stats) {
        this.maintenanceStats = stats;
        this.serviceTypeBreakdown = stats.serviceTypeBreakdown || [];
        this.carCostAnalysis = stats.carCostAnalysis || [];
      }
      this.loading = false;
    });

    // Load data
    this.dashboardService.loadMaintenanceStats();
  }

  getPeriodButtonClass(period: string): string {
    const baseClass = 'period-btn';
    const isActive = this.selectedPeriod === period;
    return isActive ? `${baseClass} active` : baseClass;
  }

  getTrendPercentage(): number {
    return this.maintenanceStats ? this.maintenanceStats.trendPercentage || 0 : 0;
  }

  getTrendIcon(): string {
    const trend = this.getTrendPercentage();
    if (trend > 0) return 'fas fa-arrow-up text-green-500';
    if (trend < 0) return 'fas fa-arrow-down text-red-500';
    return 'fas fa-minus text-gray-500';
  }

  getServiceTypeIcon(type: string): string {
    const icons = {
      oil_change: 'fas fa-oil-can',
      brake_service: 'fas fa-brake',
      tire_service: 'fas fa-tire',
      engine_repair: 'fas fa-cog',
      transmission: 'fas fa-cogs',
      battery: 'fas fa-car-battery',
      cooling: 'fas fa-thermometer-half',
      exhaust: 'fas fa-smog'
    };
    return icons[type as keyof typeof icons] || 'fas fa-wrench';
  }

  getServiceTypeIconClass(type: string): string {
    const classes = {
      oil_change: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
      brake_service: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400',
      tire_service: 'bg-black text-white',
      engine_repair: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400',
      transmission: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
      battery: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400',
      cooling: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-400',
      exhaust: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
    };
    return classes[type as keyof typeof classes] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
  }

  getMileagePercentage(current: number, estimated: number): number {
    if (estimated === 0) return 0;
    return Math.min((current / estimated) * 100, 100);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatMileage(mileage: number): string {
    return new Intl.NumberFormat('en-US').format(mileage) + ' mi';
  }

  exportStats(): void {
    // Implementation for exporting statistics
    console.log('Exporting maintenance stats...');
    // This would typically trigger a download or API call
  }

  refreshStats(): void {
    this.loadMaintenanceStats();
  }
}