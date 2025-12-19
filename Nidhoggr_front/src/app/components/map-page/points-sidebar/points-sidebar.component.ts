import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AutoComplete } from 'primeng/autocomplete';
import { PointService } from '../../../services/PointService';
import { EventService } from '../../../services/EventService';
import { GeometryService } from '../../../services/GeometryService';
import { MapService } from '../../../services/MapService';
import { NominatimService, NominatimResult } from '../../../services/NominatimService';
import { Point } from '../../../models/pointModel';
import { Event } from '../../../models/eventModel';
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
  // Observable pour la liste des points - utilise directement le MapService pour la réactivité
  points$!: Observable<Point[]>;

  selectedPointUuid: string | null = null;
  isLoading = false;
  errorMessage = '';
  emptyMessage = 'Sélectionnez un évènement pour voir ses points';
  private pointsSubscription?: Subscription;

  // Timeline properties
  timelineItems: Array<{ id: string; title: string; start?: Date; end?: Date }> = [];
  showTimeline$!: Observable<boolean>;
  timelinePoints: Point[] = [];

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

  constructor(
    private pointService: PointService,
    private eventService: EventService,
    private geometryService: GeometryService,
    private mapService: MapService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private nominatimService: NominatimService
  ) {
    // Initialiser points$ après l'injection de mapService
    this.points$ = this.mapService.points$;
    // Initialiser showTimeline$
    this.showTimeline$ = this.mapService.timelineVisible$;
  }

  ngOnInit(): void {
    // Charger la liste des événements
    this.loadEvents();

    // S'abonner aux changements de points pour déclencher la détection de changements
    this.pointsSubscription = this.points$.subscribe((points) => {
      this.allPoints = points;
      this.applyPointsFiltersAndPagination();
      this.cdr.markForCheck();
    });

    // Initialiser les points à vide APRÈS la subscription (aucun événement sélectionné)
    this.mapService.setPoints([]);

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
    this.searchSubscription?.unsubscribe();
  }

  loadEvents(): void {
    this.eventService.getAll().subscribe({
      next: (events) => {
        const uniqueEvents = events.filter(
          (event, index, self) => index === self.findIndex((e) => e.uuid === event.uuid)
        );
        this.events = uniqueEvents;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des événements:', error);
      },
    });
  }

  filterEvents(event: { query: string }): void {
    const query = event.query.toLowerCase();
    const filtered = this.events
      .filter(
        (e) => e.name.toLowerCase().includes(query) || e.description?.toLowerCase().includes(query)
      )
      .map((e) => e.name);
    // Supprimer les doublons de noms
    this.filteredEvents = [...new Set(filtered)];
  }

  onEventSelect(event: { value: string }): void {
    const eventName = event.value;
    const selectedEventObj = this.events.find((e) => e.name === eventName);
    if (selectedEventObj?.uuid) {
      this.selectedEvent = selectedEventObj;
      this.selectedEventName = selectedEventObj.name;
      // Émettre l'événement sélectionné dans le service pour les autres composants
      this.mapService.setSelectedEvent(selectedEventObj);
      this.loadPointsAndCenterMap(selectedEventObj.uuid);
    }
  }

  /**
   * Charge les points et géométries de l'événement et centre la carte
   */
  loadPointsAndCenterMap(eventId: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Charger les points et géométries en parallèle
    forkJoin({
      points: this.pointService.getByEventId(eventId),
      geometries: this.geometryService.getByEventId(eventId),
    }).subscribe({
      next: ({ points, geometries }) => {
        // Trier les points
        const withOrder = points
          .filter((p) => p.order !== undefined && p.order !== null)
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        const withoutOrder = points.filter((p) => p.order === undefined || p.order === null);

        const sortedPoints = [...withOrder, ...withoutOrder];
        // Utiliser le MapService pour la réactivité avec le map-loader
        this.mapService.setPoints(sortedPoints);
        this.emptyMessage = 'Aucun point pour cet événement';

        // Centrer la carte sur les points et géométries
        this.centerMapOnEventData(sortedPoints, geometries);

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
   * Centre la carte sur les bounds des points et géométries
   */
  private centerMapOnEventData(
    points: Point[],
    geometries: import('../../../models/geometryModel').Geometry[]
  ): void {
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

    // Ajouter les coordonnées des géométries
    geometries.forEach((g) => {
      this.extractGeometryCoords(g.geoJson, allCoords);
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
      maxZoom: 18,
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

    // Trouver l'index du point dans la liste filtrée
    const pointIndex = this.filteredPoints.findIndex((p) => p.uuid === point.uuid);

    // Sélectionner le point (ouvrira le drawer)
    this.mapService.selectPoint(point, pointIndex + 1);

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
    this.selectedEventName = event.name;
    this.mapService.setSelectedEvent(event);
    // Charger les points (vide pour un nouvel événement)
    this.loadPointsForEvent(event.uuid);
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
    this.selectedEventName = updatedEvent.name;
    this.mapService.setSelectedEvent(updatedEvent);
  }

  onEventDeleted(eventUuid: string): void {
    // Retirer l'événement de la liste locale
    this.events = this.events.filter((e) => e.uuid !== eventUuid);
    // Désélectionner l'événement
    this.selectedEvent = null;
    this.selectedEventName = '';
    this.mapService.setSelectedEvent(null);
    // Vider les points
    this.mapService.setPoints([]);
    this.emptyMessage = 'Sélectionnez un évènement pour voir ses points';
  }

  openGantt(): void {
    const selectedEvent = this.selectedEvent || this.mapService.getSelectedEvent();
    if (!selectedEvent) {
      console.warn("Aucun événement sélectionné — impossible d'afficher la frise.");
      return;
    }
    this.pointService.getByEventId(selectedEvent.uuid).subscribe({
      next: (points) => {
        if (!points || points.length === 0) {
          console.warn('Aucun point à afficher dans la frise.');
          return;
        }
        // Filtrer uniquement les points avec les deux dates (installedAt ET removedAt)
        const pointsWithBothDates = points.filter((p) => p.installedAt && p.removedAt);

        if (pointsWithBothDates.length === 0) {
          console.warn('Aucun point avec date de pose ET de dépose.');
          return;
        }

        // Trier par date d'installation
        const sortedPoints = [...pointsWithBothDates].sort((a, b) => {
          const dateA = a.installedAt ? new Date(a.installedAt).getTime() : 0;
          const dateB = b.installedAt ? new Date(b.installedAt).getTime() : 0;
          return dateA - dateB;
        });

        this.timelineItems = sortedPoints.map((p) => ({
          id: p.uuid,
          title: p.comment || `Point ${p.uuid}`,
          start: new Date(p.installedAt!),
          end: new Date(p.removedAt!),
        }));

        this.timelinePoints = sortedPoints;
        
        // Ouvrir la timeline via le service (ferme automatiquement le point drawer)
        this.mapService.openTimeline();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des points pour la frise :', err);
      },
    });
  }
  onTimelinePointHovered(pointId: string): void {
    const hoveredPoint = this.timelinePoints.find((p) => p.uuid === pointId);
    if (hoveredPoint) {
      this.mapService.focusOnPoint(hoveredPoint);
    }
  }

  onTimelinePointHoverEnd(): void {
    // Optionnel: réinitialiser le focus de la map
    // this.mapService.resetFocus();
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
    // Filtrer les points selon la recherche
    const filtered = this.filterPoints(this.allPoints, this.pointsSearchQuery);
    
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
      const dateA = a.installedAt ? new Date(a.installedAt).getTime() : Infinity;
      const dateB = b.installedAt ? new Date(b.installedAt).getTime() : Infinity;
      return dateA - dateB;
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
}
