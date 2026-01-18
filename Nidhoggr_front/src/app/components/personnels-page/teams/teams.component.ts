import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamService } from '../../../services/TeamService';
import { EmployeeService } from '../../../services/EmployeeService';
import { TeamEmployeeService } from '../../../services/TeamEmployeeService';
import { EventService } from '../../../services/EventService';
import { SecurityZoneService } from '../../../services/SecurityZoneService';
import { PlanningService } from '../../../services/PlanningService';
import { ActionService } from '../../../services/ActionService';
import { Team } from '../../../models/teamModel';
import { Employee } from '../../../models/employeeModel';
import { TeamEmployee } from '../../../models/teamEmployeeModel';
import { Event } from '../../../models/eventModel';
import { SecurityZone } from '../../../models/securityZoneModel';
import { Planning } from '../../../models/planningModel';
import { forkJoin } from 'rxjs';
import { TeamPopupComponent, TeamFormData } from '../../../shared/team-popup/team-popup';
import { DeletePopupComponent } from '../../../shared/delete-popup/delete-popup';
import { ToastService } from '../../../services/ToastService';

interface TeamWithEmployees extends Team {
  employees: Employee[];
  eventName?: string;
}

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule, FormsModule, TeamPopupComponent, DeletePopupComponent],
  templateUrl: './teams.component.html',
  styleUrl: './teams.component.scss'
})
export class TeamsComponent implements OnInit {
  // Injection des services
  private teamService = inject(TeamService);
  private employeeService = inject(EmployeeService);
  private teamEmployeeService = inject(TeamEmployeeService);
  private eventService = inject(EventService);
  private securityZoneService = inject(SecurityZoneService);
  private planningService = inject(PlanningService);
  private actionService = inject(ActionService);
  private toastService = inject(ToastService);
  
  // Security zones signal
  securityZones = signal<SecurityZone[]>([]);
  
  // Plannings signal
  plannings = signal<Planning[]>([]);
  
  // Signals calculés pour combiner les données
  readonly teams = computed<TeamWithEmployees[]>(() => {
    const teams = this.teamService.teams();
    const employees = this.employeeService.employees();
    const teamEmployees = this.teamEmployeeService.teamEmployees();
    const events = this.eventService.events();
    
    // Filtrer les équipes dont l'événement n'est pas archivé
    const nonArchivedTeams = teams.filter(team => {
      const event = events.find((e: Event) => e.uuid === team.eventId);
      return !event?.isArchived;
    });
    
    return nonArchivedTeams.map(team => {
      const employeeIds = teamEmployees
        .filter((te: TeamEmployee) => te.teamId === team.uuid)
        .map((te: TeamEmployee) => te.employeeId);
      
      const teamEmployeesList = employees
        .filter(e => employeeIds.includes(e.uuid))
        .sort((a, b) => {
          const firstNameCompare = a.firstName.localeCompare(b.firstName, 'fr');
          return firstNameCompare !== 0 ? firstNameCompare : a.lastName.localeCompare(b.lastName, 'fr');
        });
      
      const event = events.find((e: Event) => e.uuid === team.eventId);
      
      return {
        ...team,
        employees: teamEmployeesList,
        eventName: event?.title
      };
    });
  });
  
  readonly allEmployees = computed(() => 
    [...this.employeeService.employees()].sort((a, b) => {
      const firstNameCompare = a.firstName.localeCompare(b.firstName, 'fr');
      return firstNameCompare !== 0 ? firstNameCompare : a.lastName.localeCompare(b.lastName, 'fr');
    })
  );
  
  readonly events = computed(() => this.eventService.events());
  
  readonly isLoading = computed(() => 
    this.teamService.loading() || 
    this.employeeService.loading() || 
    this.teamEmployeeService.loading() ||
    this.eventService.loading()
  );
  
  // Dialog state avec Signals
  showDialog = signal(false);
  isEditing = signal(false);
  currentTeam = signal<Partial<Team>>({});
  selectedEmployees = signal<Employee[]>([]);
  
  // Confirmation dialog
  showDeleteConfirm = signal(false);
  teamToDelete = signal<TeamWithEmployees | null>(null);

  ngOnInit(): void {
    // Charger les données au démarrage
    this.teamService.load();
    this.employeeService.load();
    this.teamEmployeeService.load();
    this.eventService.load();
    this.securityZoneService.getAll().subscribe(zones => this.securityZones.set(zones));
    this.planningService.getAll().subscribe(plannings => this.plannings.set(plannings));
  }

