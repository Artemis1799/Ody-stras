import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MemberService } from '../../../services/MemberService';
import { Member } from '../../../models/memberModel';
import { PersonPopupComponent } from '../../../shared/person-popup/person-popup';
import { DeletePopupComponent } from '../../../shared/delete-popup/delete-popup';

@Component({
  selector: 'app-personnes',
  standalone: true,
  imports: [CommonModule, FormsModule, PersonPopupComponent, DeletePopupComponent],
  templateUrl: './personnes.component.html',
  styleUrl: './personnes.component.scss'
})
export class PersonnesComponent implements OnInit {
  private memberService = inject(MemberService);
  
  // Signal calculé pour trier les membres par ordre alphabétique
  members = computed(() => 
    [...this.memberService.members()].sort((a, b) => {
      const firstNameCompare = a.firstName.localeCompare(b.firstName, 'fr');
      return firstNameCompare !== 0 ? firstNameCompare : a.name.localeCompare(b.name, 'fr');
    })
  );
  isLoading = this.memberService.loading;
  
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
        error: (error) => console.error('Erreur lors de la modification:', error)
      });
    } else {
      // Création optimiste - le membre apparaît immédiatement
      this.memberService.create(person as Member).subscribe({
        error: (error) => console.error('Erreur lors de la création:', error)
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
      error: (error) => console.error('Erreur lors de la suppression:', error)
    });
  }

  getInitials(member: Member): string {
    return (member.firstName.charAt(0) + member.name.charAt(0)).toUpperCase();
  }
}
