import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { PointService } from '../../../service/PointService';
import { MapService } from '../../../service/MapService';
import { Point } from '../../../classe/pointModel';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-points-sidebar',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './points-sidebar.component.html',
  styleUrls: ['./points-sidebar.component.scss']
})
export class PointsSidebarComponent implements OnInit, OnDestroy {
  points: Point[] = [];
  isLoading = false;
  errorMessage = '';
  selectedPoint: Point | null = null;
  private pointsSubscription?: Subscription;

  constructor(
    private pointService: PointService,
    private mapService: MapService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPoints();
    
    // S'abonner aux changements de points depuis le MapService
    this.pointsSubscription = this.mapService.points$.subscribe(points => {
      if (points.length > 0) {
        this.points = points;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.pointsSubscription) {
      this.pointsSubscription.unsubscribe();
    }
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

    // Si un point est sélectionné, le mettre à jour dans le drawer
    if (this.selectedPoint) {
      // Retrouver le point sélectionné mis à jour
      const updatedPoint = this.points.find(p => p.uuid === this.selectedPoint!.uuid);
      if (updatedPoint) {
        this.mapService.selectPoint(updatedPoint);
      }
    }

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

  openEquipmentManager(): void {
    // Fermer le drawer s'il est ouvert
    this.mapService.selectPoint(null);
    this.router.navigate(['/equipments']);
  }

  onPointClick(point: Point): void {
    this.selectedPoint = point;
    
    // Sélectionner le point d'abord (ouvrira le drawer)
    this.mapService.selectPoint(point);
    
    // Attendre que le drawer s'ouvre puis recentrer avec offset
    setTimeout(() => {
      const map = this.mapService.getMapInstance();
      if (map && point.latitude && point.longitude) {
        // Calculer l'offset pour compenser la sidebar (300px) et le drawer (420px)
        // On décale vers la droite (+) pour que le point apparaisse à gauche/centre
        const offsetX = 15; // Décalage vers la droite pour centrer dans l'espace visible
        const point2D = map.latLngToContainerPoint([point.latitude, point.longitude]);
        point2D.x += offsetX;
        const targetLatLng = map.containerPointToLatLng(point2D);
        
        map.setView(targetLatLng, 17, {
          animate: true,
          duration: 0.5
        });
      }
    }, 100);
  }
}
