import { Injectable } from '@angular/core';
import { EventService } from '../../services/EventService';
import { MapService } from '../../services/MapService';
import { Event, EventStatus } from '../../models/eventModel';

export interface EventFormData {
  title: string;
  startDate: string;
  endDate: string;
  status: EventStatus;
  minDurationMinutes: number | null;
  maxDurationMinutes: number | null;
}

@Injectable()
export class EventCreatePopupPresenter {
  formData: EventFormData = {
    title: '',
    startDate: '',
    endDate: '',
    status: EventStatus.ToOrganize,
    minDurationMinutes: null,
    maxDurationMinutes: null
  };

  isSubmitting = false;
  errorMessage = '';

  constructor(
    private eventService: EventService,
    private mapService: MapService
  ) {}

  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  reset(): void {
    this.formData = {
      title: '',
      startDate: '',
      endDate: '',
      status: EventStatus.ToOrganize,
      minDurationMinutes: null,
      maxDurationMinutes: null
    };
    this.isSubmitting = false;
    this.errorMessage = '';
  }

  validate(): boolean {
    if (!this.formData.title.trim()) {
      this.errorMessage = 'Le titre de l\'événement est requis.';
      return false;
    }
    
    // Vérifier que la date de fin n'est pas inférieure à la date de début
    if (this.formData.startDate && this.formData.endDate) {
      const startDate = new Date(this.formData.startDate);
      const endDate = new Date(this.formData.endDate);
      if (endDate < startDate) {
        this.errorMessage = 'La date de fin ne peut pas être antérieure à la date de début.';
        return false;
      }
    }
    
    // Vérifier que les durées sont positives
    if (this.formData.minDurationMinutes !== null && this.formData.minDurationMinutes < 0) {
      this.errorMessage = 'La durée minimale doit être supérieure ou égale à 0.';
      return false;
    }
    
    if (this.formData.maxDurationMinutes !== null && this.formData.maxDurationMinutes < 0) {
      this.errorMessage = 'La durée maximale doit être supérieure ou égale à 0.';
      return false;
    }
    
    // Vérifier que la durée max est supérieure à la durée min
    if (this.formData.minDurationMinutes !== null && this.formData.maxDurationMinutes !== null) {
      if (this.formData.maxDurationMinutes < this.formData.minDurationMinutes) {
        this.errorMessage = 'La durée maximale ne peut pas être inférieure à la durée minimale.';
        return false;
      }
    }
    
    this.errorMessage = '';
    return true;
  }

  createEvent(): Promise<Event> {
    return new Promise((resolve, reject) => {
      if (!this.validate()) {
        reject(new Error(this.errorMessage));
        return;
      }

      this.isSubmitting = true;
      this.errorMessage = '';

      const event: Event = {
        uuid: this.generateUuid(),
        title: this.formData.title.trim(),
        startDate: this.formData.startDate ? new Date(this.formData.startDate) : new Date(),
        endDate: this.formData.endDate ? new Date(this.formData.endDate) : new Date(),
        status: this.formData.status,
        minDurationMinutes: this.formData.minDurationMinutes ?? 1,
        maxDurationMinutes: this.formData.maxDurationMinutes ?? 1
      };

      this.eventService.create(event).subscribe({
        next: (createdEvent) => {
          this.isSubmitting = false;
          // Ajouter l'événement à la liste observable
          this.mapService.addEvent(createdEvent);
          this.reset();
          resolve(createdEvent);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.errorMessage = 'Erreur lors de la création de l\'événement. Veuillez réessayer.';
          console.error('Erreur lors de la création de l\'événement:', error);
          reject(error);
        }
      });
    });
  }
}
