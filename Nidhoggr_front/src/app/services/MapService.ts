import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Point } from '../models/pointModel';
import { Event } from '../models/eventModel';
import { Geometry } from '../models/geometryModel';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private pointsSubject = new BehaviorSubject<Point[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapInstanceSubject = new BehaviorSubject<any>(null);
  private selectedPointSubject = new BehaviorSubject<Point | null>(null);
  private reloadPointsSubject = new Subject<void>();
  private selectedEventSubject = new BehaviorSubject<Event | null>(null);
  private reloadEventSubject = new Subject<void>();
  private geometriesSubject = new BehaviorSubject<Geometry[]>([]); // Géométries de l'event sélectionné

  points$: Observable<Point[]> = this.pointsSubject.asObservable();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mapInstance$: Observable<any> = this.mapInstanceSubject.asObservable();
  selectedPoint$: Observable<Point | null> = this.selectedPointSubject.asObservable();
  reloadPoints$: Observable<void> = this.reloadPointsSubject.asObservable();
  selectedEvent$: Observable<Event | null> = this.selectedEventSubject.asObservable();
  reloadEvent$: Observable<void> = this.reloadEventSubject.asObservable();
  geometries$: Observable<Geometry[]> = this.geometriesSubject.asObservable(); // Observable pour les géométries

  setPoints(points: Point[]): void {
    this.pointsSubject.next(points);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setMapInstance(map: any): void {
    this.mapInstanceSubject.next(map);
  }

  selectPoint(point: Point | null): void {
    this.selectedPointSubject.next(point);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getMapInstance(): any {
    return this.mapInstanceSubject.value;
  }
  
  triggerReloadPoints(): void {
    this.reloadPointsSubject.next();
  }

  setSelectedEvent(event: Event | null): void {
    this.selectedEventSubject.next(event);
  }

  getSelectedEvent(): Event | null {
    return this.selectedEventSubject.value;
  }

  /**
   * Définit les géométries de l'événement sélectionné
   */
  setGeometries(geometries: Geometry[]): void {
    this.geometriesSubject.next(geometries);
  }

  /**
   * Récupère les géométries actuelles
   */
  getGeometries(): Geometry[] {
    return this.geometriesSubject.value;
  }

  /**
   * Ajoute une géométrie à la liste des géométries
   */
  addGeometry(geometry: Geometry): void {
    const currentGeometries = this.geometriesSubject.value;
    this.geometriesSubject.next([...currentGeometries, geometry]);
  }

  /**
   * Supprime une géométrie de la liste
   */
  removeGeometry(geometryUuid: string): void {
    const currentGeometries = this.geometriesSubject.value;
    this.geometriesSubject.next(currentGeometries.filter(g => g.uuid !== geometryUuid));
  }

  /**
   * Met à jour une géométrie dans la liste
   */
  updateGeometry(geometry: Geometry): void {
    const currentGeometries = this.geometriesSubject.value;
    const index = currentGeometries.findIndex(g => g.uuid === geometry.uuid);
    if (index !== -1) {
      const updated = [...currentGeometries];
      updated[index] = geometry;
      this.geometriesSubject.next(updated);
    }
  }

  /**
   * Vide la liste des géométries
   */
  clearGeometries(): void {
    this.geometriesSubject.next([]);
  }

  /**
   * Déclenche un rechargement de l'événement sélectionné
   */
  triggerReloadEvent(): void {
    this.reloadEventSubject.next();
  }
}
