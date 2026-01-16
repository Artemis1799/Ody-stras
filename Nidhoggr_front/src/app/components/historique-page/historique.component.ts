import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EventService } from '../../services/EventService';
import { MapService } from '../../services/MapService';
import { ToastService } from '../../services/ToastService';
import { Event, EventStatus } from '../../models/eventModel';
import { DeletePopupComponent } from '../../shared/delete-popup/delete-popup';

@Component({
  selector: 'app-historique',
  standalone: true,
  imports: [CommonModule, DeletePopupComponent],
  templateUrl: './historique.component.html',
  styleUrl: './historique.component.scss'
})
export class HistoriqueComponent implements OnInit {
  private eventService = inject(EventService);
  private mapService = inject(MapService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  
  // Signal pour les événements archivés
  readonly archivedEvents = computed(() => this.eventService.archivedEvents());
  readonly isLoading = computed(() => this.eventService.loading());
  
  // Pour la popup de suppression
  showDeleteConfirm = false;
  eventToDelete: Event | null = null;

  ngOnInit(): void {
    this.eventService.load();
  }

  getStatusLabel(status: EventStatus): string {
    switch (status) {
      case EventStatus.ToOrganize:
        return '📋 À organiser';
      case EventStatus.InProgress:
        return '🚀 En cours';
      case EventStatus.Installation:
        return '🔧 En installation';
      case EventStatus.Uninstallation:
        return '📦 En désinstallation';
      case EventStatus.Completed:
        return '✅ Terminé';
      default:
        return 'Inconnu';
    }
  }

  formatDate(date: Date): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  viewEvent(event: Event): void {
    this.mapService.setSelectedEvent(event);
    this.router.navigate(['/evenements']);
  }

  confirmDelete(event: Event): void {
    this.eventToDelete = event;
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.eventToDelete = null;
  }

  deleteEvent(): void {
    if (!this.eventToDelete) return;
    
    const eventName = this.eventToDelete.title;
    this.eventService.delete(this.eventToDelete.uuid).subscribe({
      next: () => {
        this.toastService.showSuccess('Événement supprimé', `L'événement "${eventName}" a été supprimé définitivement`);
        this.showDeleteConfirm = false;
        this.eventToDelete = null;
      },
      error: () => {
        this.toastService.showError('Erreur', 'Impossible de supprimer l\'événement');
      }
    });
  }
}
