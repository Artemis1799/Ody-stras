import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Observable } from 'rxjs';
import { Point } from '../../../../models/pointModel';

@Component({
  selector: 'app-points-list',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './points-list.component.html',
  styleUrls: ['./points-list.component.scss']
})
export class PointsListComponent {
  @Input() points$!: Observable<Point[]>;
  @Input() selectedPointUuid: string | null = null;
  @Input() isLoading = false;
  @Input() errorMessage = '';
  @Input() emptyMessage = 'Aucun point disponible';
  
  @Output() pointClick = new EventEmitter<Point>();
  @Output() pointsReordered = new EventEmitter<Point[]>();

  onPointClick(point: Point): void {
    this.pointClick.emit(point);
  }

  onDrop(event: CdkDragDrop<Point[]>, points: Point[]): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    // Créer une copie pour réorganiser
    const reorderedPoints = [...points];
    moveItemInArray(reorderedPoints, event.previousIndex, event.currentIndex);
    
    // Mettre à jour les ordres
    reorderedPoints.forEach((point, index) => {
      point.order = index + 1;
    });

    this.pointsReordered.emit(reorderedPoints);
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
