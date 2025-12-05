import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Point } from '../../../../models/pointModel';

@Component({
  selector: 'app-points-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './points-list.component.html',
  styleUrls: ['./points-list.component.scss']
})
export class PointsListComponent {
  @Input() set points$(value: Observable<Point[]>) {
    this.points$Internal = value.pipe(
      map(points => this.sortPointsByInstalledDate(points))
    );
  }
  @Input() selectedPointUuid: string | null = null;
  @Input() isLoading = false;
  @Input() errorMessage = '';
  @Input() emptyMessage = 'Aucun point disponible';
  
  @Output() pointClick = new EventEmitter<Point>();

  points$Internal!: Observable<Point[]>;

  onPointClick(point: Point): void {
    this.pointClick.emit(point);
  }

  getPointDisplayName(point: Point): string {
    if (point.comment) {
      return point.comment;
    }
    return `Point ${point.uuid.substring(0, 8)}`;
  }

  getInstalledDateDisplay(point: Point): string {
    if (!point.installedAt) return '-';
    const date = new Date(point.installedAt);
    return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
  }

  getRemovedDateDisplay(point: Point): string {
    if (!point.removedAt) return '-';
    const date = new Date(point.removedAt);
    return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
  }

  private sortPointsByInstalledDate(points: Point[]): Point[] {
    return [...points].sort((a, b) => {
      const dateA = a.installedAt ? new Date(a.installedAt).getTime() : Infinity;
      const dateB = b.installedAt ? new Date(b.installedAt).getTime() : Infinity;
      return dateA - dateB;
    });
  }

  trackByUuid(_index: number, point: Point): string {
    return point.uuid;
  }
}
