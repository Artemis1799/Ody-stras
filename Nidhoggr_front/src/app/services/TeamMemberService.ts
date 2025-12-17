import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { TeamMember } from '../models/teamMemberModel';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TeamMemberService {
  private apiUrl = `${environment.apiUrl}/api/TeamMember`;
  
  // Signals pour la réactivité
  private _teamMembers = signal<TeamMember[]>([]);
  private _loading = signal<boolean>(false);
  private _initialized = signal<boolean>(false);
  
  // Signals exposés en lecture seule
  readonly teamMembers = this._teamMembers.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly initialized = this._initialized.asReadonly();

  constructor(private http: HttpClient) {}

  /** Charge les associations depuis l'API */
  load(): void {
    if (this._loading()) return;
    
    this._loading.set(true);
    this.http.get<TeamMember[]>(this.apiUrl).subscribe({
      next: (teamMembers) => {
        this._teamMembers.set(teamMembers);
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
    this.http.get<TeamMember[]>(this.apiUrl).subscribe({
      next: (teamMembers) => {
        this._teamMembers.set(teamMembers);
      },
      error: (error) => {
        console.error('Erreur lors du rafraîchissement:', error);
      }
    });
  }

  /** Crée une association avec mise à jour optimiste */
  create(teamMember: TeamMember): Observable<TeamMember> {
    // Mise à jour optimiste
    this._teamMembers.update(tms => [...tms, teamMember]);
    
    return this.http.post<TeamMember>(this.apiUrl, teamMember).pipe(
      tap({
        error: () => {
          // Rollback
          this._teamMembers.update(tms => 
            tms.filter(tm => !(tm.teamId === teamMember.teamId && tm.memberId === teamMember.memberId))
          );
        }
      })
    );
  }

  /** Supprime une association avec mise à jour optimiste */
  delete(teamId: string, memberId: string): Observable<void> {
    const oldTeamMembers = this._teamMembers();
    this._teamMembers.update(tms => 
      tms.filter(tm => !(tm.teamId === teamId && tm.memberId === memberId))
    );
    
    return this.http.delete<void>(`${this.apiUrl}/${teamId}/${memberId}`).pipe(
      tap({
        error: () => {
          this._teamMembers.set(oldTeamMembers);
        }
      })
    );
  }

  getAll(): Observable<TeamMember[]> {
    return this.http.get<TeamMember[]>(this.apiUrl);
  }

  getById(teamId: string, memberId: string): Observable<TeamMember> {
    return this.http.get<TeamMember>(`${this.apiUrl}/${teamId}/${memberId}`);
  }

  update(teamId: string, memberId: string, teamMember: TeamMember): Observable<TeamMember> {
    return this.http.put<TeamMember>(`${this.apiUrl}/${teamId}/${memberId}`, teamMember);
  }

  deleteAll(): Observable<{ deletedCount: number }> {
    this._teamMembers.set([]);
    return this.http.delete<{ deletedCount: number }>(this.apiUrl);
  }
}
