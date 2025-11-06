import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CarService } from '../../services/car.service';
import { Car } from '../../models/car.model';

@Component({
  selector: 'app-car-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex justify-between items-center">
        <div>
          <nav class="flex" aria-label="Breadcrumb">
            <ol class="inline-flex items-center space-x-1 md:space-x-3">
              <li class="inline-flex items-center">
                <a routerLink="/cars" class="inline-flex items-center text-sm font-medium text-gray-700 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500">
                  Cars
                </a>
              </li>
              <li>
                <div class="flex items-center">
                  <svg class="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  <span class="ml-1 text-sm font-medium text-gray-500 dark:text-gray-400 md:ml-2">Car Details</span>
                </div>
              </li>
            </ol>
          </nav>
          <h1 *ngIf="car" class="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
            {{ car.make }} {{ car.model }} ({{ car.year }})
          </h1>
        </div>
        <div class="flex space-x-3">
          <button
            type="button"
            [routerLink]="['/cars', carId, 'edit']"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg class="-ml-1 mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Car
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

      <!-- Car Details -->
      <div *ngIf="!isLoading && car" class="space-y-6">
        <!-- Basic Information -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">Basic Information</h3>
            <dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Vehicle Identification Number</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white font-mono">{{ car.vin }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">License Plate</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ car.licensePlate }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Make</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ car.make }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Model</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ car.model }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Year</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ car.year }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Color</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ car.color }}</dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- Specifications -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">Specifications</h3>
            <dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Engine Type</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ car.engineType || 'Not specified' }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Engine Size</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ car.engineSize ? car.engineSize + 'L' : 'Not specified' }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Transmission</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ car.transmission || 'Not specified' }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Fuel Type</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ car.fuelType || 'Not specified' }}</dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- Status Information -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">Status Information</h3>
            <dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Current Mileage</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ car.currentMileage | number }} km</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Last Maintenance</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ car.lastMaintenanceDate ? (car.lastMaintenanceDate | date:'mediumDate') : 'No records' }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Next Maintenance</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ car.nextMaintenanceDate ? (car.nextMaintenanceDate | date:'mediumDate') : 'Not scheduled' }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Maintenance Cost</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ car.totalMaintenanceCost | currency }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                <dd class="mt-1">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    [ngClass]="{
                      'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300': car.isActive,
                      'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300': !car.isActive
                    }"
                  >
                    {{ car.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- Notes -->
        <div *ngIf="car.notes" class="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">Notes</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{{ car.notes }}</p>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="!isLoading && !car" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.486 0-4.75.94-6.374 2.49A8 8 0 0112 3c1.94 0 3.74.69 5.145 1.838.53.44.986.97 1.32 1.554.19.335.34.693.45 1.066.193.658.204 1.347.146 2.042A7.98 7.98 0 0112 15z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">Car not found</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">The car you're looking for doesn't exist or has been deleted.</p>
        <div class="mt-6">
          <button
            type="button"
            routerLink="/cars"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg class="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Cars
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Dark mode styles */
    .dark .bg-white {
      background-color: rgb(31 41 55);
    }

    .dark .text-gray-900 {
      color: rgb(243 244 246);
    }

    .dark .text-gray-500 {
      color: rgb(156 163 175);
    }

    .dark .bg-gray-50 {
      background-color: rgb(55 65 81);
    }

    .dark .border-gray-300 {
      border-color: rgb(75 85 99);
    }
  `]
})
export class CarDetailsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  carId: string | null = null;
  car: Car | null = null;
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private carService: CarService
  ) {}

  ngOnInit(): void {
    // Get car ID from route parameters
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.carId = params['id'];
        if (this.carId) {
          this.loadCarDetails(this.carId);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCarDetails(id: string): void {
    this.isLoading = true;
    
    this.carService.getCarById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success && response.data) {
            this.car = response.data;
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Failed to load car details:', error);
        }
      });
  }
}