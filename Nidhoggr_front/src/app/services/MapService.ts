import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Point } from '../models/pointModel';
import { Event } from '../models/eventModel';
import { Area } from '../models/areaModel';
import { RoutePath } from '../models/routePathModel';
import { SecurityZone } from '../models/securityZoneModel';
import { Equipment } from '../models/equipmentModel';
import { GeometryEditData } from '../models/geometryEditModel';

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
  zoneModificationMode: boolean;
  pathModificationMode: boolean;
}

// Interface pour les bounds de la carte
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
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
  private mapBoundsSubject = new BehaviorSubject<MapBounds | null>(null); // Bounds actuels de la carte
  private timelineFilterDateSubject = new BehaviorSubject<Date | null>(null); // Date du filtre timeline
  private centerOnProjectSubject = new Subject<void>(); // Signal pour recentrer sur le projet
  private highlightedSecurityZonesSubject = new BehaviorSubject<string[]>([]); // IDs des zones en surbrillance
  private sidebarCollapsedSubject = new BehaviorSubject<boolean>(false); // État de la sidebar (collapsed/expanded)
  private visibleSecurityZoneIdsSubject = new BehaviorSubject<string[] | null>(null); // IDs des zones visibles (null = toutes visibles)
  private hiddenSecurityZoneIdsSubject = new BehaviorSubject<Set<string>>(new Set()); // IDs des zones cachées (pour la logique inverse)
  private visiblePointIdsSubject = new BehaviorSubject<string[] | null>(null); // IDs des points visibles (null = tous visibles)
  private hiddenPointIdsSubject = new BehaviorSubject<Set<string>>(new Set()); // IDs des points cachés (pour la logique inverse)
  private visiblePointOfInterestIdsSubject = new BehaviorSubject<string[] | null>(null); // IDs des points d'intérêt visibles (null = tous visibles)
  private hiddenPointOfInterestIdsSubject = new BehaviorSubject<Set<string>>(new Set()); // IDs des points d'intérêt cachés
  private visiblePathIdsSubject = new BehaviorSubject<string[] | null>(null); // IDs des parcours visibles (null = tous visibles)
  private hiddenPathIdsSubject = new BehaviorSubject<Set<string>>(new Set()); // IDs des parcours cachés
  private visibleEquipmentIdsSubject = new BehaviorSubject<string[] | null>(null); // IDs des équipements (tracés) visibles (null = tous visibles)
  private hiddenEquipmentIdsSubject = new BehaviorSubject<Set<string>>(new Set()); // IDs des équipements cachés
  private visibleAreaIdsSubject = new BehaviorSubject<string[] | null>(null); // IDs des areas visibles (null = tous visibles)
  private hiddenAreaIdsSubject = new BehaviorSubject<Set<string>>(new Set()); // IDs des areas cachées
  private eventAreaVisibleSubject = new BehaviorSubject<boolean>(this.loadEventAreaVisibility()); // Visibilité de l'area de l'événement
  
  // Édition de géométrie (Area ou RoutePath)
  private geometryEditSubject = new BehaviorSubject<GeometryEditData | null>(null);
  
  // Mode dessin pour SecurityZone
  private drawingModeSubject = new BehaviorSubject<DrawingMode>({ active: false, sourcePoint: null, equipment: null });

  // Mode création d'événement
  private eventCreationModeSubject = new BehaviorSubject<EventCreationMode>({
    active: false,
    step: 'idle',
    event: null,
    zoneGeoJson: null,
    pathGeoJson: null,
    zoneModificationMode: false,
    pathModificationMode: false
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
  mapBounds$: Observable<MapBounds | null> = this.mapBoundsSubject.asObservable();
  timelineFilterDate$: Observable<Date | null> = this.timelineFilterDateSubject.asObservable();
  centerOnProject$: Observable<void> = this.centerOnProjectSubject.asObservable();
  highlightedSecurityZones$: Observable<string[]> = this.highlightedSecurityZonesSubject.asObservable();
  sidebarCollapsed$: Observable<boolean> = this.sidebarCollapsedSubject.asObservable();
  visibleSecurityZoneIds$: Observable<string[] | null> = this.visibleSecurityZoneIdsSubject.asObservable();
  visiblePointIds$: Observable<string[] | null> = this.visiblePointIdsSubject.asObservable();
  visiblePointOfInterestIds$: Observable<string[] | null> = this.visiblePointOfInterestIdsSubject.asObservable();
  visiblePathIds$: Observable<string[] | null> = this.visiblePathIdsSubject.asObservable();
  visibleEquipmentIds$: Observable<string[] | null> = this.visibleEquipmentIdsSubject.asObservable();
  visibleAreaIds$: Observable<string[] | null> = this.visibleAreaIdsSubject.asObservable();
  eventAreaVisible$: Observable<boolean> = this.eventAreaVisibleSubject.asObservable();
  geometryEdit$: Observable<GeometryEditData | null> = this.geometryEditSubject.asObservable();
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

  getPath(pathUuid: string): RoutePath | undefined {
    return this.pathsSubject.value.find(p => p.uuid === pathUuid);
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
    this.selectedSecurityZoneSubject.next(null);
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
      pathGeoJson: null,
      zoneModificationMode: false,
      pathModificationMode: false
    });
  }

  setEventZoneGeoJson(geoJson: string): void {
    const current = this.eventCreationModeSubject.value;
    if (!current.active) return;
    
    // Si on est en mode modification de zone et que le path existe déjà, aller directement à confirm
    if (current.zoneModificationMode && current.pathGeoJson) {
      this.eventCreationModeSubject.next({
        ...current,
        step: 'confirm',
        zoneGeoJson: geoJson,
        zoneModificationMode: false,
        pathModificationMode: false
      });
    } else {
      this.eventCreationModeSubject.next({
        ...current,
        step: 'drawing-path',
        zoneGeoJson: geoJson,
        zoneModificationMode: false,
        pathModificationMode: false
      });
    }
  }

  setEventPathGeoJson(geoJson: string): void {
    const current = this.eventCreationModeSubject.value;
    if (!current.active) return;
    
    const newMode = {
      ...current,
      step: 'confirm' as const,
      pathGeoJson: geoJson,
      pathModificationMode: false
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
      pathGeoJson: null,
      zoneModificationMode: false,
      pathModificationMode: false
    });
  }

  completeEventCreation(): void {
    this.eventCreationModeSubject.next({
      active: false,
      step: 'idle',
      event: null,
      zoneGeoJson: null,
      pathGeoJson: null,
      zoneModificationMode: false,
      pathModificationMode: false
    });
  }

  // Permet de revenir à l'étape de modification de zone (garde le geoJson existant pour édition)
  backToZoneDrawing(): void {
    const current = this.eventCreationModeSubject.value;
    if (!current.active) return;
    
    this.eventCreationModeSubject.next({
      ...current,
      step: 'drawing-zone',
      // Ne pas effacer zoneGeoJson - on garde la géométrie pour l'éditer
      zoneModificationMode: true 
    });
  }

  // Permet de revenir à l'étape de modification du chemin (garde le geoJson existant pour édition)
  backToPathDrawing(): void {
    const current = this.eventCreationModeSubject.value;
    if (!current.active) return;
    
    this.eventCreationModeSubject.next({
      ...current,
      step: 'drawing-path',
      // Ne pas effacer pathGeoJson - on garde la géométrie pour l'éditer
      pathModificationMode: true
    });
  }

  // Valide les modifications en cours et retourne à l'étape de confirmation
  validateModification(): void {
    const current = this.eventCreationModeSubject.value;
    if (!current.active) return;
    
    this.eventCreationModeSubject.next({
      ...current,
      step: 'confirm',
      zoneModificationMode: false,
      pathModificationMode: false
    });
  }

  // Met à jour le geoJson de la zone ou du path pendant l'édition
  updateEventGeoJson(type: 'zone' | 'path', geoJson: string): void {
    const current = this.eventCreationModeSubject.value;
    if (!current.active) return;

    if (type === 'zone') {
      this.eventCreationModeSubject.next({
        ...current,
        zoneGeoJson: geoJson
      });
    } else {
      this.eventCreationModeSubject.next({
        ...current,
        pathGeoJson: geoJson
      });
    }
  }

  // ============= Map Bounds (Viewport) =============
  
  setMapBounds(bounds: MapBounds): void {
    this.mapBoundsSubject.next(bounds);
  }

  getMapBounds(): MapBounds | null {
    return this.mapBoundsSubject.value;
  }

  // ============= Timeline Filter Date =============
  
  setTimelineFilterDate(date: Date | null): void {
    this.timelineFilterDateSubject.next(date);
  }

  getTimelineFilterDate(): Date | null {
    return this.timelineFilterDateSubject.value;
  }

  // ============= Center on Project =============
  
  triggerCenterOnProject(): void {
    this.centerOnProjectSubject.next();
  }

  // ============= Highlighted Security Zones =============
  
  setHighlightedSecurityZones(zoneIds: string[]): void {
    this.highlightedSecurityZonesSubject.next(zoneIds);
  }

  getHighlightedSecurityZones(): string[] {
    return this.highlightedSecurityZonesSubject.value;
  }

  clearHighlightedSecurityZones(): void {
    this.highlightedSecurityZonesSubject.next([]);
  }

  // ============= Sidebar State =============
  
  setSidebarCollapsed(collapsed: boolean): void {
    this.sidebarCollapsedSubject.next(collapsed);
  }

  isSidebarCollapsed(): boolean {
    return this.sidebarCollapsedSubject.value;
  }

  // ============= Visible Security Zones Filter =============
  
  /**
   * Définit les IDs des zones de sécurité à afficher sur la carte
   * @param zoneIds - tableau d'IDs de zones à afficher, ou null pour afficher toutes les zones
   */
  setVisibleSecurityZoneIds(zoneIds: string[] | null): void {
    this.visibleSecurityZoneIdsSubject.next(zoneIds);
  }

  getVisibleSecurityZoneIds(): string[] | null {
    return this.visibleSecurityZoneIdsSubject.value;
  }

  /**
   * Réinitialise les zones cachées et affiche tout (appelé lors du changement d'événement)
   */
  resetVisibleSecurityZones(): void {
    this.hiddenSecurityZoneIdsSubject.next(new Set());
    this.visibleSecurityZoneIdsSubject.next(null);
  }

  toggleSecurityZoneVisibility(zoneId: string, visible: boolean): void {
    const currentVisible = this.visibleSecurityZoneIdsSubject.value;
    let hidden = new Set(this.hiddenSecurityZoneIdsSubject.value);
    
    // Si on passe de null à un état avec masquage/affichage sélectif
    if (currentVisible === null && !visible) {
      // On doit masquer une zone, donc initialiser hidden avec cette zone
      hidden.clear();
      hidden.add(zoneId);
    } else if (currentVisible !== null) {
      // On a déjà un filtrage actif
      if (visible) {
        // Ajouter la zone aux visibles (retirer des cachées)
        hidden.delete(zoneId);
      } else {
        // Retirer la zone des visibles (ajouter aux cachées)
        hidden.add(zoneId);
      }
    }
    
    // Mettre à jour le Set des zones cachées
    this.hiddenSecurityZoneIdsSubject.next(hidden);
    
    // Calculer les zones visibles à partir de toutes les zones et des zones cachées
    const allZones = this.securityZonesSubject.value;
    if (hidden.size === 0) {
      console.log('All zones visible now (hidden set is empty)');
      this.visibleSecurityZoneIdsSubject.next(null);
    } else {
      const visibleIds = allZones
        .filter(z => !hidden.has(z.uuid))
        .map(z => z.uuid);
      
      console.log('Setting visible zones to:', visibleIds);
      this.visibleSecurityZoneIdsSubject.next(visibleIds);
    }
  }

  // ============= Visible Points Filter =============
  
  /**
   * Basculer la visibilité d'un point
   */
  togglePointVisibility(pointId: string, visible: boolean): void {
    // Si on passe de null à un état avec masquage/affichage sélectif
    const currentVisible = this.visiblePointIdsSubject.value;
    let hidden = new Set(this.hiddenPointIdsSubject.value);
    
    // Si currentVisible est null (tous visibles), initialiser hidden avec un set vide
    // et tous les points à visible
    if (currentVisible === null && !visible) {
      // On doit masquer un point, donc initialiser hidden avec ce point
      hidden.clear();
      hidden.add(pointId);
    } else if (currentVisible !== null) {
      // On a déjà un filtrage actif
      if (visible) {
        // Ajouter le point aux visibles (retirer des cachés)
        hidden.delete(pointId);
      } else {
        // Retirer le point des visibles (ajouter aux cachés)
        hidden.add(pointId);
      }
    }
    
    // Mettre à jour le Set des points cachés
    this.hiddenPointIdsSubject.next(hidden);
    
    // Calculer les points visibles à partir de tous les points et des points cachés
    const allPoints = this.pointsSubject.value;
    if (hidden.size === 0) {
      console.log('All points visible now (hidden set is empty)');
      this.visiblePointIdsSubject.next(null);
    } else {
      const visibleIds = allPoints
        .filter(p => !hidden.has(p.uuid))
        .map(p => p.uuid);
      
      console.log('Setting visible points to:', visibleIds);
      this.visiblePointIdsSubject.next(visibleIds);
    }
  }

  /**
   * Réinitialise les points cachés et affiche tout (appelé lors du changement d'événement)
   */
  resetVisiblePoints(): void {
    this.hiddenPointIdsSubject.next(new Set());
    this.visiblePointIdsSubject.next(null);
  }

  getVisiblePointIds(): string[] | null {
    return this.visiblePointIdsSubject.value;
  }

  // ============= Visible Points of Interest Filter =============
  
  /**
   * Basculer la visibilité d'un point d'intérêt
   */
  togglePointOfInterestVisibility(pointId: string, visible: boolean): void {
    const currentVisible = this.visiblePointOfInterestIdsSubject.value;
    let hidden = new Set(this.hiddenPointOfInterestIdsSubject.value);
    
    // Si on passe de null à un état avec masquage/affichage sélectif
    if (currentVisible === null && !visible) {
      // On doit masquer un point d'intérêt, donc initialiser hidden avec ce point
      hidden.clear();
      hidden.add(pointId);
    } else if (currentVisible !== null) {
      // On a déjà un filtrage actif
      if (visible) {
        // Ajouter le point aux visibles (retirer des cachés)
        hidden.delete(pointId);
      } else {
        // Retirer le point des visibles (ajouter aux cachés)
        hidden.add(pointId);
      }
    }
    
    // Mettre à jour le Set des points d'intérêt cachés
    this.hiddenPointOfInterestIdsSubject.next(hidden);
    
    // Calculer les points d'intérêt visibles à partir de tous les points et des points d'intérêt cachés
    const allPoints = this.pointsSubject.value;
    if (hidden.size === 0) {
      console.log('All points of interest visible now (hidden set is empty)');
      this.visiblePointOfInterestIdsSubject.next(null);
    } else {
      const visibleIds = allPoints
        .filter(p => p.isPointOfInterest && !hidden.has(p.uuid))
        .map(p => p.uuid);
      
      console.log('Setting visible points of interest to:', visibleIds);
      this.visiblePointOfInterestIdsSubject.next(visibleIds);
    }
  }

  /**
   * Réinitialise les points d'intérêt cachés et affiche tout (appelé lors du changement d'événement)
   */
  resetVisiblePointsOfInterest(): void {
    this.hiddenPointOfInterestIdsSubject.next(new Set());
    this.visiblePointOfInterestIdsSubject.next(null);
  }

  getVisiblePointOfInterestIds(): string[] | null {
    return this.visiblePointOfInterestIdsSubject.value;
  }

  // ============= Visible Paths Filter =============
  
  /**
   * Basculer la visibilité d'un parcours
   */
  togglePathVisibility(pathId: string, visible: boolean): void {
    const currentVisible = this.visiblePathIdsSubject.value;
    let hidden = new Set(this.hiddenPathIdsSubject.value);
    
    // Si on passe de null à un état avec masquage/affichage sélectif
    if (currentVisible === null && !visible) {
      // On doit masquer un parcours, donc initialiser hidden avec ce parcours
      hidden.clear();
      hidden.add(pathId);
    } else if (currentVisible !== null) {
      // On a déjà un filtrage actif
      if (visible) {
        // Ajouter le parcours aux visibles (retirer des cachés)
        hidden.delete(pathId);
      } else {
        // Retirer le parcours des visibles (ajouter aux cachés)
        hidden.add(pathId);
      }
    }
    
    // Mettre à jour le Set des parcours cachés
    this.hiddenPathIdsSubject.next(hidden);
    
    // Calculer les parcours visibles à partir de TOUS les parcours (incluant les équipements) et des parcours cachés
    const allPaths = this.pathsSubject.value;
    if (hidden.size === 0) {
      console.log('All paths visible now (hidden set is empty)');
      this.visiblePathIdsSubject.next(null);
    } else {
      const visibleIds = allPaths
        .filter(p => !hidden.has(p.uuid))
        .map(p => p.uuid);
      
      console.log('Setting visible paths to:', visibleIds);
      this.visiblePathIdsSubject.next(visibleIds);
    }
  }

  /**
   * Réinitialise les parcours cachés et affiche tout (appelé lors du changement d'événement)
   */
  resetVisiblePaths(): void {
    this.hiddenPathIdsSubject.next(new Set());
    this.visiblePathIdsSubject.next(null);
  }

  getVisiblePathIds(): string[] | null {
    return this.visiblePathIdsSubject.value;
  }

  // ============= Visible Equipment Filter =============
  
  /**
   * Basculer la visibilité d'un équipement (tracé)
   */
  toggleEquipmentVisibility(equipmentId: string, visible: boolean): void {
    const currentVisible = this.visibleEquipmentIdsSubject.value;
    let hidden = new Set(this.hiddenEquipmentIdsSubject.value);
    
    // Si on passe de null à un état avec masquage/affichage sélectif
    if (currentVisible === null && !visible) {
      // On doit masquer un équipement, donc initialiser hidden avec cet équipement
      hidden.clear();
      hidden.add(equipmentId);
    } else if (currentVisible !== null) {
      // On a déjà un filtrage actif
      if (visible) {
        // Ajouter l'équipement aux visibles (retirer des cachés)
        hidden.delete(equipmentId);
      } else {
        // Retirer l'équipement des visibles (ajouter aux cachés)
        hidden.add(equipmentId);
      }
    }
    
    // Mettre à jour le Set des équipements cachés
    this.hiddenEquipmentIdsSubject.next(hidden);
    
    // Calculer les équipements visibles à partir de tous les équipements et des équipements cachés
    const allPaths = this.pathsSubject.value;
    const allEquipments = allPaths.filter(p => p.name && p.name.startsWith('Chemin '));
    
    if (hidden.size === 0) {
      console.log('All equipments visible now (hidden set is empty)');
      this.visibleEquipmentIdsSubject.next(null);
    } else {
      const visibleIds = allEquipments
        .filter(e => !hidden.has(e.uuid))
        .map(e => e.uuid);
      
      console.log('Setting visible equipments to:', visibleIds);
      this.visibleEquipmentIdsSubject.next(visibleIds);
    }
  }

  /**
   * Réinitialise les équipements cachés et affiche tout (appelé lors du changement d'événement)
   */
  resetVisibleEquipments(): void {
    this.hiddenEquipmentIdsSubject.next(new Set());
    this.visibleEquipmentIdsSubject.next(null);
  }

  getVisibleEquipmentIds(): string[] | null {
    return this.visibleEquipmentIdsSubject.value;
  }

  // ============= Visible Areas Filter =============
  
  /**
   * Basculer la visibilité d'une area
   */
  toggleAreaVisibility(areaId: string, visible: boolean): void {
    const currentVisible = this.visibleAreaIdsSubject.value;
    let hidden = new Set(this.hiddenAreaIdsSubject.value);
    
    // Si on passe de null à un état avec masquage/affichage sélectif
    if (currentVisible === null && !visible) {
      // On doit masquer une area, donc initialiser hidden avec cette area
      hidden.clear();
      hidden.add(areaId);
    } else if (currentVisible !== null) {
      // On a déjà un filtrage actif
      if (visible) {
        // Ajouter l'area aux visibles (retirer des cachées)
        hidden.delete(areaId);
      } else {
        // Retirer l'area des visibles (ajouter aux cachées)
        hidden.add(areaId);
      }
    }
    
    // Mettre à jour le Set des areas cachées
    this.hiddenAreaIdsSubject.next(hidden);
    
    // Calculer les areas visibles à partir de toutes les areas et des areas cachées
    const allAreas = this.areasSubject.value;
    if (hidden.size === 0) {
      console.log('All areas visible now (hidden set is empty)');
      this.visibleAreaIdsSubject.next(null);
    } else {
      const visibleIds = allAreas
        .filter(a => !hidden.has(a.uuid))
        .map(a => a.uuid);
      
      console.log('Setting visible areas to:', visibleIds);
      this.visibleAreaIdsSubject.next(visibleIds);
    }
  }

  /**
   * Réinitialise les areas cachées et affiche tout (appelé lors du changement d'événement)
   */
  resetVisibleAreas(): void {
    this.hiddenAreaIdsSubject.next(new Set());
    this.visibleAreaIdsSubject.next(null);
  }

  getVisibleAreaIds(): string[] | null {
    return this.visibleAreaIdsSubject.value;
  }

  // ============= Event Area Visibility =============
  
  /**
   * Charge la visibilité de l'area de l'événement
   */
  private loadEventAreaVisibility(): boolean {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return true;
    }
    const saved = localStorage.getItem('eventAreaVisible');
    return saved !== 'false'; // Par défaut visible (true)
  }

  /**
   * Définit la visibilité de l'area de l'événement sur la carte
   */
  setEventAreaVisible(visible: boolean): void {
    this.eventAreaVisibleSubject.next(visible);
    // Sauvegarder dans le localStorage
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('eventAreaVisible', String(visible));
    }
  }

  getEventAreaVisible(): boolean {
    return this.eventAreaVisibleSubject.value;
  }

  // ============= Geometry Edit (Area/RoutePath) =============
  
  /**
   * Ouvre le drawer d'édition pour une Area ou un RoutePath
   */
  openGeometryEdit(data: GeometryEditData): void {
    this.geometryEditSubject.next(data);
  }

  /**
   * Ferme le drawer d'édition de géométrie
   */
  closeGeometryEdit(): void {
    this.geometryEditSubject.next(null);
  }

  /**
   * Récupère l'état actuel de l'édition de géométrie
   */
  getGeometryEdit(): GeometryEditData | null {
    return this.geometryEditSubject.value;
  }
}
