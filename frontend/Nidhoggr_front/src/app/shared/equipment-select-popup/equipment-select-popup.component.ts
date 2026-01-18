import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Equipment } from '../../models/equipmentModel';

@Component({
  selector: 'app-equipment-select-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './equipment-select-popup.component.html',
  styleUrls: ['./equipment-select-popup.component.scss']
})
export class EquipmentSelectPopupComponent implements OnInit {
  @Input() equipments: Equipment[] = [];
  @Output() equipmentSelected = new EventEmitter<Equipment>();
  @Output() cancelled = new EventEmitter<void>();

  selectedEquipmentUuid: string | null = null;

  ngOnInit(): void {
    if (this.equipments.length === 1) {
      this.selectedEquipmentUuid = this.equipments[0].uuid;
    }
  }

  onConfirm(): void {
    if (!this.selectedEquipmentUuid) return;
    
    const selected = this.equipments.find(e => e.uuid === this.selectedEquipmentUuid);
    if (selected) {
      this.equipmentSelected.emit(selected);
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
