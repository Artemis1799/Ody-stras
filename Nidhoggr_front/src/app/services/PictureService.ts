import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Picture } from '../models/pictureModel';

@Injectable({
  providedIn: 'root'
})
export class PictureService {
  private apiUrl = `${environment.apiUrl}/api/Picture`;
  
  private readonly _pictures$ = new BehaviorSubject<Picture[]>([]);
  public pictures$ = this._pictures$.asObservable();

  constructor(private http: HttpClient) {}

  getAll(): Observable<Picture[]> {
    return this.http.get<Picture[]>(this.apiUrl).pipe(
      tap(pictures => this._pictures$.next(pictures))
    );
  }

  getById(id: string): Observable<Picture> {
    return this.http.get<Picture>(`${this.apiUrl}/${id}`);
  }

  create(picture: Picture): Observable<Picture> {
    return this.http.post<Picture>(this.apiUrl, picture).pipe(
      tap(created => {
        const current = this._pictures$.value;
        this._pictures$.next([...current, created]);
      })
    );
  }

  update(id: string, picture: Picture): Observable<Picture> {
    return this.http.put<Picture>(`${this.apiUrl}/${id}`, picture).pipe(
      tap(updated => {
        const current = this._pictures$.value;
        const index = current.findIndex(p => p.uuid === id);
        if (index !== -1) {
          current[index] = updated;
          this._pictures$.next([...current]);
        }
      })
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const current = this._pictures$.value;
        this._pictures$.next(current.filter(p => p.uuid !== id));
      })
    );
  }

  getByPointId(pointId: string): Observable<Picture[]> {
    return this.http.get<Picture[]>(`${this.apiUrl}/Point/${pointId}`);
  }

  deleteAll(): Observable<{ deletedCount: number }> {
    return this.http.delete<{ deletedCount: number }>(this.apiUrl).pipe(
      tap(() => this._pictures$.next([]))
    );
  }
}
