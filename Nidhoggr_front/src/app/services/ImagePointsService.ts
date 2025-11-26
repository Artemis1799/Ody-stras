import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ImagePoint } from '../models/imagePointsModel';

@Injectable({
  providedIn: 'root'
})
export class ImagePointService {
  private apiUrl = `${environment.apiUrl}/api/ImagePoint`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ImagePoint[]> {
    return this.http.get<ImagePoint[]>(this.apiUrl);
  }

  getByPointId(pointId: string): Observable<ImagePoint[]> {
    return this.http.get<ImagePoint[]>(`${this.apiUrl}?pointId=${pointId}`);
  }

  getByIds(imageId: string, pointId: string): Observable<ImagePoint> {
    return this.http.get<ImagePoint>(`${this.apiUrl}/${imageId}/${pointId}`);
  }

  create(imagePoint: ImagePoint): Observable<ImagePoint> {
    return this.http.post<ImagePoint>(this.apiUrl, imagePoint);
  }

  update(imageId: string, pointId: string, imagePoint: ImagePoint): Observable<ImagePoint> {
    return this.http.put<ImagePoint>(`${this.apiUrl}/${imageId}/${pointId}`, imagePoint);
  }

  delete(imageId: string, pointId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${imageId}/${pointId}`);
  }
}