import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Drawer } from 'primeng/drawer';
import { DatePicker } from 'primeng/datepicker';
import { InputText } from 'primeng/inputtext';
import { AutoComplete, AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { MapService } from '../../../services/MapService';
import { SecurityZoneService } from '../../../services/SecurityZoneService';
import { EquipmentService } from '../../../services/EquipmentService';
import { TeamService } from '../../../services/TeamService';
import { SecurityZone } from '../../../models/securityZoneModel';
import { Equipment } from '../../../models/equipmentModel';
import { Subscription } from 'rxjs';
import { DeletePopupComponent } from '../../../shared/delete-popup/delete-popup';
import { ToastService } from '../../../services/ToastService';
import { PhotoViewer } from '../../../shared/photo-viewer/photo-viewer';

@Component({
  selector: 'app-security-zone-drawer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Drawer,
    DatePicker,
    InputText,
    AutoComplete,
    DeletePopupComponent,
    PhotoViewer
  ],
  templateUrl: './security-zone-drawer.component.html',
  styleUrls: ['./security-zone-drawer.component.scss']
})
export class SecurityZoneDrawerComponent implements OnInit, OnDestroy {
  visible = false;
  selectedZone: SecurityZone | null = null;
  equipment: Equipment | null = null;

  // Édition des dates et commentaire
  installationDate: Date | null = null;
  removalDate: Date | null = null;
  quantity = 1;
  editedComment = '';

  // Calcul automatique de la quantité
  geometryLength = 0; // Longueur en mètres
  calculatedQuantity = 1;

  // Valeurs initiales pour détecter les modifications
  initialInstallationDate: Date | null = null;
  initialRemovalDate: Date | null = null;
  initialQuantity = 1;
  initialComment = '';

  // Gestion de la confirmation de suppression
  showDeleteConfirm = false;
  
  // Gestion des photos
  showPhotoViewer = false;

  // AutoComplete pour équipe de pose
  selectedInstallationTeamName = '';
  filteredInstallationTeams: string[] = [];
  selectedInstallationTeamId: string | null = null;

  // AutoComplete pour équipe de dépose
  selectedRemovalTeamName = '';
  filteredRemovalTeams: string[] = [];
  selectedRemovalTeamId: string | null = null;

  private selectedZoneSubscription?: Subscription;

  constructor(
    private mapService: MapService,
    private securityZoneService: SecurityZoneService,
    private equipmentService: EquipmentService,
    private teamService: TeamService,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService
  ) {}

  get teams() {
    return this.teamService.teams();
  }

  ngOnInit(): void {
    this.loadTeams();
    
    // S'abonner aux changements de SecurityZone sélectionnée
    this.selectedZoneSubscription = this.mapService.selectedSecurityZone$.subscribe(zone => {
      if (zone && zone.uuid !== this.selectedZone?.uuid) {
        this.openDrawer(zone);
      } else if (!zone && this.visible) {
        this.visible = false;
        this.selectedZone = null;
        this.equipment = null;
      }
    });
  }

  ngOnDestroy(): void {
    this.selectedZoneSubscription?.unsubscribe();
  }

  loadTeams(): void {
    this.teamService.load();
  }

  // eslint-disable-next-line complexity
  openDrawer(zone: SecurityZone): void {
    // Fermer le drawer des points s'il est ouvert
    this.mapService.selectPoint(null);
    
    this.selectedZone = zone;
    
    // Charger les dates et le commentaire (avec dates de l'événement par défaut si null)
    if (!zone.installationDate && zone.event?.startDate) {
      this.installationDate = new Date(zone.event.startDate);
    } else if (zone.installationDate) {
      this.installationDate = new Date(zone.installationDate);
    } else {
      this.installationDate = null;
    }

    if (!zone.removalDate && zone.event?.endDate) {
      this.removalDate = new Date(zone.event.endDate);
    } else if (zone.removalDate) {
      this.removalDate = new Date(zone.removalDate);
    } else {
      this.removalDate = null;
    }
    
    this.editedComment = zone.comment || '';

    // Charger l'équipe de pose actuelle si présente
    this.selectedInstallationTeamId = zone.installationTeamId || null;
    if (zone.installationTeamId) {
      const currentTeam = this.teams.find(t => t.uuid === zone.installationTeamId);
      this.selectedInstallationTeamName = currentTeam ? currentTeam.teamName : '';
    } else {
      this.selectedInstallationTeamName = '';
    }

    // Charger l'équipe de dépose actuelle si présente
    this.selectedRemovalTeamId = zone.removalTeamId || null;
    if (zone.removalTeamId) {
      const currentTeam = this.teams.find(t => t.uuid === zone.removalTeamId);
      this.selectedRemovalTeamName = currentTeam ? currentTeam.teamName : '';
    } else {
      this.selectedRemovalTeamName = '';
    }

    // Calculer la longueur de la géométrie
    this.geometryLength = this.calculateGeometryLength(zone.geoJson);

    // Charger l'équipement associé et calculer la quantité
    if (zone.equipmentId) {
      this.equipmentService.getById(zone.equipmentId).subscribe({
        next: (eq) => {
          this.equipment = eq;
          this.calculateAndSetQuantity();
          this.cdr.detectChanges();
        },
        error: () => {
          this.equipment = zone.equipment || null;
          this.calculateAndSetQuantity();
        }
      });
    } else {
      this.equipment = zone.equipment || null;
      this.calculateAndSetQuantity();
    }

    // Sauvegarder les valeurs initiales (après calcul)
    this.initialInstallationDate = this.installationDate;
    this.initialRemovalDate = this.removalDate;
    this.initialComment = this.editedComment;

    this.visible = true;
    this.cdr.detectChanges();
  }

