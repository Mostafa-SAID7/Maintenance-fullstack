import { Routes } from '@angular/router';
import { AuthGuard } from '../core/guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { ProfileComponent } from './components/profile/profile.component';
import { MainLayoutComponent } from '../layout/main-layout/main-layout.component';

export const authRoutes: Routes = [
  // Authentication routes (without main layout)
  {
    path: '',
    children: [
      {
        path: 'login',
        component: LoginComponent,
        data: { 
          title: 'Sign In - Car Maintenance System',
          description: 'Sign in to your Car Maintenance System account'
        }
      },
      {
        path: 'register',
        component: RegisterComponent,
        data: { 
          title: 'Create Account - Car Maintenance System',
          description: 'Create a new Car Maintenance System account'
        }
      },
      {
        path: 'forgot-password',
        component: ForgotPasswordComponent,
        data: { 
          title: 'Forgot Password - Car Maintenance System',
          description: 'Request a password reset for your Car Maintenance System account'
        }
      },
      {
        path: 'reset-password',
        component: ResetPasswordComponent,
        data: { 
          title: 'Reset Password - Car Maintenance System',
          description: 'Reset your Car Maintenance System password'
        }
      }
    ]
  },
  
  // Protected profile route (with main layout)
  {
    path: 'profile',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        component: ProfileComponent,
        data: { 
          title: 'Profile Settings - Car Maintenance System',
          description: 'Manage your profile settings and account preferences'
        }
      }
    ]
  },
  
  // Redirects and defaults
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];

/**
 * Authentication Route Configuration
 * 
 * This module defines all authentication-related routes for the Angular 19 application.
 * 
 * Features:
 * - Public authentication routes (login, register, forgot-password, reset-password)
 * - Protected profile route requiring authentication
 * - SEO-friendly route data for meta tags
 * - Proper route guards for protected pages
 * - Clean separation of public and protected routes
 * 
 * Route Structure:
 * /auth/login - Public login page
 * /auth/register - Public registration page  
 * /auth/forgot-password - Public password reset request
 * /auth/reset-password - Public password reset form (with token)
 * /auth/profile - Protected user profile page (requires authentication)
 * 
 * Security:
 * - AuthGuard protects sensitive routes
 * - Token validation for password reset
 * - Automatic redirects for authenticated users
 * - Proper error handling for invalid routes
 * 
 * SEO Optimization:
 * - Title and description for each route
 * - Meta tags can be set based on route data
 * - Proper breadcrumb support
 * 
 * Usage:
 * Import this configuration in app.routes.ts:
 * 
 * import { authRoutes } from './auth/auth.routes';
 * 
 * const routes: Routes = [
 *   ...authRoutes,
 *   // other routes
 * ];
 */