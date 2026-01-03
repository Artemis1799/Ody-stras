import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Point } from '../../../../models/pointModel';

@Component({
  selector: 'app-points-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './points-list.component.html',
  styleUrls: ['./points-list.component.scss']
})
export class PointsListComponent {
  @Input() points: Point[] = [];
  @Input() startIndex: number = 0;
  @Input() selectedPointUuid: string | null = null;
  @Input() isLoading = false;
  @Input() errorMessage = '';
  @Input() emptyMessage = 'Aucun point disponible';
  
  @Output() pointClick = new EventEmitter<Point>();

  onPointClick(point: Point): void {
    this.pointClick.emit(point);
  }

  getPointDisplayName(point: Point): string {
    if (point.comment) {
      return point.comment;
    }
    return `Point ${point.uuid.substring(0, 8)}`;
  }

  trackByUuid(_index: number, point: Point): string {
    return point.uuid;
  }
}