  /**
   * Calcule la longueur totale d'une polyline à partir du GeoJSON en mètres
   */
  private calculateGeometryLength(geoJson: string): number {
    if (!geoJson) return 0;

    try {
      const geometry = JSON.parse(geoJson);
      
      // Supporter les formats LineString et MultiLineString
      let coordinates: number[][] = [];
      
      if (geometry.type === 'LineString') {
        coordinates = geometry.coordinates;
      } else if (geometry.type === 'MultiLineString') {
        // Aplatir les coordonnées
        coordinates = geometry.coordinates.flat();
      } else if (geometry.type === 'Feature' && geometry.geometry) {
        return this.calculateGeometryLength(JSON.stringify(geometry.geometry));
      } else {
        return 0;
      }

      // Calculer la distance totale entre tous les points
      let totalDistance = 0;
      for (let i = 0; i < coordinates.length - 1; i++) {
        const [lon1, lat1] = coordinates[i];
        const [lon2, lat2] = coordinates[i + 1];
        totalDistance += this.haversineDistance(lat1, lon1, lat2, lon2);
      }

      return totalDistance;
    } catch {
      return 0;
    }
  }

  /**
   * Calcule la distance entre deux points GPS en mètres (formule de Haversine)
   */
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Rayon de la Terre en mètres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Calcule et définit la quantité en fonction de la longueur de géométrie et de l'équipement
   */
  private calculateAndSetQuantity(): void {
    if (this.equipment?.length && this.equipment.length > 0 && this.geometryLength > 0) {
      // Quantité = longueur géométrie / longueur équipement
      // Arrondi au supérieur seulement si la partie décimale >= 0.20
      const rawQuantity = this.geometryLength / this.equipment.length;
      const decimalPart = rawQuantity - Math.floor(rawQuantity);
      this.calculatedQuantity = decimalPart >= 0.20 ? Math.ceil(rawQuantity) : Math.floor(rawQuantity);
      // Minimum 1
      if (this.calculatedQuantity < 1) this.calculatedQuantity = 1;
    } else {
      this.calculatedQuantity = 1;
    }
    
    this.quantity = this.calculatedQuantity;
    this.initialQuantity = this.quantity;
  }

  /**
   * Retourne la longueur formatée en mètres
   */
  getFormattedLength(): string {
    if (this.geometryLength < 1000) {
      return `${this.geometryLength.toFixed(1)} m`;
    }
    return `${(this.geometryLength / 1000).toFixed(2)} km`;
  }

  /**
   * Retourne la longueur de l'équipement formatée
   */
  getEquipmentLength(): string {
    if (!this.equipment?.length) return 'Non défini';
    return `${this.equipment.length} m`;
  }

  closeDrawer(): void {
    if (!this.visible) return;
    
    this.visible = false;
    this.selectedZone = null;
    this.equipment = null;
    
    // Informer le MapService que le drawer est fermé
    this.mapService.selectSecurityZone(null);
  }

  // eslint-disable-next-line complexity
  hasChanges(): boolean {
    const installDateChanged = this.installationDate?.getTime() !== this.initialInstallationDate?.getTime();
    const removalDateChanged = this.removalDate?.getTime() !== this.initialRemovalDate?.getTime();
    const quantityChanged = this.quantity !== this.initialQuantity;
    const commentChanged = this.editedComment !== this.initialComment;
    const installationTeamChanged = this.selectedInstallationTeamId !== this.selectedZone?.installationTeamId;
    const removalTeamChanged = this.selectedRemovalTeamId !== this.selectedZone?.removalTeamId;
    
    return installDateChanged || removalDateChanged || quantityChanged || commentChanged || installationTeamChanged || removalTeamChanged;
  }

