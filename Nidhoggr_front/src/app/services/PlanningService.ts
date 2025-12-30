import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Planning } from '../models/planningModel';
import { Action } from '../models/actionModel';

@Injectable({
  providedIn: 'root'
})
export class PlanningService {
  private apiUrl = `${environment.apiUrl}/api/Planning`;
  
  private readonly _plannings$ = new BehaviorSubject<Planning[]>([]);
  public plannings$ = this._plannings$.asObservable();

  constructor(private http: HttpClient) {}

  getAll(): Observable<Planning[]> {
    return this.http.get<Planning[]>(this.apiUrl).pipe(
      tap(plannings => this._plannings$.next(plannings))
    );
  }

  getById(id: string): Observable<Planning> {
    return this.http.get<Planning>(`${this.apiUrl}/${id}`);
  }

  getByTeamId(teamId: string): Observable<Planning> {
    return this.http.get<Planning>(`${this.apiUrl}/team/${teamId}`);
  }

  getItinerary(planningId: string): Observable<Action[]> {
    return this.http.get<Action[]>(`${this.apiUrl}/${planningId}/itinerary`);
  }

  create(planning: Planning): Observable<Planning> {
    return this.http.post<Planning>(this.apiUrl, planning).pipe(
      tap(created => {
        const current = this._plannings$.value;
        this._plannings$.next([...current, created]);
      })
    );
  }

  update(id: string, planning: Planning): Observable<Planning> {
    return this.http.put<Planning>(`${this.apiUrl}/${id}`, planning).pipe(
      tap(updated => {
        const current = this._plannings$.value;
        const index = current.findIndex(p => p.uuid === id);
        if (index !== -1) {
          current[index] = updated;
          this._plannings$.next([...current]);
        }
      })
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const current = this._plannings$.value;
        this._plannings$.next(current.filter(p => p.uuid !== id));
      })
    );
  }

  deleteAll(): Observable<{ deletedCount: number }> {
    return this.http.delete<{ deletedCount: number }>(this.apiUrl).pipe(
      tap(() => this._plannings$.next([]))
    );
  }
}
