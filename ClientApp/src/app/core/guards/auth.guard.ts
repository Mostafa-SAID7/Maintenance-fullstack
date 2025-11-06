import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAuth(route, state);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAuth(childRoute, state);
  }

  private checkAuth(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      map(user => {
        if (user && user.isActive) {
          // Check for required permissions if specified in route data
          const requiredPermissions = route.data?.['permissions'] as string[];
          if (requiredPermissions && requiredPermissions.length > 0) {
            const hasPermissions = requiredPermissions.every(permission =>
              user.role === permission
            );
            
            if (!hasPermissions) {
              this.router.navigate(['/access-denied']);
              return false;
            }
          }

          // Check for required roles if specified in route data
          const requiredRoles = route.data?.['roles'] as string[];
          if (requiredRoles && requiredRoles.length > 0) {
            const hasRole = requiredRoles.includes(user.role);
            
            if (!hasRole) {
              this.router.navigate(['/access-denied']);
              return false;
            }
          }

          return true;
        } else if (user && !user.isActive) {
          this.router.navigate(['/account-suspended']);
          return false;
        } else {
          // Store the attempted URL for redirecting after login
          sessionStorage.setItem('redirectUrl', state.url);
          this.router.navigate(['/auth/login']);
          return false;
        }
      }),
      catchError(() => {
        // Handle authentication errors
        sessionStorage.setItem('redirectUrl', state.url);
        this.router.navigate(['/auth/login']);
        return of(false);
      })
    );
  }
}