import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { RoutePath } from '../models/routePathModel';

@Injectable({
  providedIn: 'root'
})
export class PathService {
  private apiUrl = `${environment.apiUrl}/api/Path`;
  
  private readonly _paths$ = new BehaviorSubject<RoutePath[]>([]);
  public paths$ = this._paths$.asObservable();

  constructor(private http: HttpClient) {}

  getAll(): Observable<RoutePath[]> {
    return this.http.get<RoutePath[]>(this.apiUrl).pipe(
      tap(paths => this._paths$.next(paths))
    );
  }

  getById(id: string): Observable<RoutePath> {
    return this.http.get<RoutePath>(`${this.apiUrl}/${id}`);
  }

  getByEventId(eventId: string): Observable<RoutePath[]> {
    return this.http.get<RoutePath[]>(`${this.apiUrl}/event/${eventId}`).pipe(
      tap(paths => this._paths$.next(paths))
    );
  }

  create(path: Omit<RoutePath, 'uuid'>): Observable<RoutePath> {
    return this.http.post<RoutePath>(this.apiUrl, path).pipe(
      tap(created => {
        const current = this._paths$.value;
        this._paths$.next([...current, created]);
      })
    );
  }

  update(id: string, path: RoutePath): Observable<RoutePath> {
    return this.http.put<RoutePath>(`${this.apiUrl}/${id}`, path).pipe(
      tap(updated => {
        const current = this._paths$.value;
        const index = current.findIndex(p => p.uuid === id);
        if (index !== -1) {
          current[index] = updated;
          this._paths$.next([...current]);
        }
      })
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const current = this._paths$.value;
        this._paths$.next(current.filter(p => p.uuid !== id));
      })
    );
  }

  deleteAll(): Observable<{ deletedCount: number }> {
    return this.http.delete<{ deletedCount: number }>(this.apiUrl).pipe(
      tap(() => this._paths$.next([]))
    );
  }
}
