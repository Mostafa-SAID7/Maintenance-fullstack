import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-upcoming-reminders',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="upcoming-reminders-container p-6">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Upcoming Reminders</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          Stay on top of important maintenance and service deadlines
        </p>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>

      <!-- Content -->
      <div *ngIf="!loading" class="upcoming-reminders-content">
        <!-- Filter Tabs -->
        <div class="flex space-x-1 mb-6">
          <button 
            *ngFor="let urgency of urgencyLevels" 
            [class]="getUrgencyTabClass(urgency)"
            (click)="selectedUrgency = urgency">
            {{ urgency | titlecase }}
            <span *ngIf="getRemindersByUrgency(urgency).length > 0" 
                  class="ml-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full px-2 py-0.5 text-xs">
              {{ getRemindersByUrgency(urgency).length }}
            </span>
          </button>
        </div>

        <!-- Reminders Grid -->
        <div *ngIf="filteredReminders.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div *ngFor="let reminder of filteredReminders" class="card">
            <div class="card-body">
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center">
                  <div [ngClass]="getUrgencyIndicatorClass(reminder.urgency)" class="w-3 h-3 rounded-full mr-3"></div>
                  <span [ngClass]="getReminderTypeClass(reminder.reminderType)" class="text-xs font-medium px-2 py-1 rounded-full">
                    {{ reminder.reminderType | titlecase }}
                  </span>
                </div>
                <span [ngClass]="getUrgencyTextClass(reminder.urgency)" class="text-xs font-medium">
                  {{ getUrgencyLabel(reminder.urgency) }}
                </span>
              </div>
              
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">{{ reminder.title }}</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">{{ reminder.carName }}</p>
              
              <div class="space-y-2 text-sm">
                <div class="flex items-center text-gray-500 dark:text-gray-400">
                  <i class="fas fa-calendar-alt w-4 mr-2"></i>
                  Due: {{ reminder.dueDate | date:'mediumDate' }}
                </div>
                <div class="flex items-center text-gray-500 dark:text-gray-400">
                  <i class="fas fa-clock w-4 mr-2"></i>
                  {{ formatDateAgo(reminder.dueDate) }}
                </div>
                <div *ngIf="reminder.estimatedCost" class="flex items-center text-gray-500 dark:text-gray-400">
                  <i class="fas fa-dollar-sign w-4 mr-2"></i>
                  Est. Cost: {{ formatCurrency(reminder.estimatedCost) }}
                </div>
              </div>
              
              <div class="flex space-x-2 mt-4">
                <button class="btn btn-sm btn-primary flex-1">
                  <i class="fas fa-check mr-1"></i>
                  Mark Complete
                </button>
                <button class="btn btn-sm btn-secondary">
                  <i class="fas fa-edit"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="filteredReminders.length === 0" class="text-center py-12">
          <i class="fas fa-bell text-6xl text-gray-400 mb-4"></i>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No reminders found</h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            {{ selectedUrgency === 'all' ? 'You have no upcoming reminders at this time.' : 'No ' + selectedUrgency + ' priority reminders found.' }}
          </p>
          <button class="btn btn-primary">
            <i class="fas fa-plus mr-2"></i>
            Add Reminder
          </button>
        </div>

        <!-- Summary Cards -->
        <div *ngIf="upcomingReminders.length > 0" class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <div class="card">
            <div class="card-body text-center">
              <i class="fas fa-exclamation-circle text-2xl text-red-500 mb-2"></i>
              <h4 class="text-lg font-semibold text-gray-900 dark:text-white">Critical</h4>
              <p class="text-2xl font-bold text-red-600">{{ getRemindersByUrgency('critical').length }}</p>
            </div>
          </div>
          
          <div class="card">
            <div class="card-body text-center">
              <i class="fas fa-exclamation-triangle text-2xl text-orange-500 mb-2"></i>
              <h4 class="text-lg font-semibold text-gray-900 dark:text-white">High</h4>
              <p class="text-2xl font-bold text-orange-600">{{ getRemindersByUrgency('high').length }}</p>
            </div>
          </div>
          
          <div class="card">
            <div class="card-body text-center">
              <i class="fas fa-info-circle text-2xl text-yellow-500 mb-2"></i>
              <h4 class="text-lg font-semibold text-gray-900 dark:text-white">Medium</h4>
              <p class="text-2xl font-bold text-yellow-600">{{ getRemindersByUrgency('medium').length }}</p>
            </div>
          </div>
          
          <div class="card">
            <div class="card-body text-center">
              <i class="fas fa-check-circle text-2xl text-green-500 mb-2"></i>
              <h4 class="text-lg font-semibold text-gray-900 dark:text-white">Low</h4>
              <p class="text-2xl font-bold text-green-600">{{ getRemindersByUrgency('low').length }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .upcoming-reminders-container {
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
export class UpcomingRemindersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  loading = true;
  upcomingReminders: any[] = [];
  selectedUrgency = 'all';
  urgencyLevels = ['all', 'critical', 'high', 'medium', 'low'];

  get filteredReminders(): any[] {
    if (this.selectedUrgency === 'all') {
      return this.upcomingReminders;
    }
    return this.getRemindersByUrgency(this.selectedUrgency);
  }

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadUpcomingReminders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUpcomingReminders(): void {
    this.loading = true;
    
    this.dashboardService.upcomingReminders$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(reminders => {
      this.upcomingReminders = reminders.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
      this.loading = false;
    });

    // Load data
    this.dashboardService.loadUpcomingReminders();
  }

  getRemindersByUrgency(urgency: string): any[] {
    return this.upcomingReminders.filter(reminder => reminder.urgency === urgency);
  }

  getUrgencyTabClass(urgency: string): string {
    const baseClass = 'tab';
    const isActive = this.selectedUrgency === urgency;
    return isActive ? `${baseClass} active` : baseClass;
  }

  getUrgencyIndicatorClass(urgency: string): string {
    const colors = {
      critical: 'bg-red-500',
      high: 'bg-red-400',
      medium: 'bg-yellow-400',
      low: 'bg-green-400'
    };
    return colors[urgency as keyof typeof colors] || 'bg-gray-400';
  }

  getUrgencyTextClass(urgency: string): string {
    const colors = {
      critical: 'text-red-600 dark:text-red-400',
      high: 'text-orange-600 dark:text-orange-400',
      medium: 'text-yellow-600 dark:text-yellow-400',
      low: 'text-green-600 dark:text-green-400'
    };
    return colors[urgency as keyof typeof colors] || 'text-gray-600 dark:text-gray-400';
  }

  getReminderTypeClass(type: string): string {
    const colors = {
      maintenance: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      inspection: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      insurance: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      registration: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }

  getUrgencyLabel(urgency: string): string {
    const labels = {
      critical: 'Critical',
      high: 'High',
      medium: 'Medium',
      low: 'Low'
    };
    return labels[urgency as keyof typeof labels] || urgency;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDateAgo(date: Date): string {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `In ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `In ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else if (diffMinutes > 0) {
      return `In ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    } else {
      return 'Due now';
    }
  }
}