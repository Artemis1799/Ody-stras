import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamService } from '../../../services/TeamService';
import { MemberService } from '../../../services/MemberService';
import { TeamMemberService } from '../../../services/TeamMemberService';
import { Team } from '../../../models/teamModel';
import { Member } from '../../../models/memberModel';
import { TeamMember } from '../../../models/teamMemberModel';
import { forkJoin } from 'rxjs';
import { TeamPopupComponent, TeamFormData } from '../../../shared/team-popup/team-popup';
import { DeletePopupComponent } from '../../../shared/delete-popup/delete-popup';
import { ToastService } from '../../../services/ToastService';

interface TeamWithMembers extends Team {
  members: Member[];
}

@Component({
  selector: 'app-groupes',
  standalone: true,
  imports: [CommonModule, FormsModule, TeamPopupComponent, DeletePopupComponent],
  templateUrl: './groupes.component.html',
  styleUrl: './groupes.component.scss'
})
export class GroupesComponent implements OnInit {
  // Injection des services
  private teamService = inject(TeamService);
  private memberService = inject(MemberService);
  private teamMemberService = inject(TeamMemberService);
  private toastService = inject(ToastService);
  
  // Signals calculés pour combiner les données
  readonly teams = computed<TeamWithMembers[]>(() => {
    const teams = this.teamService.teams();
    const members = this.memberService.members();
    const teamMembers = this.teamMemberService.teamMembers();
    
    return teams.map(team => {
      const memberIds = teamMembers
        .filter((tm: TeamMember) => tm.teamId === team.uuid)
        .map((tm: TeamMember) => tm.memberId);
      
      const teamMembersList = members
        .filter(m => memberIds.includes(m.uuid))
        .sort((a, b) => {
          const firstNameCompare = a.firstName.localeCompare(b.firstName, 'fr');
          return firstNameCompare !== 0 ? firstNameCompare : a.name.localeCompare(b.name, 'fr');
        });
      
      return {
        ...team,
        members: teamMembersList
      };
    });
  });
  
  readonly allMembers = computed(() => 
    [...this.memberService.members()].sort((a, b) => {
      const firstNameCompare = a.firstName.localeCompare(b.firstName, 'fr');
      return firstNameCompare !== 0 ? firstNameCompare : a.name.localeCompare(b.name, 'fr');
    })
  );
  
  readonly isLoading = computed(() => 
    this.teamService.loading() || 
    this.memberService.loading() || 
    this.teamMemberService.loading()
  );
  
  // Dialog state avec Signals
  showDialog = signal(false);
  isEditing = signal(false);
  currentTeam = signal<Partial<Team>>({});
  selectedMembers = signal<Member[]>([]);
  
  // Confirmation dialog
  showDeleteConfirm = signal(false);
  teamToDelete = signal<TeamWithMembers | null>(null);

  ngOnInit(): void {
    // Charger les données au démarrage
    this.teamService.load();
    this.memberService.load();
    this.teamMemberService.load();
  }

  openCreateDialog(): void {
    this.isEditing.set(false);
    this.currentTeam.set({ teamName: '', number: this.teams().length + 1 });
    this.selectedMembers.set([]);
    this.showDialog.set(true);
  }

  openEditDialog(team: TeamWithMembers): void {
    this.isEditing.set(true);
    this.currentTeam.set({ ...team });
    this.selectedMembers.set([...team.members]);
    this.showDialog.set(true);
  }

  closeDialog(): void {
    this.showDialog.set(false);
    this.currentTeam.set({});
    this.selectedMembers.set([]);
  }

  onTeamSave(data: TeamFormData): void {
    // Fermer immédiatement - l'API s'exécute en arrière-plan
    const teamToSave = { ...data.team };
    const membersToSave = [...data.selectedMembers];
    const wasEditing = this.isEditing();
    const teamUuid = data.team.uuid;
    
    this.closeDialog();
    
    // Exécuter les opérations en arrière-plan
    this.saveTeamAsync(teamToSave, membersToSave, wasEditing, teamUuid);
  }

  private saveTeamAsync(team: Partial<Team>, members: Member[], isEditing: boolean, uuid?: string): void {
    if (!team.teamName?.trim()) {
      return;
    }

    if (isEditing && uuid) {
      // Update team
      this.teamService.update(uuid, team as Team).subscribe({
        next: () => {
          this.toastService.showSuccess('Groupe modifié', `Le groupe "${team.teamName}" a été modifié avec succès`);
          this.updateTeamMembersAsync(uuid, members);
        },
        error: () => {
          this.toastService.showError('Erreur', 'Impossible de modifier le groupe');
        }
      });
    } else {
      // Create team
      this.teamService.create(team as Team).subscribe({
        next: (newTeam) => {
          this.toastService.showSuccess('Groupe créé', `Le groupe "${team.teamName}" a été créé avec succès`);
          this.addMembersToTeamAsync(newTeam.uuid, members);
        },
        error: () => {
          this.toastService.showError('Erreur', 'Impossible de créer le groupe');
        }
      });
    }
  }

  private updateTeamMembersAsync(teamId: string, selectedMembers: Member[]): void {
    this.teamMemberService.getAll().subscribe({
      next: (allTeamMembers) => {
        const currentMembers = allTeamMembers.filter(tm => tm.teamId === teamId);
        const currentMemberIds = currentMembers.map(tm => tm.memberId);
        const newMemberIds = selectedMembers.map(m => m.uuid);
        
        const toRemove = currentMembers.filter(tm => !newMemberIds.includes(tm.memberId));
        const toAdd = selectedMembers.filter(m => !currentMemberIds.includes(m.uuid));
        
        const deleteOps = toRemove.map(tm => 
          this.teamMemberService.delete(tm.teamId, tm.memberId)
        );
        const addOps = toAdd.map(m => 
          this.teamMemberService.create({ teamId, memberId: m.uuid })
        );
        
        if (deleteOps.length === 0 && addOps.length === 0) {
          return;
        }
        
        forkJoin([...deleteOps, ...addOps]).subscribe({
          error: (error) => {
            console.error('Erreur lors de la mise à jour des membres:', error);
          }
        });
      }
    });
  }

  private addMembersToTeamAsync(teamId: string, selectedMembers: Member[]): void {
    if (selectedMembers.length === 0) {
      return;
    }
    
    const addOps = selectedMembers.map(m => 
      this.teamMemberService.create({ teamId, memberId: m.uuid })
    );
    
    forkJoin(addOps).subscribe({
      error: (error) => {
        console.error('Erreur lors de l\'ajout des membres:', error);
      }
    });
  }

  confirmDelete(team: TeamWithMembers): void {
    this.teamToDelete.set(team);
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
    this.teamToDelete.set(null);
  }

  deleteTeam(): void {
    const team = this.teamToDelete();
    if (!team) return;

    this.cancelDelete();
    
    this.teamService.delete(team.uuid).subscribe({
      next: () => {
        this.toastService.showSuccess('Groupe supprimé', `Le groupe "${team.teamName}" a été supprimé`);
      },
      error: () => {
        this.toastService.showError('Erreur', 'Impossible de supprimer le groupe');
      }
    });
  }

  getMemberNames(members: Member[]): string {
    if (members.length === 0) return 'Aucun membre';
    if (members.length <= 2) {
      return members.map(m => `${m.firstName} ${m.name}`).join(', ');
    }
    return `${members[0].firstName} ${members[0].name} et ${members.length - 1} autre(s)`;
  }
}