  /**
   * Gère le changement d'event d'une équipe - détache les plannings
   * Note: Le détachement des security zones est géré automatiquement par l'API
   */
  onEventChangeRequested(data: { teamId: string; oldEventId: string; newEventId: string }): void {
    const { teamId } = data;
    
    // Trouver et détacher le planning lié à cette équipe
    const teamPlanning = this.plannings().find(p => p.teamId === teamId);
    
    if (teamPlanning) {
      const updatedPlanning: Planning = {
        ...teamPlanning,
        teamId: ''
      };
      
      this.planningService.update(teamPlanning.uuid, updatedPlanning).subscribe({
        next: () => {
          this.planningService.getAll().subscribe(plannings => this.plannings.set(plannings));
          this.toastService.showSuccess(
            'Équipe détachée', 
            'Le planning et les équipements ont été détachés de cette équipe'
          );
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour du planning:', error);
          this.toastService.showError('Erreur', 'Impossible de détacher le planning');
        }
      });
    } else {
      // Pas de planning, mais on affiche quand même un message pour les security zones détachées par l'API
      this.toastService.showSuccess(
        'Équipe mise à jour', 
        'Les équipements ont été détachés de cette équipe'
      );
    }
    
    // Recharger les security zones pour refléter les changements faits par l'API
    this.securityZoneService.getAll().subscribe(zones => {
      this.securityZones.set(zones);
    });
  }

  openCreateDialog(): void {
    this.isEditing.set(false);
    this.currentTeam.set({ teamName: '', teamNumber: this.teams().length + 1 });
    this.selectedEmployees.set([]);
    this.showDialog.set(true);
  }

  openEditDialog(team: TeamWithEmployees): void {
    this.isEditing.set(true);
    // S'assurer que teamNumber est inclus dans la copie
    this.currentTeam.set({ 
      ...team,
      teamNumber: team.teamNumber || undefined
    });
    this.selectedEmployees.set([...team.employees]);
    this.showDialog.set(true);
  }

  closeDialog(): void {
    this.showDialog.set(false);
    this.currentTeam.set({});
    this.selectedEmployees.set([]);
  }

  onTeamSave(data: TeamFormData): void {
    // Fermer immédiatement - l'API s'exécute en arrière-plan
    const teamToSave = { ...data.team };
    const employeesToSave = [...data.selectedEmployees];
    const wasEditing = this.isEditing();
    const teamUuid = data.team.uuid;
    
    this.closeDialog();
    
    // Exécuter les opérations en arrière-plan
    this.saveTeamAsync(teamToSave, employeesToSave, wasEditing, teamUuid);
  }

  private saveTeamAsync(team: Partial<Team>, employees: Employee[], isEditing: boolean, uuid?: string): void {
    if (!team.teamName?.trim()) {
      return;
    }

    if (isEditing && uuid) {
      // Update team
      this.teamService.update(uuid, team as Team).subscribe({
        next: () => {
          this.updateTeamEmployeesAsync(uuid, employees);
          this.toastService.showSuccess('Groupe modifié', `Le groupe "${team.teamName}" a été modifié avec succès`);
        },
        error: () => {
          this.toastService.showError('Erreur', 'Impossible de modifier le groupe');
        }
      });
    } else {
      // Create team
      this.teamService.create(team as Team).subscribe({
        next: (newTeam) => {
          this.addEmployeesToTeamAsync(newTeam.uuid, employees);
          this.toastService.showSuccess('Groupe créé', `Le groupe "${team.teamName}" a été créé avec succès`);
        },
        error: () => {
          this.toastService.showError('Erreur', 'Impossible de créer le groupe');
        }
      });
    }
  }

  private updateTeamEmployeesAsync(teamId: string, selectedEmployees: Employee[]): void {
    this.teamEmployeeService.getAll().subscribe({
      next: (allTeamEmployees) => {
        const currentEmployees = allTeamEmployees.filter(te => te.teamId === teamId);
        const currentEmployeeIds = currentEmployees.map(te => te.employeeId);
        const newEmployeeIds = selectedEmployees.map(e => e.uuid);
        
        const toRemove = currentEmployees.filter(te => !newEmployeeIds.includes(te.employeeId));
        const toAdd = selectedEmployees.filter(e => !currentEmployeeIds.includes(e.uuid));
        
        const deleteOps = toRemove.map(te => 
          this.teamEmployeeService.delete(te.teamId, te.employeeId)
        );
        const addOps = toAdd.map(e => 
          this.teamEmployeeService.create({ teamId, employeeId: e.uuid })
        );
        
        if (deleteOps.length === 0 && addOps.length === 0) {
          return;
        }
        
        forkJoin([...deleteOps, ...addOps]).subscribe({
          error: (error) => {
            console.error('Erreur lors de la mise à jour des employés:', error);
          }
        });
      }
    });
  }

  private addEmployeesToTeamAsync(teamId: string, selectedEmployees: Employee[]): void {
    if (selectedEmployees.length === 0) {
      return;
    }
    
    const addOps = selectedEmployees.map(e => 
      this.teamEmployeeService.create({ teamId, employeeId: e.uuid })
    );
    
    forkJoin(addOps).subscribe({
      error: (error) => {
        console.error('Erreur lors de l\'ajout des employés:', error);
      }
    });
  }

  confirmDelete(team: TeamWithEmployees): void {
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

  getEmployeeNames(employees: Employee[]): string {
    if (employees.length === 0) return 'Aucun membre';
    if (employees.length <= 2) {
      return employees.map(e => `${e.firstName} ${e.lastName}`).join(', ');
    }
    return `${employees[0].firstName} ${employees[0].lastName} et ${employees.length - 1} autre(s)`;
  }
}