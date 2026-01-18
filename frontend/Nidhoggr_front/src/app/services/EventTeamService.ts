import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EventTeam } from '../models/eventTeamModel';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EventTeamService {
  private apiUrl = `${environment.apiUrl}/api/EventTeam`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<EventTeam[]> {
    return this.http.get<EventTeam[]>(this.apiUrl);
  }

  getById(eventId: string, teamId: string): Observable<EventTeam> {
    return this.http.get<EventTeam>(`${this.apiUrl}/${eventId}/${teamId}`);
  }

  create(eventTeam: EventTeam): Observable<EventTeam> {
    return this.http.post<EventTeam>(this.apiUrl, eventTeam);
  }

  update(eventId: string, teamId: string, eventTeam: EventTeam): Observable<EventTeam> {
    return this.http.put<EventTeam>(`${this.apiUrl}/${eventId}/${teamId}`, eventTeam);
  }

  delete(eventId: string, teamId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${eventId}/${teamId}`);
  }

  deleteAll(): Observable<{ deletedCount: number }> {
    return this.http.delete<{ deletedCount: number }>(this.apiUrl);
  }
}
