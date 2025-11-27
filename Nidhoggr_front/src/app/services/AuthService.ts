import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();

  constructor() {
    // Vérifier si l'utilisateur était déjà connecté (sessionStorage)
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      const isAuth = sessionStorage.getItem('isAuthenticated') === 'true';
      this.isAuthenticatedSubject.next(isAuth);
    }
  }

  login(): void {
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('isAuthenticated', 'true');
    }
    this.isAuthenticatedSubject.next(true);
  }

  logout(): void {
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('isAuthenticated');
    }
    this.isAuthenticatedSubject.next(false);
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }
}
