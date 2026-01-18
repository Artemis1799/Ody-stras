import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Drawer } from 'primeng/drawer';
import { InputText } from 'primeng/inputtext';
import { MapService } from '../../../services/MapService';
import { PointService } from '../../../services/PointService';
import { DrawerService } from '../../../services/DrawerService';
import { Point } from '../../../models/pointModel';
import { Subscription } from 'rxjs';
import { ToastService } from '../../../services/ToastService';
import { DeletePopupComponent } from '../../../shared/delete-popup/delete-popup';

@Component({
  selector: 'app-point-of-interest-drawer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Drawer,
    InputText,
    DeletePopupComponent
  ],
  templateUrl: './point-of-interest-drawer.component.html',
  styleUrls: ['./point-of-interest-drawer.component.scss']
})
export class PointOfInterestDrawerComponent implements OnInit, OnDestroy {
  visible = false;
  selectedPoint: Point | null = null;
  
  // Copie locale pour l'édition du commentaire
  editedComment = '';
  initialComment = '';

  // Gestion de la confirmation de suppression
  showDeleteConfirm = false;

  private selectedPointOfInterestSubscription?: Subscription;
  private drawerSubscription?: Subscription;

  constructor(
    private mapService: MapService,
    private pointService: PointService,
    private drawerService: DrawerService,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    // S'abonner aux changements de point d'intérêt sélectionné
    this.selectedPointOfInterestSubscription = this.mapService.selectedPointOfInterest$.subscribe(point => {
      if (point) {
        this.openDrawer(point);
      } else if (!point && this.visible) {
        this.visible = false;
        this.selectedPoint = null;
      }
    });

    // S'abonner aux changements de drawer actif pour fermer ce drawer si un autre s'ouvre
    this.drawerSubscription = this.drawerService.activeDrawer$.subscribe(activeDrawer => {
      if (activeDrawer !== 'point-of-interest' && this.visible) {
        this.visible = false;
        this.selectedPoint = null;
        this.mapService.selectPointOfInterest(null);
      }
    });
  }

  ngOnDestroy(): void {
    this.selectedPointOfInterestSubscription?.unsubscribe();
    this.drawerSubscription?.unsubscribe();
  }

  openDrawer(point: Point): void {
    // Notifier le DrawerService qu'on ouvre ce drawer (ferme les autres automatiquement)
    this.drawerService.openDrawer('point-of-interest');
    
    this.selectedPoint = point;
    this.editedComment = point.comment || '';
    this.initialComment = point.comment || '';
    this.visible = true;
    this.cdr.detectChanges();
  }

  closeDrawer(): void {
    if (!this.visible) return;
    
    this.visible = false;
    this.selectedPoint = null;
    this.mapService.selectPointOfInterest(null);
    this.cdr.detectChanges();
  }

  hasChanges(): boolean {
    return this.editedComment !== this.initialComment;
  }

  saveChanges(): void {
    if (!this.selectedPoint) return;

    const updatedPoint: Point = {
      ...this.selectedPoint,
      comment: this.editedComment || undefined
    };

    this.pointService.update(this.selectedPoint.uuid, updatedPoint).subscribe({
      next: (response) => {
        this.toastService.showSuccess('Point d\'intérêt modifié', 'Le point d\'intérêt a été modifié avec succès');
        
        // Mettre à jour le point dans le service
        const currentPoints = this.mapService.getPoints();
        const updatedPoints = currentPoints.map((p: Point) => 
          p.uuid === response.uuid ? response : p
        );
        this.mapService.setPoints(updatedPoints);
        
        // Mettre à jour les valeurs initiales
        this.initialComment = response.comment || '';
        this.editedComment = response.comment || '';
        this.selectedPoint = response;
        
        // Fermer le drawer après sauvegarde
        this.closeDrawer();
      },
      error: (error) => {
        console.error('Erreur lors de la sauvegarde du commentaire:', error);
        this.toastService.showError('Erreur', 'Impossible de modifier le point d\'intérêt');
      }
    });
  }

  confirmDeletePoint(): void {
    if (!this.selectedPoint) return;
    this.showDeleteConfirm = true;
  }

  cancelDeletePoint(): void {
    this.showDeleteConfirm = false;
  }

  deletePoint(): void {
    if (!this.selectedPoint) return;

    this.showDeleteConfirm = false;
    const pointToDelete = this.selectedPoint;

    // Fermer le drawer AVANT de supprimer
    this.closeDrawer();

    // Supprimer le point et mettre à jour le MapService
    this.pointService.delete(pointToDelete.uuid).subscribe({
      next: () => {
        // Mettre à jour le MapService pour la réactivité de la sidebar et de la map
        const currentPoints = this.mapService.getPoints();
        this.mapService.setPoints(currentPoints.filter((p: Point) => p.uuid !== pointToDelete.uuid));
        this.toastService.showSuccess('Point d\'intérêt supprimé', 'Le point d\'intérêt a été supprimé avec succès');
      },
      error: () => {
        this.toastService.showError('Erreur', 'Impossible de supprimer le point d\'intérêt');
      }
    });
  }
}
