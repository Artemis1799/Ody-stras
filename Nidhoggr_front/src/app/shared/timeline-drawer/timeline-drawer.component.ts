import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MapService, MapBounds } from '../../services/MapService';
import { SecurityZone } from '../../models/securityZoneModel';
import { SecurityZoneService } from '../../services/SecurityZoneService';
import { TeamService } from '../../services/TeamService';
import { Team } from '../../models/teamModel';
import { ToastService } from '../../services/ToastService';
import { Subscription, combineLatest, forkJoin, of } from 'rxjs';
import { concatMap } from 'rxjs/operators';

interface TimelineZone {
  id: string;
  title: string;
  start: Date;
  end: Date;
  zone: SecurityZone;
}

@Component({
  selector: 'app-timeline-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './timeline-drawer.component.html',
  styleUrls: ['./timeline-drawer.component.scss'],
})
export class TimelineDrawerComponent implements OnInit, OnDestroy {
  // Référence à l'axe temporel pour le drag
  @ViewChild('timelineAxis') timelineAxis!: ElementRef<HTMLDivElement>;
  @ViewChild('timelineWrapper') timelineWrapper!: ElementRef<HTMLDivElement>;
  
  // Données
  allZones: TimelineZone[] = [];
  filteredZones: TimelineZone[] = [];
  
  // Sélection de zones
  selectedZoneIds: Set<string> = new Set();
  focusedZoneId: string | null = null; // Zone actuellement focusée (avec glow)
  
  // Modale d'assignation d'équipe
  showTeamModal = false;
  availableTeams: Team[] = [];
  selectedInstallationTeamId: string | null = null;
  selectedRemovalTeamId: string | null = null;
  isAssigning = false;
  
  // Visibilité
  isVisible = false;
  sidebarCollapsed = false;
  
  // Plage de dates globale
  minDate: Date | null = null;
  maxDate: Date | null = null;
  totalDays = 0;
  graduations: Array<{ label: string; position: number }> = [];
  
  // Indicateur de date draggable
  selectedDate: Date | null = null;
  dateFilterActive = false;
  geoFilterActive = true; // Filtre géospatial actif par défaut
  isDragging = false;
  
  // Filtre par type d'équipement
  selectedEquipmentType: string = 'all';
  availableEquipmentTypes: string[] = [];
  
  // Tooltip dynamique
  tooltipVisible = false;
  tooltipX = 0;
  tooltipY = 0;
  tooltipItem: TimelineZone | null = null;
  
