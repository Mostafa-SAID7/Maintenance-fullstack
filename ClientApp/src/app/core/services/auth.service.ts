import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { User } from '../models/user.model';
import { APP_CONSTANTS } from '../constants/app.constants';
import { STORAGE_KEYS } from '../constants/storage-keys.constants';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface TokenResponse {
  token: string;
  refreshToken: string;
  email: string;
  roles: string[];
  expiresAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadUserFromStorage();
  }

  /**
   * Login with email and password
   */
  login(credentials: LoginRequest): Observable<ApiResponse<TokenResponse>> {
    return this.http.post<ApiResponse<TokenResponse>>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.setAuthData(response.data);
            this.updateCurrentUser(response.data);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Register new user
   */
  register(userData: RegisterRequest): Observable<ApiResponse<TokenResponse>> {
    return this.http.post<ApiResponse<TokenResponse>>(`${this.apiUrl}/register`, userData)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.setAuthData(response.data);
            this.updateCurrentUser(response.data);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Refresh authentication token
   */
  refreshToken(): Observable<ApiResponse<TokenResponse>> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<ApiResponse<TokenResponse>>(`${this.apiUrl}/refresh`, {
      refreshToken
    }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setAuthData(response.data);
          this.updateCurrentUser(response.data);
        }
      }),
      catchError(error => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

  /**
   * Logout current user
   */
  logout(): void {
    this.clearAuthData();
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.roles?.includes(role) || false;
  }

  /**
   * Get authentication token
   */
  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Update user profile
   */
  updateProfile(userData: Partial<User>): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${environment.apiUrl}/users/profile`, userData)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.updateCurrentUserFromUser(response.data);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Change password
   */
  changePassword(currentPassword: string, newPassword: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/change-password`, {
      currentPassword,
      newPassword
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Request password reset
   */
  requestPasswordReset(email: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/forgot-password`, { email })
      .pipe(catchError(this.handleError));
  }

  /**
   * Reset password with token
   */
  resetPassword(token: string, newPassword: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/reset-password`, {
      token,
      newPassword
    }).pipe(catchError(this.handleError));
  }

  private setAuthData(tokenData: TokenResponse): void {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokenData.token);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokenData.refreshToken);
    localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, tokenData.expiresAt.toISOString());
    localStorage.setItem(STORAGE_KEYS.USER_EMAIL, tokenData.email);
  }

  private clearAuthData(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
    localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  private updateCurrentUser(tokenData: TokenResponse): void {
    const user: User = {
      id: '',
      email: tokenData.email,
      firstName: '',
      lastName: '',
      roles: tokenData.roles,
      isActive: true,
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.currentUserSubject.next(user);
  }

  private updateCurrentUserFromUser(user: User): void {
    this.currentUserSubject.next(user);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }

  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (userStr && this.isAuthenticated()) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch {
        this.clearAuthData();
      }
    }
  }

  private handleError = (error: any) => {
    console.error('Auth service error:', error);
    
    let errorMessage = 'An error occurred';
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  };
}