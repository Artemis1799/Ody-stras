import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Area } from '../models/areaModel';

@Injectable({
  providedIn: 'root'
})
export class AreaService {
  private apiUrl = `${environment.apiUrl}/api/Area`;
  
  private readonly _areas$ = new BehaviorSubject<Area[]>([]);
  public areas$ = this._areas$.asObservable();

  constructor(private http: HttpClient) {}

  getAll(): Observable<Area[]> {
    return this.http.get<Area[]>(this.apiUrl).pipe(
      tap(areas => this._areas$.next(areas))
    );
  }

  getById(id: string): Observable<Area> {
    return this.http.get<Area>(`${this.apiUrl}/${id}`);
  }

  getByEventId(eventId: string): Observable<Area[]> {
    return this.http.get<Area[]>(`${this.apiUrl}/event/${eventId}`).pipe(
      tap(areas => this._areas$.next(areas))
    );
  }

  create(area: Omit<Area, 'uuid'>): Observable<Area> {
    return this.http.post<Area>(this.apiUrl, area).pipe(
      tap(created => {
        const current = this._areas$.value;
        this._areas$.next([...current, created]);
      })
    );
  }

  update(id: string, area: Area): Observable<Area> {
    return this.http.put<Area>(`${this.apiUrl}/${id}`, area).pipe(
      tap(updated => {
        const current = this._areas$.value;
        const index = current.findIndex(a => a.uuid === id);
        if (index !== -1) {
          current[index] = updated;
          this._areas$.next([...current]);
        }
      })
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const current = this._areas$.value;
        this._areas$.next(current.filter(a => a.uuid !== id));
      })
    );
  }

  deleteAll(): Observable<{ deletedCount: number }> {
    return this.http.delete<{ deletedCount: number }>(this.apiUrl).pipe(
      tap(() => this._areas$.next([]))
    );
  }
}
