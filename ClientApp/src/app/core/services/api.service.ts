import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { APP_CONSTANTS } from '../constants/app.constants';

export interface HttpOptions {
  headers?: HttpHeaders | { [header: string]: string | string[] };
  params?: HttpParams | { [param: string]: string | string[] };
  withCredentials?: boolean;
  retry?: number;
  skipErrorHandling?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * GET request
   */
  get<T>(endpoint: string, options?: HttpOptions): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, options)
      .pipe(
        retry(options?.retry || APP_CONSTANTS.RETRY_ATTEMPTS),
        catchError(this.handleError)
      );
  }

  /**
   * POST request
   */
  post<T>(endpoint: string, data?: any, options?: HttpOptions): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, data, options)
      .pipe(
        retry(options?.retry || APP_CONSTANTS.RETRY_ATTEMPTS),
        catchError(this.handleError)
      );
  }

  /**
   * PUT request
   */
  put<T>(endpoint: string, data?: any, options?: HttpOptions): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, data, options)
      .pipe(
        retry(options?.retry || APP_CONSTANTS.RETRY_ATTEMPTS),
        catchError(this.handleError)
      );
  }

  /**
   * PATCH request
   */
  patch<T>(endpoint: string, data?: any, options?: HttpOptions): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${endpoint}`, data, options)
      .pipe(
        retry(options?.retry || APP_CONSTANTS.RETRY_ATTEMPTS),
        catchError(this.handleError)
      );
  }

  /**
   * DELETE request
   */
  delete<T>(endpoint: string, options?: HttpOptions): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`, options)
      .pipe(
        retry(options?.retry || APP_CONSTANTS.RETRY_ATTEMPTS),
        catchError(this.handleError)
      );
  }

  /**
   * File upload
   */
  upload<T>(endpoint: string, file: File, additionalData?: any): Observable<T> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    return this.post<T>(endpoint, formData, {
      headers: new HttpHeaders({
        'Accept': 'application/json'
      })
    });
  }

  /**
   * Download file
   */
  download(endpoint: string, filename?: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}${endpoint}`, {
      responseType: 'blob',
      headers: new HttpHeaders({
        'Accept': 'application/octet-stream'
      })
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Create HttpParams from object
   */
  createParams(params: { [key: string]: any }): HttpParams {
    let httpParams = new HttpParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        httpParams = httpParams.append(key, params[key].toString());
      }
    });
    
    return httpParams;
  }

  /**
   * Create HttpHeaders from object
   */
  createHeaders(headers: { [key: string]: string }): HttpHeaders {
    let httpHeaders = new HttpHeaders();
    
    Object.keys(headers).forEach(key => {
      httpHeaders = httpHeaders.append(key, headers[key]);
    });
    
    return httpHeaders;
  }

  /**
   * Build query string
   */
  buildQueryString(params: { [key: string]: any }): string {
    const queryParams: string[] = [];
    
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
      }
    });
    
    return queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
  }

  /**
   * Handle HTTP errors
   */
  private handleError = (error: HttpErrorResponse) => {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.status === 0) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      } else {
        errorMessage = `Server Error ${error.status}: ${error.statusText}`;
      }
    }
    
    console.error('API Service Error:', error);
    return throwError(() => new Error(errorMessage));
  };
}