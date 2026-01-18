import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Team } from '../models/teamModel';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private apiUrl = `${environment.apiUrl}/api/Team`;
  
  // Signals pour la réactivité
  private _teams = signal<Team[]>([]);
  private _loading = signal<boolean>(false);
  private _initialized = signal<boolean>(false);
  
  // Signals exposés en lecture seule
  readonly teams = this._teams.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly initialized = this._initialized.asReadonly();
  
  readonly count = computed(() => this._teams().length);

  constructor(private http: HttpClient) {}

  /** Charge les équipes depuis l'API */
  load(): void {
    if (this._loading()) return;
    
    this._loading.set(true);
    this.http.get<Team[]>(this.apiUrl).subscribe({
      next: (teams) => {
        this._teams.set(teams);
        this._initialized.set(true);
        this._loading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des équipes:', error);
        this._loading.set(false);
      }
    });
  }

  /** Rafraîchit silencieusement */
  refresh(): void {
    this.http.get<Team[]>(this.apiUrl).subscribe({
      next: (teams) => {
        this._teams.set(teams);
      },
      error: (error) => {
        console.error('Erreur lors du rafraîchissement:', error);
      }
    });
  }

  /** Crée une équipe avec mise à jour optimiste */
  create(team: Team): Observable<Team> {
    const tempId = 'temp-' + Date.now();
    const tempTeam = { ...team, uuid: tempId };
    this._teams.update(teams => [...teams, tempTeam]);
    
    return this.http.post<Team>(this.apiUrl, team).pipe(
      tap({
        next: (created) => {
          this._teams.update(teams => 
            teams.map(t => t.uuid === tempId ? created : t)
          );
        },
        error: () => {
          this._teams.update(teams => teams.filter(t => t.uuid !== tempId));
        }
      })
    );
  }

  /** Met à jour une équipe avec mise à jour optimiste */
  update(id: string, team: Team): Observable<Team> {
    const oldTeams = this._teams();
    this._teams.update(teams => 
      teams.map(t => t.uuid === id ? { ...t, ...team } : t)
    );
    
    return this.http.put<Team>(`${this.apiUrl}/${id}`, team).pipe(
      tap({
        next: (updated) => {
          this._teams.update(teams => 
            teams.map(t => t.uuid === id ? updated : t)
          );
        },
        error: () => {
          this._teams.set(oldTeams);
        }
      })
    );
  }

  /** Supprime une équipe avec mise à jour optimiste */
  delete(id: string): Observable<void> {
    const oldTeams = this._teams();
    this._teams.update(teams => teams.filter(t => t.uuid !== id));
    
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap({
        error: () => {
          this._teams.set(oldTeams);
        }
      })
    );
  }

  getAll(): Observable<Team[]> {
    return this.http.get<Team[]>(this.apiUrl);
  }

  getById(id: string): Observable<Team> {
    return this.http.get<Team>(`${this.apiUrl}/${id}`);
  }

  getByEventId(eventId: string): Observable<Team[]> {
    return this.http.get<Team[]>(`${this.apiUrl}/event/${eventId}`);
  }

  deleteAll(): Observable<{ deletedCount: number }> {
    const oldTeams = this._teams();
    this._teams.set([]);
    
    return this.http.delete<{ deletedCount: number }>(this.apiUrl).pipe(
      tap({
        error: () => {
          this._teams.set(oldTeams);
        }
      })
    );
  }
}
