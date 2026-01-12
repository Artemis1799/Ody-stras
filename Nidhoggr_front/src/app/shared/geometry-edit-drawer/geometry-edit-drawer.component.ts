import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Area } from '../../models/areaModel';
import { RoutePath } from '../../models/routePathModel';
import { GeometryEditData } from '../../models/geometryEditModel';
import { AreaService } from '../../services/AreaService';
import { PathService } from '../../services/PathService';
import { ToastService } from '../../services/ToastService';
import { NgIf } from '@angular/common';

export type { GeometryEditData, GeometryType } from '../../models/geometryEditModel';

@Component({
  selector: 'app-geometry-edit-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIf],
  templateUrl: './geometry-edit-drawer.component.html',
  styleUrls: ['./geometry-edit-drawer.component.scss']
})
export class GeometryEditDrawerComponent implements OnInit {
  @Input() geometry!: GeometryEditData;
  @Output() close = new EventEmitter<void>();
  @Output() geometryUpdated = new EventEmitter<GeometryEditData>();

  formData = {
    name: '',
    description: ''
  };

  isSubmitting = false;
  errorMessage = '';

  constructor(
    private areaService: AreaService,
    private pathService: PathService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    if (this.geometry) {
      if (this.geometry.type === 'area') {
        const area = this.geometry.data as Area;
        this.formData.name = area.name || '';
        this.formData.description = area.description || '';
      } else {
        const path = this.geometry.data as RoutePath;
        this.formData.name = path.name || '';
        this.formData.description = path.description || '';
      }
    }
  }

  get isArea(): boolean {
    return this.geometry?.type === 'area';
  }

  get title(): string {
    return this.isArea ? 'Modifier la zone' : 'Modifier le parcours';
  }

  get subtitle(): string {
    return this.isArea 
      ? 'Modifiez le nom et la description de cette zone'
      : 'Modifiez le nom et la description de ce parcours';
  }

  onSubmit(): void {
    if (this.geometry.type === 'path' && !this.formData.name?.trim()) {
      this.errorMessage = 'Le nom est requis pour un parcours';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    if (this.geometry.type === 'area') {
      const area = this.geometry.data as Area;
      const updatedArea: Area = {
        ...area,
        name: this.formData.name?.trim() || undefined,
        description: this.formData.description?.trim() || undefined
      };

      this.areaService.update(area.uuid, updatedArea).subscribe({
        next: (result) => {
          this.isSubmitting = false;
          this.toastService.showSuccess('Zone modifiée', `La zone a été modifiée avec succès`);
          this.geometryUpdated.emit({ type: 'area', data: result });
          this.close.emit();
        },
        error: () => {
          this.isSubmitting = false;
          this.toastService.showError('Erreur', 'Impossible de modifier la zone');
        }
      });
    } else {
      const path = this.geometry.data as RoutePath;
      const updatedPath: RoutePath = {
        ...path,
        name: this.formData.name.trim(),
        description: this.formData.description?.trim() || undefined
      };

      this.pathService.update(path.uuid, updatedPath).subscribe({
        next: (result) => {
          this.isSubmitting = false;
          this.toastService.showSuccess('Parcours modifié', `Le parcours "${updatedPath.name}" a été modifié avec succès`);
          this.geometryUpdated.emit({ type: 'path', data: result });
          this.close.emit();
        },
        error: () => {
          this.isSubmitting = false;
          this.toastService.showError('Erreur', 'Impossible de modifier le parcours');
        }
      });
    }
  }
}
