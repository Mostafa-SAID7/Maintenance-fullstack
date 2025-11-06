export interface DashboardStats {
  totalCars: number;
  activeMaintenanceRecords: number;
  upcomingReminders: number;
  totalMaintenanceCost: number;
  averageMileage: number;
  carsRequiringMaintenance: number;
  completedMaintenanceThisMonth: number;
  fuelEfficiency: number;
  serviceProvidersCount: number;
}

export interface RecentMaintenance {
  id: string;
  carId: string;
  carName: string;
  serviceType: string;
  date: Date;
  cost: number;
  status: 'completed' | 'pending' | 'in-progress';
  serviceProvider?: string;
}

export interface UpcomingReminder {
  id: string;
  carId: string;
  carName: string;
  reminderType: 'maintenance' | 'inspection' | 'insurance' | 'registration';
  title: string;
  dueDate: Date;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  estimatedCost?: number;
}

export interface MaintenanceTrend {
  period: string;
  totalCost: number;
  maintenanceCount: number;
  averageCost: number;
}

export interface PredictiveInsight {
  id: string;
  carId: string;
  carName: string;
  insightType: 'cost_prediction' | 'maintenance_forecast' | 'performance_alert' | 'efficiency_analysis';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'alert';
  predictedDate?: Date;
  predictedCost?: number;
  confidence: number; // 0-100%
  recommendations: string[];
}

export interface MaintenanceStats {
  totalCostByMonth: MaintenanceTrend[];
  costByServiceType: Array<{
    serviceType: string;
    totalCost: number;
    count: number;
    averageCost: number;
  }>;
  fuelEfficiencyTrend: Array<{
    period: string;
    efficiency: number;
    cost: number;
  }>;
  maintenanceFrequency: Array<{
    period: string;
    frequency: number;
  }>;
}

export interface OverviewCard {
  id: string;
  title: string;
  value: number | string;
  previousValue?: number | string;
  change?: number; // percentage change
  icon: string;
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'indigo';
  description?: string;
  trend?: 'up' | 'down' | 'stable';
}