  // Bounds de la carte pour le filtre géospatial
  private currentBounds: MapBounds | null = null;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private mapService: MapService,
    private cdr: ChangeDetectorRef,
    private securityZoneService: SecurityZoneService,
    private teamService: TeamService,
    private toastService: ToastService
  ) {}

  get isEventArchived(): boolean {
    return this.mapService.isSelectedEventArchived();
  }

  ngOnInit(): void {
    // Combiner les observables: visibilité, zones, bounds
    const combined$ = combineLatest([
      this.mapService.timelineVisible$,
      this.mapService.securityZones$,
      this.mapService.mapBounds$
    ]);

    this.subscriptions.push(
      combined$.subscribe(([visible, zones, bounds]) => {
        
        const wasVisible = this.isVisible;
        this.isVisible = visible;
        this.currentBounds = bounds;
        
        if (visible && zones.length > 0) {
          // Toujours reprocesser les zones pour être à jour
          this.processSecurityZones(zones);
          
          // Auto-centrer sur le projet seulement à l'ouverture
          if (!wasVisible) {
            this.mapService.triggerCenterOnProject();
          }
          
          // Toujours appliquer les filtres (y compris quand les bounds changent)
          this.applyFilters();
        }
      })
    );

    // S'abonner à l'état de la sidebar
    this.subscriptions.push(
      this.mapService.sidebarCollapsed$.subscribe(collapsed => {
        this.sidebarCollapsed = collapsed;
        this.cdr.detectChanges();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Transforme les security zones en éléments de timeline
   */
  private processSecurityZones(zones: SecurityZone[]): void {
    this.allZones = zones.map(zone => ({
      id: zone.uuid,
      title: zone.equipment?.type || 'Zone sans équipement',
      start: new Date(zone.installationDate),
      end: new Date(zone.removalDate),
      zone
    }));

    // Extraire les types d'équipements uniques
    const equipmentTypes = new Set<string>();
    zones.forEach(zone => {
      if (zone.equipment?.type) {
        equipmentTypes.add(zone.equipment.type);
      }
    });
    this.availableEquipmentTypes = Array.from(equipmentTypes).sort();

    // Calculer la plage de dates globale
    if (this.allZones.length > 0) {
      const dates: Date[] = [];
      this.allZones.forEach(z => {
        if (!isNaN(z.start.getTime())) dates.push(z.start);
        if (!isNaN(z.end.getTime())) dates.push(z.end);
      });

      if (dates.length > 0) {
        const minDateRaw = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDateRaw = new Date(Math.max(...dates.map(d => d.getTime())));

        // Ajouter une marge de 3%
        const diffMs = maxDateRaw.getTime() - minDateRaw.getTime();
        const marginMs = Math.ceil(diffMs * 0.03);

        this.minDate = new Date(minDateRaw.getTime() - marginMs);
        this.maxDate = new Date(maxDateRaw.getTime() + marginMs);
        this.totalDays = Math.ceil((this.maxDate.getTime() - this.minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        // Initialiser la date sélectionnée au milieu
        this.initializeSelectedDate();
        this.generateGraduations();
      }
    }
  }

  /**
   * Initialise la date sélectionnée au milieu de la plage
   */
  private initializeSelectedDate(): void {
    if (!this.minDate || !this.maxDate) return;
    
    const timeRange = this.maxDate.getTime() - this.minDate.getTime();
    const middleTime = this.minDate.getTime() + (timeRange * 0.5);
    this.selectedDate = new Date(middleTime);
  }

  /**
   * Applique les filtres de date et géospatial
   */
  private applyFilters(): void {
    let filtered = [...this.allZones];

    // Filtre par type d'équipement
    if (this.selectedEquipmentType !== 'all') {
      filtered = filtered.filter(z => z.zone.equipment?.type === this.selectedEquipmentType);
    }

    // Filtre par date: la zone doit être active à cette date
    if (this.dateFilterActive && this.selectedDate) {
      filtered = filtered.filter(z => 
        this.selectedDate! >= z.start && this.selectedDate! <= z.end
      );
    }

    // Filtre géospatial: la zone doit être visible dans le viewport (hors timeline)
    if (this.geoFilterActive && this.currentBounds) {
      // Ajuster les bounds pour exclure la zone occupée par la timeline
      const adjustedBounds = this.getAdjustedBoundsForTimeline(this.currentBounds);
      filtered = filtered.filter(z => this.isZoneInBounds(z.zone, adjustedBounds));
    }

    this.filteredZones = filtered;
    
    // Forcer la détection de changement pour mettre à jour le template
    this.cdr.detectChanges();
    
    // Émettre les IDs des zones filtrées pour la surbrillance sur la carte
    this.mapService.setHighlightedSecurityZones(filtered.map(z => z.id));
  }

  /**
   * Ajuste les bounds pour exclure la zone occupée par la timeline en bas de l'écran
   */
  private getAdjustedBoundsForTimeline(bounds: MapBounds): MapBounds {
    // La timeline occupe environ 300px en bas de l'écran
    // Calculer le ratio de la hauteur de la timeline par rapport à la hauteur du viewport
    const timelineHeight = 300; // px approximatif de la timeline
    const viewportHeight = window.innerHeight;
    const timelineRatio = timelineHeight / viewportHeight;
    
    // Ajuster le bound sud en remontant proportionnellement
    const latRange = bounds.north - bounds.south;
    const adjustedSouth = bounds.south + (latRange * timelineRatio);
    
    return {
      north: bounds.north,
      south: adjustedSouth,
      east: bounds.east,
      west: bounds.west
    };
  }

  /**
   * Vérifie si une zone est dans les bounds de la carte
   */
  private isZoneInBounds(zone: SecurityZone, bounds: MapBounds): boolean {
    if (!zone.geoJson) return false;
    
    try {
      const geometry = JSON.parse(zone.geoJson);
      let coordinates: number[][] = [];
      
      // Extraire les coordonnées selon le type de géométrie
      const extractCoords = (geom: { type: string; coordinates: number[][] | number[][][] }): number[][] => {
        if (geom.type === 'LineString') {
          return geom.coordinates as number[][];
        } else if (geom.type === 'MultiLineString') {
          return (geom.coordinates as number[][][]).flat();
        } else if (geom.type === 'Polygon') {
          // Un Polygon a des rings: [[outer], [hole1], [hole2], ...]
          return (geom.coordinates as number[][][]).flat();
        } else if (geom.type === 'MultiPolygon') {
          // MultiPolygon: [[[ring1], [ring2]], [[ring1], [ring2]]]
          return (geom.coordinates as unknown as number[][][][]).flat(2);
        }
        return [];
      };

      if (geometry.type === 'Feature' && geometry.geometry) {
        coordinates = extractCoords(geometry.geometry);
      } else {
        coordinates = extractCoords(geometry);
      }
      
      // Vérifier si au moins un point est dans les bounds
      return coordinates.some(coord => {
        const lon = coord[0];
        const lat = coord[1];
        return lat >= bounds.south && lat <= bounds.north &&
               lon >= bounds.west && lon <= bounds.east;
      });
    } catch {
      return false;
    }
  }

  /**
   * Active/désactive le filtre de date (désactive le filtre géospatial si activé)
   */
  toggleDateFilter(): void {
    this.dateFilterActive = !this.dateFilterActive;
    // Les filtres sont mutuellement exclusifs
    if (this.dateFilterActive) {
      this.geoFilterActive = false;
    }
    this.applyFilters();
  }

  /**
   * Active/désactive le filtre géospatial (désactive le filtre de date si activé)
   */
  toggleGeoFilter(): void {
    this.geoFilterActive = !this.geoFilterActive;
    // Les filtres sont mutuellement exclusifs
    if (this.geoFilterActive) {
      this.dateFilterActive = false;
    }
    this.applyFilters();
  }

  /**
   * Gère le changement du type d'équipement sélectionné
   */
  onEquipmentTypeChange(): void {
    this.applyFilters();
  }

  /**
   * Gestion du drag sur l'axe temporel - MouseDown
   */
  onAxisMouseDown(event: MouseEvent): void {
    if (!this.dateFilterActive) return;
    
    // Empêcher la sélection de texte pendant le drag
    event.preventDefault();
    
    this.isDragging = true;
    this.updateDateFromMousePosition(event);
  }

  /**
   * Gestion du drag sur l'axe temporel - MouseMove
   */
  onAxisMouseMove(event: MouseEvent): void {
    if (!this.isDragging || !this.dateFilterActive) return;
    this.updateDateFromMousePosition(event);
  }

  /**
   * Gestion du drag sur l'axe temporel - MouseUp
   */
  onAxisMouseUp(): void {
    this.isDragging = false;
  }

  /**
   * Met à jour la date sélectionnée à partir de la position de la souris
   */
  private updateDateFromMousePosition(event: MouseEvent): void {
    if (!this.minDate || !this.maxDate) return;
    
    // Utiliser l'axe pour calculer la position (il est déjà aligné avec les barres)
    const refElement = this.timelineAxis?.nativeElement;
    if (!refElement) return;
    
    const rect = refElement.getBoundingClientRect();
    
    // Calculer la position relative (0-1)
    let relativeX = (event.clientX - rect.left) / rect.width;
    relativeX = Math.max(0, Math.min(1, relativeX)); // Clamp entre 0 et 1
    
    // Convertir en date
    const timeRange = this.maxDate.getTime() - this.minDate.getTime();
    const selectedTime = this.minDate.getTime() + (timeRange * relativeX);
    this.selectedDate = new Date(selectedTime);
    
    this.applyFilters();
    this.cdr.detectChanges();
  }

  /**
   * Click sur une zone pour la focus avec glow
   */
  onZoneClick(zone: TimelineZone, event: MouseEvent): void {
    event.stopPropagation();
    
    // Si on clique sur la zone déjà focusée, la défocuser
    if (this.focusedZoneId === zone.id) {
      this.focusedZoneId = null;
      this.mapService.clearSecurityZoneGlow();
    } else {
      // Sinon, focuser la nouvelle zone avec glow
      this.focusedZoneId = zone.id;
      this.mapService.focusOnSecurityZoneWithGlow(zone.zone);
    }
  }

  /**
   * Hover sur une zone pour afficher le tooltip
   */
  onZoneHover(zone: TimelineZone, event: MouseEvent): void {
    this.tooltipItem = zone;
    this.tooltipVisible = true;
    this.updateTooltipPosition(event);
  }

  onZoneMouseMove(event: MouseEvent): void {
    if (this.tooltipVisible) {
      this.updateTooltipPosition(event);
    }
  }

  private updateTooltipPosition(event: MouseEvent): void {
    // Positionner le tooltip au-dessus du curseur avec un décalage
    this.tooltipX = event.clientX;
    this.tooltipY = event.clientY - 10;
  }

  onZoneHoverEnd(): void {
    this.tooltipVisible = false;
    this.tooltipItem = null;
    // Ne pas retirer le glow au hover end si une zone est focusée
  }

  close(): void {
    // Nettoyer la surbrillance des zones
    this.mapService.clearHighlightedSecurityZones();
    this.mapService.clearSecurityZoneGlow();
    this.focusedZoneId = null;
    this.mapService.closeTimeline();
  }

  // ============= Méthodes d'affichage =============

  getDatePosition(date: Date): number {
    if (!this.minDate || !this.maxDate || this.totalDays === 0) {
      return 0;
    }
    const diff = date.getTime() - this.minDate.getTime();
    const position = (diff / (this.maxDate.getTime() - this.minDate.getTime())) * 100;
    return Math.max(0, Math.min(100, position));
  }

  getDuration(start: Date, end: Date): number {
    if (!this.minDate || !this.maxDate || this.totalDays === 0) {
      return 0;
    }
    const startPos = this.getDatePosition(start);
    const endPos = this.getDatePosition(end);
    const duration = endPos - startPos;
    return Math.max(Math.min(duration, 100 - startPos), 2);
  }

  formatDate(date: Date | null): string {
    if (!date) return 'N/A';
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatDateTime(date: Date | null): string {
    if (!date) return 'N/A';
    const datePart = date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const timePart = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    return `${datePart} ${timePart}`;
  }

  // eslint-disable-next-line complexity
  private generateGraduations(): void {
    if (!this.minDate || !this.maxDate || this.totalDays === 0) {
      this.graduations = [];
      return;
    }

    this.graduations = [];

    // Déterminer l'intervalle approprié en fonction de la plage totale
    let stepMs: number;
    let formatFn: (date: Date) => string;

    if (this.totalDays <= 1) {
      stepMs = 1000 * 60 * 60;
      formatFn = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } else if (this.totalDays <= 2) {
      stepMs = 1000 * 60 * 60 * 6;
      formatFn = (d) => `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} ${String(d.getHours()).padStart(2, '0')}h`;
    } else if (this.totalDays <= 3) {
      stepMs = 1000 * 60 * 60 * 12;
      formatFn = (d) => `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} ${String(d.getHours()).padStart(2, '0')}h`;
    } else if (this.totalDays <= 7) {
      stepMs = 1000 * 60 * 60 * 24;
      formatFn = (d) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } else if (this.totalDays <= 30) {
      stepMs = 1000 * 60 * 60 * 24 * 3;
      formatFn = (d) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } else if (this.totalDays <= 90) {
      stepMs = 1000 * 60 * 60 * 24 * 7;
      formatFn = (d) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } else if (this.totalDays <= 365) {
      stepMs = 1000 * 60 * 60 * 24 * 30;
      formatFn = (d) => d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    } else {
      stepMs = 1000 * 60 * 60 * 24 * 90;
      formatFn = (d) => d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    }

    // Générer les graduations
    let currentDate = new Date(this.minDate);
    while (currentDate <= this.maxDate) {
      const position = this.getDatePosition(currentDate);
      this.graduations.push({
        label: formatFn(currentDate),
        position,
      });
      currentDate = new Date(currentDate.getTime() + stepMs);
    }
  }

  getTimelineLabel(): string {
    if (!this.minDate || !this.maxDate) {
      return 'Pas de dates';
    }
    return `${this.formatDate(this.minDate)} → ${this.formatDate(this.maxDate)} (${this.totalDays} jours)`;
  }

  getFilterInfo(): string {
    const total = this.allZones.length;
    const filtered = this.filteredZones.length;
    if (total === filtered) {
      return `${total} zones de sécurité`;
    }
    return `${filtered} / ${total} zones visibles`;
  }

  // ============= Sélection de zones =============

  /**
   * Vérifie si une zone est sélectionnée
   */
  isZoneSelected(zoneId: string): boolean {
    return this.selectedZoneIds.has(zoneId);
  }

  /**
   * Toggle la sélection d'une zone
   */
  toggleZoneSelection(zoneId: string, event: Event): void {
    event.stopPropagation();
    if (this.selectedZoneIds.has(zoneId)) {
      this.selectedZoneIds.delete(zoneId);
    } else {
      this.selectedZoneIds.add(zoneId);
    }
    this.cdr.detectChanges();
  }

  /**
   * Sélectionne toutes les zones filtrées
   */
  selectAllZones(): void {
    this.filteredZones.forEach(zone => {
      this.selectedZoneIds.add(zone.id);
    });
    this.cdr.detectChanges();
  }

  /**
   * Désélectionne toutes les zones
   */
  deselectAllZones(): void {
    this.selectedZoneIds.clear();
    this.cdr.detectChanges();
  }

  /**
   * Vérifie si toutes les zones filtrées sont sélectionnées
   */
  areAllZonesSelected(): boolean {
    if (this.filteredZones.length === 0) return false;
    return this.filteredZones.every(zone => this.selectedZoneIds.has(zone.id));
  }

  /**
   * Toggle sélectionner/désélectionner tout
   */
  toggleSelectAll(): void {
    if (this.areAllZonesSelected()) {
      this.deselectAllZones();
    } else {
      this.selectAllZones();
    }
  }

  /**
   * Retourne le nombre de zones sélectionnées
   */
  getSelectedCount(): number {
    return this.selectedZoneIds.size;
  }

  // ============= Assignation d'équipe =============

  /**
   * Ouvre la modale d'assignation d'équipe
   */
  openTeamAssignModal(): void {
    if (this.selectedZoneIds.size === 0) return;

    // Charger les équipes de l'événement sélectionné
    const selectedEvent = this.mapService.getSelectedEvent();
    if (!selectedEvent) return;

    this.teamService.load();
    // Filtrer les équipes par eventId
    this.availableTeams = this.teamService.teams().filter(
      team => team.eventId === selectedEvent.uuid
    );
    
    this.selectedInstallationTeamId = null;
    this.selectedRemovalTeamId = null;
    this.showTeamModal = true;
    this.cdr.detectChanges();
  }

  /**
   * Ferme la modale d'assignation d'équipe
   */
  closeTeamModal(): void {
    this.showTeamModal = false;
    this.selectedInstallationTeamId = null;
    this.selectedRemovalTeamId = null;
    this.cdr.detectChanges();
  }

  /**
   * Assigne les zones sélectionnées aux équipes choisies
   */
  assignZonesToTeam(): void {
    if ((!this.selectedInstallationTeamId && !this.selectedRemovalTeamId) || this.selectedZoneIds.size === 0) return;

    this.isAssigning = true;
    
    // Pour chaque zone, on doit faire les assignations en séquence (installation puis removal)
    // pour éviter que les deux requêtes en parallèle ne s'écrasent mutuellement
    const zoneAssignments$ = Array.from(this.selectedZoneIds).map(zoneId => {
      // Créer une chaîne d'observables pour cette zone
      let assignment$ = of(null as SecurityZone | null);
      
      // Si on doit assigner l'équipe d'installation
      if (this.selectedInstallationTeamId) {
        assignment$ = assignment$.pipe(
          concatMap(() => this.securityZoneService.assignInstallationTeam(zoneId, this.selectedInstallationTeamId!))
        );
      }
      
      // Si on doit assigner l'équipe de retrait (après l'installation)
      if (this.selectedRemovalTeamId) {
        assignment$ = assignment$.pipe(
          concatMap(() => {
            // Si on a déjà une zone retournée par l'assignation d'installation, on l'ignore
            // et on fait l'assignation de removal qui retournera la zone avec les deux équipes
            return this.securityZoneService.assignRemovalTeam(zoneId, this.selectedRemovalTeamId!);
          })
        );
      }
      
      return assignment$;
    });

    if (zoneAssignments$.length === 0) {
      this.isAssigning = false;
      return;
    }

    forkJoin(zoneAssignments$).subscribe({
      next: (updatedZones) => {
        this.isAssigning = false;
        
        // Mettre à jour l'affichage en temps réel via MapService
        // Filtrer les valeurs null (ne devrait pas arriver mais par sécurité)
        updatedZones.filter(zone => zone !== null).forEach(updatedZone => {
          this.mapService.updateSecurityZone(updatedZone!);
        });
        
        // Afficher un message de succès
        const count = this.selectedZoneIds.size;
        const teamNames: string[] = [];
        if (this.selectedInstallationTeamId) {
          const team = this.availableTeams.find(t => t.uuid === this.selectedInstallationTeamId);
          if (team) teamNames.push(`pose: ${team.teamName}`);
        }
        if (this.selectedRemovalTeamId) {
          const team = this.availableTeams.find(t => t.uuid === this.selectedRemovalTeamId);
          if (team) teamNames.push(`dépose: ${team.teamName}`);
        }
        const message = `${count} zone${count > 1 ? 's assignées' : ' assignée'} (${teamNames.join(', ')})`;
        this.toastService.showSuccess('Assignation réussie', message);
        
        this.selectedZoneIds.clear();
        this.closeTeamModal();
      },
      error: (error) => {
        console.error('Erreur lors de l\'assignation des équipes:', error);
        this.toastService.showError('Erreur', 'Impossible d\'assigner les équipes aux zones');
        this.isAssigning = false;
      }
    });
  }

  /**
   * Vérifie si au moins une équipe est sélectionnée
   */
  hasTeamSelected(): boolean {
    return !!this.selectedInstallationTeamId || !!this.selectedRemovalTeamId;
  }
}
