import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Point } from '../classe/pointModel';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PointService {
  private apiUrl = `${environment.apiUrl}/api/Point`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Point[]> {
    return this.http.get<Point[]>(this.apiUrl);
  }

  getById(id: string): Observable<Point> {
    return this.http.get<Point>(`${this.apiUrl}/${id}`);
  }

  create(point: Point): Observable<Point> {
    return this.http.post<Point>(this.apiUrl, point);
  }

  update(id: string, point: Point): Observable<Point> {
    return this.http.put<Point>(`${this.apiUrl}/${id}`, point);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}