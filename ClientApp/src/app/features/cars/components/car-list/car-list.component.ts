import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CarService } from '../../services/car.service';
import {
  Car,
  CarSummary,
  CarSearchCriteria,
  CarStatistics
} from '../../models/car.model';

@Component({
  selector: 'app-car-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Cars</h1>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage your vehicle fleet
          </p>
        </div>
        <button
          type="button"
          routerLink="/cars/add"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg class="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Car
        </button>
      </div>

      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4" *ngIf="statistics">
        <!-- Total Cars -->
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Cars</dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">{{ statistics.totalCars }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <!-- Active Cars -->
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Active Cars</dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">{{ statistics.activeCars }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <!-- Due for Maintenance -->
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Due for Maintenance</dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">{{ statistics.carsDueForMaintenance }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <!-- Average Mileage -->
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Avg. Mileage</dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">{{ statistics.averageMileage | number }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Search and Filters -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="p-6">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <!-- Search -->
            <div class="md:col-span-1">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  [value]="searchText"
                  (input)="onSearch($event)"
                  placeholder="Search cars by make, model, VIN..."
                  class="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                >
              </div>
            </div>

            <!-- Filters -->
            <div class="md:col-span-2">
              <form [formGroup]="filterForm" class="space-y-4">
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <!-- Make Filter -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Make</label>
                    <select
                      formControlName="make"
                      class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm rounded-md"
                    >
                      <option value="">All Makes</option>
                      <option *ngFor="let make of availableMakes" [value]="make">{{ make }}</option>
                    </select>
                  </div>

                  <!-- Status Filter -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                    <select
                      formControlName="isActive"
                      class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm rounded-md"
                    >
                      <option value="">All Status</option>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>

                  <!-- Maintenance Filter -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Maintenance</label>
                    <select
                      formControlName="nextMaintenanceDue"
                      class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm rounded-md"
                    >
                      <option value="">All</option>
                      <option value="true">Due Soon</option>
                    </select>
                  </div>
                </div>

                <!-- Filter Actions -->
                <div class="flex justify-end space-x-3">
                  <button
                    type="button"
                    (click)="onClearFilters()"
                    class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Clear Filters
                  </button>
                  <button
                    type="button"
                    (click)="onApplyFilters()"
                    class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Apply Filters
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Cars List -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Cars ({{ filteredCars.length }})
            </h3>
            
            <!-- Bulk Actions -->
            <div class="flex space-x-3" *ngIf="selectedCarIds.length > 0">
              <button
                type="button"
                (click)="onBulkDelete()"
                class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete Selected ({{ selectedCarIds.length }})
              </button>
            </div>
          </div>

          <!-- Loading State -->
          <div *ngIf="isLoading" class="flex justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>

          <!-- Cars Grid/List -->
          <div *ngIf="!isLoading">
            <!-- Desktop Table View -->
            <div class="hidden md:block overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table class="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                <thead class="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      <input type="checkbox" (change)="onSelectAll($event)" class="rounded">
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      VIN
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Mileage
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Maintenance
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th class="relative px-6 py-3">
                      <span class="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                  <tr *ngFor="let car of filteredCars" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <input type="checkbox" [checked]="selectedCarIds.includes(car.id)" (change)="onSelectCar(car.id)" class="rounded">
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <img
                          *ngIf="car.avatarUrl"
                          [src]="car.avatarUrl"
                          [alt]="car.make + ' ' + car.model"
                          class="h-8 w-8 rounded-full object-cover mr-3"
                        >
                        <div>
                          <div class="text-sm font-medium text-gray-900 dark:text-white">
                            {{ car.make }} {{ car.model }}
                          </div>
                          <div class="text-sm text-gray-500 dark:text-gray-400">{{ car.year }}</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-mono">
                      {{ car.vin }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {{ car.currentMileage | number }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        [ngClass]="getMaintenanceStatusClass(car)"
                      >
                        {{ getMaintenanceStatus(car) }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        [ngClass]="{
                          'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300': car.isActive,
                          'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300': !car.isActive
                        }"
                      >
                        {{ car.isActive ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div class="flex items-center space-x-2">
                        <button
                          type="button"
                          [routerLink]="['/cars', car.id]"
                          class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="View Details"
                        >
                          <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          [routerLink]="['/cars', car.id, 'edit']"
                          class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          title="Edit"
                        >
                          <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          (click)="onDeleteCar(car.id)"
                          class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete"
                        >
                          <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Mobile Card View -->
            <div class="md:hidden space-y-4">
              <div *ngFor="let car of filteredCars" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center">
                    <input type="checkbox" [checked]="selectedCarIds.includes(car.id)" (change)="onSelectCar(car.id)" class="mr-3">
                    <div>
                      <div class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ car.make }} {{ car.model }}
                      </div>
                      <div class="text-sm text-gray-500 dark:text-gray-400">{{ car.year }}</div>
                    </div>
                  </div>
                  <div class="flex items-center space-x-2">
                    <button
                      type="button"
                      [routerLink]="['/cars', car.id]"
                      class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      [routerLink]="['/cars', car.id, 'edit']"
                      class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      (click)="onDeleteCar(car.id)"
                      class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-gray-500 dark:text-gray-400">VIN:</span>
                    <span class="ml-1 text-gray-900 dark:text-white font-mono">{{ car.vin }}</span>
                  </div>
                  <div>
                    <span class="text-gray-500 dark:text-gray-400">Mileage:</span>
                    <span class="ml-1 text-gray-900 dark:text-white">{{ car.currentMileage | number }}</span>
                  </div>
                </div>
                <div class="mt-3 flex items-center space-x-2">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    [ngClass]="getMaintenanceStatusClass(car)"
                  >
                    {{ getMaintenanceStatus(car) }}
                  </span>
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    [ngClass]="{
                      'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300': car.isActive,
                      'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300': !car.isActive
                    }"
                  >
                    {{ car.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div *ngIf="!isLoading && filteredCars.length === 0" class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No cars found</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by adding a new car.</p>
            <div class="mt-6">
              <button
                type="button"
                routerLink="/cars/add"
                class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg class="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Car
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Custom table styling for dark mode */
    .dark .data-table {
      border-color: rgb(55 65 81);
    }

    .dark .data-table th {
      background-color: rgb(55 65 81);
      color: rgb(243 244 246);
    }

    .dark .data-table td {
      border-color: rgb(75 85 99);
    }

    /* Loading spinner integration */
    :host ::ng-deep .loading-spinner {
      width: 1.25rem;
      height: 1.25rem;
    }
  `]
})
export class CarListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Data
  cars: CarSummary[] = [];
  filteredCars: CarSummary[] = [];
  statistics: CarStatistics | null = null;
  selectedCarIds: string[] = [];
  availableMakes: string[] = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Nissan', 'Hyundai'];
  
  // UI State
  isLoading = false;
  searchText = '';
  currentPage = 1;
  pageSize = 25;
  sortBy = 'createdAt';
  sortDirection: 'asc' | 'desc' = 'desc';
  
  // Forms
  filterForm: FormGroup;

  constructor(
    private carService: CarService,
    private formBuilder: FormBuilder
  ) {
    this.filterForm = this.createFilterForm();
  }

  ngOnInit(): void {
    this.loadCars();
    this.loadStatistics();
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createFilterForm(): FormGroup {
    return this.formBuilder.group({
      make: [''],
      isActive: [''],
      nextMaintenanceDue: ['']
    });
  }

  private setupFormSubscriptions(): void {
    // Auto-apply filters when they change
    this.filterForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.applyFilters();
      });
  }

  // ========== DATA LOADING ==========

  private loadCars(): void {
    this.isLoading = true;

    const criteria: CarSearchCriteria = {
      sortBy: this.sortBy as any,
      sortDirection: this.sortDirection,
      page: this.currentPage,
      pageSize: this.pageSize
    };

    this.carService.getCars(criteria)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success && response.data) {
            this.cars = response.data;
            this.applyFilters();
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Failed to load cars:', error);
        }
      });
  }

  private loadStatistics(): void {
    this.carService.getCarStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.statistics = response.data;
          }
        },
        error: (error) => {
          console.error('Failed to load statistics:', error);
        }
      });
  }

  // ========== FILTERING AND SEARCH ==========

  onSearch(event: Event): void {
    this.searchText = (event.target as HTMLInputElement).value;
    this.applyFilters();
  }

  onApplyFilters(): void {
    this.applyFilters();
  }

  onClearFilters(): void {
    this.filterForm.reset();
    this.searchText = '';
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.cars];

    // Text search
    if (this.searchText) {
      const searchLower = this.searchText.toLowerCase();
      filtered = filtered.filter(car => 
        car.make.toLowerCase().includes(searchLower) ||
        car.model.toLowerCase().includes(searchLower) ||
        car.vin.toLowerCase().includes(searchLower) ||
        car.licensePlate.toLowerCase().includes(searchLower)
      );
    }

    // Apply form filters
    const filters = this.filterForm.value;
    if (filters.make) {
      filtered = filtered.filter(car => car.make === filters.make);
    }
    if (filters.isActive !== '') {
      filtered = filtered.filter(car => car.isActive === (filters.isActive === 'true'));
    }
    if (filters.nextMaintenanceDue === 'true') {
      filtered = filtered.filter(car => 
        car.nextMaintenanceDate && new Date(car.nextMaintenanceDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      );
    }

    this.filteredCars = filtered;
  }

  // ========== SELECTION ==========

  onSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedCarIds = this.filteredCars.map(car => car.id);
    } else {
      this.selectedCarIds = [];
    }
  }

  onSelectCar(carId: string): void {
    const index = this.selectedCarIds.indexOf(carId);
    if (index > -1) {
      this.selectedCarIds.splice(index, 1);
    } else {
      this.selectedCarIds.push(carId);
    }
  }

  // ========== ACTIONS ==========

  onDeleteCar(carId: string): void {
    if (confirm('Are you sure you want to delete this car? This action cannot be undone.')) {
      this.carService.deleteCar(carId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.loadCars();
              this.loadStatistics();
            }
          },
          error: (error) => {
            console.error('Failed to delete car:', error);
          }
        });
    }
  }

  onBulkDelete(): void {
    if (confirm(`Are you sure you want to delete ${this.selectedCarIds.length} cars? This action cannot be undone.`)) {
      this.carService.bulkDeleteCars(this.selectedCarIds)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.selectedCarIds = [];
              this.loadCars();
              this.loadStatistics();
            }
          },
          error: (error) => {
            console.error('Failed to delete cars:', error);
          }
        });
    }
  }

  // ========== UTILITY METHODS ==========

  getMaintenanceStatus(car: CarSummary): string {
    if (!car.nextMaintenanceDate) {
      return 'No Schedule';
    }
    
    const daysUntil = Math.ceil((new Date(car.nextMaintenanceDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) {
      return 'Overdue';
    } else if (daysUntil <= 7) {
      return 'Due Soon';
    } else if (daysUntil <= 30) {
      return 'Scheduled';
    } else {
      return 'Up to Date';
    }
  }

  getMaintenanceStatusClass(car: CarSummary): string {
    const status = this.getMaintenanceStatus(car);
    
    switch (status) {
      case 'Overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'Due Soon':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
    }
  }
}