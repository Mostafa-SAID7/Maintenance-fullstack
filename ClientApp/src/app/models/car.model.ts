export interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  mileage: number;
  color: string;
  ownerId: string;
  createdAt: Date;
  lastMaintenanceDate?: Date;
  ownerName: string;
}

export interface CarForm {
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  mileage: number;
  color: string;
  ownerId: string;
}