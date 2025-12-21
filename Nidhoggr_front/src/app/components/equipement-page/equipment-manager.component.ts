import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { EquipmentService } from '../../services/EquipmentService';
import { PointService } from '../../services/PointService';
import { Equipment } from '../../models/equipmentModel';
import { Observable } from 'rxjs';
import { EquipmentCard } from './equipment-card/equipment-card';
import { ToastService } from '../../services/ToastService';

@Component({
  selector: 'app-equipment-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputText,
    InputNumber,
    EquipmentCard
  ],
  templateUrl: './equipment-manager.component.html',
  styleUrls: ['./equipment-manager.component.scss']
})
export class EquipmentManagerComponent implements OnInit {
  equipments$: Observable<Equipment[]>;
  editingEquipment: Equipment | null = null;
  isLoading = false;
  errorMessage = '';

  // Nouvel équipement
  newEquipment: Partial<Equipment> = {
    type: '',
    description: '',
    length: 0,
    storageType: 0
  };
  showAddForm = false;

  constructor(
    private equipmentService: EquipmentService,
    private pointService: PointService,
    private toastService: ToastService
  ) {
    this.equipments$ = this.equipmentService.equipments$;
  }

  ngOnInit(): void {
    this.loadEquipments();
  }

  loadEquipments(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.equipmentService.getAll().subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des équipements:', error);
        this.errorMessage = 'Impossible de charger les équipements';
        this.isLoading = false;
      }
    });
  }

  startEdit(equipment: Equipment): void {
    this.editingEquipment = { ...equipment };
  }

  cancelEdit(): void {
    this.editingEquipment = null;
  }

  saveEquipment(equipment: Equipment): void {
    if (!this.editingEquipment) return;

    const editedEquipmentName = this.editingEquipment.description || this.editingEquipment.type;

    this.equipmentService.update(equipment.uuid, this.editingEquipment).subscribe({
      next: () => {
        this.toastService.showSuccess('Équipement modifié', `L'équipement "${editedEquipmentName}" a été modifié avec succès`);
        this.editingEquipment = null;
      },
      error: () => {
        this.toastService.showError('Erreur', 'Impossible de modifier l\'équipement');
      }
    });
  }

  deleteEquipment(equipment: Equipment): void {
    if (!confirm(`Voulez-vous vraiment supprimer l'équipement "${equipment.description || equipment.type}" ?`)) {
      return;
    }

    // Charger tous les points qui utilisent cet équipement
    this.pointService.getAll().subscribe({
      next: (points) => {
        const pointsWithEquipment = points.filter(p => p.equipmentId === equipment.uuid);
        
        // Mettre à jour les points concernés (retirer l'équipement)
        const updatePromises = pointsWithEquipment.map(point => {
          const updatedPoint = {
            ...point,
            equipmentId: '',
            equipmentQuantity: 0
          };
          return this.pointService.update(point.uuid, updatedPoint).toPromise();
        });

        Promise.all(updatePromises).then(() => {
          // Supprimer l'équipement
          this.equipmentService.delete(equipment.uuid).subscribe({
            next: () => {
              this.toastService.showSuccess('Équipement supprimé', `L'équipement "${equipment.description || equipment.type}" a été supprimé. ${pointsWithEquipment.length} point(s) mis à jour.`);
            },
            error: () => {
              this.toastService.showError('Erreur', 'Impossible de supprimer l\'équipement');
            }
          });
        }).catch(() => {
          this.toastService.showError('Erreur', 'Impossible de mettre à jour les points');
        });
      },
      error: (error) => {
        console.error('Erreur lors du chargement des points:', error);
      }
    });
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (this.showAddForm) {
      this.newEquipment = {
        type: '',
        description: '',
        length: 0,
        storageType: 0
      };
    }
  }

  addEquipment(): void {
    if (!this.newEquipment.type || !this.newEquipment.description) {
      this.toastService.showWarning('Champs requis', 'Le type et la description sont obligatoires');
      return;
    }

    this.equipmentService.create(this.newEquipment as Equipment).subscribe({
      next: () => {
        this.toastService.showSuccess('Équipement créé', `L'équipement "${this.newEquipment.description || this.newEquipment.type}" a été créé avec succès`);
        this.showAddForm = false;
        this.newEquipment = {
          type: '',
          description: '',
          length: 0,
          storageType: 0
        };
      },
      error: () => {
        this.toastService.showError('Erreur', 'Impossible de créer l\'équipement');
      }
    });
  }

  isEditing(equipment: Equipment): boolean {
    return this.editingEquipment?.uuid === equipment.uuid;
  }
}

