import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-delete-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-popup.html',
  styleUrl: './delete-popup.scss'
})
export class DeletePopupComponent {
  @Input() title = 'Confirmer la suppression';
  @Input() itemName = '';
  @Input() warningMessage = 'Cette action est irréversible.';
  
  @Output() confirm = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onClose(): void {
    this.close.emit();
  }
}
