import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type DrawerType = 
  | 'point' 
  | 'point-of-interest' 
  | 'security-zone' 
  | 'timeline' 
  | 'filter' 
  | 'geometry-edit'
  | null;

@Injectable({
  providedIn: 'root'
})
export class DrawerService {
  private activeDrawerSubject = new BehaviorSubject<DrawerType>(null);
  public activeDrawer$: Observable<DrawerType> = this.activeDrawerSubject.asObservable();

  /**
   * Ouvre un drawer spécifique et ferme tous les autres
   */
  openDrawer(drawerType: DrawerType): void {
    this.activeDrawerSubject.next(drawerType);
  }

  /**
   * Ferme le drawer actuellement ouvert
   */
  closeDrawer(): void {
    this.activeDrawerSubject.next(null);
  }

  /**
   * Ferme un drawer spécifique seulement s'il est actuellement ouvert
   */
  closeIfOpen(drawerType: DrawerType): void {
    if (this.activeDrawerSubject.value === drawerType) {
      this.activeDrawerSubject.next(null);
    }
  }

  /**
   * Vérifie si un drawer spécifique est ouvert
   */
  isOpen(drawerType: DrawerType): boolean {
    return this.activeDrawerSubject.value === drawerType;
  }

  /**
   * Retourne le drawer actuellement ouvert
   */
  getActiveDrawer(): DrawerType {
    return this.activeDrawerSubject.value;
  }
}
