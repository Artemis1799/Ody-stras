import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { TeamEmployee } from '../models/teamEmployeeModel';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TeamEmployeeService {
  private apiUrl = `${environment.apiUrl}/api/TeamEmployee`;
  
  // Signals pour la réactivité
  private _teamEmployees = signal<TeamEmployee[]>([]);
  private _loading = signal<boolean>(false);
  private _initialized = signal<boolean>(false);
  
  // Signals exposés en lecture seule
  readonly teamEmployees = this._teamEmployees.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly initialized = this._initialized.asReadonly();

  constructor(private http: HttpClient) {}

  /** Charge les associations depuis l'API */
  load(): void {
    if (this._loading()) return;
    
    this._loading.set(true);
    this.http.get<TeamEmployee[]>(this.apiUrl).subscribe({
      next: (teamEmployees) => {
        this._teamEmployees.set(teamEmployees);
        this._initialized.set(true);
        this._loading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des associations:', error);
        this._loading.set(false);
      }
    });
  }

  /** Rafraîchit silencieusement */
  refresh(): void {
    this.http.get<TeamEmployee[]>(this.apiUrl).subscribe({
      next: (teamEmployees) => {
        this._teamEmployees.set(teamEmployees);
      },
      error: (error) => {
        console.error('Erreur lors du rafraîchissement:', error);
      }
    });
  }

  /** Crée une association avec mise à jour optimiste */
  create(teamEmployee: TeamEmployee): Observable<TeamEmployee> {
    this._teamEmployees.update(tes => [...tes, teamEmployee]);
    
    return this.http.post<TeamEmployee>(this.apiUrl, teamEmployee).pipe(
      tap({
        error: () => {
          this._teamEmployees.update(tes => 
            tes.filter(te => !(te.teamId === teamEmployee.teamId && te.employeeId === teamEmployee.employeeId))
          );
        }
      })
    );
  }

  /** Supprime une association avec mise à jour optimiste */
  delete(teamId: string, employeeId: string): Observable<void> {
    const oldTeamEmployees = this._teamEmployees();
    this._teamEmployees.update(tes => 
      tes.filter(te => !(te.teamId === teamId && te.employeeId === employeeId))
    );
    
    return this.http.delete<void>(`${this.apiUrl}/${teamId}/${employeeId}`).pipe(
      tap({
        error: () => {
          this._teamEmployees.set(oldTeamEmployees);
        }
      })
    );
  }

  getAll(): Observable<TeamEmployee[]> {
    return this.http.get<TeamEmployee[]>(this.apiUrl);
  }

  getByTeamId(teamId: string): Observable<TeamEmployee[]> {
    return this.http.get<TeamEmployee[]>(`${this.apiUrl}/team/${teamId}`);
  }

  getByEmployeeId(employeeId: string): Observable<TeamEmployee[]> {
    return this.http.get<TeamEmployee[]>(`${this.apiUrl}/employee/${employeeId}`);
  }

  getById(teamId: string, employeeId: string): Observable<TeamEmployee> {
    return this.http.get<TeamEmployee>(`${this.apiUrl}/${teamId}/${employeeId}`);
  }

  deleteAll(): Observable<{ deletedCount: number }> {
    this._teamEmployees.set([]);
    return this.http.delete<{ deletedCount: number }>(this.apiUrl);
  }
}
