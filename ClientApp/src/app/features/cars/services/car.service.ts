import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { map, catchError, tap, shareReplay } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { ApiService } from '../../../core/services/api.service';
import {
  Car,
  CarSummary,
  CarFormData,
  CarSearchCriteria,
  CarStatistics,
  CarValidationRules,
  VinCheckResponse,
  CarMaintenanceStatus,
  CarDashboardCard,
  CarExportData
} from '../models/car.model';

@Injectable({
  providedIn: 'root'
})
export class CarService {
  private readonly apiUrl = `${environment.apiUrl}/cars`;
  
  // Private state management
  private carsSubject = new BehaviorSubject<Car[]>([]);
  private selectedCarSubject = new BehaviorSubject<Car | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  
  // Public observables
  public cars$ = this.carsSubject.asObservable();
  public selectedCar$ = this.selectedCarSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  
  // Cached data
  private carsCache = new Map<string, Car>();
  private searchResultsCache = new Map<string, { data: Car[]; timestamp: number }>();
  private readonly cacheExpiry = 5 * 60 * 1000; // 5 minutes

  constructor(
    private http: HttpClient,
    private apiService: ApiService
  ) {}

  // ========== CORE CRUD OPERATIONS ==========

  /**
   * Get all cars with optional filtering and pagination
   */
  getCars(criteria?: CarSearchCriteria): Observable<ApiResponse<Car[]>> {
    this.loadingSubject.next(true);
    
    const params = this.buildSearchParams(criteria);
    const cacheKey = JSON.stringify(criteria || {});
    
    // Check cache first
    const cachedResult = this.searchResultsCache.get(cacheKey);
    if (cachedResult && (Date.now() - cachedResult.timestamp) < this.cacheExpiry) {
      this.loadingSubject.next(false);
      return of({
        success: true,
        data: cachedResult.data,
        message: 'Cars retrieved from cache',
        timestamp: new Date().toISOString()
      });
    }

    return this.http.get<ApiResponse<Car[]>>(this.apiUrl, { params })
      .pipe(
        tap(response => {
          this.loadingSubject.next(false);
          if (response.success && response.data) {
            // Update cache
            this.searchResultsCache.set(cacheKey, {
              data: response.data,
              timestamp: Date.now()
            });
            
            // Update state
            this.carsSubject.next(response.data);
            
            // Cache individual cars
            response.data.forEach(car => {
              this.carsCache.set(car.id, car);
            });
          }
        }),
        catchError(this.handleError),
        shareReplay(1)
      );
  }

