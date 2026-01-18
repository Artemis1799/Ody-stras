import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Point } from '../../../../models/pointModel';
import { RoutePath } from '../../../../models/routePathModel';
import { SecurityZone } from '../../../../models/securityZoneModel';
import { Area } from '../../../../models/areaModel';

interface OrganizedSection {
  id: string;
  title: string;
  icon: string;
  isExpanded: boolean;
  isSelected: boolean;
  items: OrganizedItem[];
  allItems: OrganizedItem[];
  count: number;
}

interface OrganizedItem {
  id: string;
  name: string;
  icon: string;
  type: 'point' | 'point-of-interest' | 'path' | 'equipment' | 'zone' | 'area';
  data: Point | RoutePath | SecurityZone | Area;
}

@Component({
  selector: 'app-organized-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './organized-list.component.html',
  styleUrls: ['./organized-list.component.scss'],
})
export class OrganizedListComponent implements OnChanges {
  @Input() points: Point[] = [];
  @Input() paths: RoutePath[] = [];
  @Input() securityZones: SecurityZone[] = [];
  @Input() areas: Area[] = [];
  @Input() visibleZoneIds: string[] | null = null; // IDs des zones visibles (SecurityZones)
  @Input() visibleAreaIds: string[] | null = null; // IDs des areas visibles
  @Input() visiblePointIds: string[] | null = null; // IDs des points visibles
  @Input() visiblePointOfInterestIds: string[] | null = null; // IDs des points d'intérêt visibles
  @Input() visiblePathIds: string[] | null = null; // IDs des parcours visibles
  @Input() visibleEquipmentIds: string[] | null = null; // IDs des équipements visibles
  @Output() itemClick = new EventEmitter<OrganizedItem>();
  @Output() itemVisibilityChange = new EventEmitter<{item: OrganizedItem, visible: boolean}>();

  sections: OrganizedSection[] = [];

  ngOnChanges(): void {
    this.organizeSections();
  }

  private organizeSections(): void {
    this.sections = [];

    // Section: Points à sécuriser (points réguliers)
    const regularPoints = this.points.filter(p => !p.isPointOfInterest && !p.equipmentId);
    if (regularPoints.length > 0) {
      const pointItems: OrganizedItem[] = regularPoints.map(point => ({
        id: point.uuid,
        name: point.name || point.comment || `Point ${point.order || ''}`,
        icon: '📍',
        type: 'point' as const,
        data: point
      }));

      // Afficher les 4 premiers + compte du reste
      const displayCount = 4;
      const displayItems = pointItems.slice(0, displayCount);

      this.sections.push({
        id: 'points',
        title: 'Points',
        icon: '📍',
        isExpanded: true,
        isSelected: true,
        items: displayItems,
        allItems: pointItems,
        count: regularPoints.length
      });
    }

    // Section: Parcours (uniquement les parcours nommés, pas les tracés d'équipements)
    // Exclure les parcours avec le nom automatique "Chemin dd/mm/yyyy"
    const namedPaths = this.paths.filter(p => 
      p.name && p.name.trim().length > 0 && !p.name.startsWith('Chemin ')
    );
    if (namedPaths.length > 0) {
      const pathItems: OrganizedItem[] = namedPaths.map(path => ({
        id: path.uuid,
        name: path.name || 'Parcours sans nom',
        icon: '🏃',
        type: 'path' as const,
        data: path
      }));

      this.sections.push({
        id: 'paths',
        title: 'Parcours',
        icon: '🏃',
        isExpanded: true,
        isSelected: true,
        items: pathItems,
        allItems: pathItems,
        count: namedPaths.length
      });
    }

    // Section: Points d'intérêt
    const pointsOfInterest = this.points.filter(p => p.isPointOfInterest);
    if (pointsOfInterest.length > 0) {
      const poiItems: OrganizedItem[] = pointsOfInterest.map(point => ({
        id: point.uuid,
        name: point.name || point.comment || `Point d'intérêt ${point.order || ''}`,
        icon: '⭐',
        type: 'point-of-interest' as const,
        data: point
      }));

      // Afficher les 4 premiers + compte du reste
      const displayCount = 4;
      const displayItems = poiItems.slice(0, displayCount);

      this.sections.push({
        id: 'points-of-interest',
        title: 'Points d\'intérêt',
        icon: '⭐',
        isExpanded: true,
        isSelected: true,
        items: displayItems,
        allItems: poiItems,
        count: pointsOfInterest.length
      });
    }

    // Section: Zones (Areas - géométries)
    const areaItems = this.areas.map(area => ({
      id: area.uuid,
      name: area.name || `Zone sans nom`,
      icon: '🗺️',
      type: 'area' as const,
      data: area
    }));

    if (areaItems.length > 0) {
      const displayCount = 4;
      const displayItems = areaItems.slice(0, displayCount);

      this.sections.push({
        id: 'areas',
        title: 'Zones',
        icon: '🗺️',
        isExpanded: true,
        isSelected: true,
        items: displayItems,
        allItems: areaItems,
        count: areaItems.length
      });
    }

    // Section: Équipements (tracés d'équipements générés automatiquement)
    const equipmentPaths = this.paths.filter(p => p.name && p.name.startsWith('Chemin ')).map(path => ({
      id: path.uuid,
      name: `Tracé - ${path.name}`,
      icon: '🛣️',
      type: 'equipment' as const,
      data: path
    }));

    if (equipmentPaths.length > 0) {
      const displayCount = 4;
      const displayItems = equipmentPaths.slice(0, displayCount);

      this.sections.push({
        id: 'equipment-paths',
        title: 'Équipements',
        icon: '🚗',
        isExpanded: true,
        isSelected: true,
        items: displayItems,
        allItems: equipmentPaths,
        count: equipmentPaths.length
      });
    }
  }

