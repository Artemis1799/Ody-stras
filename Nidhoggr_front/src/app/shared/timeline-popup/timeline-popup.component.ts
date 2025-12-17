import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

interface TimelineItem {
  id: string;
  title: string;
  start?: Date;
  end?: Date;
}

interface TimelineData {
  items: TimelineItem[];
}

@Component({
  selector: 'app-timeline-popup',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './timeline-popup.component.html',
  styleUrls: ['./timeline-popup.component.scss'],
})
export class TimelinePopupComponent {
  timelineItems: TimelineItem[] = [];
  minDate: Date | null = null;
  maxDate: Date | null = null;
  totalDays = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: TimelineData,
    private dialogRef: MatDialogRef<TimelinePopupComponent>
  ) {
    this.processTimeline();
  }

  private processTimeline(): void {
    if (!this.data?.items || this.data.items.length === 0) {
      return;
    }

    this.timelineItems = this.data.items;

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
      const marginMs = Math.ceil(diffMs * 0.1); // 10% de marge

      this.minDate = new Date(minDateRaw.getTime() - marginMs);
      this.maxDate = new Date(maxDateRaw.getTime() + marginMs);

      // Calculer le nombre de jours
      const diffMsAdjusted = this.maxDate.getTime() - this.minDate.getTime();
      this.totalDays = Math.ceil(diffMsAdjusted / (1000 * 60 * 60 * 24)) + 1;
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

  /**
   * Ferme le dialog
   */
  close(): void {
    this.dialogRef.close();
  }
}
