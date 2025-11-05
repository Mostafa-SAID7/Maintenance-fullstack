import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    const user = this.authService.getCurrentUser();
    if (user && this.isAdmin(user)) {
      return true;
    } else {
      this.router.navigate(['/dashboard']);
      return false;
    }
  }

  private isAdmin(user: any): boolean {
    // Implement role checking logic
    // This would typically check user roles from JWT token or user claims
    return user.roles?.includes('Admin') || false;
  }
}