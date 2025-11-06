import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CarService } from '../../services/car.service';
import { VinValidator } from '../../../../shared/validators/vin.validator';
import { CarFormData, Car } from '../../models/car.model';

@Component({
  selector: 'app-car-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
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
                  <span class="ml-1 text-sm font-medium text-gray-500 dark:text-gray-400 md:ml-2">
                    {{ isEditMode ? 'Edit Car' : 'Add Car' }}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
          <h1 class="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
            {{ isEditMode ? 'Edit Car' : 'Add New Car' }}
          </h1>
        </div>
        <button
          type="button"
          routerLink="/cars"
          class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg class="-ml-1 mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Cancel
        </button>
      </div>

      <!-- Success Alert -->
      <div *ngIf="successMessage" class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-green-700 dark:text-green-300">{{ successMessage }}</p>
          </div>
        </div>
      </div>

      <!-- Error Alert -->
      <div *ngIf="errorMessage" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-700 dark:text-red-300">{{ errorMessage }}</p>
          </div>
        </div>
      </div>

      <!-- Form -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <form [formGroup]="carForm" (ngSubmit)="onSubmit()" class="space-y-6">
          <div class="px-4 py-5 sm:p-6">
            <!-- Basic Information Section -->
            <div class="space-y-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">Basic Information</h3>
              
              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <!-- VIN -->
                <div>
                  <label for="vin" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Vehicle Identification Number (VIN) *
                  </label>
                  <div class="mt-1">
                    <input
                      id="vin"
                      name="vin"
                      type="text"
                      required
                      formControlName="vin"
                      (blur)="onVinBlur()"
                      class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      [ngClass]="{
                        'border-red-300 dark:border-red-600': hasFieldError('vin'),
                        'border-yellow-300 dark:border-yellow-600': vinChecking
                      }"
                      placeholder="17-character VIN"
                      maxlength="17"
                    >
                  </div>
                  <div class="mt-1 flex items-center" *ngIf="vinChecking">
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                    <span class="ml-2 text-sm text-yellow-600">Checking VIN...</span>
                  </div>
                  <div *ngIf="hasFieldError('vin')" class="mt-2 text-sm text-red-600 dark:text-red-400">
                    <p *ngFor="let error of getFieldErrors('vin')">{{ error }}</p>
                  </div>
                </div>

                <!-- License Plate -->
                <div>
                  <label for="licensePlate" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    License Plate *
                  </label>
                  <div class="mt-1">
                    <input
                      id="licensePlate"
                      name="licensePlate"
                      type="text"
                      required
                      formControlName="licensePlate"
                      class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      [ngClass]="{
                        'border-red-300 dark:border-red-600': hasFieldError('licensePlate')
                      }"
                      placeholder="Enter license plate"
                    >
                  </div>
                  <div *ngIf="hasFieldError('licensePlate')" class="mt-2 text-sm text-red-600 dark:text-red-400">
                    <p *ngFor="let error of getFieldErrors('licensePlate')">{{ error }}</p>
                  </div>
                </div>

                <!-- Make -->
                <div>
                  <label for="make" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Make *
                  </label>
                  <div class="mt-1">
                    <select
                      id="make"
                      name="make"
                      required
                      formControlName="make"
                      class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm rounded-md"
                      [ngClass]="{
                        'border-red-300 dark:border-red-600': hasFieldError('make')
                      }"
                    >
                      <option value="">Select Make</option>
                      <option *ngFor="let make of availableMakes" [value]="make">{{ make }}</option>
                    </select>
                  </div>
                  <div *ngIf="hasFieldError('make')" class="mt-2 text-sm text-red-600 dark:text-red-400">
                    <p *ngFor="let error of getFieldErrors('make')">{{ error }}</p>
                  </div>
                </div>

                <!-- Model -->
                <div>
                  <label for="model" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Model *
                  </label>
                  <div class="mt-1">
                    <input
                      id="model"
                      name="model"
                      type="text"
                      required
                      formControlName="model"
                      class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      [ngClass]="{
                        'border-red-300 dark:border-red-600': hasFieldError('model')
                      }"
                      placeholder="Enter model"
                    >
                  </div>
                  <div *ngIf="hasFieldError('model')" class="mt-2 text-sm text-red-600 dark:text-red-400">
                    <p *ngFor="let error of getFieldErrors('model')">{{ error }}</p>
                  </div>
                </div>

                <!-- Year -->
                <div>
                  <label for="year" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Year *
                  </label>
                  <div class="mt-1">
                    <input
                      id="year"
                      name="year"
                      type="number"
                      required
                      formControlName="year"
                      [min]="1990"
                      [max]="currentYear + 1"
                      class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      [ngClass]="{
                        'border-red-300 dark:border-red-600': hasFieldError('year')
                      }"
                      placeholder="Enter year"
                    >
                  </div>
                  <div *ngIf="hasFieldError('year')" class="mt-2 text-sm text-red-600 dark:text-red-400">
                    <p *ngFor="let error of getFieldErrors('year')">{{ error }}</p>
                  </div>
                </div>

                <!-- Color -->
                <div>
                  <label for="color" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Color
                  </label>
                  <div class="mt-1">
                    <input
                      id="color"
                      name="color"
                      type="text"
                      formControlName="color"
                      class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      placeholder="Enter color"
                    >
                  </div>
                </div>
              </div>
            </div>

            <!-- Vehicle Specifications Section -->
            <div class="space-y-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">Vehicle Specifications</h3>
              
              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <!-- Engine Type -->
                <div>
                  <label for="engineType" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Engine Type
                  </label>
                  <div class="mt-1">
                    <select
                      id="engineType"
                      name="engineType"
                      formControlName="engineType"
                      class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm rounded-md"
                    >
                      <option value="">Select Engine Type</option>
                      <option value="V6">V6</option>
                      <option value="V8">V8</option>
                      <option value="I4">I4</option>
                      <option value="I6">I6</option>
                      <option value="Electric">Electric</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>

                <!-- Engine Size -->
                <div>
                  <label for="engineSize" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Engine Size (Liters)
                  </label>
                  <div class="mt-1">
                    <input
                      id="engineSize"
                      name="engineSize"
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="8.0"
                      formControlName="engineSize"
                      class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      placeholder="e.g., 2.5"
                    >
                  </div>
                </div>

                <!-- Transmission -->
                <div>
                  <label for="transmission" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Transmission
                  </label>
                  <div class="mt-1">
                    <select
                      id="transmission"
                      name="transmission"
                      formControlName="transmission"
                      class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm rounded-md"
                    >
                      <option value="">Select Transmission</option>
                      <option value="Manual">Manual</option>
                      <option value="Automatic">Automatic</option>
                      <option value="CVT">CVT</option>
                    </select>
                  </div>
                </div>

                <!-- Fuel Type -->
                <div>
                  <label for="fuelType" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Fuel Type
                  </label>
                  <div class="mt-1">
                    <select
                      id="fuelType"
                      name="fuelType"
                      formControlName="fuelType"
                      class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm rounded-md"
                    >
                      <option value="">Select Fuel Type</option>
                      <option value="Gasoline">Gasoline</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Electric">Electric</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Plug-in Hybrid">Plug-in Hybrid</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- Mileage Section -->
            <div class="space-y-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">Mileage Information</h3>
              
              <div>
                <label for="currentMileage" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Current Mileage (km) *
                </label>
                <div class="mt-1">
                  <input
                    id="currentMileage"
                    name="currentMileage"
                    type="number"
                    required
                    min="0"
                    formControlName="currentMileage"
                    class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    [ngClass]="{
                      'border-red-300 dark:border-red-600': hasFieldError('currentMileage')
                    }"
                    placeholder="Enter current mileage"
                  >
                </div>
                <div *ngIf="hasFieldError('currentMileage')" class="mt-2 text-sm text-red-600 dark:text-red-400">
                  <p *ngFor="let error of getFieldErrors('currentMileage')">{{ error }}</p>
                </div>
              </div>
            </div>

            <!-- Additional Information Section -->
            <div class="space-y-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">Additional Information</h3>
              
              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <!-- Registration Expiry -->
                <div>
                  <label for="registrationExpiry" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Registration Expiry
                  </label>
                  <div class="mt-1">
                    <input
                      id="registrationExpiry"
                      name="registrationExpiry"
                      type="date"
                      formControlName="registrationExpiry"
                      class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    >
                  </div>
                </div>

                <!-- Insurance Expiry -->
                <div>
                  <label for="insuranceExpiry" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Insurance Expiry
                  </label>
                  <div class="mt-1">
                    <input
                      id="insuranceExpiry"
                      name="insuranceExpiry"
                      type="date"
                      formControlName="insuranceExpiry"
                      class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    >
                  </div>
                </div>
              </div>

              <!-- Notes -->
              <div>
                <label for="notes" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notes
                </label>
                <div class="mt-1">
                  <textarea
                    id="notes"
                    name="notes"
                    rows="4"
                    formControlName="notes"
                    class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    placeholder="Any additional notes about the vehicle..."
                  ></textarea>
                </div>
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-right sm:px-6">
            <div class="flex justify-end space-x-3">
              <button
                type="button"
                routerLink="/cars"
                class="inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="carForm.invalid || isLoading"
                class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div *ngIf="isLoading" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {{ isEditMode ? 'Update Car' : 'Add Car' }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    /* Dark mode styles */
    .dark .bg-white {
      background-color: rgb(31 41 55);
    }

    .dark .bg-gray-50 {
      background-color: rgb(55 65 81);
    }

    .dark .text-gray-900 {
      color: rgb(243 244 246);
    }

    .dark .text-gray-700 {
      color: rgb(209 213 219);
    }

    .dark .text-gray-500 {
      color: rgb(156 163 175);
    }

    .dark .border-gray-300 {
      border-color: rgb(75 85 99);
    }
  `]
})
export class CarFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private vinDebounceTimer?: any;
  
  isEditMode = false;
  carId: string | null = null;
  car: Car | null = null;
  
  isLoading = false;
  vinChecking = false;
  errorMessage = '';
  successMessage = '';
  
  carForm: FormGroup;
  
  availableMakes = [
    'Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes-Benz', 
    'Audi', 'Volkswagen', 'Nissan', 'Hyundai', 'Kia', 'Mazda', 
    'Subaru', 'Lexus', 'Acura', 'Infiniti', 'Cadillac', 'Lincoln',
    'Buick', 'GMC', 'Ram', 'Jeep', 'Dodge', 'Chrysler'
  ];
  get currentYear(): number {
    return new Date().getFullYear();
  }
  

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private carService: CarService
  ) {
    this.carForm = this.createCarForm();
  }

  ngOnInit(): void {
    // Check if we're in edit mode
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.carId = params['id'];
        this.isEditMode = !!this.carId;
        
        if (this.isEditMode && this.carId) {
          this.loadCarForEdit(this.carId);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.vinDebounceTimer) {
      clearTimeout(this.vinDebounceTimer);
    }
  }

  private createCarForm(): FormGroup {
    return this.formBuilder.group({
      vin: ['', [
        Validators.required,
        Validators.minLength(17),
        Validators.maxLength(17),
        VinValidator
      ]],
      licensePlate: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(15)
      ]],
      make: ['', [Validators.required]],
      model: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50)
      ]],
      year: ['', [
        Validators.required,
        Validators.min(1990),
        Validators.max(new Date().getFullYear() + 1)
      ]],
      color: [''],
      engineType: [''],
      engineSize: ['', [Validators.min(0.5), Validators.max(8.0)]],
      transmission: [''],
      fuelType: [''],
      currentMileage: ['', [
        Validators.required,
        Validators.min(0),
        Validators.max(9999999)
      ]],
      registrationExpiry: [''],
      insuranceExpiry: [''],
      notes: ['', [Validators.maxLength(1000)]],
      ownerId: ['', [Validators.required]]
    });
  }

  private loadCarForEdit(id: string): void {
    this.isLoading = true;
    
    this.carService.getCarById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success && response.data) {
            this.car = response.data;
            this.populateForm();
          } else {
            this.errorMessage = 'Car not found';
            setTimeout(() => this.router.navigate(['/cars']), 2000);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = 'Failed to load car details';
          console.error('Failed to load car:', error);
          setTimeout(() => this.router.navigate(['/cars']), 2000);
        }
      });
  }

  private populateForm(): void {
    if (this.car) {
      this.carForm.patchValue({
        vin: this.car.vin,
        licensePlate: this.car.licensePlate,
        make: this.car.make,
        model: this.car.model,
        year: this.car.year,
        color: this.car.color,
        engineType: this.car.engineType,
        engineSize: this.car.engineSize,
        transmission: this.car.transmission,
        fuelType: this.car.fuelType,
        currentMileage: this.car.currentMileage,
        registrationExpiry: this.car.registrationExpiry,
        insuranceExpiry: this.car.insuranceExpiry,
        notes: this.car.notes,
        ownerId: this.car.owner?.id || ''
      });
    }
  }

  onVinBlur(): void {
    const vin = this.carForm.get('vin')?.value;
    if (vin && vin.length === 17) {
      this.vinChecking = true;
      
      // Debounce VIN checking
      if (this.vinDebounceTimer) {
        clearTimeout(this.vinDebounceTimer);
      }
      
      this.vinDebounceTimer = setTimeout(() => {
        this.verifyVin(vin);
      }, 500);
    }
  }

  private verifyVin(vin: string): void {
    this.carService.verifyVin(vin)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.vinChecking = false;
          if (response.success && response.data) {
            const vinData = response.data;
            if (vinData.isValid) {
              // Auto-fill form with VIN data
              this.carForm.patchValue({
                make: vinData.make || this.carForm.get('make')?.value,
                model: vinData.model || this.carForm.get('model')?.value,
                year: vinData.year || this.carForm.get('year')?.value,
                engineType: vinData.engineType || this.carForm.get('engineType')?.value,
                fuelType: vinData.fuelType || this.carForm.get('fuelType')?.value,
                transmission: vinData.transmission || this.carForm.get('transmission')?.value
              });
            }
          }
        },
        error: (error) => {
          this.vinChecking = false;
          console.error('VIN verification failed:', error);
        }
      });
  }

  onSubmit(): void {
    if (this.carForm.invalid) {
      this.markFormGroupTouched(this.carForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = this.carForm.value;

    const request = this.isEditMode && this.carId
      ? this.carService.updateCar(this.carId, formData)
      : this.carService.createCar(formData);

    request
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.successMessage = this.isEditMode 
              ? 'Car updated successfully!' 
              : 'Car added successfully!';
            
            // Redirect after a short delay
            setTimeout(() => {
              this.router.navigate(['/cars']);
            }, 1500);
          } else {
            this.errorMessage = response.message || 'Operation failed';
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'An unexpected error occurred';
          console.error('Car operation error:', error);
        }
      });
  }

  // ========== VALIDATION HELPERS ==========

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  hasFieldError(fieldName: string): boolean {
    const field = this.carForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldErrors(fieldName: string): string[] {
    const field = this.carForm.get(fieldName);
    if (field && field.errors && field.touched) {
      const errors: string[] = [];
      
      if (field.errors['required']) {
        errors.push(`${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required.`);
      }
      if (field.errors['minlength']) {
        errors.push(`${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${field.errors['minlength'].requiredLength} characters.`);
      }
      if (field.errors['maxlength']) {
        errors.push(`${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must not exceed ${field.errors['maxlength'].requiredLength} characters.`);
      }
      if (field.errors['min']) {
        errors.push(`${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${field.errors['min'].min}.`);
      }
      if (field.errors['max']) {
        errors.push(`${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must not exceed ${field.errors['max'].max}.`);
      }
      if (field.errors['invalidVin']) {
        errors.push('Invalid VIN format.');
      }
      if (field.errors['maxLength']) {
        errors.push(`${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is too long.`);
      }
      
      return errors;
    }
    return [];
  }
}