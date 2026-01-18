import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { Equipment } from '../../../models/equipmentModel';

@Component({
  selector: 'app-equipment-card',
  standalone: true,
  imports: [CommonModule, FormsModule, InputText, InputNumber],
  templateUrl: './equipment-card.html',
  styleUrl: './equipment-card.scss',
})
export class EquipmentCard {
  @Input() equipment!: Equipment;
  @Input() isEditing: boolean = false;
  @Input() editingEquipment: Equipment | null = null;

  @Output() edit = new EventEmitter<Equipment>();
  @Output() delete = new EventEmitter<Equipment>();
  @Output() save = new EventEmitter<Equipment>();
  @Output() cancelEdit = new EventEmitter<void>();

  onEdit(): void {
    this.edit.emit(this.equipment);
  }

  onDelete(): void {
    this.delete.emit(this.equipment);
  }

  onSave(): void {
    this.save.emit(this.equipment);
  }

  onCancelEdit(): void {
    this.cancelEdit.emit();
  }
}
