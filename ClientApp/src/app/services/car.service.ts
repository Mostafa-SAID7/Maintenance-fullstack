import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

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

@Injectable({
  providedIn: 'root'
})
export class CarService {
  private readonly API_URL = '/api/cars';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Car[]> {
    return this.http.get<Car[]>(this.API_URL);
  }

  getById(id: number): Observable<Car> {
    return this.http.get<Car>(`${this.API_URL}/${id}`);
  }

  create(car: Omit<Car, 'id' | 'createdAt' | 'ownerName'>): Observable<Car> {
    return this.http.post<Car>(this.API_URL, car);
  }

  update(id: number, car: Omit<Car, 'id' | 'createdAt' | 'ownerName'>): Observable<Car> {
    return this.http.put<Car>(`${this.API_URL}/${id}`, car);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  getByOwner(ownerId: string): Observable<Car[]> {
    const params = new HttpParams().set('ownerId', ownerId);
    return this.http.get<Car[]>(this.API_URL, { params });
  }
}