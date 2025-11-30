import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TeamMember } from '../models/teamMemberModel';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TeamMemberService {
  private apiUrl = `${environment.apiUrl}/api/TeamMember`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<TeamMember[]> {
    return this.http.get<TeamMember[]>(this.apiUrl);
  }

  getById(teamId: string, memberId: string): Observable<TeamMember> {
    return this.http.get<TeamMember>(`${this.apiUrl}/${teamId}/${memberId}`);
  }

  create(teamMember: TeamMember): Observable<TeamMember> {
    return this.http.post<TeamMember>(this.apiUrl, teamMember);
  }

  update(teamId: string, memberId: string, teamMember: TeamMember): Observable<TeamMember> {
    return this.http.put<TeamMember>(`${this.apiUrl}/${teamId}/${memberId}`, teamMember);
  }

  delete(teamId: string, memberId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${teamId}/${memberId}`);
  }

  deleteAll(): Observable<{ deletedCount: number }> {
    return this.http.delete<{ deletedCount: number }>(this.apiUrl);
  }
}
