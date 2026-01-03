import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Point } from '../models/pointModel';
import { Event } from '../models/eventModel';
import { Area } from '../models/areaModel';
import { RoutePath } from '../models/routePathModel';
import { SecurityZone } from '../models/securityZoneModel';
import { Equipment } from '../models/equipmentModel';

// Mode de dessin pour les SecurityZones
export interface DrawingMode {
  active: boolean;
  sourcePoint: Point | null;
  equipment: Equipment | null;
}

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private pointsSubject = new BehaviorSubject<Point[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapInstanceSubject = new BehaviorSubject<any>(null);
  private selectedPointSubject = new BehaviorSubject<Point | null>(null);
  private selectedPointIndexSubject = new BehaviorSubject<number | null>(null);
  private reloadPointsSubject = new Subject<void>();
  private selectedEventSubject = new BehaviorSubject<Event | null>(null);
  private reloadEventSubject = new Subject<void>();
  private areasSubject = new BehaviorSubject<Area[]>([]);
  private pathsSubject = new BehaviorSubject<RoutePath[]>([]);
  private securityZonesSubject = new BehaviorSubject<SecurityZone[]>([]);
  private selectedSecurityZoneSubject = new BehaviorSubject<SecurityZone | null>(null);
  private focusPointSubject = new Subject<Point>(); // Pour le focus sur un point depuis la timeline
  private focusSecurityZoneSubject = new Subject<SecurityZone>(); // Pour le focus sur une security zone
  private timelineVisibleSubject = new BehaviorSubject<boolean>(false); // Visibilité de la timeline
  
  // Mode dessin pour SecurityZone
  private drawingModeSubject = new BehaviorSubject<DrawingMode>({ active: false, sourcePoint: null, equipment: null });

  points$: Observable<Point[]> = this.pointsSubject.asObservable();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mapInstance$: Observable<any> = this.mapInstanceSubject.asObservable();
  selectedPoint$: Observable<Point | null> = this.selectedPointSubject.asObservable();
  selectedPointIndex$: Observable<number | null> = this.selectedPointIndexSubject.asObservable();
  reloadPoints$: Observable<void> = this.reloadPointsSubject.asObservable();
  selectedEvent$: Observable<Event | null> = this.selectedEventSubject.asObservable();
  reloadEvent$: Observable<void> = this.reloadEventSubject.asObservable();
  areas$: Observable<Area[]> = this.areasSubject.asObservable();
  paths$: Observable<RoutePath[]> = this.pathsSubject.asObservable();
  securityZones$: Observable<SecurityZone[]> = this.securityZonesSubject.asObservable();
  selectedSecurityZone$: Observable<SecurityZone | null> = this.selectedSecurityZoneSubject.asObservable();
  focusPoint$: Observable<Point> = this.focusPointSubject.asObservable();
  focusSecurityZone$: Observable<SecurityZone> = this.focusSecurityZoneSubject.asObservable();
  timelineVisible$: Observable<boolean> = this.timelineVisibleSubject.asObservable();
  drawingMode$: Observable<DrawingMode> = this.drawingModeSubject.asObservable();

  setPoints(points: Point[]): void {
    this.pointsSubject.next(points);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setMapInstance(map: any): void {
    this.mapInstanceSubject.next(map);
  }

  selectPoint(point: Point | null, index?: number): void {
    if (point) {
      this.timelineVisibleSubject.next(false);
    }
    this.selectedPointSubject.next(point);
    this.selectedPointIndexSubject.next(index ?? null);
  }

  getSelectedPointIndex(): number | null {
    return this.selectedPointIndexSubject.value;
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

  // ============= Areas =============
  
  setAreas(areas: Area[]): void {
    this.areasSubject.next(areas);
  }

  getAreas(): Area[] {
    return this.areasSubject.value;
  }

  addArea(area: Area): void {
    const current = this.areasSubject.value;
    this.areasSubject.next([...current, area]);
  }

  removeArea(areaUuid: string): void {
    const current = this.areasSubject.value;
    this.areasSubject.next(current.filter(a => a.uuid !== areaUuid));
  }

  updateArea(area: Area): void {
    const current = this.areasSubject.value;
    const index = current.findIndex(a => a.uuid === area.uuid);
    if (index !== -1) {
      const updated = [...current];
      updated[index] = area;
      this.areasSubject.next(updated);
    }
  }

  clearAreas(): void {
    this.areasSubject.next([]);
  }

  // ============= Paths =============
  
  setPaths(paths: RoutePath[]): void {
    this.pathsSubject.next(paths);
  }

  getPaths(): RoutePath[] {
    return this.pathsSubject.value;
  }

  addPath(path: RoutePath): void {
    const current = this.pathsSubject.value;
    this.pathsSubject.next([...current, path]);
  }

  removePath(pathUuid: string): void {
    const current = this.pathsSubject.value;
    this.pathsSubject.next(current.filter(p => p.uuid !== pathUuid));
  }

  updatePath(path: RoutePath): void {
    const current = this.pathsSubject.value;
    const index = current.findIndex(p => p.uuid === path.uuid);
    if (index !== -1) {
      const updated = [...current];
      updated[index] = path;
      this.pathsSubject.next(updated);
    }
  }

  clearPaths(): void {
    this.pathsSubject.next([]);
  }

  // ============= Clear All =============
  
  clearAllShapes(): void {
    this.clearAreas();
    this.clearPaths();
  }

  triggerReloadEvent(): void {
    this.reloadEventSubject.next();
  }

  focusOnPoint(point: Point): void {
    this.focusPointSubject.next(point);
  }

  focusOnSecurityZone(zone: SecurityZone): void {
    this.focusSecurityZoneSubject.next(zone);
  }

  openTimeline(): void {
    this.selectedPointSubject.next(null);
    this.selectedPointIndexSubject.next(null);
    this.timelineVisibleSubject.next(true);
  }

  closeTimeline(): void {
    this.timelineVisibleSubject.next(false);
  }

  isTimelineVisible(): boolean {
    return this.timelineVisibleSubject.value;
  }

  // ============= Security Zones =============
  
  setSecurityZones(zones: SecurityZone[]): void {
    this.securityZonesSubject.next(zones);
  }

  getSecurityZones(): SecurityZone[] {
    return this.securityZonesSubject.value;
  }

  addSecurityZone(zone: SecurityZone): void {
    const current = this.securityZonesSubject.value;
    this.securityZonesSubject.next([...current, zone]);
  }

  removeSecurityZone(zoneUuid: string): void {
    const current = this.securityZonesSubject.value;
    this.securityZonesSubject.next(current.filter(z => z.uuid !== zoneUuid));
  }

  updateSecurityZone(zone: SecurityZone): void {
    const current = this.securityZonesSubject.value;
    const index = current.findIndex(z => z.uuid === zone.uuid);
    if (index !== -1) {
      const updated = [...current];
      updated[index] = zone;
      this.securityZonesSubject.next(updated);
    }
  }

  selectSecurityZone(zone: SecurityZone | null): void {
    // Fermer le drawer de point si on sélectionne une security zone
    if (zone) {
      this.selectedPointSubject.next(null);
      this.selectedPointIndexSubject.next(null);
      this.timelineVisibleSubject.next(false);
    }
    this.selectedSecurityZoneSubject.next(zone);
  }

  // ============= Drawing Mode =============
  
  startDrawingMode(sourcePoint: Point, equipment: Equipment): void {
    // Fermer le drawer du point
    this.selectedPointSubject.next(null);
    this.selectedPointIndexSubject.next(null);
    this.timelineVisibleSubject.next(false);
    
    // Activer le mode dessin
    this.drawingModeSubject.next({
      active: true,
      sourcePoint,
      equipment
    });
  }

  stopDrawingMode(): void {
    this.drawingModeSubject.next({
      active: false,
      sourcePoint: null,
      equipment: null
    });
  }

  getDrawingMode(): DrawingMode {
    return this.drawingModeSubject.value;
  }

  isDrawingModeActive(): boolean {
    return this.drawingModeSubject.value.active;
  }
}
