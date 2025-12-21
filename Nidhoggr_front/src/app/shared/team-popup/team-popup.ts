import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Team } from '../../models/teamModel';
import { Employee } from '../../models/employeeModel';
import { Event } from '../../models/eventModel';

export interface TeamFormData {
  team: Partial<Team>;
  selectedEmployees: Employee[];
}

@Component({
  selector: 'app-team-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './team-popup.html',
  styleUrl: './team-popup.scss'
})
export class TeamPopupComponent {
  @Input() isEditing = false;
  @Input() team: Partial<Team> = {};
  @Input() allEmployees: Employee[] = [];
  @Input() selectedEmployees: Employee[] = [];
  @Input() events: Event[] = [];
  
  // Signaux de recherche
  searchLastName = signal('');
  searchFirstName = signal('');
  
  get sortedEmployees(): Employee[] {
    return [...this.allEmployees].sort((a, b) => {
      const firstNameCompare = a.firstName.localeCompare(b.firstName, 'fr');
      return firstNameCompare !== 0 ? firstNameCompare : a.lastName.localeCompare(b.lastName, 'fr');
    });
  }
  
  @Output() selectedEmployeesChange = new EventEmitter<Employee[]>();
  @Output() save = new EventEmitter<TeamFormData>();
  @Output() close = new EventEmitter<void>();
  
  getFilteredEmployees(): Employee[] {
    const lastNameFilter = this.searchLastName().toLowerCase().trim();
    const firstNameFilter = this.searchFirstName().toLowerCase().trim();
    
    return this.sortedEmployees.filter(employee => {
      const matchesLastName = !lastNameFilter || employee.lastName.toLowerCase().includes(lastNameFilter);
      const matchesFirstName = !firstNameFilter || employee.firstName.toLowerCase().includes(firstNameFilter);
      
      return matchesLastName && matchesFirstName;
    });
  }

  isEmployeeSelected(employee: Employee): boolean {
    return this.selectedEmployees.some(e => e.uuid === employee.uuid);
  }

  toggleEmployee(employee: Employee): void {
    if (this.isEmployeeSelected(employee)) {
      this.selectedEmployees = this.selectedEmployees.filter(e => e.uuid !== employee.uuid);
    } else {
      this.selectedEmployees = [...this.selectedEmployees, employee];
    }
    this.selectedEmployeesChange.emit(this.selectedEmployees);
  }

  onSave(): void {
    if (this.team.teamName?.trim() && this.team.eventId) {
      this.save.emit({
        team: { ...this.team },
        selectedEmployees: [...this.selectedEmployees]
      });
    }
  }

  onClose(): void {
    this.close.emit();
  }
  
  parseNumber(value: string | number | null): number | undefined {
    if (!value) return undefined;
    const num = parseInt(String(value), 10);
    return isNaN(num) ? undefined : num;
  }
}
