import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Equipment } from '../models/equipmentModel';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class EquipmentService {
  private apiUrl = `${environment.apiUrl}/api/Equipment`;
  
  private readonly _equipments$ = new BehaviorSubject<Equipment[]>([]);
  public equipments$ = this._equipments$.asObservable();

  constructor(private http: HttpClient) {}

  getAll(): Observable<Equipment[]> {
    return this.http.get<Equipment[]>(this.apiUrl).pipe(
      tap(equipments => this._equipments$.next(equipments))
    );
  }

  getById(id: string): Observable<Equipment> {
    return this.http.get<Equipment>(`${this.apiUrl}/${id}`);
  }

  create(equipment: Equipment): Observable<Equipment> {
    return this.http.post<Equipment>(this.apiUrl, equipment).pipe(
      tap(created => {
        const current = this._equipments$.value;
        this._equipments$.next([...current, created]);
      })
    );
  }

  update(id: string, equipment: Equipment): Observable<Equipment> {
    return this.http.put<Equipment>(`${this.apiUrl}/${id}`, equipment).pipe(
      tap(updated => {
        const current = this._equipments$.value;
        const index = current.findIndex(e => e.uuid === id);
        if (index !== -1) {
          current[index] = updated;
          this._equipments$.next([...current]);
        }
      })
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const current = this._equipments$.value;
        this._equipments$.next(current.filter(e => e.uuid !== id));
      })
    );
  }

  deleteAll(): Observable<{ deletedCount: number }> {
    return this.http.delete<{ deletedCount: number }>(this.apiUrl).pipe(
      tap(() => this._equipments$.next([]))
    );
  }
}