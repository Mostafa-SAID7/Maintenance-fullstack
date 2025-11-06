import { Routes } from '@angular/router';

// Import route configurations from feature modules
import { dashboardRoutes } from '../features/dashboard/routes';
import { carRoutes } from '../features/cars/routes';

// Import auth routes (to be created)
// import { authRoutes } from '../auth/routes';

// Import guards
import { AuthGuard } from '../core/guards/auth.guard';
import { RoleGuard } from '../core/guards/role.guard';

// Define application routes
export const routes: Routes = [
  // Redirect root to dashboard
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  
  // Auth routes (public routes)
  // ...authRoutes,
  
  // Dashboard route (protected)
  ...dashboardRoutes,
  
  // Cars routes (protected)
  ...carRoutes,
  
  // Catch-all route for 404
  {
    path: '**',
    loadComponent: () => import('../shared/components/ui/not-found/not-found.component')
      .then(m => m.NotFoundComponent)
  }
];