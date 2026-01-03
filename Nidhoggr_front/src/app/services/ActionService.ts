import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Action } from '../models/actionModel';

@Injectable({
  providedIn: 'root'
})
export class ActionService {
  private apiUrl = `${environment.apiUrl}/api/Action`;
  
  private readonly _actions$ = new BehaviorSubject<Action[]>([]);
  public actions$ = this._actions$.asObservable();

  constructor(private http: HttpClient) {}

  getAll(): Observable<Action[]> {
    return this.http.get<Action[]>(this.apiUrl).pipe(
      tap(actions => this._actions$.next(actions))
    );
  }

  getById(id: string): Observable<Action> {
    return this.http.get<Action>(`${this.apiUrl}/${id}`);
  }

  getByPlanningId(planningId: string): Observable<Action[]> {
    return this.http.get<Action[]>(`${this.apiUrl}/planning/${planningId}`);
  }

  getBySecurityZoneId(securityZoneId: string): Observable<Action[]> {
    return this.http.get<Action[]>(`${this.apiUrl}/securityzone/${securityZoneId}`);
  }

  create(action: Action): Observable<Action> {
    return this.http.post<Action>(this.apiUrl, action).pipe(
      tap(created => {
        const current = this._actions$.value;
        this._actions$.next([...current, created]);
      })
    );
  }

  update(id: string, action: Action): Observable<Action> {
    return this.http.put<Action>(`${this.apiUrl}/${id}`, action).pipe(
      tap(updated => {
        const current = this._actions$.value;
        const index = current.findIndex(a => a.uuid === id);
        if (index !== -1) {
          current[index] = updated;
          this._actions$.next([...current]);
        }
      })
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const current = this._actions$.value;
        this._actions$.next(current.filter(a => a.uuid !== id));
      })
    );
  }

  deleteAll(): Observable<{ deletedCount: number }> {
    return this.http.delete<{ deletedCount: number }>(this.apiUrl).pipe(
      tap(() => this._actions$.next([]))
    );
  }
}