  /**
   * Get car by ID
   */
  getCarById(id: string): Observable<ApiResponse<Car>> {
    // Check cache first
    const cachedCar = this.carsCache.get(id);
    if (cachedCar) {
      this.selectedCarSubject.next(cachedCar);
      return of({
        success: true,
        data: cachedCar,
        message: 'Car retrieved from cache',
        timestamp: new Date().toISOString()
      });
    }

    this.loadingSubject.next(true);

    return this.http.get<ApiResponse<Car>>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(response => {
          this.loadingSubject.next(false);
          if (response.success && response.data) {
            this.selectedCarSubject.next(response.data);
            this.carsCache.set(response.data.id, response.data);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Create new car
   */
  createCar(carData: CarFormData): Observable<ApiResponse<Car>> {
    this.loadingSubject.next(true);

    return this.http.post<ApiResponse<Car>>(this.apiUrl, carData)
      .pipe(
        tap(response => {
          this.loadingSubject.next(false);
          if (response.success && response.data) {
            // Update cache and state
            this.carsCache.set(response.data.id, response.data);
            const currentCars = this.carsSubject.value;
            this.carsSubject.next([response.data, ...currentCars]);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Update existing car
   */
  updateCar(id: string, carData: Partial<CarFormData>): Observable<ApiResponse<Car>> {
    this.loadingSubject.next(true);

    return this.http.put<ApiResponse<Car>>(`${this.apiUrl}/${id}`, carData)
      .pipe(
        tap(response => {
          this.loadingSubject.next(false);
          if (response.success && response.data) {
            // Update cache and state
            this.carsCache.set(response.data.id, response.data);
            const currentCars = this.carsSubject.value;
            const updatedCars = currentCars.map(car => 
              car.id === id ? response.data! : car
            );
            this.carsSubject.next(updatedCars);
            
            // Update selected car if it's the current one
            if (this.selectedCarSubject.value?.id === id) {
              this.selectedCarSubject.next(response.data);
            }
            
            // Clear search cache as data has changed
            this.clearSearchCache();
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Delete car
   */
  deleteCar(id: string): Observable<ApiResponse<void>> {
    this.loadingSubject.next(true);

    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(response => {
          this.loadingSubject.next(false);
          if (response.success) {
            // Remove from cache and state
            this.carsCache.delete(id);
            const currentCars = this.carsSubject.value;
            this.carsSubject.next(currentCars.filter(car => car.id !== id));
            
            // Clear selected car if it was deleted
            if (this.selectedCarSubject.value?.id === id) {
              this.selectedCarSubject.next(null);
            }
            
            // Clear search cache
            this.clearSearchCache();
          }
        }),
        catchError(this.handleError)
      );
  }

  // ========== ADVANCED FEATURES ==========

  /**
   * VIN verification and validation
   */
  verifyVin(vin: string): Observable<ApiResponse<VinCheckResponse>> {
    if (!vin || vin.length !== 17) {
      return throwError(() => new Error('VIN must be exactly 17 characters long'));
    }

    return this.http.post<ApiResponse<VinCheckResponse>>(`${this.apiUrl}/verify-vin`, { vin })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get car statistics
   */
  getCarStatistics(): Observable<ApiResponse<CarStatistics>> {
    return this.http.get<ApiResponse<CarStatistics>>(`${this.apiUrl}/statistics`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get car maintenance status
   */
  getCarMaintenanceStatus(carId: string): Observable<ApiResponse<CarMaintenanceStatus>> {
    return this.http.get<ApiResponse<CarMaintenanceStatus>>(`${this.apiUrl}/${carId}/maintenance-status`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get dashboard cards for cars
   */
  getDashboardCards(): Observable<ApiResponse<CarDashboardCard[]>> {
    return this.http.get<ApiResponse<CarDashboardCard[]>>(`${this.apiUrl}/dashboard`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Update car mileage
   */
  updateMileage(carId: string, newMileage: number, serviceDate?: Date): Observable<ApiResponse<Car>> {
    const updateData = {
      currentMileage: newMileage,
      serviceDate: serviceDate?.toISOString()
    };

    return this.http.patch<ApiResponse<Car>>(`${this.apiUrl}/${carId}/mileage`, updateData)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.carsCache.set(response.data.id, response.data);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Export car data
   */
  exportCars(exportData: CarExportData): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/export`, exportData, {
      responseType: 'blob'
    }).pipe(catchError(this.handleError));
  }

  // ========== SEARCH AND FILTER ==========

  /**
   * Search cars by text
   */
  searchCars(searchText: string): Observable<ApiResponse<CarSummary[]>> {
    const params = new HttpParams()
      .set('searchText', searchText)
      .set('page', '1')
      .set('pageSize', '50');

    return this.http.get<ApiResponse<CarSummary[]>>(`${this.apiUrl}/search`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get cars by owner
   */
  getCarsByOwner(ownerId: string): Observable<ApiResponse<Car[]>> {
    const params = new HttpParams().set('ownerId', ownerId);

    return this.http.get<ApiResponse<Car[]>>(this.apiUrl, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get cars due for maintenance
   */
  getCarsDueForMaintenance(daysAhead: number = 30): Observable<ApiResponse<Car[]>> {
    const params = new HttpParams()
      .set('nextMaintenanceDue', 'true')
      .set('daysAhead', daysAhead.toString());

    return this.http.get<ApiResponse<Car[]>>(this.apiUrl, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get cars by make
   */
  getCarsByMake(make: string): Observable<ApiResponse<Car[]>> {
    const params = new HttpParams().set('make', make);

    return this.http.get<ApiResponse<Car[]>>(this.apiUrl, { params })
      .pipe(catchError(this.handleError));
  }

  // ========== BULK OPERATIONS ==========

  /**
   * Bulk update cars
   */
  bulkUpdateCars(carIds: string[], updates: Partial<CarFormData>): Observable<ApiResponse<Car[]>> {
    return this.http.patch<ApiResponse<Car[]>>(`${this.apiUrl}/bulk-update`, {
      carIds,
      updates
    }).pipe(
      tap(response => {
        if (response.success && response.data) {
          // Update cache and state for each updated car
          response.data.forEach(car => {
            this.carsCache.set(car.id, car);
          });
          
          const currentCars = this.carsSubject.value;
          const updatedCars = currentCars.map(car => {
            const updatedCar = response.data!.find(updated => updated.id === car.id);
            return updatedCar || car;
          });
          this.carsSubject.next(updatedCars);
          
          this.clearSearchCache();
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Bulk delete cars
   */
  bulkDeleteCars(carIds: string[]): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/bulk-delete`, {
      body: { carIds }
    }).pipe(
      tap(response => {
        if (response.success) {
          // Remove from cache and state
          carIds.forEach(id => this.carsCache.delete(id));
          const currentCars = this.carsSubject.value;
          this.carsSubject.next(currentCars.filter(car => !carIds.includes(car.id)));
          
          this.clearSearchCache();
        }
      }),
      catchError(this.handleError)
    );
  }

  // ========== VALIDATION ==========

  /**
   * Validate VIN
   */
  validateVin(vin: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!vin) {
      errors.push('VIN is required');
      return { isValid: false, errors };
    }

    if (vin.length !== 17) {
      errors.push('VIN must be exactly 17 characters long');
    }

    if (!/^[A-HJ-NPR-Z0-9]+$/i.test(vin)) {
      errors.push('VIN contains invalid characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate license plate
   */
  validateLicensePlate(licensePlate: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!licensePlate) {
      errors.push('License plate is required');
      return { isValid: false, errors };
    }

    // Basic validation - can be enhanced based on regional requirements
    if (licensePlate.length < 3 || licensePlate.length > 15) {
      errors.push('License plate must be between 3 and 15 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get validation rules
   */
  getValidationRules(): Observable<ApiResponse<CarValidationRules>> {
    return this.http.get<ApiResponse<CarValidationRules>>(`${this.apiUrl}/validation-rules`)
      .pipe(catchError(this.handleError));
  }

  // ========== UTILITY METHODS ==========

  /**
   * Clear all caches
   */
  clearAllCache(): void {
    this.carsCache.clear();
    this.searchResultsCache.clear();
  }

  /**
   * Clear search cache
   */
  private clearSearchCache(): void {
    this.searchResultsCache.clear();
  }

  /**
   * Check if VIN is unique
   */
  checkVinUniqueness(vin: string, excludeId?: string): Observable<ApiResponse<boolean>> {
    const params = new HttpParams()
      .set('vin', vin)
      .set('excludeId', excludeId || '');

    return this.http.get<ApiResponse<boolean>>(`${this.apiUrl}/check-vin-unique`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Check if license plate is unique
   */
  checkLicensePlateUniqueness(licensePlate: string, excludeId?: string): Observable<ApiResponse<boolean>> {
    const params = new HttpParams()
      .set('licensePlate', licensePlate)
      .set('excludeId', excludeId || '');

    return this.http.get<ApiResponse<boolean>>(`${this.apiUrl}/check-license-plate-unique`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get car by VIN
   */
  getCarByVin(vin: string): Observable<ApiResponse<Car>> {
    const params = new HttpParams().set('vin', vin);

    return this.http.get<ApiResponse<Car>>(`${this.apiUrl}/by-vin`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Upload car photos
   */
  uploadCarPhotos(carId: string, photos: File[]): Observable<ApiResponse<string[]>> {
    const formData = new FormData();
    photos.forEach((photo, index) => {
      formData.append(`photo${index}`, photo);
    });

    return this.http.post<ApiResponse<string[]>>(`${this.apiUrl}/${carId}/photos`, formData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Delete car photo
   */
  deleteCarPhoto(carId: string, photoUrl: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${carId}/photos`, {
      body: { photoUrl }
    }).pipe(catchError(this.handleError));
  }

  // ========== PRIVATE HELPERS ==========

  /**
   * Build search parameters
   */
  private buildSearchParams(criteria?: CarSearchCriteria): HttpParams {
    let params = new HttpParams();

    if (criteria) {
      if (criteria.make) params = params.set('make', criteria.make);
      if (criteria.model) params = params.set('model', criteria.model);
      if (criteria.yearFrom) params = params.set('yearFrom', criteria.yearFrom.toString());
      if (criteria.yearTo) params = params.set('yearTo', criteria.yearTo.toString());
      if (criteria.fuelType) params = params.set('fuelType', criteria.fuelType);
      if (criteria.transmission) params = params.set('transmission', criteria.transmission);
      if (criteria.color) params = params.set('color', criteria.color);
      if (criteria.isActive !== undefined) params = params.set('isActive', criteria.isActive.toString());
      if (criteria.ownerId) params = params.set('ownerId', criteria.ownerId);
      if (criteria.nextMaintenanceDue) params = params.set('nextMaintenanceDue', 'true');
      if (criteria.searchText) params = params.set('searchText', criteria.searchText);
      if (criteria.page) params = params.set('page', criteria.page.toString());
      if (criteria.pageSize) params = params.set('pageSize', criteria.pageSize.toString());
      if (criteria.sortBy) params = params.set('sortBy', criteria.sortBy);
      if (criteria.sortDirection) params = params.set('sortDirection', criteria.sortDirection);
    }

    return params;
  }

  /**
   * Handle HTTP errors
   */
  private handleError = (error: any) => {
    console.error('CarService error:', error);
    
    let errorMessage = 'An error occurred while processing your request';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  };
}