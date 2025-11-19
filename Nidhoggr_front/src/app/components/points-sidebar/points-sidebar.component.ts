import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { PointService } from '../../../service/PointService';
import { MapService } from '../../../service/MapService';
import { Point } from '../../../classe/pointModel';

@Component({
  selector: 'app-points-sidebar',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './points-sidebar.component.html',
  styleUrls: ['./points-sidebar.component.scss']
})
export class PointsSidebarComponent implements OnInit {
  points: Point[] = [];
  isLoading = false;
  errorMessage = '';
  selectedPoint: Point | null = null;

  constructor(
    private pointService: PointService,
    private mapService: MapService
  ) {}

  ngOnInit(): void {
    this.loadPoints();
  }

  loadPoints(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.pointService.getAll().subscribe({
      next: (data) => {
        // Trier les points: ceux avec order d'abord, puis les autres
        const withOrder = data.filter(p => p.order !== undefined && p.order !== null)
                              .sort((a, b) => (a.order || 0) - (b.order || 0));
        const withoutOrder = data.filter(p => p.order === undefined || p.order === null);
        
        // Assigner un ordre aux points sans ordre
        withoutOrder.forEach((point, index) => {
          point.order = withOrder.length + index + 1;
        });
        
        this.points = [...withOrder, ...withoutOrder];
        this.isLoading = false;
        
        // Partager les points avec le service pour affichage sur la map
        this.mapService.setPoints(this.points);
        
        // Si des points ont été réordonnés, mettre à jour la base de données
        if (withoutOrder.length > 0) {
          this.updateOrdersInDatabase();
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des points:', error);
        this.errorMessage = 'Impossible de charger les points';
        this.isLoading = false;
      }
    });
  }

  onDrop(event: CdkDragDrop<Point[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    // Réorganiser la liste
    moveItemInArray(this.points, event.previousIndex, event.currentIndex);
    
    // Mettre à jour les ordres
    this.points.forEach((point, index) => {
      point.order = index + 1;
    });

    // Partager les points mis à jour
    this.mapService.setPoints(this.points);

    // Mettre à jour la base de données
    this.updateOrdersInDatabase();
  }

  private updateOrdersInDatabase(): void {
    // Mettre à jour chaque point modifié
    this.points.forEach((point) => {
      this.pointService.update(point.uuid, point).subscribe({
        error: (error) => {
          console.error(`Erreur lors de la mise à jour du point ${point.uuid}:`, error);
        }
      });
    });
  }

  getPointDisplayName(point: Point): string {
    if (point.comment) {
      return point.comment;
    }
    return `Point ${point.uuid.substring(0, 8)}`;
  }

  onPointClick(point: Point): void {
    this.selectedPoint = point;
    this.mapService.selectPoint(point);
    
    // Centrer la map sur le point si coordonnées disponibles
    const map = this.mapService.getMapInstance();
    if (map && point.latitude && point.longitude) {
      map.setView([point.latitude, point.longitude], 16);
    }
  }
}
