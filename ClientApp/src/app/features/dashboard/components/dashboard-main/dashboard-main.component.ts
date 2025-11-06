import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingSpinnerComponent } from '../../../../shared/components/ui/loading-spinner/loading-spinner.component';
import { DateAgoPipe } from '../../../../shared/pipes/date-ago.pipe';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardStats } from '../../models/dashboard.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard-main',
  standalone: true,
  imports: [
    CommonModule,
    LoadingSpinnerComponent,
    DateAgoPipe,
    CurrencyFormatPipe
  ],
  template: `
    <div class="dashboard-container p-6">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          Welcome back! Here's what's happening with your vehicles.
        </p>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex justify-center items-center h-64">
        <app-loading-spinner size="large"></app-loading-spinner>
      </div>

      <!-- Dashboard Content -->
      <div *ngIf="!loading" class="dashboard-content">
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <div *ngFor="let card of overviewCards" class="stats-card">
            <div class="card" [ngClass]="'card-' + card.color">
              <div class="card-body">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i [class]="card.icon" class="text-2xl"></i>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">{{ card.title }}</p>
                    <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ card.value }}</p>
                    <p *ngIf="card.description" class="text-xs text-gray-500 dark:text-gray-400">{{ card.description }}</p>
                  </div>
                </div>
                <div *ngIf="card.change" class="mt-2">
                  <span [ngClass]="{
                    'text-green-600': card.trend === 'up',
                    'text-red-600': card.trend === 'down',
                    'text-gray-600': card.trend === 'stable'
                  }" class="text-sm font-medium">
                    <i [class]="{
                      'fas fa-arrow-up': card.trend === 'up',
                      'fas fa-arrow-down': card.trend === 'down',
                      'fas fa-minus': card.trend === 'stable'
                    }"></i>
                    {{ card.change }}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <!-- Recent Maintenance -->
          <div class="lg:col-span-2">
            <div class="card">
              <div class="card-header">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Recent Maintenance</h3>
                <a routerLink="/dashboard/recent-maintenance" class="text-blue-600 hover:text-blue-800 text-sm">
                  View all
                </a>
              </div>
              <div class="card-body">
                <div *ngIf="recentMaintenance.length === 0" class="text-center py-8">
                  <i class="fas fa-tools text-4xl text-gray-400 mb-4"></i>
                  <p class="text-gray-500 dark:text-gray-400">No recent maintenance records</p>
                </div>
                <div *ngFor="let maintenance of recentMaintenance | slice:0:3" class="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">{{ maintenance.carName }}</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">{{ maintenance.serviceType }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-500">{{ maintenance.date | dateAgo }}</p>
                  </div>
                  <div class="text-right">
                    <p class="font-medium text-gray-900 dark:text-white">{{ maintenance.cost | currencyFormat }}</p>
                    <span [ngClass]="{
                      'bg-green-100 text-green-800': maintenance.status === 'completed',
                      'bg-yellow-100 text-yellow-800': maintenance.status === 'in-progress',
                      'bg-red-100 text-red-800': maintenance.status === 'pending'
                    }" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                      {{ maintenance.status | titlecase }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Upcoming Reminders -->
          <div>
            <div class="card">
              <div class="card-header">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Reminders</h3>
                <a routerLink="/dashboard/upcoming-reminders" class="text-blue-600 hover:text-blue-800 text-sm">
                  View all
                </a>
              </div>
              <div class="card-body">
                <div *ngIf="upcomingReminders.length === 0" class="text-center py-8">
                  <i class="fas fa-bell text-4xl text-gray-400 mb-4"></i>
                  <p class="text-gray-500 dark:text-gray-400">No upcoming reminders</p>
                </div>
                <div *ngFor="let reminder of upcomingReminders | slice:0:4" class="mb-4 last:mb-0">
                  <div class="flex items-start">
                    <div class="flex-shrink-0 w-3 h-3 rounded-full mt-2" 
                         [ngClass]="{
                           'bg-red-400': reminder.urgency === 'critical',
                           'bg-red-500': reminder.urgency === 'high',
                           'bg-yellow-400': reminder.urgency === 'medium',
                           'bg-green-400': reminder.urgency === 'low'
                         }"></div>
                    <div class="ml-3 flex-1">
                      <p class="text-sm font-medium text-gray-900 dark:text-white">{{ reminder.title }}</p>
                      <p class="text-xs text-gray-600 dark:text-gray-400">{{ reminder.carName }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-500">{{ reminder.dueDate | dateAgo }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Predictive Insights -->
        <div *ngIf="criticalInsights.length > 0" class="mb-8">
          <div class="card">
            <div class="card-header">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Critical Alerts</h3>
            </div>
            <div class="card-body">
              <div *ngFor="let insight of criticalInsights" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4 last:mb-0">
                <div class="flex items-start">
                  <div class="flex-shrink-0">
                    <i class="fas fa-exclamation-triangle text-red-600"></i>
                  </div>
                  <div class="ml-3">
                    <h4 class="text-sm font-medium text-red-800 dark:text-red-400">{{ insight.title }}</h4>
                    <p class="text-sm text-red-700 dark:text-red-300 mt-1">{{ insight.description }}</p>
                    <div class="mt-2">
                      <button class="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded mr-2">
                        View Details
                      </button>
                      <button class="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded">
                        Schedule Service
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .stats-card .card {
      transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    }

    .stats-card .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }

    .card-blue { border-left: 4px solid #3B82F6; }
    .card-green { border-left: 4px solid #10B981; }
    .card-orange { border-left: 4px solid #F59E0B; }
    .card-red { border-left: 4px solid #EF4444; }
    .card-purple { border-left: 4px solid #8B5CF6; }
    .card-indigo { border-left: 4px solid #6366F1; }

    .card {
      @apply bg-white dark:bg-gray-800 rounded-lg shadow-md;
      border-radius: 0.5rem;
    }

    .card-header {
      @apply px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center;
    }

    .card-body {
      @apply p-6;
    }

    .card-blue .card-body { @apply bg-blue-50/50 dark:bg-blue-900/20; }
    .card-green .card-body { @apply bg-green-50/50 dark:bg-green-900/20; }
    .card-orange .card-body { @apply bg-orange-50/50 dark:bg-orange-900/20; }
    .card-red .card-body { @apply bg-red-50/50 dark:bg-red-900/20; }
    .card-purple .card-body { @apply bg-purple-50/50 dark:bg-purple-900/20; }
    .card-indigo .card-body { @apply bg-indigo-50/50 dark:bg-indigo-900/20; }

    @media (max-width: 768px) {
      .dashboard-container {
        padding: 1rem;
      }
      
      .grid.grid-cols-6 {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class DashboardMainComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  loading = true;
  stats: DashboardStats | null = null;
  overviewCards: any[] = [];
  recentMaintenance: any[] = [];
  upcomingReminders: any[] = [];
  criticalInsights: any[] = [];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboardData(): void {
    this.loading = true;
    
    // Load all dashboard data
    this.dashboardService.stats$.pipe(takeUntil(this.destroy$)).subscribe(stats => {
      if (stats) {
        this.stats = stats;
        this.overviewCards = this.dashboardService.createOverviewCards(stats);
      }
    });

    this.dashboardService.recentMaintenance$.pipe(takeUntil(this.destroy$)).subscribe(maintenance => {
      this.recentMaintenance = maintenance;
    });

    this.dashboardService.upcomingReminders$.pipe(takeUntil(this.destroy$)).subscribe(reminders => {
      this.upcomingReminders = reminders;
    });

    this.dashboardService.getCriticalAlerts().pipe(takeUntil(this.destroy$)).subscribe(insights => {
      this.criticalInsights = insights;
    });

    // Trigger data loading
    this.dashboardService.loadDashboardData();
    
    // Set loading to false after a short delay
    setTimeout(() => {
      this.loading = false;
    }, 1000);
  }

  private setupSubscriptions(): void {
    // Setup auto-refresh every 5 minutes
    this.dashboardService.scheduleRefresh(300000);
  }
}