import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

interface TimelineItem {
  id: string;
  title: string;
  start?: Date;
  end?: Date;
}

@Component({
  selector: 'app-timeline-popup',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './timeline-popup.component.html',
  styleUrls: ['./timeline-popup.component.scss'],
})
export class TimelinePopupComponent {
  @Input() timelineItems: TimelineItem[] = [];
  @Input() isVisible = false;

  @Output() pointHovered = new EventEmitter<string>();
  @Output() pointHoverEnd = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  minDate: Date | null = null;
  maxDate: Date | null = null;
  totalDays = 0;
  graduations: Array<{ label: string; position: number }> = [];

  ngOnChanges(): void {
    if (this.timelineItems.length > 0) {
      this.processTimeline();
    }
  }

  onPointHover(pointId: string): void {
    this.pointHovered.emit(pointId);
  }

  onPointHoverEnd(): void {
    this.pointHoverEnd.emit();
  }

  close(): void {
    this.closed.emit();
  }

  private processTimeline(): void {
    if (!this.timelineItems || this.timelineItems.length === 0) {
      return;
    }

    // Calculer la plage de dates
    const dates: Date[] = [];
    this.timelineItems.forEach((item) => {
      if (item.start instanceof Date) dates.push(item.start);
      if (item.end instanceof Date) dates.push(item.end);
    });

    if (dates.length > 0) {
      const minDateRaw = new Date(Math.min(...dates.map((d) => d.getTime())));
      const maxDateRaw = new Date(Math.max(...dates.map((d) => d.getTime())));

      // Ajouter une marge de 10% avant et après
      const diffMs = maxDateRaw.getTime() - minDateRaw.getTime();
      const marginMs = Math.ceil(diffMs * 0.02); // 10% de marge

      this.minDate = new Date(minDateRaw.getTime() - marginMs);
      this.maxDate = new Date(maxDateRaw.getTime() + marginMs);

      // Calculer le nombre de jours
      const diffMsAdjusted = this.maxDate.getTime() - this.minDate.getTime();
      this.totalDays = Math.ceil(diffMsAdjusted / (1000 * 60 * 60 * 24)) + 1;

      // Générer les graduations
      this.generateGraduations();
    }
  }

  /**
   * Génère les graduations en fonction de la plage de dates
   */
  private generateGraduations(): void {
    if (!this.minDate || !this.maxDate || this.totalDays === 0) {
      this.graduations = [];
      return;
    }

    this.graduations = [];
    const diffMs = this.maxDate.getTime() - this.minDate.getTime();

    // Déterminer l'intervalle approprié en fonction de la plage totale
    let stepMs: number;
    let formatFn: (date: Date) => string;

    if (this.totalDays <= 1) {
      // Pour moins d'un jour: toutes les heures
      stepMs = 1000 * 60 * 60; // 1 heure
      formatFn = (d) =>
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } else if (this.totalDays <= 2) {
      // Pour 1-2 jours: toutes les 6 heures (demi-journées)
      stepMs = 1000 * 60 * 60 * 6;
      formatFn = (d) =>
        `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} ${String(
          d.getHours()
        ).padStart(2, '0')}h`;
    } else if (this.totalDays <= 3) {
      // Pour 2-3 jours: toutes les 12 heures
      stepMs = 1000 * 60 * 60 * 12;
      formatFn = (d) =>
        `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} ${String(
          d.getHours()
        ).padStart(2, '0')}h`;
    } else if (this.totalDays <= 7) {
      // Pour moins d'une semaine: chaque jour
      stepMs = 1000 * 60 * 60 * 24;
      formatFn = (d) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } else if (this.totalDays <= 30) {
      // Pour moins d'un mois: tous les 3 jours
      stepMs = 1000 * 60 * 60 * 24 * 3;
      formatFn = (d) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } else if (this.totalDays <= 90) {
      // Pour moins de 3 mois: toutes les semaines
      stepMs = 1000 * 60 * 60 * 24 * 7;
      formatFn = (d) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } else if (this.totalDays <= 365) {
      // Pour moins d'un an: tous les mois
      stepMs = 1000 * 60 * 60 * 24 * 30;
      formatFn = (d) => d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    } else {
      // Pour plus d'un an: tous les 3 mois
      stepMs = 1000 * 60 * 60 * 24 * 90;
      formatFn = (d) => d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    }

    // Générer les graduations
    let currentDate = new Date(this.minDate);
    while (currentDate <= this.maxDate) {
      const position = this.getDatePosition(currentDate);
      this.graduations.push({
        label: formatFn(currentDate),
        position,
      });
      currentDate = new Date(currentDate.getTime() + stepMs);
    }
  }

  /**
   * Calcule la position en pourcentage d'une date sur la timeline
   */
  getDatePosition(date: Date): number {
    if (!this.minDate || !this.maxDate || this.totalDays === 0) {
      return 0;
    }
    const diff = date.getTime() - this.minDate.getTime();
    return (diff / (this.maxDate.getTime() - this.minDate.getTime())) * 100;
  }

  /**
   * Calcule la largeur en pourcentage d'une période
   */
  getDuration(start: Date | undefined, end: Date | undefined): number {
    if (!start || !end || !this.minDate || !this.maxDate || this.totalDays === 0) {
      return 0;
    }
    const startPos = this.getDatePosition(start);
    const endPos = this.getDatePosition(end);
    return Math.max(endPos - startPos, 2); // Minimum 2% pour la visibilité
  }

  /**
   * Format une date pour l'affichage
   */
  formatDate(date: Date | null | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Format une date avec heure:minute pour l'affichage
   */
  formatDateTime(date: Date | null | undefined): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    const datePart = d.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const timePart = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(
      2,
      '0'
    )}`;
    return `${datePart} ${timePart}`;
  }

  /**
   * Génère un label pour la plage horaire
   */
  getTimelineLabel(): string {
    if (!this.minDate || !this.maxDate) {
      return 'Pas de dates';
    }
    return `${this.formatDate(this.minDate)} → ${this.formatDate(this.maxDate)} (${
      this.totalDays
    } jours)`;
  }
}
