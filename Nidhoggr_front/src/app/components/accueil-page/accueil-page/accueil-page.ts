import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EventService } from '../../../services/EventService';

@Component({
  selector: 'app-accueil-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './accueil-page.html',
  styleUrl: './accueil-page.scss',
})
export class AccueilPage {
  private eventService = inject(EventService);
  
  readonly favoriteEvents = this.eventService.favoriteEvents;

  constructor() {
    // Charger les événements si pas encore chargés
    if (!this.eventService.initialized()) {
      this.eventService.load();
    }
  }

  getStatusLabel(status: number): string {
    const labels: { [key: number]: string } = {
      0: '📋 À organiser',
      1: '🚀 En cours',
      2: '🔧 En installation',
      3: '📦 En désinstallation',
      4: '✅ Terminé'
    };
    return labels[status] || 'Inconnu';
  }

  getStatusClass(status: number): string {
    const classes: { [key: number]: string } = {
      0: 'to-organize',
      1: 'in-progress',
      2: 'installation',
      3: 'uninstallation',
      4: 'completed'
    };
    return classes[status] || '';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
}
