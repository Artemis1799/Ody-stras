import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();
  
  private isInitializedSubject = new BehaviorSubject<boolean>(false);
  public isInitialized$: Observable<boolean> = this.isInitializedSubject.asObservable();
  
  private readonly TOKEN_KEY = 'auth_token';

  constructor() {
    // Vérifier si un token JWT existe
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      const token = sessionStorage.getItem(this.TOKEN_KEY);
      if (token && this.isTokenValid(token)) {
        this.isAuthenticatedSubject.next(true);
      }
      this.isInitializedSubject.next(true);
    } else {
      this.isInitializedSubject.next(true);
    }
  }

  login(token: string): void {
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(this.TOKEN_KEY, token);
    }
    this.isAuthenticatedSubject.next(true);
  }

  logout(): void {
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(this.TOKEN_KEY);
    }
    this.isAuthenticatedSubject.next(false);
  }

  getToken(): string | null {
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  isInitialized(): boolean {
    return this.isInitializedSubject.value;
  }

  private isTokenValid(token: string): boolean {
    try {
      // Décoder le payload du JWT (partie entre les deux points)
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Vérifier si le token n'est pas expiré
      const exp = payload.exp * 1000; // Convertir en millisecondes
      return Date.now() < exp;
    } catch (error) {
      console.error('Token invalide:', error);
      return false;
    }
  }
}
