import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Drawer } from 'primeng/drawer';
import { InputText } from 'primeng/inputtext';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { AutoComplete, AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
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
    ToggleSwitch,
    AutoComplete,
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
  
  // Copie locale pour l'édition (commentaire seulement en étape 1)
  editedComment = '';
  isValidated = false;

  // Valeurs initiales pour détecter les modifications
  initialComment = '';
  initialEquipmentId: string | undefined = undefined;
  initialValidated = false;

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
    // Fermer le drawer des security zones s'il est ouvert
    this.mapService.selectSecurityZone(null);
    
    this.selectedPoint = point;
    this.editedComment = point.comment || '';
    this.isValidated = point.validated || false;

    // Sauvegarder les valeurs initiales pour détecter les modifications
    this.initialComment = this.editedComment;
    this.initialEquipmentId = point.equipmentId;
    this.initialValidated = point.validated || false;

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
    
    // Ajouter l'option "Aucun" en premier
    const aucunOption = 'Aucun';
    
    if (query) {
      const filtered = equipmentNames.filter(name => 
        name.toLowerCase().includes(query)
      );
      // Ajouter "Aucun" si la recherche correspond
      if (aucunOption.toLowerCase().includes(query)) {
        this.filteredEquipments = [aucunOption, ...filtered];
      } else {
        this.filteredEquipments = filtered;
      }
    } else {
      this.filteredEquipments = [aucunOption, ...equipmentNames];
    }
  }

  // Méthode appelée lors de la sélection d'un équipement (AutoComplete)
  onEquipmentSelect(event: AutoCompleteSelectEvent): void {
    const selectedName = event.value;
    
    // Si "Aucun" est sélectionné, on met l'équipement à undefined
    if (selectedName === 'Aucun') {
      this.selectedEquipment = null;
      this.selectedEquipmentName = 'Aucun';
      return;
    }
    
    const newEquipment = this.equipments.find(e => this.getEquipmentDisplayName(e) === selectedName) || null;
    this.selectedEquipment = newEquipment;
  }

  onEquipmentChange(event: { value: Equipment | null }): void {
    const newEquipment = event.value;
    this.selectedEquipment = newEquipment;
  }

  hasChanges(): boolean {
    const currentEquipmentId = this.selectedEquipment?.uuid;
    return (
      this.editedComment !== this.initialComment ||
      currentEquipmentId !== this.initialEquipmentId ||
      this.isValidated !== this.initialValidated
    );
  }

  get isEventArchived(): boolean {
    return this.mapService.isSelectedEventArchived();
  }

  /**
   * Vérifie si un équipement a été sélectionné pour passer à l'étape 2
   */
  canProceedToDrawing(): boolean {
    return this.selectedEquipment !== null && this.selectedEquipment?.uuid !== undefined;
  }

  /**
   * Lance le mode dessin pour placer la SecurityZone sur la carte
   */
  proceedToDrawing(): void {
    if (!this.selectedPoint || !this.selectedEquipment) return;

    // Créer une copie du point avec le commentaire édité
    const pointWithComment = {
      ...this.selectedPoint,
      comment: this.editedComment
    };

    // Lancer le mode dessin avec le point source (incluant le commentaire édité) et l'équipement sélectionné
    this.mapService.startDrawingMode(pointWithComment, this.selectedEquipment);
    
    // Le drawer se ferme automatiquement via la subscription au selectedPoint$
    this.toastService.showInfo(
      'Mode dessin activé', 
      'Dessinez une ligne sur la carte pour définir l\'emplacement exact de l\'équipement'
    );
  }

  saveCommentOnly(): void {
    if (!this.selectedPoint) return;

    // Sauvegarder seulement le commentaire
    const updatedPoint: Point = {
      ...this.selectedPoint,
      comment: this.editedComment
    };

    this.pointService.update(this.selectedPoint.uuid, updatedPoint).subscribe({
      next: (savedPoint) => {
        // Mettre à jour le point local immédiatement
        if (this.selectedPoint) {
          this.selectedPoint.comment = this.editedComment;
          this.initialComment = this.editedComment; // Mettre à jour la valeur initiale
        }
        
        // Mettre à jour le MapService pour la réactivité de la sidebar et de la map
        const currentPoints = this.mapService['pointsSubject'].value;
        const index = currentPoints.findIndex((p: Point) => p.uuid === savedPoint.uuid);
        if (index !== -1) {
          currentPoints[index] = savedPoint;
          this.mapService.setPoints([...currentPoints]);
        }
        
        this.toastService.showSuccess('Commentaire sauvegardé', 'Le commentaire du point a été mis à jour');
        this.cdr.markForCheck();
      },
      error: () => {
        this.toastService.showError('Erreur', 'Impossible de sauvegarder le commentaire');
      }
    });
  }

  saveChanges(): void {
    if (!this.selectedPoint) return;

    // Préparer les données pour la mise à jour (commentaire seulement en étape 1)
    const updatedPoint: Point = {
      ...this.selectedPoint,
      comment: this.editedComment,
      equipmentId: this.selectedEquipment?.uuid || '',
      validated: this.isValidated
    };

    // Sauvegarder le point
    this.pointService.update(this.selectedPoint.uuid, updatedPoint).subscribe({
      next: (savedPoint) => {
        // Mettre à jour le point local immédiatement
        if (this.selectedPoint) {
          this.selectedPoint.comment = this.editedComment;
          this.selectedPoint.equipmentId = this.selectedEquipment?.uuid || '';
          this.selectedPoint.validated = this.isValidated;
        }
        
        // Mettre à jour le MapService pour la réactivité de la sidebar et de la map
        const currentPoints = this.mapService['pointsSubject'].value;
        const index = currentPoints.findIndex((p: Point) => p.uuid === savedPoint.uuid);
        if (index !== -1) {
          currentPoints[index] = savedPoint;
          this.mapService.setPoints([...currentPoints]);
        }
        
        this.toastService.showSuccess('Point modifié', 'Le point a été modifié avec succès');
        
        // Mettre à jour les valeurs initiales pour la prochaine modification
        this.initialComment = this.editedComment;
        this.initialEquipmentId = this.selectedEquipment?.uuid || '';
        this.initialValidated = this.isValidated;
        
        this.cdr.markForCheck();
      },
      error: () => {
        this.toastService.showError('Erreur', 'Impossible de modifier le point');
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

  getEquipmentDisplayName(equipment: Equipment): string {
    if (!equipment || !equipment.uuid) return 'Aucun';
    return equipment.type || 'Équipement sans type';
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
        const currentPoints = this.mapService['pointsSubject'].value;
        this.mapService.setPoints(currentPoints.filter((p: Point) => p.uuid !== pointToDelete.uuid));
        this.toastService.showSuccess('Point supprimé', 'Le point a été supprimé avec succès');
      },
      error: () => {
        this.toastService.showError('Erreur', 'Impossible de supprimer le point');
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

