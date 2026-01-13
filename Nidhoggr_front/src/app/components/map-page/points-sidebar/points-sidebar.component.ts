import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AutoComplete } from 'primeng/autocomplete';
import { EventStoreService } from '../../../store-services/EventStore-Service';
import { PointService } from '../../../services/PointService';
import { EventService } from '../../../services/EventService';
import { AreaService } from '../../../services/AreaService';
import { PathService } from '../../../services/PathService';
import { SecurityZoneService } from '../../../services/SecurityZoneService';
import { MapService } from '../../../services/MapService';
import { NominatimService, NominatimResult } from '../../../services/NominatimService';
import { Point } from '../../../models/pointModel';
import { SecurityZone } from '../../../models/securityZoneModel';
import { Event } from '../../../models/eventModel';
import { Area } from '../../../models/areaModel';
import { RoutePath } from '../../../models/routePathModel';
import { Subscription, Subject, Observable, forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { ExportPopup } from '../../../shared/export-popup/export-popup';
import { ImportPopup } from '../../../shared/import-popup/import-popup';
import { EventCreatePopup } from '../../../shared/event-create-popup/event-create-popup';
import { EventEditPopup } from '../../../shared/event-edit-popup/event-edit-popup';
import { PointsListComponent } from './points-list/points-list.component';
import { TimelineDrawerComponent } from '../../../shared/timeline-drawer/timeline-drawer.component';

@Component({
  selector: 'app-points-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AutoComplete,
    ExportPopup,
    ImportPopup,
    EventCreatePopup,
    EventEditPopup,
    PointsListComponent,
    TimelineDrawerComponent,
  ],
  templateUrl: './points-sidebar.component.html',
  styleUrls: ['./points-sidebar.component.scss'],
})
export class PointsSidebarComponent implements OnInit, OnDestroy {
  isCollapsed = false;

  // Observable pour la liste des points - utilise directement le MapService pour la réactivité
  points$!: Observable<Point[]>;
  securityZones$!: Observable<SecurityZone[]>;
  events$!: Observable<Event[]>;

  selectedPointUuid: string | null = null;
  isLoading = false;
  errorMessage = '';
  emptyMessage = 'Sélectionnez un évènement pour voir ses points';
  private pointsSubscription?: Subscription;
  private securityZonesSubscription?: Subscription;
  private selectedEventSubscription?: Subscription;
  private eventsSubscription?: Subscription;

  // Onglet actif: 'points' ou 'zones'
  activeTab: 'points' | 'zones' = 'points';

  // Search properties
  searchQuery = '';
  searchResults: NominatimResult[] = [];
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  // Popups
  showExportPopup = false;
  showImportPopup = false;
  showEventCreatePopup = false;
  showEventEditPopup = false;

  // Events autocomplete
  events: Event[] = [];
  filteredEvents: string[] = [];
  selectedEvent: Event | null = null;
  selectedEventName = '';

  // Points search and pagination
  pointsSearchQuery = '';
  allPoints: Point[] = [];
  filteredPoints: Point[] = [];
  paginatedPoints: Point[] = [];
  currentPage = 1;
  itemsPerPage = 5;
  totalPages = 1;

  // SecurityZones
  allSecurityZones: SecurityZone[] = [];
  filteredSecurityZones: SecurityZone[] = [];
  paginatedSecurityZones: SecurityZone[] = [];
  selectedZoneType = 'all'; // Filtre par type d'équipement
  availableZoneTypes: string[] = []; // Types d'équipements disponibles
  zonesCurrentPage = 1;
  zonesTotalPages = 1;

  constructor(
    private pointService: PointService,
    private eventService: EventService,
    private areaService: AreaService,
    private pathService: PathService,
    private securityZoneService: SecurityZoneService,
    private mapService: MapService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private nominatimService: NominatimService,
    private eventStoreService: EventStoreService
  ) {
    // Initialiser points$ après l'injection de mapService
    this.points$ = this.mapService.points$;
    this.securityZones$ = this.mapService.securityZones$;
    this.events$ = this.mapService.events$;
  }