  canSave(): boolean {
    return this.installationDate !== null && this.removalDate !== null && this.quantity > 0 && this.hasChanges();
  }

  saveChanges(): void {
    if (!this.selectedZone || !this.installationDate || !this.removalDate) return;

    const updatedZone: SecurityZone = {
      ...this.selectedZone,
      installationDate: this.installationDate,
      removalDate: this.removalDate,
      quantity: this.quantity,
      comment: this.editedComment || undefined
    };

    // Déterminer si les équipes ont changé
    const installationTeamChanged = this.selectedInstallationTeamId !== this.selectedZone.installationTeamId;
    const removalTeamChanged = this.selectedRemovalTeamId !== this.selectedZone.removalTeamId;

    this.securityZoneService.update(this.selectedZone.uuid, updatedZone).subscribe({
      next: (savedZone) => {
        // Gérer les changements d'équipes en séquence
        this.handleTeamAssignments(savedZone, installationTeamChanged, removalTeamChanged);
      },
      error: () => {
        this.toastService.showError('Erreur', 'Impossible de modifier la zone de sécurité');
      }
    });
  }

  private handleTeamAssignments(zone: SecurityZone, installationTeamChanged: boolean, removalTeamChanged: boolean): void {
    // Si aucun changement d'équipe, on termine
    if (!installationTeamChanged && !removalTeamChanged) {
      this.mapService.updateSecurityZone(zone);
      this.toastService.showSuccess('Zone de sécurité modifiée', 'Les modifications ont été enregistrées avec succès');
      this.closeDrawer();
      return;
    }

    // Gérer l'équipe de pose d'abord
    if (installationTeamChanged) {
      if (this.selectedInstallationTeamId) {
        this.securityZoneService.assignInstallationTeam(zone.uuid, this.selectedInstallationTeamId).subscribe({
          next: (updatedZone) => {
            if (removalTeamChanged) {
              this.handleRemovalTeamAssignment(updatedZone);
            } else {
              this.mapService.updateSecurityZone(updatedZone);
              this.toastService.showSuccess('Zone de sécurité modifiée', 'Les modifications ont été enregistrées avec succès');
              this.closeDrawer();
            }
          },
          error: () => {
            this.toastService.showError('Erreur', 'Impossible d\'assigner l\'équipe de pose');
            this.closeDrawer();
          }
        });
      } else {
        this.securityZoneService.unassignInstallationTeam(zone.uuid).subscribe({
          next: (updatedZone) => {
            if (removalTeamChanged) {
              this.handleRemovalTeamAssignment(updatedZone);
            } else {
              this.mapService.updateSecurityZone(updatedZone);
              this.toastService.showSuccess('Zone de sécurité modifiée', 'Les modifications ont été enregistrées avec succès');
              this.closeDrawer();
            }
          },
          error: () => {
            this.toastService.showError('Erreur', 'Impossible de retirer l\'équipe de pose');
            this.closeDrawer();
          }
        });
      }
    } else if (removalTeamChanged) {
      this.handleRemovalTeamAssignment(zone);
    }
  }

  private handleRemovalTeamAssignment(zone: SecurityZone): void {
    if (this.selectedRemovalTeamId) {
      this.securityZoneService.assignRemovalTeam(zone.uuid, this.selectedRemovalTeamId).subscribe({
        next: (finalZone) => {
          this.mapService.updateSecurityZone(finalZone);
          this.toastService.showSuccess('Zone de sécurité modifiée', 'Les modifications ont été enregistrées avec succès');
          this.closeDrawer();
        },
        error: () => {
          this.toastService.showError('Erreur', 'Impossible d\'assigner l\'équipe de dépose');
          this.closeDrawer();
        }
      });
    } else {
      this.securityZoneService.unassignRemovalTeam(zone.uuid).subscribe({
        next: (finalZone) => {
          this.mapService.updateSecurityZone(finalZone);
          this.toastService.showSuccess('Zone de sécurité modifiée', 'Les modifications ont été enregistrées avec succès');
          this.closeDrawer();
        },
        error: () => {
          this.toastService.showError('Erreur', 'Impossible de retirer l\'équipe de dépose');
          this.closeDrawer();
        }
      });
    }
  }

  // Gestion des photos
  openPhotoViewer(): void {
    this.showPhotoViewer = true;
  }

  closePhotoViewer(): void {
    this.showPhotoViewer = false;
  }

