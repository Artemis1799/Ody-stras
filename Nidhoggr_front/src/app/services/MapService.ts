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

// Étapes de création d'événement
export type EventCreationStep = 'idle' | 'drawing-zone' | 'drawing-path' | 'confirm';

// Mode de création d'événement
export interface EventCreationMode {
  active: boolean;
  step: EventCreationStep;
  event: Event | null;
  zoneGeoJson: string | null;
  pathGeoJson: string | null;
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
  private selectedPointOfInterestSubject = new BehaviorSubject<Point | null>(null);
  private reloadPointsSubject = new Subject<void>();
  private selectedEventSubject = new BehaviorSubject<Event | null>(null);
  private eventsSubject = new BehaviorSubject<Event[]>([]);
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

  // Mode création d'événement
  private eventCreationModeSubject = new BehaviorSubject<EventCreationMode>({
    active: false,
    step: 'idle',
    event: null,
    zoneGeoJson: null,
    pathGeoJson: null
  });

  points$: Observable<Point[]> = this.pointsSubject.asObservable();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mapInstance$: Observable<any> = this.mapInstanceSubject.asObservable();
  selectedPoint$: Observable<Point | null> = this.selectedPointSubject.asObservable();
  selectedPointIndex$: Observable<number | null> = this.selectedPointIndexSubject.asObservable();
  selectedPointOfInterest$: Observable<Point | null> = this.selectedPointOfInterestSubject.asObservable();
  reloadPoints$: Observable<void> = this.reloadPointsSubject.asObservable();
  selectedEvent$: Observable<Event | null> = this.selectedEventSubject.asObservable();
  events$: Observable<Event[]> = this.eventsSubject.asObservable();
  reloadEvent$: Observable<void> = this.reloadEventSubject.asObservable();
  areas$: Observable<Area[]> = this.areasSubject.asObservable();
  paths$: Observable<RoutePath[]> = this.pathsSubject.asObservable();
  securityZones$: Observable<SecurityZone[]> = this.securityZonesSubject.asObservable();
  selectedSecurityZone$: Observable<SecurityZone | null> = this.selectedSecurityZoneSubject.asObservable();
  focusPoint$: Observable<Point> = this.focusPointSubject.asObservable();
  focusSecurityZone$: Observable<SecurityZone> = this.focusSecurityZoneSubject.asObservable();
  timelineVisible$: Observable<boolean> = this.timelineVisibleSubject.asObservable();
  drawingMode$: Observable<DrawingMode> = this.drawingModeSubject.asObservable();
  eventCreationMode$: Observable<EventCreationMode> = this.eventCreationModeSubject.asObservable();

  setPoints(points: Point[]): void {
    this.pointsSubject.next(points);
  }

  getPoints(): Point[] {
    return this.pointsSubject.value;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setMapInstance(map: any): void {
    this.mapInstanceSubject.next(map);
  }

  selectPoint(point: Point | null, index?: number): void {
    if (point) {
      this.timelineVisibleSubject.next(false);
      // Fermer le drawer des points d'intérêt si un point normal est sélectionné
      this.selectedPointOfInterestSubject.next(null);
    }
    this.selectedPointSubject.next(point);
    this.selectedPointIndexSubject.next(index ?? null);
  }

  selectPointOfInterest(point: Point | null): void {
    if (point) {
      this.timelineVisibleSubject.next(false);
      // Fermer le drawer des points normaux si un point d'intérêt est sélectionné
      this.selectedPointSubject.next(null);
      this.selectedPointIndexSubject.next(null);
    }
    this.selectedPointOfInterestSubject.next(point);
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

  // ============= Events =============
  
  setEvents(events: Event[]): void {
    this.eventsSubject.next(events);
  }

  getEvents(): Event[] {
    return this.eventsSubject.value;
  }

  addEvent(event: Event): void {
    const current = this.eventsSubject.value;
    if (!current.find(e => e.uuid === event.uuid)) {
      this.eventsSubject.next([...current, event]);
    }
  }

  removeEvent(eventUuid: string): void {
    const current = this.eventsSubject.value;
    this.eventsSubject.next(current.filter(e => e.uuid !== eventUuid));
  }

  updateEvent(event: Event): void {
    const current = this.eventsSubject.value;
    const index = current.findIndex(e => e.uuid === event.uuid);
    if (index !== -1) {
      const updated = [...current];
      updated[index] = event;
      this.eventsSubject.next(updated);
    }
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

  // ============= Close All Drawers =============
  closeAllDrawers(): void {
    this.selectedPointSubject.next(null);
    this.selectedPointIndexSubject.next(null);
    this.selectedPointOfInterestSubject.next(null);
    this.selectedSecurityZoneSubject.next(null);
    this.timelineVisibleSubject.next(false);
  }

  // ============= Event Creation Mode =============
  
  startEventCreation(event: Event): void {
    this.closeAllDrawers();
    
    this.eventCreationModeSubject.next({
      active: true,
      step: 'drawing-zone',
      event,
      zoneGeoJson: null,
      pathGeoJson: null
    });
  }

  setEventZoneGeoJson(geoJson: string): void {
    const current = this.eventCreationModeSubject.value;
    if (!current.active) return;
    
    this.eventCreationModeSubject.next({
      ...current,
      step: 'drawing-path',
      zoneGeoJson: geoJson
    });
  }

  setEventPathGeoJson(geoJson: string): void {
    const current = this.eventCreationModeSubject.value;
    if (!current.active) return;
    
    const newMode = {
      ...current,
      step: 'confirm' as const,
      pathGeoJson: geoJson
    };
    this.eventCreationModeSubject.next(newMode);
  }

  getEventCreationMode(): EventCreationMode {
    return this.eventCreationModeSubject.value;
  }

  isEventCreationActive(): boolean {
    return this.eventCreationModeSubject.value.active;
  }

  cancelEventCreation(): void {
    this.eventCreationModeSubject.next({
      active: false,
      step: 'idle',
      event: null,
      zoneGeoJson: null,
      pathGeoJson: null
    });
  }

  completeEventCreation(): void {
    this.eventCreationModeSubject.next({
      active: false,
      step: 'idle',
      event: null,
      zoneGeoJson: null,
      pathGeoJson: null
    });
  }

  // Permet de revenir à l'étape de dessin de zone pour modifier
  backToZoneDrawing(): void {
    const current = this.eventCreationModeSubject.value;
    if (!current.active) return;
    
    this.eventCreationModeSubject.next({
      ...current,
      step: 'drawing-zone',
      zoneGeoJson: null,
      pathGeoJson: null
    });
  }

  // Permet de revenir à l'étape de dessin du chemin pour modifier
  backToPathDrawing(): void {
    const current = this.eventCreationModeSubject.value;
    if (!current.active) return;
    
    this.eventCreationModeSubject.next({
      ...current,
      step: 'drawing-path',
      pathGeoJson: null
    });
  }
}
