import { Injectable } from '@angular/core';
import { EventService } from '../../services/EventService';
import { Event, EventStatus } from '../../models/eventModel';

export interface EventFormData {
  name: string;
  description: string;
  startDate: string;
  status: EventStatus;
}

@Injectable()
export class EventCreatePopupPresenter {
  formData: EventFormData = {
    name: '',
    description: '',
    startDate: '',
    status: EventStatus.ToOrganize
  };

  isSubmitting = false;
  errorMessage = '';

  constructor(private eventService: EventService) {}

  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  reset(): void {
    this.formData = {
      name: '',
      description: '',
      startDate: '',
      status: EventStatus.ToOrganize
    };
    this.isSubmitting = false;
    this.errorMessage = '';
  }

  validate(): boolean {
    if (!this.formData.name.trim()) {
      this.errorMessage = 'Le nom de l\'événement est requis.';
      return false;
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
        name: this.formData.name.trim(),
        description: this.formData.description.trim(),
        startDate: this.formData.startDate ? new Date(this.formData.startDate) : undefined,
        status: this.formData.status
      };

      this.eventService.create(event).subscribe({
        next: (createdEvent) => {
          this.isSubmitting = false;
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
