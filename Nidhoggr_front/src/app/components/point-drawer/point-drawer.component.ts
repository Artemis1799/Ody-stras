import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Drawer } from 'primeng/drawer';
import { InputText } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { Select } from 'primeng/select';
import { Checkbox } from 'primeng/checkbox';
import { Dialog } from 'primeng/dialog';
import { MapService } from '../../services/MapService';
import { PointService } from '../../services/PointService';
import { EquipmentService } from '../../services/EquipmentService';
import { ImagePointService } from '../../services/ImagePointsService';
import { PhotoService } from '../../services/PhotoService';
import { Point } from '../../models/pointModel';
import { Subscription } from 'rxjs';
import { Equipment } from '../../models/equipmentModel';
import { Photo } from '../../models/photoModel';

@Component({
  selector: 'app-point-drawer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Drawer,
    InputText,
    InputNumber,
    Select,
    Checkbox,
    Dialog
  ],
  templateUrl: './point-drawer.component.html',
  styleUrls: ['./point-drawer.component.scss']
})
export class PointDrawerComponent implements OnInit, OnDestroy {
  visible = false;
  selectedPoint: Point | null = null;
  equipments: Equipment[] = [];
  selectedEquipment: Equipment | null = null;
  
  // Copie locale pour l'édition
  editedComment = '';
  editedIsValid = false;
  editedEquipmentQuantity = 0;
  previousEquipmentId: string | null = null;
  previousEquipmentQuantity = 0;

  // Gestion des photos
  showPhotoDialog = false;
  photos: Photo[] = [];
  currentPhotoIndex = 0;
  loadingPhotos = false;

  private selectedPointSubscription?: Subscription;

