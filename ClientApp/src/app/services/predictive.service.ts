import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PredictionResult {
  carId: number;
  maintenanceNeeded: boolean;
  confidence: number;
  predictedDate: Date;
  reason: string;
}

@Injectable({
  providedIn: 'root'
})
export class PredictiveService {
  private readonly API_URL = '/api/predictive';

  constructor(private http: HttpClient) {}

  getPrediction(carId: number): Observable<PredictionResult> {
    return this.http.get<PredictionResult>(`${this.API_URL}/predict/${carId}`);
  }

  getAllPredictions(): Observable<PredictionResult[]> {
    return this.http.get<PredictionResult[]>(`${this.API_URL}/predictions`);
  }

  trainModel(): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/train`, {});
  }

  getModelAccuracy(): Observable<number> {
    return this.http.get<number>(`${this.API_URL}/accuracy`);
  }
}