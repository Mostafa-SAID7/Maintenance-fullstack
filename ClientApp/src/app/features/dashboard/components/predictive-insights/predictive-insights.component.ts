import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-predictive-insights',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="predictive-insights-container p-6">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Predictive Insights</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          AI-powered predictions to help you stay ahead of maintenance needs
        </p>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>

      <!-- Content -->
      <div *ngIf="!loading" class="predictive-insights-content">
        <!-- Filter Tabs -->
        <div class="flex space-x-1 mb-6">
          <button 
            *ngFor="let severity of severityLevels" 
            [class]="getSeverityTabClass(severity)"
            (click)="selectedSeverity = severity">
            {{ severity | titlecase }}
            <span *ngIf="getInsightsBySeverity(severity).length > 0" 
                  class="ml-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full px-2 py-0.5 text-xs">
              {{ getInsightsBySeverity(severity).length }}
            </span>
          </button>
        </div>

        <!-- Insights List -->
        <div *ngIf="filteredInsights.length > 0" class="space-y-6">
          <div *ngFor="let insight of filteredInsights" 
               [ngClass]="getInsightCardClass(insight.severity)" 
               class="border rounded-lg p-6">
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center">
                <div [ngClass]="getInsightIconClass(insight.severity)" class="w-8 h-8 rounded-full flex items-center justify-center mr-3">
                  <i [class]="getInsightIcon(insight.insightType)"></i>
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ insight.title }}</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">{{ insight.carName }}</p>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <span [ngClass]="getConfidenceClass(insight.confidence)" class="text-xs font-medium px-2 py-1 rounded-full">
                  {{ insight.confidence }}% Confidence
                </span>
                <span [ngClass]="getSeverityBadgeClass(insight.severity)" class="text-xs font-medium px-2 py-1 rounded-full">
                  {{ insight.severity | titlecase }}
                </span>
              </div>
            </div>
            
            <p class="text-gray-700 dark:text-gray-300 mb-4">{{ insight.description }}</p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div *ngIf="insight.predictedDate" class="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <i class="fas fa-calendar-alt w-4 mr-2"></i>
                Predicted: {{ insight.predictedDate | date:'mediumDate' }}
              </div>
              <div *ngIf="insight.predictedCost" class="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <i class="fas fa-dollar-sign w-4 mr-2"></i>
                Estimated Cost: {{ formatCurrency(insight.predictedCost) }}
              </div>
            </div>
            
            <div *ngIf="insight.recommendations.length > 0" class="mb-4">
              <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Recommendations:</h4>
              <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li *ngFor="let recommendation of insight.recommendations" class="flex items-start">
                  <i class="fas fa-lightbulb text-yellow-500 w-4 mr-2 mt-0.5 flex-shrink-0"></i>
                  {{ recommendation }}
                </li>
              </ul>
            </div>
            
            <div class="flex space-x-2">
              <button class="btn btn-sm btn-primary">
                <i class="fas fa-eye mr-1"></i>
                View Details
              </button>
              <button class="btn btn-sm btn-secondary">
                <i class="fas fa-calendar-plus mr-1"></i>
                Schedule Service
              </button>
              <button class="btn btn-sm btn-secondary">
                <i class="fas fa-dismiss mr-1"></i>
                Dismiss
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="filteredInsights.length === 0" class="text-center py-12">
          <i class="fas fa-brain text-6xl text-gray-400 mb-4"></i>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No insights found</h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            {{ selectedSeverity === 'all' ? 'No predictive insights available at this time.' : 'No ' + selectedSeverity + ' severity insights found.' }}
          </p>
          <button class="btn btn-primary">
            <i class="fas fa-refresh mr-2"></i>
            Refresh Insights
          </button>
        </div>

        <!-- Summary Cards -->
        <div *ngIf="predictiveInsights.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div class="card">
            <div class="card-body text-center">
              <i class="fas fa-exclamation-circle text-2xl text-red-500 mb-2"></i>
              <h4 class="text-lg font-semibold text-gray-900 dark:text-white">Alert Insights</h4>
              <p class="text-2xl font-bold text-red-600">{{ getInsightsBySeverity('alert').length }}</p>
            </div>
          </div>
          
          <div class="card">
            <div class="card-body text-center">
              <i class="fas fa-exclamation-triangle text-2xl text-yellow-500 mb-2"></i>
              <h4 class="text-lg font-semibold text-gray-900 dark:text-white">Warning Insights</h4>
              <p class="text-2xl font-bold text-yellow-600">{{ getInsightsBySeverity('warning').length }}</p>
            </div>
          </div>
          
          <div class="card">
            <div class="card-body text-center">
              <i class="fas fa-info-circle text-2xl text-blue-500 mb-2"></i>
              <h4 class="text-lg font-semibold text-gray-900 dark:text-white">Info Insights</h4>
              <p class="text-2xl font-bold text-blue-600">{{ getInsightsBySeverity('info').length }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .predictive-insights-container {
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

    .card-body {
      @apply p-6;
    }

    .tab {
      @apply px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200;
    }

    .tab.active {
      @apply bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300;
    }

    .tab:not(.active) {
      @apply bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600;
    }
  `]
})
export class PredictiveInsightsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  loading = true;
  predictiveInsights: any[] = [];
  selectedSeverity = 'all';
  severityLevels = ['all', 'alert', 'warning', 'info'];

  get filteredInsights(): any[] {
    if (this.selectedSeverity === 'all') {
      return this.predictiveInsights;
    }
    return this.getInsightsBySeverity(this.selectedSeverity);
  }

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadPredictiveInsights();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadPredictiveInsights(): void {
    this.loading = true;
    
    this.dashboardService.predictiveInsights$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(insights => {
      this.predictiveInsights = insights.sort((a, b) => b.confidence - a.confidence);
      this.loading = false;
    });

    // Load data
    this.dashboardService.loadPredictiveInsights();
  }

  getInsightsBySeverity(severity: string): any[] {
    return this.predictiveInsights.filter(insight => insight.severity === severity);
  }

  getSeverityTabClass(severity: string): string {
    const baseClass = 'tab';
    const isActive = this.selectedSeverity === severity;
    return isActive ? `${baseClass} active` : baseClass;
  }

  getInsightCardClass(severity: string): string {
    const classes = {
      alert: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20',
      warning: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20',
      info: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
    };
    return classes[severity as keyof typeof classes] || 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20';
  }

  getInsightIconClass(severity: string): string {
    const classes = {
      alert: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400',
      warning: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400',
      info: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
    };
    return classes[severity as keyof typeof classes] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
  }

  getInsightIcon(type: string): string {
    const icons = {
      cost_prediction: 'fas fa-dollar-sign',
      maintenance_forecast: 'fas fa-tools',
      performance_alert: 'fas fa-exclamation-triangle',
      efficiency_analysis: 'fas fa-chart-line'
    };
    return icons[type as keyof typeof icons] || 'fas fa-info-circle';
  }

  getConfidenceClass(confidence: number): string {
    if (confidence >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  }

  getSeverityBadgeClass(severity: string): string {
    const classes = {
      alert: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    };
    return classes[severity as keyof typeof classes] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}