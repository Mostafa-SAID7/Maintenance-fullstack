import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-recent-maintenance',
  standalone: true,
  imports: [
    CommonModule
  ],
  template: `
    <div class="recent-maintenance-container p-6">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Recent Maintenance</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          View and manage your recent maintenance records
        </p>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>

      <!-- Content -->
      <div *ngIf="!loading" class="recent-maintenance-content">
        <div class="card">
          <div class="card-header">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Maintenance Records</h3>
            <div class="flex gap-2">
              <button class="btn btn-sm btn-primary">
                <i class="fas fa-plus mr-2"></i>
                Add Record
              </button>
              <button class="btn btn-sm btn-secondary">
                <i class="fas fa-download mr-2"></i>
                Export
              </button>
            </div>
          </div>
          <div class="card-body">
            <div *ngIf="recentMaintenance.length === 0" class="text-center py-12">
              <i class="fas fa-tools text-6xl text-gray-400 mb-4"></i>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No maintenance records</h3>
              <p class="text-gray-600 dark:text-gray-400 mb-4">
                Start tracking your vehicle maintenance to see records here
              </p>
              <button class="btn btn-primary">
                <i class="fas fa-plus mr-2"></i>
                Add First Record
              </button>
            </div>

            <div *ngIf="recentMaintenance.length > 0">
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead class="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vehicle</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Service Type</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cost</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Provider</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    <tr *ngFor="let record of recentMaintenance" class="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{{ record.carName }}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ record.serviceType }}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div>{{ record.date | date:'mediumDate' }}</div>
                        <div class="text-xs">{{ formatDateAgo(record.date) }}</div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {{ formatCurrency(record.cost) }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span [ngClass]="{
                          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300': record.status === 'completed',
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300': record.status === 'in-progress',
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300': record.status === 'pending',
                          'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300': record.status === 'scheduled'
                        }" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                          {{ record.status | titlecase }}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ record.serviceProvider }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Summary Stats -->
        <div *ngIf="recentMaintenance.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div class="card">
            <div class="card-body text-center">
              <i class="fas fa-chart-line text-2xl text-blue-500 mb-2"></i>
              <h4 class="text-lg font-semibold text-gray-900 dark:text-white">Total Cost</h4>
              <p class="text-2xl font-bold text-blue-600">{{ formatCurrency(totalCost) }}</p>
            </div>
          </div>
          
          <div class="card">
            <div class="card-body text-center">
              <i class="fas fa-tools text-2xl text-green-500 mb-2"></i>
              <h4 class="text-lg font-semibold text-gray-900 dark:text-white">Total Records</h4>
              <p class="text-2xl font-bold text-green-600">{{ recentMaintenance.length }}</p>
            </div>
          </div>
          
          <div class="card">
            <div class="card-body text-center">
              <i class="fas fa-tachometer-alt text-2xl text-purple-500 mb-2"></i>
              <h4 class="text-lg font-semibold text-gray-900 dark:text-white">Average Cost</h4>
              <p class="text-2xl font-bold text-purple-600">{{ formatCurrency(averageCost) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .recent-maintenance-container {
      max-width: 1200px;
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

    .card-header {
      @apply px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center;
    }

    .card-body {
      @apply p-6;
    }
  `]
})
export class RecentMaintenanceComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  loading = true;
  recentMaintenance: any[] = [];
  totalCost = 0;
  averageCost = 0;

  columns = [
    { key: 'carName', label: 'Vehicle', sortable: true },
    { key: 'serviceType', label: 'Service Type', sortable: true },
    { key: 'date', label: 'Date', sortable: true, customTemplate: 'dateColumn' },
    { key: 'cost', label: 'Cost', sortable: true, customTemplate: 'costColumn' },
    { key: 'status', label: 'Status', sortable: true, customTemplate: 'statusColumn' },
    { key: 'serviceProvider', label: 'Provider', sortable: true }
  ];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadRecentMaintenance();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadRecentMaintenance(): void {
    this.loading = true;
    
    this.dashboardService.recentMaintenance$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(maintenance => {
      this.recentMaintenance = maintenance;
      this.calculateStats();
      this.loading = false;
    });

    // Load data
    this.dashboardService.loadRecentMaintenance();
  }

  private calculateStats(): void {
    if (this.recentMaintenance.length === 0) {
      this.totalCost = 0;
      this.averageCost = 0;
      return;
    }

    this.totalCost = this.recentMaintenance.reduce((sum, record) => sum + record.cost, 0);
    this.averageCost = this.totalCost / this.recentMaintenance.length;
  }

  onRowClick(item: any): void {
    console.log('Row clicked:', item);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDateAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }
}