  ngOnInit(): void {
    // Charger la liste des événements
    this.loadEvents();

    this.eventsSubscription = this.events$.subscribe((events) => {
      this.events = events;
      this.cdr.markForCheck();

      // Après le chargement des événements, restaurer l'événement depuis l'URL s'il existe
      const eventUuidFromUrl = this.eventStoreService.initializeFromUrl();
      if (eventUuidFromUrl) {
        const eventFromUrl = events.find((e) => e.uuid === eventUuidFromUrl);
        if (eventFromUrl) {
          this.selectedEvent = eventFromUrl;
          this.selectedEventName = eventFromUrl.title;
          this.mapService.setSelectedEvent(eventFromUrl);
          this.loadPointsAndCenterMap(eventFromUrl.uuid);
        }
      }
    });

    // S'abonner aux changements de points pour déclencher la détection de changements
    this.pointsSubscription = this.points$.subscribe((points) => {
      this.allPoints = points;
      this.applyPointsFiltersAndPagination();
      this.cdr.markForCheck();
    });

    // S'abonner aux changements de security zones
    this.securityZonesSubscription = this.securityZones$.subscribe((zones) => {
      this.allSecurityZones = zones;
      // Mettre à jour les types disponibles dynamiquement
      this.extractAvailableZoneTypes(zones);
      this.applyZonesFiltersAndPagination();
      this.cdr.markForCheck();
    });

    // Initialiser les points à vide APRÈS la subscription (aucun événement sélectionné)
    this.mapService.setPoints([]);
    this.mapService.setSecurityZones([]);

    this.selectedEventSubscription = this.mapService.selectedEvent$.subscribe((event) => {
      if (event) {
        this.selectedEvent = event;
        this.selectedEventName = event.title;
      } else {
        this.selectedEvent = null;
        this.selectedEventName = '';
        this.allPoints = [];
        this.filteredPoints = [];
        this.paginatedPoints = [];
        this.allSecurityZones = [];
        this.filteredSecurityZones = [];
        this.paginatedSecurityZones = [];
      }
      this.cdr.markForCheck();
    });

    // Setup debounced search (300ms)
    this.searchSubscription = this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          if (!query || query.trim().length < 2) {
            this.searchResults = [];
            return [];
          }
          return this.nominatimService.search(query);
        })
      )
      .subscribe({
        next: (results) => {
          this.searchResults = results;
        },
        error: (error) => {
          console.error('Erreur lors de la recherche:', error);
          this.searchResults = [];
        },
      });
  }

  ngOnDestroy(): void {
    this.pointsSubscription?.unsubscribe();
    this.securityZonesSubscription?.unsubscribe();
    this.selectedEventSubscription?.unsubscribe();
    this.eventsSubscription?.unsubscribe();
    this.searchSubscription?.unsubscribe();
  }

  loadEvents(): void {
    this.eventService.getAll().subscribe({
      next: (events) => {
        const uniqueEvents = events.filter(
          (event, index, self) => index === self.findIndex((e) => e.uuid === event.uuid)
        );
        this.mapService.setEvents(uniqueEvents);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des événements:', error);
      },
    });
  }

  filterEvents(event: { query: string }): void {
    const query = event.query.toLowerCase();
    // Filtrer les événements non archivés
    const filtered = this.events
      .filter(
        (e) => !e.isArchived && e.title.toLowerCase().includes(query)
      )
      .map((e) => e.title);
    // Supprimer les doublons de noms
    this.filteredEvents = [...new Set(filtered)];
  }

  onEventSelect(event: { value: string }): void {
    const eventName = event.value;
    const selectedEventObj = this.events.find((e) => e.title === eventName && !e.isArchived);
    if (selectedEventObj?.uuid) {
      this.selectedEvent = selectedEventObj;
      this.selectedEventName = selectedEventObj.title;
      // Émettre l'événement sélectionné dans le service pour les autres composants
      this.mapService.setSelectedEvent(selectedEventObj);
      // Persister dans le store et l'URL
      this.eventStoreService.setSelectedEvent(selectedEventObj);
      this.loadPointsAndCenterMap(selectedEventObj.uuid);
    }
  }

  /**
   * Charge les points, areas, paths et security zones de l'événement et centre la carte
   */
  loadPointsAndCenterMap(eventId: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Charger les points, areas, paths et security zones en parallèle
    forkJoin({
      points: this.pointService.getByEventId(eventId),
      areas: this.areaService.getByEventId(eventId),
      paths: this.pathService.getByEventId(eventId),
      securityZones: this.securityZoneService.getByEventId(eventId),
    }).subscribe({
      next: ({ points, areas, paths, securityZones }) => {
        // Trier les points
        const withOrder = points
          .filter((p) => p.order !== undefined && p.order !== null)
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        const withoutOrder = points.filter((p) => p.order === undefined || p.order === null);

        const sortedPoints = [...withOrder, ...withoutOrder];
        // Utiliser le MapService pour la réactivité avec le map-loader
        this.mapService.setPoints(sortedPoints);
        this.mapService.setAreas(areas);
        this.mapService.setPaths(paths);
        this.mapService.setSecurityZones(securityZones);
        this.emptyMessage = 'Aucun point pour cet événement';

        // Extraire les types d'équipements disponibles pour le filtre
        this.extractAvailableZoneTypes(securityZones);

        // Centrer la carte sur les points, areas et paths
        this.centerMapOnEventData(sortedPoints, areas, paths);

        this.isLoading = false;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error("Erreur lors du chargement des données de l'événement:", error);
        this.errorMessage = "Impossible de charger les données de l'événement";
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Centre la carte sur les bounds des points, areas et paths
   */
  private centerMapOnEventData(points: Point[], areas: Area[], paths: RoutePath[]): void {
    const map = this.mapService.getMapInstance();
    if (!map) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L = (window as any).L;
    if (!L) return;

    // Collecter toutes les coordonnées
    const allCoords: [number, number][] = [];

    // Ajouter les coordonnées des points
    points.forEach((p) => {
      if (p.latitude && p.longitude) {
        allCoords.push([p.latitude, p.longitude]);
      }
    });

    // Ajouter les coordonnées des areas
    areas.forEach((a) => {
      const geoJson = typeof a.geoJson === 'string' ? JSON.parse(a.geoJson) : a.geoJson;
      this.extractGeometryCoords(geoJson, allCoords);
    });

    // Ajouter les coordonnées des paths
    paths.forEach((p) => {
      const geoJson = typeof p.geoJson === 'string' ? JSON.parse(p.geoJson) : p.geoJson;
      this.extractGeometryCoords(geoJson, allCoords);
    });

    // Si aucune coordonnée, ne rien faire
    if (allCoords.length === 0) return;

    // Créer les bounds et zoomer dessus
    const bounds = L.latLngBounds(allCoords);

    // Ajouter un padding pour ne pas coller aux bords
    // Prendre en compte la sidebar (300px) et le drawer potentiel (420px)
    map.fitBounds(bounds, {
      padding: [50, 50],
      paddingTopLeft: [350, 50], // Compenser la sidebar
      paddingBottomRight: [50, 50],
      maxZoom: 16, // Réduire le zoom max pour mieux voir l'ensemble
      minZoom: 2, // Permettre un zoom out jusqu'à niveau 2
      animate: true,
      duration: 0.5,
    });
  }

  /**
   * Extrait les coordonnées d'une géométrie GeoJSON
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractGeometryCoords(geoJson: any, coords: [number, number][]): void {
    if (!geoJson) return;

    if (geoJson.type === 'Point') {
      const c = geoJson.coordinates as [number, number];
      coords.push([c[1], c[0]]); // GeoJSON est [lng, lat]
    } else if (geoJson.type === 'LineString') {
      const lineCoords = geoJson.coordinates as [number, number][];
      lineCoords.forEach((c) => coords.push([c[1], c[0]]));
    } else if (geoJson.type === 'Polygon') {
      const polyCoords = geoJson.coordinates as [number, number][][];
      polyCoords.forEach((ring) => ring.forEach((c) => coords.push([c[1], c[0]])));
    }
  }

  loadPointsForEvent(eventId: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Charger les points via le PointService
    this.pointService.getByEventId(eventId).subscribe({
      next: (points) => {
        // Trier les points
        const withOrder = points
          .filter((p) => p.order !== undefined && p.order !== null)
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        const withoutOrder = points.filter((p) => p.order === undefined || p.order === null);

        const sortedPoints = [...withOrder, ...withoutOrder];
        // Utiliser le MapService pour la réactivité avec le map-loader
        this.mapService.setPoints(sortedPoints);
        this.emptyMessage = 'Aucun point pour cet événement';

        this.isLoading = false;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error("Erreur lors du chargement des points de l'événement:", error);
        this.errorMessage = "Impossible de charger les points de l'événement";
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  onPointClick(point: Point): void {
    this.selectedPointUuid = point.uuid;

    // Sélectionner le point avec son ordre réel (ouvrira le drawer)
    this.mapService.selectPoint(point, point.order);

    // Attendre que le drawer s'ouvre puis recentrer avec offset
    setTimeout(() => {
      const map = this.mapService.getMapInstance();
      if (map && point.latitude && point.longitude) {
        // Calculer l'offset pour compenser la sidebar (300px) et le drawer (420px)
        // On décale vers la droite (+) pour que le point apparaisse à gauche/centre
        const offsetX = 15; // Décalage vers la droite pour centrer dans l'espace visible
        const point2D = map.latLngToContainerPoint([point.latitude, point.longitude]);
        point2D.x += offsetX;
        const targetLatLng = map.containerPointToLatLng(point2D);

        map.setView(targetLatLng, 18, {
          animate: true,
          duration: 0.5,
        });
      }
    }, 100);
  }

  openEquipmentManager(): void {
    this.mapService.selectPoint(null);

    if (this.router.url === '/equipments') {
      this.router.navigate(['/map']);
    } else {
      this.router.navigate(['/equipments']);
    }
  }

  openImport(): void {
    this.showImportPopup = true;
  }

  closeImport(): void {
    this.showImportPopup = false;
  }

  onSearch(): void {
    // Trigger debounced search via Subject
    this.searchSubject.next(this.searchQuery);
  }

  goToLocation(result: NominatimResult): void {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    const map = this.mapService.getMapInstance();
    if (map) {
      map.setView([lat, lon], 16, {
        animate: true,
        duration: 0.5,
      });

      // Ajouter un marqueur temporaire avec le style des points
      const L = (window as unknown as { L: typeof import('leaflet') }).L;
      if (L) {
        const marker = L.marker([lat, lon], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: `<div class="marker-pin search-marker">
                     <span class="marker-number">📍</span>
                   </div>`,
            iconSize: [30, 42],
            iconAnchor: [15, 42],
            popupAnchor: [0, -42],
          }),
        })
          .addTo(map)
          .bindPopup(result.display_name)
          .openPopup();

        // Retirer le marqueur après 25 secondes
        setTimeout(() => {
          map.removeLayer(marker);
        }, 25000);
      }
    }

    // Clear search
    this.searchResults = [];
    this.searchQuery = '';
  }

  openExport(): void {
    this.showExportPopup = true;
  }

  closeExport(): void {
    this.showExportPopup = false;
  }

  openEventCreate(): void {
    this.showEventCreatePopup = true;
  }

  closeEventCreate(): void {
    this.showEventCreatePopup = false;
  }

  onEventCreated(event: Event): void {
    // Ajouter l'événement à la liste locale
    this.events.push(event);
    // Sélectionner automatiquement le nouvel événement
    this.selectedEvent = event;
    this.selectedEventName = event.title;
    this.mapService.setSelectedEvent(event);
    // Charger les points (vide pour un nouvel événement)
    this.loadPointsForEvent(event.uuid);
    // Démarrer le mode création d'événement (dessin zone puis chemin)
    this.mapService.startEventCreation(event);
  }

  openEventEdit(): void {
    if (this.selectedEvent) {
      this.showEventEditPopup = true;
    }
  }

  closeEventEdit(): void {
    this.showEventEditPopup = false;
  }

  onEventUpdated(updatedEvent: Event): void {
    // Mettre à jour l'événement dans la liste locale
    const index = this.events.findIndex((e) => e.uuid === updatedEvent.uuid);
    if (index !== -1) {
      this.events[index] = updatedEvent;
    }
    // Mettre à jour la sélection
    this.selectedEvent = updatedEvent;
    this.selectedEventName = updatedEvent.title;
    this.mapService.setSelectedEvent(updatedEvent);
  }

  onEventDeleted(eventUuid: string): void {
    // Retirer l'événement de la liste locale
    this.events = this.events.filter((e) => e.uuid !== eventUuid);
    // Désélectionner l'événement
    this.selectedEvent = null;
    this.selectedEventName = '';
    this.mapService.setSelectedEvent(null);
    // Supprimer du store et de l'URL
    this.eventStoreService.setSelectedEvent(null);
    // Vider les points
    this.mapService.setPoints([]);
    this.emptyMessage = 'Sélectionnez un évènement pour voir ses points';
  }

  onEventCreationConfirmed(): void {
    this.mapService.triggerReloadEvent();
  }

  onEventCreationCancelled(): void {
    if (this.selectedEvent) {
      this.eventService.delete(this.selectedEvent.uuid).subscribe({
        next: () => {
          this.events = this.events.filter((e) => e.uuid !== this.selectedEvent?.uuid);
          this.selectedEvent = null;
          this.selectedEventName = '';
          this.mapService.setSelectedEvent(null);
          this.eventStoreService.setSelectedEvent(null);
          this.mapService.setPoints([]);
          this.emptyMessage = 'Sélectionnez un évènement pour voir ses points';
        },
        error: (error) => {
          console.error("Erreur lors de la suppression de l'événement annulé:", error);
        },
      });
    }
  }

  openGantt(): void {
    const selectedEvent = this.selectedEvent || this.mapService.getSelectedEvent();
    if (!selectedEvent) {
      console.warn("Aucun événement sélectionné — impossible d'afficher la frise.");
      return;
    }

    // La timeline utilise maintenant les SecurityZones du MapService
    // Il suffit d'ouvrir la timeline, elle récupère les données automatiquement
    const zones = this.mapService.getSecurityZones();
    if (zones.length === 0) {
      console.warn('Aucun équipement à afficher dans la frise.');
      return;
    }

    // Ouvrir la timeline via le service (ferme automatiquement le point drawer)
    this.mapService.openTimeline();
  }

  closeTimeline(): void {
    this.mapService.closeTimeline();
  }

  // Points search and pagination methods
  onPointsSearchChange(): void {
    this.currentPage = 1;
    this.applyPointsFiltersAndPagination();
  }

  applyPointsFiltersAndPagination(): void {
    // Filtrer d'abord les points d'intérêt
    const regularPoints = this.allPoints.filter((point) => !point.isPointOfInterest);

    // Filtrer les points selon la recherche
    const filtered = this.filterPoints(regularPoints, this.pointsSearchQuery);

    // Trier les points par date d'installation
    this.filteredPoints = this.sortPointsByInstalledDate(filtered);

    // Calculer le nombre total de pages
    this.totalPages = Math.ceil(this.filteredPoints.length / this.itemsPerPage);

    // S'assurer qu'on a au moins 1 page si on a des points
    if (this.totalPages === 0 && this.filteredPoints.length > 0) {
      this.totalPages = 1;
    }

    // S'assurer que la page courante est valide
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }

    // Appliquer la pagination
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedPoints = this.filteredPoints.slice(startIndex, endIndex);
  }

  sortPointsByInstalledDate(points: Point[]): Point[] {
    return [...points].sort((a, b) => {
      // Sort by order if available
      const orderA = a.order ?? Infinity;
      const orderB = b.order ?? Infinity;
      return orderA - orderB;
    });
  }

  filterPoints(points: Point[], query: string): Point[] {
    if (!query || query.trim() === '') {
      return points;
    }

    const lowerQuery = query.toLowerCase().trim();
    return points.filter((point) => {
      // Recherche dans le commentaire (nom)
      if (point.comment && point.comment.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Recherche dans le numéro d'ordre
      if (point.order && point.order.toString().includes(lowerQuery)) {
        return true;
      }

      return false;
    });
  }

  goToPointsPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyPointsFiltersAndPagination();
    }
  }

  previousPointsPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.applyPointsFiltersAndPagination();
    }
  }

  nextPointsPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.applyPointsFiltersAndPagination();
    }
  }

  getPointsPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;

    if (this.totalPages <= maxPagesToShow) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, this.currentPage - 2);
      const endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

      if (endPage - startPage < maxPagesToShow - 1) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  // ============= Sidebar Toggle =============

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    this.mapService.setSidebarCollapsed(this.isCollapsed);
  }

  // ============= Security Zones Methods =============

  switchTab(tab: 'points' | 'zones'): void {
    this.activeTab = tab;
  }

  onZoneClick(zone: SecurityZone): void {
    // Centrer la carte sur la zone et ouvrir le drawer
    this.mapService.focusOnSecurityZone(zone);
    this.mapService.selectSecurityZone(zone);
  }

  onZoneTypeChange(type: string): void {
    this.selectedZoneType = type;
    this.zonesCurrentPage = 1;
    this.applyZonesFiltersAndPagination();
  }

  extractAvailableZoneTypes(zones: SecurityZone[]): void {
    const typesSet = new Set<string>();
    zones.forEach((zone) => {
      if (zone.equipment?.type) {
        typesSet.add(zone.equipment.type);
      }
    });
    this.availableZoneTypes = Array.from(typesSet).sort();
  }

  applyZonesFiltersAndPagination(): void {
    // Filtrer les zones par type
    this.filteredSecurityZones = this.filterZonesByType(
      this.allSecurityZones,
      this.selectedZoneType
    );

    // Mettre à jour les zones visibles sur la carte
    if (this.selectedZoneType === 'all' || !this.selectedZoneType) {
      // Aucun filtre actif -> afficher toutes les zones
      this.mapService.setVisibleSecurityZoneIds(null);
    } else {
      // Filtre actif -> n'afficher que les zones filtrées
      const visibleIds = this.filteredSecurityZones.map((z) => z.uuid);
      this.mapService.setVisibleSecurityZoneIds(visibleIds);
    }

    // Calculer la pagination
    this.zonesTotalPages = Math.max(
      1,
      Math.ceil(this.filteredSecurityZones.length / this.itemsPerPage)
    );

    // Ajuster la page courante si nécessaire
    if (this.zonesCurrentPage > this.zonesTotalPages) {
      this.zonesCurrentPage = this.zonesTotalPages;
    }

    // Appliquer la pagination
    const startIndex = (this.zonesCurrentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedSecurityZones = this.filteredSecurityZones.slice(startIndex, endIndex);
  }

  private filterZonesByType(zones: SecurityZone[], type: string): SecurityZone[] {
    if (type === 'all' || !type) {
      return zones;
    }

    return zones.filter((zone) => {
      return zone.equipment?.type === type;
    });
  }

  goToZonesPage(page: number): void {
    if (page >= 1 && page <= this.zonesTotalPages) {
      this.zonesCurrentPage = page;
      this.applyZonesFiltersAndPagination();
    }
  }

  previousZonesPage(): void {
    if (this.zonesCurrentPage > 1) {
      this.zonesCurrentPage--;
      this.applyZonesFiltersAndPagination();
    }
  }

  nextZonesPage(): void {
    if (this.zonesCurrentPage < this.zonesTotalPages) {
      this.zonesCurrentPage++;
      this.applyZonesFiltersAndPagination();
    }
  }

  getZonesPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;

    if (this.zonesTotalPages <= maxPagesToShow) {
      for (let i = 1; i <= this.zonesTotalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, this.zonesCurrentPage - 2);
      const endPage = Math.min(this.zonesTotalPages, startPage + maxPagesToShow - 1);

      if (endPage - startPage < maxPagesToShow - 1) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  getZoneEquipmentName(zone: SecurityZone): string {
    return zone.equipment?.type || 'Équipement inconnu';
  }

  getZoneDateRange(zone: SecurityZone): string {
    const install = zone.installationDate
      ? new Date(zone.installationDate).toLocaleDateString('fr-FR')
      : '?';
    const removal = zone.removalDate ? new Date(zone.removalDate).toLocaleDateString('fr-FR') : '?';
    return `${install} - ${removal}`;
  }

  // ============= Point Count Methods =============

  getRegularPointsCount(): number {
    // Compter uniquement les points qui ne sont pas des points d'intérêt
    return this.allPoints.filter((point) => !point.isPointOfInterest).length;
  }
}
