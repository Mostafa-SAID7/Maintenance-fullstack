import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { MainLayoutComponent } from '../../layout/main-layout/main-layout.component';

export const carRoutes: Routes = [
  {
    path: 'cars',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./components/car-list/car-list.component').then(m => m.CarListComponent),
        data: { 
          title: 'Cars - Car Maintenance System',
          description: 'Manage your vehicle fleet'
        }
      },
      {
        path: 'add',
        loadComponent: () => import('./components/car-form/car-form.component').then(m => m.CarFormComponent),
        data: { 
          title: 'Add Car - Car Maintenance System',
          description: 'Add a new car to your fleet'
        }
      },
      {
        path: ':id',
        loadComponent: () => import('./components/car-details/car-details.component').then(m => m.CarDetailsComponent),
        data: { 
          title: 'Car Details - Car Maintenance System',
          description: 'View car details and maintenance history'
        }
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./components/car-form/car-form.component').then(m => m.CarFormComponent),
        data: { 
          title: 'Edit Car - Car Maintenance System',
          description: 'Edit car information'
        }
      }
    ]
  },
  
  // Redirects and defaults
  {
    path: '',
    redirectTo: 'cars',
    pathMatch: 'full'
  }
];

/**
 * Cars Module Route Configuration
 * 
 * This module defines all car-related routes for the Angular 19 application.
 * 
 * Features:
 * - Protected routes requiring authentication
 * - Lazy-loaded components for better performance
 * - SEO-friendly route data for meta tags
 * - Proper route guards for security
 * 
 * Route Structure:
 * /cars - Car list (requires authentication)
 * /cars/add - Add new car form (requires authentication)
 * /cars/:id - Car details view (requires authentication)
 * /cars/:id/edit - Edit car form (requires authentication)
 * 
 * Security:
 * - AuthGuard protects all car-related routes
 * - User authentication verification required
 * - Role-based access can be added if needed
 * 
 * Performance:
 * - Lazy loading reduces initial bundle size
 * - Components loaded on-demand
 * - Proper error handling for failed routes
 * 
 * SEO Optimization:
 * - Title and description for each route
 * - Meta tags can be set based on route data
 * - Proper breadcrumb support via breadcrumbs service
 * 
 * Usage:
 * Import this configuration in app.routes.ts:
 * 
 * import { carRoutes } from './features/cars/routes';
 * 
 * const routes: Routes = [
 *   ...carRoutes,
 *   // other routes
 * ];
 */