  private getEquipmentIcon(type?: string): string {
    if (!type) return '🚗';
    
    const lowerType = type.toLowerCase();
    if (lowerType.includes('véhicule') || lowerType.includes('vehicle')) return '🚗';
    if (lowerType.includes('bloc') || lowerType.includes('béton') || lowerType.includes('block')) return '🧱';
    if (lowerType.includes('barrière') || lowerType.includes('barrier')) return '🚧';
    if (lowerType.includes('cone') || lowerType.includes('cône')) return '🚦';
    
    return '🚗';
  }

  toggleSection(section: OrganizedSection): void {
    section.isExpanded = !section.isExpanded;
  }

  toggleSectionSelection(section: OrganizedSection, event: Event): void {
    event.stopPropagation();
    
    // Déterminer la nouvelle visibilité en fonction de l'état réel:
    // Si TOUS les items sont visibles => les cacher
    // Sinon => les afficher
    const isCurrentlyFullyVisible = this.isSectionFullyVisible(section);
    const newVisibility = !isCurrentlyFullyVisible;
    
    // Pour toutes les sections qui ont des toggles, émettre les changements de visibilité
    if (section.id === 'points' || section.id === 'paths' || section.id === 'points-of-interest' || section.id === 'equipment-paths' || section.id === 'areas' || section.id === 'zones') {
      // Utiliser allItems pour affecter TOUS les items, pas juste les affichés
      section.allItems.forEach(item => {
        const isCurrentlyVisible = this.isItemVisible(item);
        if (isCurrentlyVisible !== newVisibility) {
          this.itemVisibilityChange.emit({ item, visible: newVisibility });
        }
      });
      
      // Si on toggle la section équipements, affecter aussi les zones de sécurité
      if (section.id === 'equipment-paths') {
        // Créer des items pour toutes les zones de sécurité et émettre les changements
        this.securityZones.forEach(zone => {
          const zoneItem: OrganizedItem = {
            id: zone.uuid,
            name: zone.equipment?.type || `Zone de sécurité sans nom`,
            icon: '🚨',
            type: 'zone' as const,
            data: zone
          };
          
          const isCurrentlyVisible = this.isItemVisible(zoneItem);
          if (isCurrentlyVisible !== newVisibility) {
            this.itemVisibilityChange.emit({ item: zoneItem, visible: newVisibility });
          }
        });
      }
    }
  }

  onItemClick(item: OrganizedItem): void {
    this.itemClick.emit(item);
  }

  toggleItemVisibility(item: OrganizedItem, event: Event): void {
    event.stopPropagation();
    const isCurrentlyVisible = this.isItemVisible(item);
    const newVisibility = !isCurrentlyVisible;
    this.itemVisibilityChange.emit({ item, visible: newVisibility });
  }

  isItemVisible(item: OrganizedItem): boolean {
    if (item.type === 'zone') {
      return this.visibleZoneIds === null || this.visibleZoneIds.includes(item.id);
    } else if (item.type === 'area') {
      return this.visibleAreaIds === null || this.visibleAreaIds.includes(item.id);
    } else if (item.type === 'point') {
      return this.visiblePointIds === null || this.visiblePointIds.includes(item.id);
    } else if (item.type === 'point-of-interest') {
      return this.visiblePointOfInterestIds === null || this.visiblePointOfInterestIds.includes(item.id);
    } else if (item.type === 'path') {
      return this.visiblePathIds === null || this.visiblePathIds.includes(item.id);
    } else if (item.type === 'equipment') {
      return this.visibleEquipmentIds === null || this.visibleEquipmentIds.includes(item.id);
    }
    return true; // Autres types toujours visibles
  }

  isSectionFullyVisible(section: OrganizedSection): boolean {
    // Vérifier si TOUS les items de la section sont visibles
    return section.allItems.every(item => this.isItemVisible(item));
  }

  getRemainingCount(section: OrganizedSection): number {
    return Math.max(0, section.count - section.items.length);
  }
}
