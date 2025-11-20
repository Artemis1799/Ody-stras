import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InputText } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { EquipmentService } from '../../../service/EquipmentService';
import { PointService } from '../../../service/PointService';
import { Equipment } from '../../../classe/equipmentModel';
import { Point } from '../../../classe/pointModel';

@Component({
  selector: 'app-equipment-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputText,
    InputNumber
  ],
  templateUrl: './equipment-manager.component.html',
  styleUrls: ['./equipment-manager.component.scss']
})
export class EquipmentManagerComponent implements OnInit {
  equipments: Equipment[] = [];
  editingEquipment: Equipment | null = null;
  isLoading = false;
  errorMessage = '';

  // Nouvel équipement
  newEquipment: Partial<Equipment> = {
    type: '',
    description: '',
    unit: '',
    totalStock: 0,
    remainingStock: 0
  };
  showAddForm = false;

  constructor(
    private equipmentService: EquipmentService,
    private pointService: PointService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEquipments();
  }

  loadEquipments(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.equipmentService.getAll().subscribe({
      next: (data) => {
        this.equipments = data;
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

    const oldTotalStock = equipment.totalStock || 0;
    const newTotalStock = this.editingEquipment.totalStock || 0;
    const stockDifference = newTotalStock - oldTotalStock;

    // Mettre à jour le remaining stock proportionnellement
    if (stockDifference !== 0 && equipment.remainingStock !== undefined) {
      this.editingEquipment.remainingStock = (equipment.remainingStock || 0) + stockDifference;
      
      // S'assurer que le remaining stock ne dépasse pas le total stock
      if (this.editingEquipment.remainingStock > newTotalStock) {
        this.editingEquipment.remainingStock = newTotalStock;
      }
    }

    this.equipmentService.update(equipment.uuid, this.editingEquipment).subscribe({
      next: () => {
        // Mettre à jour l'équipement dans la liste
        const index = this.equipments.findIndex(e => e.uuid === equipment.uuid);
        if (index !== -1) {
          this.equipments[index] = { ...this.editingEquipment! };
        }
        this.editingEquipment = null;
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour de l\'équipement:', error);
        alert('Erreur lors de la mise à jour de l\'équipement');
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
              this.equipments = this.equipments.filter(e => e.uuid !== equipment.uuid);
              alert(`Équipement supprimé. ${pointsWithEquipment.length} point(s) mis à jour.`);
            },
            error: (error) => {
              console.error('Erreur lors de la suppression de l\'équipement:', error);
              alert('Erreur lors de la suppression de l\'équipement');
            }
          });
        }).catch((error) => {
          console.error('Erreur lors de la mise à jour des points:', error);
          alert('Erreur lors de la mise à jour des points');
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
        unit: '',
        totalStock: 0,
        remainingStock: 0
      };
    }
  }

  addEquipment(): void {
    if (!this.newEquipment.type || !this.newEquipment.description) {
      alert('Le type et la description sont obligatoires');
      return;
    }

    // S'assurer que remainingStock = totalStock pour un nouvel équipement
    this.newEquipment.remainingStock = this.newEquipment.totalStock;

    this.equipmentService.create(this.newEquipment as Equipment).subscribe({
      next: (created) => {
        this.equipments.push(created);
        this.showAddForm = false;
        this.newEquipment = {
          type: '',
          description: '',
          unit: '',
          totalStock: 0,
          remainingStock: 0
        };
      },
      error: (error) => {
        console.error('Erreur lors de la création de l\'équipement:', error);
        alert('Erreur lors de la création de l\'équipement');
      }
    });
  }

  onClose(): void {
    this.router.navigate(['/map']);
  }

  isEditing(equipment: Equipment): boolean {
    return this.editingEquipment?.uuid === equipment.uuid;
  }
}
