import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  boundingbox: [string, string, string, string];
}

@Injectable({
  providedIn: 'root'
})
export class NominatimService {
  private apiUrl = 'http://localhost:8080'; // Mettre à jour le port si nécessaire

  constructor(private http: HttpClient) {}

  search(query: string): Observable<NominatimResult[]> {
    return this.http.get<NominatimResult[]>(
      `${this.apiUrl}/search?q=${encodeURIComponent(query)}&format=json&limit=10`
    );
  }

  reverse(lat: number, lon: number): Observable<NominatimResult> {
    return this.http.get<NominatimResult>(
      `${this.apiUrl}/reverse?lat=${lat}&lon=${lon}&format=json`
    );
  }
}