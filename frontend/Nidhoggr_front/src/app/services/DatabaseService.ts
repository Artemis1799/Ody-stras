import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private apiUrl = `${environment.apiUrl}/api/Database`;

  constructor(private http: HttpClient) {}

  resetDatabase(): Observable<{ [key: string]: number }> {
    return this.http.delete<{ [key: string]: number }>(`${this.apiUrl}/reset`);
  }

  seedTestData(): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/seed`, {});
  }
}
