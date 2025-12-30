import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Employee } from '../../models/employeeModel';

@Component({
  selector: 'app-person-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './person-popup.html',
  styleUrl: './person-popup.scss'
})
export class PersonPopupComponent {
  @Input() isEditing = false;
  @Input() person: Partial<Employee> = {};

  @Output() save = new EventEmitter<Partial<Employee>>();
  @Output() close = new EventEmitter<void>();

  onSave(): void {
    if (!this.person.lastName?.trim() || !this.person.firstName?.trim()) {
      return;
    }

    // Validate email length
    if (this.person.email && this.person.email.length > 60) {
      return;
    }

    // Validate phone format (0 followed by 9 digits)
    if (this.person.phone && !/^0[0-9]{9}$/.test(this.person.phone)) {
      return;
    }

    this.save.emit({ ...this.person });
  }

  onClose(): void {
    this.close.emit();
  }
}
