import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Event, EventStatus } from '../../models/eventModel';
import { EventService } from '../../services/EventService';
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
    name: '',
    description: '',
    startDate: '',
    status: EventStatus.ToOrganize
  };

  isSubmitting = false;
  errorMessage = '';
  showDeleteConfirm = false;

  constructor(
    private eventService: EventService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    if (this.event) {
      this.formData.name = this.event.name || '';
      this.formData.description = this.event.description || '';
      this.formData.status = this.event.status;
      
      if (this.event.startDate) {
        const date = new Date(this.event.startDate);
        this.formData.startDate = date.toISOString().slice(0, 16);
      }
    }
  }

  onSubmit(): void {
    if (!this.formData.name?.trim()) {
      this.errorMessage = 'Le nom de l\'événement est requis';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const updatedEvent: Event = {
      ...this.event,
      name: this.formData.name.trim(),
      description: this.formData.description?.trim() || '',
      status: this.formData.status,
      startDate: this.formData.startDate ? new Date(this.formData.startDate) : undefined
    };

    this.eventService.update(this.event.uuid, updatedEvent).subscribe({
      next: (result) => {
        this.isSubmitting = false;
        this.toastService.showSuccess('Événement modifié', `L'événement "${updatedEvent.name}" a été modifié avec succès`);
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
        this.toastService.showSuccess('Événement supprimé', `L'événement "${this.event.name}" a été supprimé`);
        this.eventDeleted.emit(this.event.uuid);
        this.close.emit();
      },
      error: () => {
        this.toastService.showError('Erreur', 'Impossible de supprimer l\'événement');
      }
    });
  }
}
