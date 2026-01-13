import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Event, EventStatus } from '../../models/eventModel';
import { EventService } from '../../services/EventService';
import { MapService } from '../../services/MapService';
import { DeletePopupComponent } from '../delete-popup/delete-popup';
import { ToastService } from '../../services/ToastService';

@Component({
  selector: 'app-event-edit-popup',
  standalone: true,
  imports: [CommonModule, FormsModule, DeletePopupComponent],
  templateUrl: './event-edit-popup.html',
  styleUrls: ['./event-edit-popup.scss']
})
export class EventEditPopup implements OnInit {
  @Input() event!: Event;
  @Output() close = new EventEmitter<void>();
  @Output() eventUpdated = new EventEmitter<Event>();
  @Output() eventDeleted = new EventEmitter<string>();

  formData = {
    title: '',
    startDate: '',
    endDate: '',
    status: EventStatus.ToOrganize,
    minDurationMinutes: null as number | null,
    maxDurationMinutes: null as number | null
  };

  isSubmitting = false;
  errorMessage = '';
  showDeleteConfirm = false;
  eventAreaVisible = true;

  constructor(
    private eventService: EventService,
    private mapService: MapService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    // Récupérer l'état actuel de la visibilité de l'area
    this.eventAreaVisible = this.mapService.getEventAreaVisible();
    
    if (this.event) {
      this.formData.title = this.event.title || '';
      this.formData.status = this.event.status;
      this.formData.minDurationMinutes = this.event.minDurationMinutes ?? null;
      this.formData.maxDurationMinutes = this.event.maxDurationMinutes ?? null;
      
      if (this.event.startDate) {
        const date = new Date(this.event.startDate);
        this.formData.startDate = date.toISOString().slice(0, 16);
      }
      if (this.event.endDate) {
        const date = new Date(this.event.endDate);
        this.formData.endDate = date.toISOString().slice(0, 16);
      }
    }
  }

  // eslint-disable-next-line complexity
  onSubmit(): void {
    if (!this.formData.title?.trim()) {
      this.errorMessage = 'Le titre de l\'événement est requis';
      return;
    }

    // Vérifier que la date de fin n'est pas inférieure à la date de début
    if (this.formData.startDate && this.formData.endDate) {
      const startDate = new Date(this.formData.startDate);
      const endDate = new Date(this.formData.endDate);
      if (endDate < startDate) {
        this.errorMessage = 'La date de fin ne peut pas être antérieure à la date de début.';
        return;
      }
    }

    // Vérifier que les durées sont positives
    if (this.formData.minDurationMinutes !== null && this.formData.minDurationMinutes < 0) {
      this.errorMessage = 'La durée minimale doit être supérieure ou égale à 0.';
      return;
    }
    
    if (this.formData.maxDurationMinutes !== null && this.formData.maxDurationMinutes < 0) {
      this.errorMessage = 'La durée maximale doit être supérieure ou égale à 0.';
      return;
    }
    
    // Vérifier que la durée max est supérieure à la durée min
    if (this.formData.minDurationMinutes !== null && this.formData.maxDurationMinutes !== null) {
      if (this.formData.maxDurationMinutes < this.formData.minDurationMinutes) {
        this.errorMessage = 'La durée maximale ne peut pas être inférieure à la durée minimale.';
        return;
      }
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const updatedEvent: Event = {
      ...this.event,
      title: this.formData.title.trim(),
      status: this.formData.status,
      startDate: this.formData.startDate ? new Date(this.formData.startDate) : new Date(),
      endDate: this.formData.endDate ? new Date(this.formData.endDate) : new Date(),
      minDurationMinutes: this.formData.minDurationMinutes ?? undefined,
      maxDurationMinutes: this.formData.maxDurationMinutes ?? undefined
    };

    this.eventService.update(this.event.uuid, updatedEvent).subscribe({
      next: (result) => {
        this.isSubmitting = false;
        this.toastService.showSuccess('Événement modifié', `L'événement "${updatedEvent.title}" a été modifié avec succès`);
        this.eventUpdated.emit(result);
        this.close.emit();
      },
      error: () => {
        this.toastService.showError('Erreur', 'Impossible de modifier l\'événement');
      }
    });
  }

  confirmDelete(): void {
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
  }

  deleteEvent(): void {
    this.eventService.delete(this.event.uuid).subscribe({
      next: () => {
        this.showDeleteConfirm = false;
        this.toastService.showSuccess('Événement supprimé', `L'événement "${this.event.title}" a été supprimé`);
        this.eventDeleted.emit(this.event.uuid);
        this.close.emit();
      },
      error: () => {
        this.toastService.showError('Erreur', 'Impossible de supprimer l\'événement');
      }
    });
  }

  toggleEventAreaVisibility(): void {
    this.eventAreaVisible = !this.eventAreaVisible;
    this.mapService.setEventAreaVisible(this.eventAreaVisible);
  }
}
