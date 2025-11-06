import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, map, catchError, of } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { 
  DashboardStats, 
  RecentMaintenance, 
  UpcomingReminder, 
  PredictiveInsight,
  MaintenanceStats,
  OverviewCard 
} from './models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private statsSubject = new BehaviorSubject<DashboardStats | null>(null);
  private recentMaintenanceSubject = new BehaviorSubject<RecentMaintenance[]>([]);
  private upcomingRemindersSubject = new BehaviorSubject<UpcomingReminder[]>([]);
  private predictiveInsightsSubject = new BehaviorSubject<PredictiveInsight[]>([]);
  private maintenanceStatsSubject = new BehaviorSubject<MaintenanceStats | null>(null);
  private overviewCardsSubject = new BehaviorSubject<OverviewCard[]>([]);

  public stats$ = this.statsSubject.asObservable();
  public recentMaintenance$ = this.recentMaintenanceSubject.asObservable();
  public upcomingReminders$ = this.upcomingRemindersSubject.asObservable();
  public predictiveInsights$ = this.predictiveInsightsSubject.asObservable();
  public maintenanceStats$ = this.maintenanceStatsSubject.asObservable();
  public overviewCards$ = this.overviewCardsSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.loadDashboardData();
  }

  /**
   * Loads all dashboard data
   */
  loadDashboardData(): void {
    this.loadStats();
    this.loadRecentMaintenance();
    this.loadUpcomingReminders();
    this.loadPredictiveInsights();
    this.loadMaintenanceStats();
  }

  /**
   * Gets dashboard statistics
   */
  loadStats(): Observable<DashboardStats> {
    return this.apiService.get('/dashboard/stats').pipe(
      map((response: any) => response.data as DashboardStats),
      catchError(error => {
        console.error('Error loading dashboard stats:', error);
        return of(this.getMockStats());
      })
    );
  }

  /**
   * Gets recent maintenance records
   */
  loadRecentMaintenance(): Observable<RecentMaintenance[]> {
    return this.apiService.get('/dashboard/recent-maintenance').pipe(
      map((response: any) => {
        const data = response.data as RecentMaintenance[];
        return data.map(item => ({
          ...item,
          date: new Date(item.date)
        }));
      }),
      catchError(error => {
        console.error('Error loading recent maintenance:', error);
        return of(this.getMockRecentMaintenance());
      })
    );
  }

  /**
   * Gets upcoming reminders
   */
  loadUpcomingReminders(): Observable<UpcomingReminder[]> {
    return this.apiService.get('/dashboard/upcoming-reminders').pipe(
      map((response: any) => {
        const data = response.data as UpcomingReminder[];
        return data.map(item => ({
          ...item,
          dueDate: new Date(item.dueDate)
        }));
      }),
      catchError(error => {
        console.error('Error loading upcoming reminders:', error);
        return of(this.getMockUpcomingReminders());
      })
    );
  }

  /**
   * Gets predictive insights
   */
  loadPredictiveInsights(): Observable<PredictiveInsight[]> {
    return this.apiService.get('/dashboard/predictive-insights').pipe(
      map((response: any) => {
        const data = response.data as PredictiveInsight[];
        return data.map(item => ({
          ...item,
          predictedDate: item.predictedDate ? new Date(item.predictedDate) : undefined
        }));
      }),
      catchError(error => {
        console.error('Error loading predictive insights:', error);
        return of(this.getMockPredictiveInsights());
      })
    );
  }

  /**
   * Gets maintenance statistics
   */
  loadMaintenanceStats(): Observable<MaintenanceStats> {
    return this.apiService.get('/dashboard/maintenance-stats').pipe(
      map((response: any) => response.data as MaintenanceStats),
      catchError(error => {
        console.error('Error loading maintenance stats:', error);
        return of(this.getMockMaintenanceStats());
      })
    );
  }

  /**
   * Refreshes dashboard data
   */
  refreshDashboard(): void {
    this.loadDashboardData();
  }

  /**
   * Gets cars requiring maintenance
   */
  getCarsRequiringMaintenance(): Observable<any[]> {
    return this.apiService.get('/dashboard/cars-requiring-maintenance').pipe(
      map((response: any) => response.data),
      catchError(error => {
        console.error('Error loading cars requiring maintenance:', error);
        return of([]);
      })
    );
  }

  /**
   * Gets maintenance cost trend
   */
  getMaintenanceCostTrend(period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Observable<any[]> {
    return this.apiService.get(`/dashboard/cost-trend?period=${period}`).pipe(
      map((response: any) => response.data),
      catchError(error => {
        console.error('Error loading maintenance cost trend:', error);
        return of([]);
      })
    );
  }

  /**
   * Gets service performance metrics
   */
  getServicePerformanceMetrics(): Observable<any[]> {
    return this.apiService.get('/dashboard/service-performance').pipe(
      map((response: any) => response.data),
      catchError(error => {
        console.error('Error loading service performance:', error);
        return of([]);
      })
    );
  }

  /**
   * Creates overview cards from stats
   */
  createOverviewCards(stats: DashboardStats): OverviewCard[] {
    return [
      {
        id: 'total-cars',
        title: 'Total Cars',
        value: stats.totalCars,
        icon: 'fas fa-car',
        color: 'blue',
        description: 'Registered vehicles'
      },
      {
        id: 'active-maintenance',
        title: 'Active Maintenance',
        value: stats.activeMaintenanceRecords,
        icon: 'fas fa-tools',
        color: 'orange',
        description: 'Ongoing services'
      },
      {
        id: 'upcoming-reminders',
        title: 'Upcoming Reminders',
        value: stats.upcomingReminders,
        icon: 'fas fa-bell',
        color: 'red',
        description: 'Due within 30 days'
      },
      {
        id: 'total-maintenance-cost',
        title: 'Maintenance Cost',
        value: this.formatCurrency(stats.totalMaintenanceCost),
        icon: 'fas fa-dollar-sign',
        color: 'green',
        description: 'This month',
        trend: 'stable'
      },
      {
        id: 'average-mileage',
        title: 'Average Mileage',
        value: `${stats.averageMileage.toLocaleString()} mi`,
        icon: 'fas fa-tachometer-alt',
        color: 'purple',
        description: 'Across all vehicles'
      },
      {
        id: 'fuel-efficiency',
        title: 'Fuel Efficiency',
        value: `${stats.fuelEfficiency.toFixed(1)} MPG`,
        icon: 'fas fa-gas-pump',
        color: 'indigo',
        description: 'Average efficiency'
      }
    ];
  }

  /**
   * Filters insights by severity
   */
  filterInsightsBySeverity(severity: 'info' | 'warning' | 'alert'): Observable<PredictiveInsight[]> {
    return this.predictiveInsights$.pipe(
      map(insights => insights.filter(insight => insight.severity === severity))
    );
  }

  /**
   * Gets critical alerts
   */
  getCriticalAlerts(): Observable<PredictiveInsight[]> {
    return this.predictiveInsights$.pipe(
      map(insights => insights.filter(insight => insight.severity === 'alert'))
    );
  }

  /**
   * Exports dashboard data
   */
  exportDashboardData(format: 'pdf' | 'excel' = 'pdf'): Observable<Blob> {
    return this.apiService.get(`/dashboard/export?format=${format}`, { responseType: 'blob' });
  }

  /**
   * Schedules dashboard data refresh
   */
  scheduleRefresh(interval: number = 300000): void { // 5 minutes default
    setInterval(() => {
      this.refreshDashboard();
    }, interval);
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  // Mock data methods for development/testing
  private getMockStats(): DashboardStats {
    return {
      totalCars: 12,
      activeMaintenanceRecords: 5,
      upcomingReminders: 8,
      totalMaintenanceCost: 2850.50,
      averageMileage: 45000,
      carsRequiringMaintenance: 3,
      completedMaintenanceThisMonth: 18,
      fuelEfficiency: 24.5,
      serviceProvidersCount: 15
    };
  }

  private getMockRecentMaintenance(): RecentMaintenance[] {
    return [
      {
        id: '1',
        carId: 'car1',
        carName: '2020 Toyota Camry',
        serviceType: 'Oil Change',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        cost: 45.99,
        status: 'completed',
        serviceProvider: 'Quick Lube'
      },
      {
        id: '2',
        carId: 'car2',
        carName: '2019 Honda Accord',
        serviceType: 'Brake Inspection',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        cost: 125.50,
        status: 'completed',
        serviceProvider: 'AutoCare Center'
      }
    ];
  }

  private getMockUpcomingReminders(): UpcomingReminder[] {
    return [
      {
        id: '1',
        carId: 'car1',
        carName: '2020 Toyota Camry',
        reminderType: 'maintenance',
        title: 'Oil Change Due',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        urgency: 'medium',
        estimatedCost: 50
      },
      {
        id: '2',
        carId: 'car3',
        carName: '2021 Ford F-150',
        reminderType: 'inspection',
        title: 'Annual Safety Inspection',
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        urgency: 'low',
        estimatedCost: 25
      }
    ];
  }

  private getMockPredictiveInsights(): PredictiveInsight[] {
    return [
      {
        id: '1',
        carId: 'car1',
        carName: '2020 Toyota Camry',
        insightType: 'maintenance_forecast',
        title: 'Brake Service Predicted',
        description: 'Based on current driving patterns and mileage, brake service may be needed within 2 months.',
        severity: 'warning',
        predictedDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        predictedCost: 250,
        confidence: 78,
        recommendations: [
          'Schedule brake inspection within the next month',
          'Monitor brake pad wear more frequently',
          'Consider brake fluid change'
        ]
      }
    ];
  }

  private getMockMaintenanceStats(): MaintenanceStats {
    return {
      totalCostByMonth: [
        { period: 'Jan', totalCost: 1250, maintenanceCount: 8, averageCost: 156.25 },
        { period: 'Feb', totalCost: 980, maintenanceCount: 6, averageCost: 163.33 },
        { period: 'Mar', totalCost: 1450, maintenanceCount: 9, averageCost: 161.11 }
      ],
      costByServiceType: [
        { serviceType: 'Oil Change', totalCost: 450, count: 12, averageCost: 37.50 },
        { serviceType: 'Brake Service', totalCost: 850, count: 3, averageCost: 283.33 },
        { serviceType: 'Tire Rotation', totalCost: 300, count: 6, averageCost: 50.00 }
      ],
      fuelEfficiencyTrend: [
        { period: 'Jan', efficiency: 24.2, cost: 180 },
        { period: 'Feb', efficiency: 23.8, cost: 175 },
        { period: 'Mar', efficiency: 24.5, cost: 185 }
      ],
      maintenanceFrequency: [
        { period: 'Jan', frequency: 8 },
        { period: 'Feb', frequency: 6 },
        { period: 'Mar', frequency: 9 }
      ]
    };
  }
}