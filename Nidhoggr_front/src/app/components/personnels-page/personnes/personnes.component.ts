import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MemberService } from '../../../services/MemberService';
import { Member } from '../../../models/memberModel';
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
  private memberService = inject(MemberService);
  private toastService = inject(ToastService);
  
  // Signal calculé pour trier les membres par ordre alphabétique
  members = computed(() => 
    [...this.memberService.members()].sort((a, b) => {
      const firstNameCompare = a.firstName.localeCompare(b.firstName, 'fr');
      return firstNameCompare !== 0 ? firstNameCompare : a.name.localeCompare(b.name, 'fr');
    })
  );
  isLoading = this.memberService.loading;
  
  // Champs de recherche
  searchName = signal('');
  searchFirstName = signal('');
  searchEmail = signal('');
  
  // Signal calculé pour les membres filtrés
  filteredMembers = computed(() => {
    const members = this.members();
    const nameFilter = this.searchName().toLowerCase().trim();
    const firstNameFilter = this.searchFirstName().toLowerCase().trim();
    const emailFilter = this.searchEmail().toLowerCase().trim();
    
    if (!nameFilter && !firstNameFilter && !emailFilter) {
      return members;
    }
    
    return members.filter(member => {
      const matchesName = !nameFilter || member.name.toLowerCase().includes(nameFilter);
      const matchesFirstName = !firstNameFilter || member.firstName.toLowerCase().includes(firstNameFilter);
      const matchesEmail = !emailFilter || (member.email?.toLowerCase().includes(emailFilter) ?? false);
      
      return matchesName && matchesFirstName && matchesEmail;
    });
  });
  
  // État local avec signals
  showDialog = signal(false);
  isEditing = signal(false);
  currentMember = signal<Partial<Member>>({});
  
  showDeleteConfirm = signal(false);
  memberToDelete = signal<Member | null>(null);

  ngOnInit(): void {
    // Charger une seule fois au démarrage si pas déjà chargé
    if (!this.memberService.initialized()) {
      this.memberService.load();
    }
  }

  openCreateDialog(): void {
    this.isEditing.set(false);
    this.currentMember.set({ name: '', firstName: '' });
    this.showDialog.set(true);
  }

  openEditDialog(member: Member): void {
    this.isEditing.set(true);
    this.currentMember.set({ ...member });
    this.showDialog.set(true);
  }

  closeDialog(): void {
    this.showDialog.set(false);
    this.currentMember.set({});
  }

  onPersonSave(person: Partial<Member>): void {
    if (!person.name?.trim() || !person.firstName?.trim()) {
      return;
    }

    // Fermer immédiatement
    this.closeDialog();

    if (this.isEditing() && person.uuid) {
      // Mise à jour optimiste - l'UI se met à jour instantanément
      this.memberService.update(person.uuid, person as Member).subscribe({
        next: () => {
          this.toastService.showSuccess('Personne modifiée', `${person.firstName} ${person.name} a été modifié(e) avec succès`);
        },
        error: () => {
          this.toastService.showError('Erreur', 'Impossible de modifier la personne');
        }
      });
    } else {
      // Création optimiste - le membre apparaît immédiatement
      this.memberService.create(person as Member).subscribe({
        next: () => {
          this.toastService.showSuccess('Personne créée', `${person.firstName} ${person.name} a été créé(e) avec succès`);
        },
        error: () => {
          this.toastService.showError('Erreur', 'Impossible de créer la personne');
        }
      });
    }
  }

  confirmDelete(member: Member): void {
    this.memberToDelete.set(member);
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
    this.memberToDelete.set(null);
  }

  deleteMember(): void {
    const member = this.memberToDelete();
    if (!member) return;

    // Fermer et supprimer de façon optimiste
    this.cancelDelete();
    
    this.memberService.delete(member.uuid).subscribe({
      next: () => {
        this.toastService.showSuccess('Personne supprimée', `${member.firstName} ${member.name} a été supprimé(e)`);
      },
      error: () => {
        this.toastService.showError('Erreur', 'Impossible de supprimer la personne');
      }
    });
  }

  getInitials(member: Member): string {
    return (member.firstName.charAt(0) + member.name.charAt(0)).toUpperCase();
  }
  
  onSearchChange(): void {
    // La réactivité est automatique grâce aux signals
  }
  
  clearSearch(field: 'name' | 'firstName' | 'email'): void {
    if (field === 'name') {
      this.searchName.set('');
    } else if (field === 'firstName') {
      this.searchFirstName.set('');
    } else if (field === 'email') {
      this.searchEmail.set('');
    }
  }
}
