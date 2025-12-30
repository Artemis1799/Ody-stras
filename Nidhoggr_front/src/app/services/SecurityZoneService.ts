import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { SecurityZone } from '../models/securityZoneModel';

@Injectable({
  providedIn: 'root'
})
export class SecurityZoneService {
  private apiUrl = `${environment.apiUrl}/api/SecurityZone`;
  
  private readonly _securityZones$ = new BehaviorSubject<SecurityZone[]>([]);
  public securityZones$ = this._securityZones$.asObservable();

  constructor(private http: HttpClient) {}

  getAll(): Observable<SecurityZone[]> {
    return this.http.get<SecurityZone[]>(this.apiUrl).pipe(
      tap(zones => this._securityZones$.next(zones))
    );
  }

  getById(id: string): Observable<SecurityZone> {
    return this.http.get<SecurityZone>(`${this.apiUrl}/${id}`);
  }

  getByEventId(eventId: string): Observable<SecurityZone[]> {
    return this.http.get<SecurityZone[]>(`${this.apiUrl}/event/${eventId}`).pipe(
      tap(zones => this._securityZones$.next(zones))
    );
  }

  create(zone: SecurityZone): Observable<SecurityZone> {
    return this.http.post<SecurityZone>(this.apiUrl, zone).pipe(
      tap(created => {
        const current = this._securityZones$.value;
        this._securityZones$.next([...current, created]);
      })
    );
  }

  update(id: string, zone: SecurityZone): Observable<SecurityZone> {
    return this.http.put<SecurityZone>(`${this.apiUrl}/${id}`, zone).pipe(
      tap(updated => {
        const current = this._securityZones$.value;
        const index = current.findIndex(z => z.uuid === id);
        if (index !== -1) {
          current[index] = updated;
          this._securityZones$.next([...current]);
        }
      })
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const current = this._securityZones$.value;
        this._securityZones$.next(current.filter(z => z.uuid !== id));
      })
    );
  }

  deleteAll(): Observable<{ deletedCount: number }> {
    return this.http.delete<{ deletedCount: number }>(this.apiUrl).pipe(
      tap(() => this._securityZones$.next([]))
    );
  }
}
