import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Drawer } from 'primeng/drawer';
import { InputText } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { AutoComplete, AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { Checkbox } from 'primeng/checkbox';
import { MapService } from '../../../services/MapService';
import { PointService } from '../../../services/PointService';
import { EquipmentService } from '../../../services/EquipmentService';
import { Point } from '../../../models/pointModel';
import { Subscription } from 'rxjs';
import { Equipment } from '../../../models/equipmentModel';
import { PhotoViewer } from '../../../shared/photo-viewer/photo-viewer';
import { DeletePopupComponent } from '../../../shared/delete-popup/delete-popup';
import { ToastService } from '../../../services/ToastService';

@Component({
  selector: 'app-point-drawer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Drawer,
    InputText,
    InputNumber,
    AutoComplete,
    Checkbox,
    PhotoViewer,
    DeletePopupComponent
  ],
  templateUrl: './point-drawer.component.html',
  styleUrls: ['./point-drawer.component.scss']
})
export class PointDrawerComponent implements OnInit, OnDestroy {
  visible = false;
  selectedPoint: Point | null = null;
  selectedPointIndex: number | null = null;
  equipments: Equipment[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  equipmentOptions: any[] = []; // Inclut l'option "Aucun" + les équipements
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedEquipment: any | null = null;
  
  // AutoComplete pour équipements
  selectedEquipmentName = '';
  filteredEquipments: string[] = [];
  
  // Copie locale pour l'édition
  editedComment = '';
  editedIsValid = false;
  editedEquipmentQuantity = 0;
  editedInstalledAt: string | null = null;
  editedRemovedAt: string | null = null;
  previousEquipmentId: string | null = null;
  previousEquipmentQuantity = 0;

  // Valeurs initiales pour détecter les modifications
  initialComment = '';
  initialIsValid = false;
  initialEquipmentId: string | null = null;
  initialEquipmentQuantity = 0;
  initialInstalledAt: string | null = null;
  initialRemovedAt: string | null = null;

  // Gestion des photos
  showPhotoViewer = false;

  // Gestion de la confirmation de suppression
  showDeleteConfirm = false;

  private selectedPointSubscription?: Subscription;
  private selectedPointIndexSubscription?: Subscription;
  private equipmentsSubscription?: Subscription;

  constructor(
    private mapService: MapService,
    private pointService: PointService,
    private equipmentService: EquipmentService,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadEquipments();
    
    // S'abonner aux changements d'équipements depuis le EquipmentService
    this.equipmentsSubscription = this.equipmentService.equipments$.subscribe(equipments => {
      this.equipments = equipments;
      this.updateEquipmentOptions();
      
      // Mettre à jour l'équipement sélectionné si nécessaire
      if (this.selectedEquipment && this.selectedEquipment.uuid) {
        const updatedEquipment = equipments.find(e => e.uuid === this.selectedEquipment!.uuid);
        if (updatedEquipment) {
          this.selectedEquipment = updatedEquipment;
        }
      }
      
      this.cdr.detectChanges();
    });
    
    // S'abonner aux changements de l'index du point sélectionné
    this.selectedPointIndexSubscription = this.mapService.selectedPointIndex$.subscribe(index => {
      this.selectedPointIndex = index;
      this.cdr.detectChanges();
    });
    
    // S'abonner aux changements de point sélectionné
    this.selectedPointSubscription = this.mapService.selectedPoint$.subscribe(point => {
      if (point && point.uuid !== this.selectedPoint?.uuid) {
        this.openDrawer(point);
      } else if (!point && this.visible) {
        this.visible = false;
        this.selectedPoint = null;
        this.selectedPointIndex = null;
        this.selectedEquipment = null;
        this.showPhotoViewer = false;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.selectedPointSubscription) {
      this.selectedPointSubscription.unsubscribe();
    }
    if (this.selectedPointIndexSubscription) {
      this.selectedPointIndexSubscription.unsubscribe();
    }
    if (this.equipmentsSubscription) {
      this.equipmentsSubscription.unsubscribe();
    }
  }

  loadEquipments(): void {
    this.equipmentService.getAll().subscribe({
      next: (data) => {
        this.equipments = data;
        this.updateEquipmentOptions();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des équipements:', error);
      }
    });
  }

  updateEquipmentOptions(): void {
    // Créer l'option "Aucun" en premier
    const noneOption = { uuid: null, description: 'Aucun', type: 'none' };
    this.equipmentOptions = [noneOption, ...this.equipments];
  }

  openDrawer(point: Point): void {
    this.selectedPoint = point;
    this.editedComment = point.comment || '';
    this.editedIsValid = point.isValid;
    this.editedEquipmentQuantity = point.equipmentQuantity || 0;
    this.previousEquipmentId = point.equipmentId;
    this.previousEquipmentQuantity = point.equipmentQuantity || 0;
    
    // Charger les dates de pose/dépose (format datetime-local)
    this.editedInstalledAt = point.installedAt ? this.formatDateForInput(point.installedAt) : null;
    this.editedRemovedAt = point.removedAt ? this.formatDateForInput(point.removedAt) : null;

    // Sauvegarder les valeurs initiales pour détecter les modifications
    this.initialComment = this.editedComment;
    this.initialIsValid = this.editedIsValid;
    this.initialEquipmentId = point.equipmentId;
    this.initialEquipmentQuantity = this.editedEquipmentQuantity;
    this.initialInstalledAt = this.editedInstalledAt;
    this.initialRemovedAt = this.editedRemovedAt;

    // Charger l'équipement actuel si présent
    if (point.equipmentId) {
      this.selectedEquipment = this.equipments.find(e => e.uuid === point.equipmentId) || null;
      this.selectedEquipmentName = this.selectedEquipment ? this.getEquipmentDisplayName(this.selectedEquipment) : '';
    } else {
      // Si pas d'équipement, sélectionner l'option "Aucun"
      this.selectedEquipment = null;
      this.selectedEquipmentName = '';
    }

    this.visible = true;
  }
  
  // Convertit une Date en format datetime-local (YYYY-MM-DDTHH:mm)
  private formatDateForInput(date: Date | string | null): string | null {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    // Format: YYYY-MM-DDTHH:mm
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  closeDrawer(): void {
    if (!this.visible) return; // Éviter les appels multiples
    
    this.visible = false;
    this.selectedPoint = null;
    this.selectedEquipment = null;
    this.selectedEquipmentName = '';
    this.showPhotoViewer = false;
    
    // Informer le MapService que le drawer est fermé
    this.mapService.selectPoint(null);
  }

  openPhotoViewer(): void {
    this.showPhotoViewer = true;
  }

  closePhotoViewer(): void {
    this.showPhotoViewer = false;
  }

  // Méthode pour filtrer les équipements (AutoComplete)
  filterEquipments(event: AutoCompleteCompleteEvent): void {
    const query = event.query.toLowerCase();
    const equipmentNames = this.equipments.map(e => this.getEquipmentDisplayName(e));
    
    if (query) {
      this.filteredEquipments = equipmentNames.filter(name => 
        name.toLowerCase().includes(query)
      );
    } else {
      this.filteredEquipments = [...equipmentNames];
    }
  }

  // Méthode appelée lors de la sélection d'un équipement (AutoComplete)
  onEquipmentSelect(event: AutoCompleteSelectEvent): void {
    const selectedName = event.value;
    const newEquipment = this.equipments.find(e => this.getEquipmentDisplayName(e) === selectedName) || null;
    
    // Si on avait un équipement précédent, on remet sa quantité dans le stock
    if (this.previousEquipmentId && this.previousEquipmentQuantity > 0) {
      const previousEquipment = this.equipments.find(e => e.uuid === this.previousEquipmentId);
      if (previousEquipment && previousEquipment.remainingStock !== undefined) {
        previousEquipment.remainingStock += this.previousEquipmentQuantity;
        this.updateEquipmentStock(previousEquipment);
      }
    }

    // Réinitialiser la quantité
    this.editedEquipmentQuantity = 0;
    this.selectedEquipment = newEquipment;

    // Mettre à jour les valeurs précédentes
    this.previousEquipmentId = newEquipment?.uuid || null;
    this.previousEquipmentQuantity = 0;
  }

  onEquipmentChange(event: { value: Equipment | null }): void {
    const newEquipment = event.value;
    
    // Si on avait un équipement précédent, on remet sa quantité dans le stock
    if (this.previousEquipmentId && this.previousEquipmentQuantity > 0) {
      const previousEquipment = this.equipments.find(e => e.uuid === this.previousEquipmentId);
      if (previousEquipment && previousEquipment.remainingStock !== undefined) {
        previousEquipment.remainingStock += this.previousEquipmentQuantity;
        this.updateEquipmentStock(previousEquipment);
      }
    }

    // Réinitialiser la quantité
    this.editedEquipmentQuantity = 0;
    this.selectedEquipment = newEquipment;

    // Mettre à jour les valeurs précédentes
    this.previousEquipmentId = newEquipment?.uuid || null;
    this.previousEquipmentQuantity = 0;
  }

  onQuantityChange(newQuantity: number): void {
    if (!this.selectedEquipment) return;

    const availableStock = (this.selectedEquipment.remainingStock || 0) + this.previousEquipmentQuantity;
    
    // Vérifier que la quantité ne dépasse pas le stock disponible
    if (newQuantity > availableStock) {
      this.editedEquipmentQuantity = availableStock;
      this.toastService.showWarning('Stock insuffisant', `La quantité ne peut pas dépasser le stock disponible (${availableStock})`);
      return;
    }

    this.editedEquipmentQuantity = newQuantity;
  }

  hasChanges(): boolean {
    const currentEquipmentId = this.selectedEquipment?.uuid || null;
    return (
      this.editedComment !== this.initialComment ||
      this.editedIsValid !== this.initialIsValid ||
      currentEquipmentId !== this.initialEquipmentId ||
      this.editedEquipmentQuantity !== this.initialEquipmentQuantity ||
      this.editedInstalledAt !== this.initialInstalledAt ||
      this.editedRemovedAt !== this.initialRemovedAt
    );
  }

  saveChanges(): void {
    if (!this.selectedPoint) return;

    // Préparer les données pour la mise à jour
    const updatedPoint: Point = {
      ...this.selectedPoint,
      comment: this.editedComment,
      isValid: this.editedIsValid,
      equipmentId: this.selectedEquipment?.uuid || null,
      equipmentQuantity: this.editedEquipmentQuantity,
      installedAt: this.editedInstalledAt ? new Date(this.editedInstalledAt) : null,
      removedAt: this.editedRemovedAt ? new Date(this.editedRemovedAt) : null
    };

    // Calculer les changements de stock
    let stockDifference = 0;
    if (this.selectedEquipment && this.selectedEquipment.uuid) {
      stockDifference = this.editedEquipmentQuantity - this.previousEquipmentQuantity;
      
      // Mettre à jour le stock de l'équipement
      if (this.selectedEquipment.remainingStock !== undefined) {
        this.selectedEquipment.remainingStock -= stockDifference;
        this.updateEquipmentStock(this.selectedEquipment);
      }
    }

    // Sauvegarder le point
    this.pointService.update(this.selectedPoint.uuid, updatedPoint).subscribe({
      next: (savedPoint) => {
        // Mettre à jour les valeurs précédentes
        this.previousEquipmentQuantity = this.editedEquipmentQuantity;
        this.previousEquipmentId = this.selectedEquipment?.uuid || null;
        
        // Mettre à jour le point local immédiatement
        if (this.selectedPoint) {
          this.selectedPoint.comment = this.editedComment;
          this.selectedPoint.isValid = this.editedIsValid;
          this.selectedPoint.equipmentId = this.selectedEquipment?.uuid || null;
          this.selectedPoint.equipmentQuantity = this.editedEquipmentQuantity;
        }
        
        // Mettre à jour le MapService pour la réactivité de la sidebar et de la map
        const currentPoints = this.mapService['pointsSubject'].value;
        const index = currentPoints.findIndex((p: Point) => p.uuid === savedPoint.uuid);
        if (index !== -1) {
          currentPoints[index] = savedPoint;
          this.mapService.setPoints([...currentPoints]);
        }
        
        this.toastService.showSuccess('Point modifié', 'Le point a été modifié avec succès');
        
        // Fermer le drawer après sauvegarde
        this.closeDrawer();
      },
      error: () => {
        // En cas d'erreur, restaurer le stock
        if (this.selectedEquipment && this.selectedEquipment.remainingStock !== undefined) {
          this.selectedEquipment.remainingStock += stockDifference;
        }
        this.toastService.showError('Erreur', 'Impossible de modifier le point');
      }
    });
  }

  private updateEquipmentStock(equipment: Equipment): void {
    this.equipmentService.update(equipment.uuid, equipment).subscribe({
      error: (error) => {
        console.error('Erreur lors de la mise à jour du stock:', error);
      }
    });
  }

  private reloadPoints(): void {
    // Forcer un rechargement des points via le PointService
    this.pointService.getAll().subscribe({
      next: (points) => {
        // Trier les points par ordre
        const sortedPoints = points.sort((a, b) => (a.order || 0) - (b.order || 0));
        this.mapService.setPoints(sortedPoints);
      },
      error: (error) => {
        console.error('Erreur lors du rechargement des points:', error);
      }
    });
  }

  getAvailableStock(): number {
    if (!this.selectedEquipment) return 0;
    return (this.selectedEquipment.remainingStock || 0) + this.previousEquipmentQuantity;
  }

  getEquipmentDisplayName(equipment: Equipment): string {
    if (!equipment || !equipment.uuid) return 'Aucun';
    return equipment.description || equipment.type || 'Équipement sans nom';
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

    // Restaurer le stock de l'équipement si nécessaire
    if (pointToDelete.equipmentId && pointToDelete.equipmentQuantity) {
      const equipment = this.equipments.find(e => e.uuid === pointToDelete.equipmentId);
      if (equipment && equipment.remainingStock !== undefined) {
        equipment.remainingStock += pointToDelete.equipmentQuantity;
        this.updateEquipmentStock(equipment);
      }
    }

    // Fermer le drawer AVANT de supprimer
    this.closeDrawer();

    // Supprimer le point et mettre à jour le MapService
    this.pointService.delete(pointToDelete.uuid).subscribe({
      next: () => {
        // Mettre à jour le MapService pour la réactivité de la sidebar et de la map
        const currentPoints = this.mapService['pointsSubject'].value;
        this.mapService.setPoints(currentPoints.filter((p: Point) => p.uuid !== pointToDelete.uuid));
        this.toastService.showSuccess('Point supprimé', 'Le point a été supprimé avec succès');
      },
      error: () => {
        this.toastService.showError('Erreur', 'Impossible de supprimer le point');
        // En cas d'erreur, restaurer le stock
        if (pointToDelete.equipmentId && pointToDelete.equipmentQuantity) {
          const equipment = this.equipments.find(e => e.uuid === pointToDelete.equipmentId);
          if (equipment && equipment.remainingStock !== undefined) {
            equipment.remainingStock -= pointToDelete.equipmentQuantity;
          }
        }
      }
    });
  }

  private reloadPointsAndReorder(): void {
    // Forcer un rechargement des points via le PointService
    this.pointService.getAll().subscribe({
      next: (points) => {
        // Trier les points par ordre et réassigner les numéros
        const sortedPoints = points.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        // Réattribuer les ordres de manière consécutive
        sortedPoints.forEach((point, index) => {
          const newOrder = index + 1;
          if (point.order !== newOrder) {
            point.order = newOrder;
            // Mettre à jour dans la base de données
            this.pointService.update(point.uuid, point).subscribe({
              error: (error) => {
                console.error(`Erreur lors de la mise à jour de l'ordre du point ${point.uuid}:`, error);
              }
            });
          }
        });
        
        this.mapService.setPoints(sortedPoints);
      },
      error: (error) => {
        console.error('Erreur lors du rechargement des points:', error);
      }
    });
  }
}

