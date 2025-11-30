import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Point } from '../models/pointModel';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PointService {
  private apiUrl = `${environment.apiUrl}/api/Point`;
  
  private readonly _points$ = new BehaviorSubject<Point[]>([]);
  public points$ = this._points$.asObservable();

  constructor(private http: HttpClient) {}

  getAll(): Observable<Point[]> {
    return this.http.get<Point[]>(this.apiUrl).pipe(
      tap(points => this._points$.next(points))
    );
  }

  getById(id: string): Observable<Point> {
    return this.http.get<Point>(`${this.apiUrl}/${id}`);
  }

  create(point: Point): Observable<Point> {
    return this.http.post<Point>(this.apiUrl, point).pipe(
      tap(created => {
        const current = this._points$.value;
        this._points$.next([...current, created]);
      })
    );
  }

  update(id: string, point: Point): Observable<Point> {
    return this.http.put<Point>(`${this.apiUrl}/${id}`, point).pipe(
      tap(updated => {
        const current = this._points$.value;
        const index = current.findIndex(p => p.uuid === id);
        if (index !== -1) {
          current[index] = updated;
          this._points$.next([...current]);
        }
      })
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const current = this._points$.value;
        this._points$.next(current.filter(p => p.uuid !== id));
      })
    );
  }

  deleteAll(): Observable<{ deletedCount: number }> {
    return this.http.delete<{ deletedCount: number }>(this.apiUrl).pipe(
      tap(() => this._points$.next([]))
    );
  }
}