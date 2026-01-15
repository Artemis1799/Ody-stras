import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../../services/EmployeeService';
import { Employee } from '../../../models/employeeModel';
import { PersonPopupComponent } from '../../../shared/person-popup/person-popup';
import { DeletePopupComponent } from '../../../shared/delete-popup/delete-popup';
import { ToastService } from '../../../services/ToastService';

@Component({
  selector: 'app-personnes',
  standalone: true,
  imports: [CommonModule, FormsModule, PersonPopupComponent, DeletePopupComponent],
  templateUrl: './personnes.component.html',
  styleUrl: './personnes.component.scss'
})
export class PersonnesComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private toastService = inject(ToastService);
  
  // Signal calculé pour trier les employés par ordre alphabétique
  employees = computed(() => 
    [...this.employeeService.employees()].sort((a, b) => {
      const firstNameCompare = a.firstName.localeCompare(b.firstName, 'fr');
      return firstNameCompare !== 0 ? firstNameCompare : a.lastName.localeCompare(b.lastName, 'fr');
    })
  );
  isLoading = this.employeeService.loading;
  
  // Champs de recherche
  searchLastName = signal('');
  searchFirstName = signal('');
  searchEmail = signal('');
  
  // Pagination
  currentPage = signal(1);
  readonly itemsPerPage = 24
  
  // Signal calculé pour les employés filtrés
  filteredEmployees = computed(() => {
    const employees = this.employees();
    const lastNameFilter = this.searchLastName().toLowerCase().trim();
    const firstNameFilter = this.searchFirstName().toLowerCase().trim();
    const emailFilter = this.searchEmail().toLowerCase().trim();
    
    if (!lastNameFilter && !firstNameFilter && !emailFilter) {
      return employees;
    }
    
    return employees.filter(employee => {
      const matchesLastName = !lastNameFilter || employee.lastName.toLowerCase().includes(lastNameFilter);
      const matchesFirstName = !firstNameFilter || employee.firstName.toLowerCase().includes(firstNameFilter);
      const matchesEmail = !emailFilter || (employee.email?.toLowerCase().includes(emailFilter) ?? false);
      
      return matchesLastName && matchesFirstName && matchesEmail;
    });
  });
  
  // Signal calculé pour les employés paginés
  paginatedEmployees = computed(() => {
    const filtered = this.filteredEmployees();
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return filtered.slice(start, end);
  });
  
  // Nombre total de pages
  totalPages = computed(() => {
    return Math.ceil(this.filteredEmployees().length / this.itemsPerPage);
  });
  
  // État local avec signals
  showDialog = signal(false);
  isEditing = signal(false);
  currentEmployee = signal<Partial<Employee>>({});
  
  showDeleteConfirm = signal(false);
  employeeToDelete = signal<Employee | null>(null);

  ngOnInit(): void {
    // Charger une seule fois au démarrage si pas déjà chargé
    if (!this.employeeService.initialized()) {
      this.employeeService.load();
    }
  }

  openCreateDialog(): void {
    this.isEditing.set(false);
    this.currentEmployee.set({ lastName: '', firstName: '' });
    this.showDialog.set(true);
  }

  openEditDialog(employee: Employee): void {
    this.isEditing.set(true);
    this.currentEmployee.set({ ...employee });
    this.showDialog.set(true);
  }

  closeDialog(): void {
    this.showDialog.set(false);
    this.currentEmployee.set({});
  }

  onPersonSave(person: Partial<Employee>): void {
    if (!person.lastName?.trim() || !person.firstName?.trim()) {
      return;
    }

    // Fermer immédiatement
    this.closeDialog();

    if (this.isEditing() && person.uuid) {
      // Mise à jour optimiste - l'UI se met à jour instantanément
      this.employeeService.update(person.uuid, person as Employee).subscribe({
        next: () => {
          this.toastService.showSuccess('Personne modifiée', `${person.firstName} ${person.lastName} a été modifié(e) avec succès`);
        },
        error: () => {
          this.toastService.showError('Erreur', 'Impossible de modifier la personne');
        }
      });
    } else {
      // Création optimiste - l'employé apparaît immédiatement
      this.employeeService.create(person as Employee).subscribe({
        next: () => {
          this.toastService.showSuccess('Personne créée', `${person.firstName} ${person.lastName} a été créé(e) avec succès`);
        },
        error: () => {
          this.toastService.showError('Erreur', 'Impossible de créer la personne');
        }
      });
    }
  }

  confirmDelete(employee: Employee): void {
    this.employeeToDelete.set(employee);
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
    this.employeeToDelete.set(null);
  }

  deleteEmployee(): void {
    const employee = this.employeeToDelete();
    if (!employee) return;

    // Fermer et supprimer de façon optimiste
    this.cancelDelete();
    
    this.employeeService.delete(employee.uuid).subscribe({
      next: () => {
        this.toastService.showSuccess('Personne supprimée', `${employee.firstName} ${employee.lastName} a été supprimé(e)`);
      },
      error: () => {
        this.toastService.showError('Erreur', 'Impossible de supprimer la personne');
      }
    });
  }

  getInitials(employee: Employee): string {
    return (employee.firstName.charAt(0) + employee.lastName.charAt(0)).toUpperCase();
  }

  toggleFavorite(employee: Employee): void {
    this.employeeService.toggleFavorite(employee.uuid).subscribe({
      next: (updatedEmployee) => {
        const action = updatedEmployee.isFavorite ? 'ajouté aux favoris' : 'retiré des favoris';
        this.toastService.showSuccess('Favori', `${employee.firstName} ${employee.lastName} ${action}`);
      },
      error: () => {
        this.toastService.showError('Erreur', 'Impossible de modifier le favori');
      }
    });
  }
  
  onSearchChange(): void {
    // Réinitialiser à la première page lors d'une recherche
    this.currentPage.set(1);
  }
  
  clearSearch(field: 'lastName' | 'firstName' | 'email'): void {
    if (field === 'lastName') {
      this.searchLastName.set('');
    } else if (field === 'firstName') {
      this.searchFirstName.set('');
    } else if (field === 'email') {
      this.searchEmail.set('');
    }
    this.currentPage.set(1);
  }
  
  // Navigation de pagination
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }
  
  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }
  
  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }
  
  // Génère les numéros de page à afficher
  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    
    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push(-1); // ellipsis
        pages.push(total);
      } else if (current >= total - 3) {
        pages.push(1);
        pages.push(-1);
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1);
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push(-1);
        pages.push(total);
      }
    }
    
    return pages;
  }
}
