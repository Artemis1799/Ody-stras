import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Event, EventStatus } from '../../models/eventModel';
import { EventService } from '../../services/EventService';
import { DeletePopupComponent } from '../delete-popup/delete-popup';

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

  constructor(private eventService: EventService) {}

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
        this.eventUpdated.emit(result);
        this.close.emit();
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = 'Erreur lors de la mise à jour de l\'événement';
        console.error('Erreur lors de la mise à jour:', error);
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
        this.eventDeleted.emit(this.event.uuid);
        this.close.emit();
      },
      error: (error) => {
        this.showDeleteConfirm = false;
        this.errorMessage = 'Erreur lors de la suppression de l\'événement';
        console.error('Erreur lors de la suppression:', error);
      }
    });
  }
}
