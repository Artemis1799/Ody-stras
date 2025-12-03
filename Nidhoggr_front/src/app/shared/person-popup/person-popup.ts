import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Member } from '../../models/memberModel';

@Component({
  selector: 'app-person-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './person-popup.html',
  styleUrl: './person-popup.scss'
})
export class PersonPopupComponent {
  @Input() isEditing = false;
  @Input() person: Partial<Member> = {};

  @Output() save = new EventEmitter<Partial<Member>>();
  @Output() close = new EventEmitter<void>();

  onSave(): void {
    if (this.person.name?.trim() && this.person.firstName?.trim()) {
      this.save.emit({ ...this.person });
    }
  }

  onClose(): void {
    this.close.emit();
  }
}
