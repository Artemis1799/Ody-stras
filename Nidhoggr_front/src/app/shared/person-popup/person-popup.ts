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
    if (!this.person.name?.trim() || !this.person.firstName?.trim()) {
      return;
    }

    // Validate email length
    if (this.person.email && this.person.email.length > 60) {
      return;
    }

    // Validate phone format (0 followed by 9 digits)
    if (this.person.phoneNumber && !/^0[0-9]{9}$/.test(this.person.phoneNumber)) {
      return;
    }

    this.save.emit({ ...this.person });
  }

  onClose(): void {
    this.close.emit();
  }
}
