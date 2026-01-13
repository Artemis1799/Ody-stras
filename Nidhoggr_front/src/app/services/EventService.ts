import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Event } from '../models/eventModel';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private apiUrl = `${environment.apiUrl}/api/Event`;
  
  // Signals pour la réactivité
  private _events = signal<Event[]>([]);
  private _loading = signal<boolean>(false);
  private _initialized = signal<boolean>(false);
  
  // Signals exposés en lecture seule
  readonly events = this._events.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly initialized = this._initialized.asReadonly();
  
  readonly count = computed(() => this._events().length);
  
  // Signal pour les événements actifs (non archivés)
  readonly activeEvents = computed(() => this._events().filter(e => !e.isArchived));
  
  // Signal pour les événements archivés
  readonly archivedEvents = computed(() => this._events().filter(e => e.isArchived));

  constructor(private http: HttpClient) {}

  /** Charge les événements depuis l'API */
  load(): void {
    if (this._loading()) return;
    
    this._loading.set(true);
    this.http.get<Event[]>(this.apiUrl).subscribe({
      next: (events) => {
        this._events.set(events);
        this._initialized.set(true);
        this._loading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des événements:', error);
        this._loading.set(false);
      }
    });
  }

  /** Rafraîchit silencieusement */
  refresh(): void {
    this.http.get<Event[]>(this.apiUrl).subscribe({
      next: (events) => {
        this._events.set(events);
      },
      error: (error) => {
        console.error('Erreur lors du rafraîchissement:', error);
      }
    });
  }

  getAll(): Observable<Event[]> {
    return this.http.get<Event[]>(this.apiUrl).pipe(
      tap(events => this._events.set(events))
    );
  }

  getById(id: string): Observable<Event> {
    return this.http.get<Event>(`${this.apiUrl}/${id}`);
  }

  create(event: Event): Observable<Event> {
    const tempId = 'temp-' + Date.now();
    const tempEvent = { ...event, uuid: tempId };
    this._events.update(events => [...events, tempEvent]);
    
    return this.http.post<Event>(this.apiUrl, event).pipe(
      tap({
        next: (created) => {
          this._events.update(events => 
            events.map(e => e.uuid === tempId ? created : e)
          );
        },
        error: () => {
          this._events.update(events => events.filter(e => e.uuid !== tempId));
        }
      })
    );
  }

  update(id: string, event: Event): Observable<Event> {
    const oldEvents = this._events();
    this._events.update(events => 
      events.map(e => e.uuid === id ? { ...e, ...event } : e)
    );
    
    return this.http.put<Event>(`${this.apiUrl}/${id}`, event).pipe(
      tap({
        next: (updated) => {
          this._events.update(events => 
            events.map(e => e.uuid === id ? updated : e)
          );
        },
        error: () => {
          this._events.set(oldEvents);
        }
      })
    );
  }

  delete(id: string): Observable<void> {
    const oldEvents = this._events();
    this._events.update(events => events.filter(e => e.uuid !== id));
    
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap({
        error: () => {
          this._events.set(oldEvents);
        }
      })
    );
  }

  deleteAll(): Observable<{ deletedCount: number }> {
    return this.http.delete<{ deletedCount: number }>(this.apiUrl).pipe(
      tap(() => this._events.set([]))
    );
  }

  /** Archive un événement (met isArchived à true) */
  archive(id: string): Observable<Event> {
    const event = this._events().find(e => e.uuid === id);
    if (!event) {
      throw new Error('Event not found');
    }
    
    const archivedEvent: Event = { ...event, isArchived: true };
    return this.update(id, archivedEvent);
  }

  unarchive(id: string): Observable<Event> {
    const event = this._events().find(e => e.uuid === id);
    if (!event) {
      throw new Error('Event not found');
    }
    
    const archivedEvent: Event = { ...event, isArchived: false };
    return this.update(id, archivedEvent);
  }
}
