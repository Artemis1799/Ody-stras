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

  constructor() {
    // L'authentification sera vérifiée via un appel API au démarrage
  }

  markAsInitialized(): void {
    this.isInitializedSubject.next(true);
  }

  login(): void {
    // Le token sera stocké dans un cookie HttpOnly par le backend
    this.isAuthenticatedSubject.next(true);
  }

  logout(): void {
    // Le backend devra supprimer le cookie HttpOnly
    this.isAuthenticatedSubject.next(false);
  }

  setAuthenticated(isAuth: boolean): void {
    this.isAuthenticatedSubject.next(isAuth);
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  isInitialized(): boolean {
    return this.isInitializedSubject.value;
  }
}
