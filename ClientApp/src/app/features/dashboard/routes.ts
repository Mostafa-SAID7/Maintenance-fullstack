import { Routes } from '@angular/router';
import { DashboardMainComponent } from './components/dashboard-main/dashboard-main.component';
import { RecentMaintenanceComponent } from './components/recent-maintenance/recent-maintenance.component';
import { UpcomingRemindersComponent } from './components/upcoming-reminders/upcoming-reminders.component';
import { OverviewCardsComponent } from './components/overview-cards/overview-cards.component';
import { MaintenanceStatsComponent } from './components/maintenance-stats/maintenance-stats.component';
import { PredictiveInsightsComponent } from './components/predictive-insights/predictive-insights.component';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';

export const dashboardRoutes: Routes = [
  {
    path: '',
    component: DashboardMainComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { 
      title: 'Dashboard',
      breadcrumb: 'Dashboard'
    },
    children: [
      {
        path: 'overview',
        component: OverviewCardsComponent,
        canActivate: [AuthGuard],
        data: { 
          title: 'Dashboard Overview',
          breadcrumb: 'Overview'
        }
      },
      {
        path: 'recent-maintenance',
        component: RecentMaintenanceComponent,
        canActivate: [AuthGuard],
        data: { 
          title: 'Recent Maintenance',
          breadcrumb: 'Recent Maintenance'
        }
      },
      {
        path: 'reminders',
        component: UpcomingRemindersComponent,
        canActivate: [AuthGuard],
        data: { 
          title: 'Upcoming Reminders',
          breadcrumb: 'Reminders'
        }
      },
      {
        path: 'stats',
        component: MaintenanceStatsComponent,
        canActivate: [AuthGuard],
        data: { 
          title: 'Maintenance Statistics',
          breadcrumb: 'Statistics'
        }
      },
      {
        path: 'insights',
        component: PredictiveInsightsComponent,
        canActivate: [AuthGuard],
        data: { 
          title: 'Predictive Insights',
          breadcrumb: 'Insights'
        }
      },
      {
        path: '',
        redirectTo: 'overview',
        pathMatch: 'full'
      }
    ]
  }
];