import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { User } from '../models/user.model';

export interface RoleGuardConfig {
  allowedRoles: string[];
  redirectTo?: string;
  denyMessage?: string;
  requireAll?: boolean; // If true, user must have ALL roles. If false, user must have ANY role.
}

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkRole(route, state);
  }

  private checkRole(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    // Get role configuration from route data or guard configuration
    const config = route.data?.['roleGuard'] as RoleGuardConfig || {
      allowedRoles: route.data?.['roles'] as string[] || [],
      redirectTo: '/access-denied'
    };

    if (!config.allowedRoles || config.allowedRoles.length === 0) {
      // No role restrictions, allow access
      return new Observable(observer => {
        observer.next(true);
        observer.complete();
      });
    }

    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (!user) {
          this.router.navigate(['/auth/login']);
          return false;
        }

        const hasAccess = config.requireAll 
          ? config.allowedRoles.every(role => this.hasRole(user, role))
          : config.allowedRoles.some(role => this.hasRole(user, role));

        if (!hasAccess) {
          console.warn(`Access denied for user ${user.email} to route ${state.url}. Required roles: ${config.allowedRoles.join(', ')}`);
          
          if (config.redirectTo) {
            this.router.navigate([config.redirectTo], {
              queryParams: { 
                returnUrl: state.url,
                reason: 'insufficient-role',
                requiredRoles: config.allowedRoles.join(',')
              }
            });
          }
          
          return false;
        }

        return true;
      })
    );
  }

  /**
   * Check if user has specific role
   */
  private hasRole(user: User, role: string): boolean {
    if (!user.role) {
      return false;
    }

    // Handle role hierarchies (e.g., Admin has all permissions of Manager)
    const roleHierarchy: { [key: string]: string[] } = {
      'SuperAdmin': ['Admin', 'Manager', 'User'],
      'Admin': ['Manager', 'User'],
      'Manager': ['User'],
      'User': []
    };

    const userRole = user.role;
    const requiredRole = role;

    // Exact match
    if (userRole === requiredRole) {
      return true;
    }

    // Check hierarchy
    const userHierarchy = roleHierarchy[userRole] || [];
    return userHierarchy.includes(requiredRole);
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(user: User, roles: string[]): boolean {
    return roles.some(role => this.hasRole(user, role));
  }

  /**
   * Check if user has all specified roles
   */
  hasAllRoles(user: User, roles: string[]): boolean {
    return roles.every(role => this.hasRole(user, role));
  }

  /**
   * Get user's role level (for hierarchical access)
   */
  getRoleLevel(role: string): number {
    const roleLevels: { [key: string]: number } = {
      'SuperAdmin': 4,
      'Admin': 3,
      'Manager': 2,
      'User': 1,
      'Guest': 0
    };

    return roleLevels[role] || 0;
  }

  /**
   * Check if user has minimum role level
   */
  hasMinimumRoleLevel(user: User, minimumRole: string): boolean {
    const userLevel = this.getRoleLevel(user.role);
    const requiredLevel = this.getRoleLevel(minimumRole);
    
    return userLevel >= requiredLevel;
  }

  /**
   * Get accessible roles for user
   */
  getAccessibleRoles(user: User): string[] {
    const roleHierarchy: { [key: string]: string[] } = {
      'SuperAdmin': ['SuperAdmin', 'Admin', 'Manager', 'User'],
      'Admin': ['Admin', 'Manager', 'User'],
      'Manager': ['Manager', 'User'],
      'User': ['User']
    };

    return roleHierarchy[user.role] || [user.role];
  }

  /**
   * Validate role configuration
   */
  validateRoleConfig(config: RoleGuardConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.allowedRoles || config.allowedRoles.length === 0) {
      errors.push('No allowed roles specified');
    }

    if (config.allowedRoles) {
      const validRoles = ['SuperAdmin', 'Admin', 'Manager', 'User', 'Guest'];
      const invalidRoles = config.allowedRoles.filter(role => !validRoles.includes(role));
      
      if (invalidRoles.length > 0) {
        errors.push(`Invalid roles specified: ${invalidRoles.join(', ')}`);
      }
    }

    if (config.redirectTo && !config.redirectTo.startsWith('/')) {
      errors.push('Redirect path must start with "/"');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create role guard configuration
   */
  static createConfig(
    allowedRoles: string[],
    options?: {
      redirectTo?: string;
      denyMessage?: string;
      requireAll?: boolean;
    }
  ): RoleGuardConfig {
    return {
      allowedRoles,
      redirectTo: options?.redirectTo || '/access-denied',
      denyMessage: options?.denyMessage,
      requireAll: options?.requireAll || false
    };
  }

  /**
   * Helper method to check role in templates/components
   */
  static hasRole(user: User | null, role: string): boolean {
    if (!user || !user.role) {
      return false;
    }

    const roleHierarchy: { [key: string]: string[] } = {
      'SuperAdmin': ['Admin', 'Manager', 'User'],
      'Admin': ['Manager', 'User'],
      'Manager': ['User'],
      'User': []
    };

    const userRole = user.role;
    const requiredRole = role;

    if (userRole === requiredRole) {
      return true;
    }

    const userHierarchy = roleHierarchy[userRole] || [];
    return userHierarchy.includes(requiredRole);
  }

  /**
   * Helper method to check multiple roles in templates/components
   */
  static hasAnyRole(user: User | null, roles: string[]): boolean {
    return roles.some(role => RoleGuard.hasRole(user, role));
  }

  /**
   * Helper method to check if user has all roles in templates/components
   */
  static hasAllRoles(user: User | null, roles: string[]): boolean {
    return roles.every(role => RoleGuard.hasRole(user, role));
  }
}