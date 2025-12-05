import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AutoComplete } from 'primeng/autocomplete';
import { PointService } from '../../../services/PointService';
import { EventService } from '../../../services/EventService';
import { MapService } from '../../../services/MapService';
import { NominatimService, NominatimResult } from '../../../services/NominatimService';
import { Point } from '../../../models/pointModel';
import { Event } from '../../../models/eventModel';
import { Subscription, Subject, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { ExportPopup } from '../../../shared/export-popup/export-popup';
import { ImportPopup } from '../../../shared/import-popup/import-popup';
import { EventCreatePopup } from '../../../shared/event-create-popup/event-create-popup';
import { EventEditPopup } from '../../../shared/event-edit-popup/event-edit-popup';
import { PointsListComponent } from './points-list/points-list.component';
import { MatDialog } from '@angular/material/dialog';
import { TimelinePopupComponent } from '../../../shared/timeline-popup/timeline-popup.component';

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

  constructor(
    private pointService: PointService,
    private eventService: EventService,
    private mapService: MapService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private nominatimService: NominatimService,
    private dialog: MatDialog
  ) {
    // Initialiser points$ après l'injection de mapService
    this.points$ = this.mapService.points$;
  }

  ngOnInit(): void {
    // Initialiser les points à vide AVANT tout (aucun événement sélectionné)
    this.mapService.setPoints([]);

    // Charger la liste des événements
    this.loadEvents();

    // S'abonner aux changements de points pour déclencher la détection de changements
    this.pointsSubscription = this.points$.subscribe(() => {
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
      this.loadPointsForEvent(selectedEventObj.uuid);
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

    // Sélectionner le point (ouvrira le drawer)
    this.mapService.selectPoint(point);

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

        map.setView(targetLatLng, 17, {
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

        // Trier et préparer les items pour la frise
        const withOrder = points
          .filter((p) => p.order !== undefined && p.order !== null)
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        const withoutOrder = points.filter((p) => p.order === undefined || p.order === null);
        const sortedPoints = [...withOrder, ...withoutOrder];

        const items = sortedPoints.map((p) => ({
          id: p.uuid,
          title: p.comment || `Point ${p.uuid}`,
          start: p.installedAt ? new Date(p.installedAt) : undefined,
          end: p.removedAt ? new Date(p.removedAt) : undefined,
        }));

        this.dialog.open(TimelinePopupComponent, {
          width: '70vw',
          maxWidth: '1800px',
          maxHeight: '95vh',
          data: { items },
        });
      },
      error: (err) => {
        console.error('Erreur lors du chargement des points pour la frise :', err);
      },
    });
  }
}
