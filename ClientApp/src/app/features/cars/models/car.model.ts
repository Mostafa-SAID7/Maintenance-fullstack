/**
 * Car Entity Model
 *
 * Represents a car/vehicle in the Car Maintenance System.
 * Contains all car-related data including basic info, specifications,
 * maintenance history, and relationships to owners and maintenance records.
 */
export interface Car {
  /** Unique identifier for the car */
  id: string;
  
  /** Vehicle Identification Number */
  vin: string;
  
  /** License plate number */
  licensePlate: string;
  
  /** Make/brand of the vehicle (e.g., Toyota, Honda) */
  make: string;
  
  /** Model name (e.g., Camry, Civic) */
  model: string;
  
  /** Model year of the vehicle */
  year: number;
  
  /** Color of the vehicle */
  color: string;
  
  /** Engine type (e.g., V6, I4, Electric) */
  engineType?: string;
  
  /** Engine displacement in liters */
  engineSize?: number;
  
  /** Transmission type */
  transmission?: 'Manual' | 'Automatic' | 'CVT';
  
  /** Fuel type */
  fuelType?: 'Gasoline' | 'Diesel' | 'Electric' | 'Hybrid' | 'Plug-in Hybrid';
  
  /** Current odometer reading in kilometers or miles */
  currentMileage: number;
  
  /** Last maintenance date */
  lastMaintenanceDate?: Date;
  
  /** Next maintenance due date */
  nextMaintenanceDate?: Date;
  
  /** Total maintenance cost */
  totalMaintenanceCost: number;
  
  /** Number of maintenance records */
  maintenanceRecordCount: number;
  
  /** Registration status */
  isRegistered: boolean;
  
  /** Insurance status */
  isInsured: boolean;
  
  /** Registration expiry date */
  registrationExpiry?: Date;
  
  /** Insurance expiry date */
  insuranceExpiry?: Date;
  
  /** Car avatar/image URL */
  avatarUrl?: string;
  
  /** Additional notes about the car */
  notes?: string;
  
  /** Owner information */
  owner?: CarOwner;
  
  /** List of maintenance records */
  maintenanceRecords?: MaintenanceRecord[];
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last update timestamp */
  updatedAt: Date;
  
  /** Whether the car is active */
  isActive: boolean;
}

/**
 * Car Summary/List Item Model
 *
 * Simplified car representation for lists and overviews
 */
export interface CarSummary {
  id: string;
  vin: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  color: string;
  currentMileage: number;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  isActive: boolean;
  avatarUrl?: string;
}

/**
 * Car Form Data Model
 *
 * Model for creating/updating cars
 */
export interface CarFormData {
  vin: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  color: string;
  engineType?: string;
  engineSize?: number;
  transmission?: string;
  fuelType?: string;
  currentMileage: number;
  registrationExpiry?: Date;
  insuranceExpiry?: Date;
  avatarUrl?: string;
  notes?: string;
  ownerId: string;
}

/**
 * Car Search/Filter Model
 *
 * Model for filtering and searching cars
 */
export interface CarSearchCriteria {
  make?: string;
  model?: string;
  yearFrom?: number;
  yearTo?: number;
  fuelType?: string;
  transmission?: string;
  color?: string;
  isActive?: boolean;
  ownerId?: string;
  nextMaintenanceDue?: boolean;
  searchText?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'make' | 'model' | 'year' | 'currentMileage' | 'lastMaintenanceDate' | 'createdAt';
  sortDirection?: 'asc' | 'desc';
}

/**
 * Car Statistics Model
 *
 * Model for car-related statistics
 */
export interface CarStatistics {
  totalCars: number;
  activeCars: number;
  inactiveCars: number;
  carsByMake: { make: string; count: number }[];
  carsByFuelType: { fuelType: string; count: number }[];
  carsByTransmission: { transmission: string; count: number }[];
  averageMileage: number;
  totalMaintenanceCost: number;
  averageMaintenanceCost: number;
  carsDueForMaintenance: number;
  carsOverdueForMaintenance: number;
}

/**
 * Car Validation Model
 *
 * Model for car validation rules
 */
export interface CarValidationRules {
  vin: {
    required: boolean;
    pattern: RegExp;
    minLength: number;
    maxLength: number;
    unique?: boolean;
  };
  licensePlate: {
    required: boolean;
    pattern: RegExp;
    unique?: boolean;
  };
  make: {
    required: boolean;
    minLength: number;
    maxLength: number;
  };
  model: {
    required: boolean;
    minLength: number;
    maxLength: number;
  };
  year: {
    required: boolean;
    min: number;
    max: number;
  };
  currentMileage: {
    required: boolean;
    min: number;
    max: number;
  };
}

/**
 * VIN Check Response Model
 *
 * Model for VIN verification API response
 */
export interface VinCheckResponse {
  isValid: boolean;
  make?: string;
  model?: string;
  year?: number;
  engineType?: string;
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
  errorMessage?: string;
}

/**
 * Car Maintenance Status Model
 *
 * Model for car maintenance status
 */
export interface CarMaintenanceStatus {
  carId: string;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  daysUntilNextMaintenance?: number;
  maintenanceStatus: 'up-to-date' | 'due-soon' | 'overdue' | 'no-records';
  mileageSinceLastMaintenance?: number;
  recommendedMaintenanceType?: string;
  estimatedMaintenanceCost?: number;
}

/**
 * Car Dashboard Card Model
 *
 * Model for dashboard car cards
 */
export interface CarDashboardCard {
  id: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  currentMileage: number;
  maintenanceStatus: CarMaintenanceStatus;
  nextMaintenanceDate?: Date;
  avatarUrl?: string;
  isActive: boolean;
  daysUntilNextMaintenance?: number;
}

/**
 * Car Export Model
 *
 * Model for exporting car data
 */
export interface CarExportData {
  cars: Car[];
  format: 'csv' | 'xlsx' | 'pdf';
  includeMaintenanceHistory: boolean;
  includePhotos: boolean;
  selectedColumns: string[];
}

/**
 * Car Owner Model (simplified for cars module)
 */
export interface CarOwner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Maintenance Record Model (simplified for cars module)
 */
export interface MaintenanceRecord {
  id: string;
  carId: string;
  serviceType: string;
  description: string;
  serviceDate: Date;
  mileage: number;
  cost: number;
  serviceProvider?: string;
  parts?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}