  constructor(
    private mapService: MapService,
    private pointService: PointService,
    private equipmentService: EquipmentService,
    private imagePointService: ImagePointService,
    private photoService: PhotoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadEquipments();
    
    // S'abonner aux changements de point sélectionné
    this.selectedPointSubscription = this.mapService.selectedPoint$.subscribe(point => {
      if (point) {
        this.openDrawer(point);
      } else {
        this.closeDrawer();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.selectedPointSubscription) {
      this.selectedPointSubscription.unsubscribe();
    }
  }

  loadEquipments(): void {
    this.equipmentService.getAll().subscribe({
      next: (data) => {
        this.equipments = data;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des équipements:', error);
      }
    });
  }

  openDrawer(point: Point): void {
    this.selectedPoint = point;
    this.editedComment = point.comment || '';
    this.editedIsValid = point.isValid;
    this.editedEquipmentQuantity = point.equipmentQuantity || 0;
    this.previousEquipmentId = point.equipmentId;
    this.previousEquipmentQuantity = point.equipmentQuantity || 0;

    // Charger l'équipement actuel si présent
    if (point.equipmentId) {
      this.selectedEquipment = this.equipments.find(e => e.uuid === point.equipmentId) || null;
    } else {
      this.selectedEquipment = null;
    }

    this.visible = true;
  }

  closeDrawer(): void {
    this.visible = false;
    this.selectedPoint = null;
    this.selectedEquipment = null;
    this.photos = [];
    this.showPhotoDialog = false;
  }

  loadPhotosForPoint(): void {
    if (!this.selectedPoint) return;

    // Ouvrir la modal immédiatement avec un état de chargement
    this.loadingPhotos = true;
    this.photos = [];
    this.currentPhotoIndex = 0;
    this.showPhotoDialog = true;
    this.cdr.detectChanges(); // Forcer l'affichage de la modal

    console.log('🔍 Chargement des photos pour le point:', this.selectedPoint.uuid);

    // Récupérer uniquement les ImagePoints de ce point spécifique (filtrage côté client pour l'instant)
    this.imagePointService.getAll().subscribe({
      next: (imagePoints) => {
        console.log('📦 Total ImagePoints reçus:', imagePoints.length);
        
        // Filtrer les ImagePoints pour ce point spécifique
        const pointImagePoints = imagePoints.filter(ip => ip.pointId === this.selectedPoint!.uuid);
        
        console.log('📌 ImagePoints pour ce point:', pointImagePoints.length);
        
        if (pointImagePoints.length === 0) {
          console.log('⚠️ Aucune photo trouvée pour ce point');
          this.loadingPhotos = false;
          this.cdr.detectChanges();
          return;
        }

        // Utiliser directement les photos incluses dans les ImagePoints (pas besoin de requêtes supplémentaires)
        this.photos = pointImagePoints
          .map(ip => ip.photo)
          .filter((photo): photo is Photo => photo !== undefined && photo !== null);
        
        console.log('📸 Photos chargées:', this.photos.length);
        this.loadingPhotos = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des ImagePoints:', error);
        this.loadingPhotos = false;
        this.cdr.detectChanges();
      }
    });
  }

  get hasPhotos(): boolean {
    return this.photos.length > 0;
  }

  get currentPhoto(): Photo | null {
    return this.photos.length > 0 ? this.photos[this.currentPhotoIndex] : null;
  }

  nextPhoto(): void {
    if (this.currentPhotoIndex < this.photos.length - 1) {
      this.currentPhotoIndex++;
    }
  }

  previousPhoto(): void {
    if (this.currentPhotoIndex > 0) {
      this.currentPhotoIndex--;
    }
  }

  get photoCountText(): string {
    return `${this.currentPhotoIndex + 1} / ${this.photos.length}`;
  }

  getPhotoSrc(photo: Photo): string {
    // Si la photo est déjà en base64 avec le préfixe
    if (photo.picture.startsWith('data:')) {
      return photo.picture;
    }
    // Sinon, ajouter le préfixe
    return `data:image/jpeg;base64,${photo.picture}`;
  }

  onEquipmentChange(event: any): void {
    const newEquipment = event.value as Equipment | null;
    
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
      alert(`La quantité ne peut pas dépasser le stock disponible (${availableStock})`);
      return;
    }

    this.editedEquipmentQuantity = newQuantity;
  }

  saveChanges(): void {
    if (!this.selectedPoint) return;

    // Préparer les données pour la mise à jour
    const updatedPoint: Point = {
      ...this.selectedPoint,
      comment: this.editedComment,
      isValid: this.editedIsValid,
      equipmentId: this.selectedEquipment?.uuid || '',
      equipmentQuantity: this.editedEquipmentQuantity
    };

    // Calculer les changements de stock
    let stockDifference = 0;
    if (this.selectedEquipment) {
      stockDifference = this.editedEquipmentQuantity - this.previousEquipmentQuantity;
      
      // Mettre à jour le stock de l'équipement
      if (this.selectedEquipment.remainingStock !== undefined) {
        this.selectedEquipment.remainingStock -= stockDifference;
        this.updateEquipmentStock(this.selectedEquipment);
      }
    }

    // Sauvegarder le point
    this.pointService.update(this.selectedPoint.uuid, updatedPoint).subscribe({
      next: () => {
        console.log('Point mis à jour avec succès');
        // Mettre à jour les valeurs précédentes
        this.previousEquipmentQuantity = this.editedEquipmentQuantity;
        this.previousEquipmentId = this.selectedEquipment?.uuid || null;
        
        // Mettre à jour le point local immédiatement
        if (this.selectedPoint) {
          this.selectedPoint.comment = this.editedComment;
          this.selectedPoint.isValid = this.editedIsValid;
          this.selectedPoint.equipmentId = this.selectedEquipment?.uuid || '';
          this.selectedPoint.equipmentQuantity = this.editedEquipmentQuantity;
        }
        
        // Déclencher le rechargement des points dans la sidebar
        this.mapService.triggerReloadPoints();
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du point:', error);
        // En cas d'erreur, restaurer le stock
        if (this.selectedEquipment && this.selectedEquipment.remainingStock !== undefined) {
          this.selectedEquipment.remainingStock += stockDifference;
        }
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
    return equipment.description || equipment.type || 'Équipement sans nom';
  }

  deletePoint(): void {
    if (!this.selectedPoint) return;

    if (!confirm(`Voulez-vous vraiment supprimer ce point ?`)) {
      return;
    }

    const pointToDelete = this.selectedPoint;

    // Restaurer le stock de l'équipement si nécessaire
    if (pointToDelete.equipmentId && pointToDelete.equipmentQuantity) {
      const equipment = this.equipments.find(e => e.uuid === pointToDelete.equipmentId);
      if (equipment && equipment.remainingStock !== undefined) {
        equipment.remainingStock += pointToDelete.equipmentQuantity;
        this.updateEquipmentStock(equipment);
      }
    }

    // Supprimer le point
    this.pointService.delete(pointToDelete.uuid).subscribe({
      next: () => {
        console.log('Point supprimé avec succès');
        
        // Fermer le drawer
        this.closeDrawer();
        
        // Recharger les points pour mettre à jour l'affichage et réordonner
        this.reloadPointsAndReorder();
      },
      error: (error) => {
        console.error('Erreur lors de la suppression du point:', error);
        alert('Erreur lors de la suppression du point');
        
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
