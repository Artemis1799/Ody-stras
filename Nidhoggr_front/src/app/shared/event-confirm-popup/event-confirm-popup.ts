import { Component, EventEmitter, OnDestroy, OnInit, Output, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { MapService, EventCreationMode } from '../../services/MapService';
import { Event } from '../../models/eventModel';
import { AreaService } from '../../services/AreaService';
import { PathService } from '../../services/PathService';
import { EventService } from '../../services/EventService';
import { ToastService } from '../../services/ToastService';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-event-confirm-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-confirm-popup.html',
  styleUrls: ['./event-confirm-popup.scss']
})
export class EventConfirmPopup implements OnInit, OnDestroy {
  @Output() eventConfirmed = new EventEmitter<Event>();
  @Output() cancelled = new EventEmitter<void>();

  mode: EventCreationMode | null = null;
  isMinimized = false;
  isSaving = false;
  private subscription?: Subscription;

  constructor(
    private mapService: MapService,
    private areaService: AreaService,
    private pathService: PathService,
    private eventService: EventService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subscription = this.mapService.eventCreationMode$.subscribe(mode => {
      this.mode = mode;
      if (mode.step === 'confirm') {
        this.isMinimized = false;
      }
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  get isVisible(): boolean {
    return this.mode?.active === true && this.mode?.step === 'confirm';
  }

  get eventTitle(): string {
    return this.mode?.event?.title ?? '';
  }

  get hasZone(): boolean {
    return !!this.mode?.zoneGeoJson;
  }

  toggleMinimize(): void {
    this.isMinimized = !this.isMinimized;
  }

  onModifyZone(): void {
    this.mapService.backToZoneDrawing();
  }

  onModifyPath(): void {
    this.mapService.backToPathDrawing();
  }

  onCancel(): void {
    // Supprimer l'événement créé puisqu'on annule sa création
    if (this.mode?.event?.uuid) {
      const eventUuid = this.mode.event.uuid;
      this.eventService.delete(eventUuid).subscribe({
        next: () => {
          this.toastService.showSuccess('Création annulée', 'L\'événement a été supprimé');
          this.mapService.removeEvent(eventUuid);
          // Vider le sélecteur d'événement car l'événement n'existe plus
          this.mapService.setSelectedEvent(null);
          this.mapService.cancelEventCreation();
          this.cancelled.emit();
        },
        error: (error) => {
          console.error('Erreur lors de la suppression de l\'événement:', error);
          this.toastService.showError('Erreur', 'Impossible de supprimer l\'événement');
          this.mapService.removeEvent(eventUuid);
          this.mapService.setSelectedEvent(null);
          this.mapService.cancelEventCreation();
          this.cancelled.emit();
        }
      });
    } else {
      this.mapService.setSelectedEvent(null);
      this.mapService.cancelEventCreation();
      this.cancelled.emit();
    }
  }

  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  onConfirm(): void {
    if (!this.mode?.event || !this.mode.pathGeoJson) {
      this.toastService.showError('Erreur', 'Données manquantes pour confirmer l\'événement');
      return;
    }

    this.isSaving = true;
    const event = this.mode.event;
    const hasZone = !!this.mode.zoneGeoJson;

    // Si pas de zone, seulement créer le path
    if (!hasZone) {
      const pathData = {
        uuid: this.generateUuid(),
        eventId: event.uuid,
        name: `Tracé - ${event.title}`,
        colorHex: '#a91a1a',
        startDate: new Date(),
        fastestEstimatedSpeed: 5,
        slowestEstimatedSpeed: 3,
        geoJson: this.mode.pathGeoJson
      };

      this.pathService.create(pathData).subscribe({
        next: (path) => {
          this.isSaving = false;
          
          // Ajouter le path au MapService
          this.mapService.addPath(path);
          
          // Mettre la visibilité de l'area de l'événement à false (pas d'area créée)
          this.mapService.setEventAreaVisible(false);
          
          // Sélectionner l'événement
          this.mapService.setSelectedEvent(event);
          
          this.toastService.showSuccess(
            'Événement créé',
            `L'événement "${event.title}" a été créé avec son tracé`
          );
          this.mapService.completeEventCreation();
          this.eventConfirmed.emit(event);
        },
        error: (error) => {
          this.isSaving = false;
          console.error('Erreur lors de la sauvegarde:', error);
          this.toastService.showError('Erreur', 'Impossible de sauvegarder le tracé');
        }
      });
      return;
    }

    // Créer l'Area et le Path en parallèle
    const areaData = {
      uuid: this.generateUuid(),
      eventId: event.uuid,
      name: `Zone - ${event.title}`,
      colorHex: '#3388ff',
      geoJson: this.mode.zoneGeoJson!
    };

    const pathData = {
      uuid: this.generateUuid(),
      eventId: event.uuid,
      name: `Tracé - ${event.title}`,
      colorHex: '#a91a1a',
      startDate: new Date(),
      fastestEstimatedSpeed: 5,
      slowestEstimatedSpeed: 3,
      geoJson: this.mode.pathGeoJson!
    };

    forkJoin({
      area: this.areaService.create(areaData),
      path: this.pathService.create(pathData)
    }).subscribe({
      next: ({ area, path }) => {
        this.isSaving = false;
        
        // Ajouter les géométries créées au MapService pour qu'elles soient affichées
        this.mapService.addArea(area);
        this.mapService.addPath(path);
        
        // Mettre la visibilité de l'area de l'événement à true (area créée)
        this.mapService.setEventAreaVisible(true);
        
        // Sélectionner l'événement pour que la carte charge ses géométries
        this.mapService.setSelectedEvent(event);
        
        this.toastService.showSuccess(
          'Événement créé',
          `L'événement "${event.title}" a été créé avec sa zone et son tracé`
        );
        this.mapService.completeEventCreation();
        this.eventConfirmed.emit(event);
      },
      error: (error) => {
        this.isSaving = false;
        console.error('Erreur lors de la sauvegarde:', error);
        this.toastService.showError('Erreur', 'Impossible de sauvegarder la zone et le tracé');
      }
    });
  }
}
