import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Member } from '../models/memberModel';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MemberService {
  private apiUrl = `${environment.apiUrl}/api/Member`;
  
  // Signals pour la réactivité
  private _members = signal<Member[]>([]);
  private _loading = signal<boolean>(false);
  private _initialized = signal<boolean>(false);
  
  // Signals exposés en lecture seule
  readonly members = this._members.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly initialized = this._initialized.asReadonly();
  
  // Signal calculé pour le nombre de membres
  readonly count = computed(() => this._members().length);

  constructor(private http: HttpClient) {}

  /** Charge les membres depuis l'API */
  load(): void {
    if (this._loading()) return;
    
    this._loading.set(true);
    this.http.get<Member[]>(this.apiUrl).subscribe({
      next: (members) => {
        this._members.set(members);
        this._initialized.set(true);
        this._loading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des membres:', error);
        this._loading.set(false);
      }
    });
  }

  /** Rafraîchit silencieusement (sans loading) */
  refresh(): void {
    this.http.get<Member[]>(this.apiUrl).subscribe({
      next: (members) => {
        this._members.set(members);
      },
      error: (error) => {
        console.error('Erreur lors du rafraîchissement:', error);
      }
    });
  }

  /** Crée un membre avec mise à jour optimiste */
  create(member: Member): Observable<Member> {
    // Mise à jour optimiste - ajouter immédiatement à la liste
    const tempId = 'temp-' + Date.now();
    const tempMember = { ...member, uuid: tempId };
    this._members.update(members => [...members, tempMember]);
    
    return this.http.post<Member>(this.apiUrl, member).pipe(
      tap({
        next: (created) => {
          // Remplacer le membre temporaire par le vrai
          this._members.update(members => 
            members.map(m => m.uuid === tempId ? created : m)
          );
        },
        error: () => {
          // En cas d'erreur, retirer le membre temporaire
          this._members.update(members => 
            members.filter(m => m.uuid !== tempId)
          );
        }
      })
    );
  }

  /** Met à jour un membre avec mise à jour optimiste */
  update(id: string, member: Member): Observable<Member> {
    // Sauvegarder l'ancien état pour rollback
    const oldMembers = this._members();
    
    // Mise à jour optimiste
    this._members.update(members => 
      members.map(m => m.uuid === id ? { ...m, ...member } : m)
    );
    
    return this.http.put<Member>(`${this.apiUrl}/${id}`, member).pipe(
      tap({
        next: (updated) => {
          // Confirmer avec les données du serveur
          this._members.update(members => 
            members.map(m => m.uuid === id ? updated : m)
          );
        },
        error: () => {
          // Rollback en cas d'erreur
          this._members.set(oldMembers);
        }
      })
    );
  }

  /** Supprime un membre avec mise à jour optimiste */
  delete(id: string): Observable<void> {
    // Sauvegarder l'ancien état pour rollback
    const oldMembers = this._members();
    
    // Mise à jour optimiste - retirer immédiatement
    this._members.update(members => members.filter(m => m.uuid !== id));
    
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap({
        error: () => {
          // Rollback en cas d'erreur
          this._members.set(oldMembers);
        }
      })
    );
  }

  getAll(): Observable<Member[]> {
    return this.http.get<Member[]>(this.apiUrl);
  }

  getById(id: string): Observable<Member> {
    return this.http.get<Member>(`${this.apiUrl}/${id}`);
  }

  deleteAll(): Observable<{ deletedCount: number }> {
    const oldMembers = this._members();
    this._members.set([]);
    
    return this.http.delete<{ deletedCount: number }>(this.apiUrl).pipe(
      tap({
        error: () => {
          this._members.set(oldMembers);
        }
      })
    );
  }
}
