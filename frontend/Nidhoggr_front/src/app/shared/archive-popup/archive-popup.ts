import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-archive-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './archive-popup.html',
  styleUrl: './archive-popup.scss'
})
export class ArchivePopupComponent {
  @Input() title = 'Confirmer l\'archivage';
  @Input() itemName = '';
  @Input() warningMessage = 'L\'élément sera déplacé dans l\'historique.';
  @Input() isToArchive = true;
  
  @Output() confirm = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onClose(): void {
    this.close.emit();
  }
}