  getEquipmentDisplayName(): string {
    if (!this.equipment) return 'Non défini';
    return this.equipment.type || 'Équipement sans type';
  }

  /**
   * Retourne les équipes filtrées par l'eventId de la zone de sécurité sélectionnée
   */
  getTeamsForCurrentEvent(): { uuid: string; teamName: string }[] {
    if (!this.selectedZone) return [];
    return this.teams.filter(t => t.eventId === this.selectedZone?.eventId);
  }

  // Méthode pour filtrer les équipes de pose (AutoComplete)
  filterInstallationTeams(event: AutoCompleteCompleteEvent): void {
    const query = event.query.toLowerCase();
    // Filtrer par l'eventId de la zone de sécurité sélectionnée
    const teamsForEvent = this.getTeamsForCurrentEvent();
    const teamNames = teamsForEvent.map(t => t.teamName);

    // Ajouter l'option "Aucune" en premier
    const aucuneOption = 'Aucune';

    if (query) {
      const filtered = teamNames.filter(name =>
        name.toLowerCase().includes(query)
      );
      // Ajouter "Aucune" si la recherche correspond
      if (aucuneOption.toLowerCase().includes(query)) {
        this.filteredInstallationTeams = [aucuneOption, ...filtered];
      } else {
        this.filteredInstallationTeams = filtered;
      }
    } else {
      this.filteredInstallationTeams = [aucuneOption, ...teamNames];
    }
  }

  // Méthode appelée lors de la sélection d'une équipe de pose (AutoComplete)
  onInstallationTeamSelect(event: AutoCompleteSelectEvent): void {
    const selectedName = event.value;

    // Si "Aucune" est sélectionné, on met l'équipe à null
    if (selectedName === 'Aucune') {
      this.selectedInstallationTeamId = null;
      this.selectedInstallationTeamName = 'Aucune';
      return;
    }

    const teamsForEvent = this.getTeamsForCurrentEvent();
    const newTeam = teamsForEvent.find(t => t.teamName === selectedName) || null;
    this.selectedInstallationTeamId = newTeam?.uuid || null;
  }

  // Méthode pour filtrer les équipes de dépose (AutoComplete)
  filterRemovalTeams(event: AutoCompleteCompleteEvent): void {
    const query = event.query.toLowerCase();
    // Filtrer par l'eventId de la zone de sécurité sélectionnée
    const teamsForEvent = this.getTeamsForCurrentEvent();
    const teamNames = teamsForEvent.map(t => t.teamName);

    // Ajouter l'option "Aucune" en premier
    const aucuneOption = 'Aucune';

    if (query) {
      const filtered = teamNames.filter(name =>
        name.toLowerCase().includes(query)
      );
      // Ajouter "Aucune" si la recherche correspond
      if (aucuneOption.toLowerCase().includes(query)) {
        this.filteredRemovalTeams = [aucuneOption, ...filtered];
      } else {
        this.filteredRemovalTeams = filtered;
      }
    } else {
      this.filteredRemovalTeams = [aucuneOption, ...teamNames];
    }
  }

  // Méthode appelée lors de la sélection d'une équipe de dépose (AutoComplete)
  onRemovalTeamSelect(event: AutoCompleteSelectEvent): void {
    const selectedName = event.value;

    // Si "Aucune" est sélectionné, on met l'équipe à null
    if (selectedName === 'Aucune') {
      this.selectedRemovalTeamId = null;
      this.selectedRemovalTeamName = 'Aucune';
      return;
    }

    const teamsForEvent = this.getTeamsForCurrentEvent();
    const newTeam = teamsForEvent.find(t => t.teamName === selectedName) || null;
    this.selectedRemovalTeamId = newTeam?.uuid || null;
  }

  confirmDeleteZone(): void {
    if (!this.selectedZone) return;
    this.showDeleteConfirm = true;
  }

  cancelDeleteZone(): void {
    this.showDeleteConfirm = false;
  }

  deleteZone(): void {
    if (!this.selectedZone) return;

    this.showDeleteConfirm = false;
    const zoneToDelete = this.selectedZone;

    // Fermer le drawer AVANT de supprimer
    this.closeDrawer();

    this.securityZoneService.delete(zoneToDelete.uuid).subscribe({
      next: () => {
        // Retirer de la liste du MapService
        this.mapService.removeSecurityZone(zoneToDelete.uuid);
        this.toastService.showSuccess('Zone supprimée', 'La zone de sécurité a été supprimée');
      },
      error: () => {
        this.toastService.showError('Erreur', 'Impossible de supprimer la zone de sécurité');
      }
    });
  }
}
