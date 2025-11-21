import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { PointService } from '../../services/PointService';
import { EquipmentService } from '../../services/EquipmentService';
import { EventService } from '../../services/EventService';
import { MapService } from '../../services/MapService';
import { NominatimService, NominatimResult } from '../../services/NominatimService';
import { Point } from '../../models/pointModel';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { ExportPopup } from '../../shared/export-popup/export-popup';
import { ImportPopup } from '../../shared/import-popup/import-popup';

@Component({
  selector: 'app-points-sidebar',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule, ExportPopup, ImportPopup],
  templateUrl: './points-sidebar.component.html',
  styleUrls: ['./points-sidebar.component.scss']
})
export class PointsSidebarComponent implements OnInit, OnDestroy {
  points: Point[] = [];
  isLoading = false;
  errorMessage = '';
  selectedPoint: Point | null = null;
  private pointsSubscription?: Subscription;
  private reloadSubscription?: Subscription;
  private refreshInterval?: any;
  
  // Modal QR Code
  showQRModal = false;
  qrCodeDataUrl = '';
  wsUrl = 'ws://172.20.10.3:8765';
  
  // Search properties
  searchQuery = '';
  searchResults: NominatimResult[] = [];
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;
  
  // Popups
  showExportPopup = false;
  showImportPopup = false;

  constructor(
    private pointService: PointService,
    private equipmentService: EquipmentService,
    private eventService: EventService,
    private mapService: MapService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private nominatimService: NominatimService,
  ) {}

  ngOnInit(): void {
    this.loadPoints();
    
    // S'abonner aux changements de points depuis le MapService
    this.pointsSubscription = this.mapService.points$.subscribe(points => {
      if (points.length > 0) {
        this.points = points;
      }
    });

    // Recharger les points automatiquement toutes les 5 secondes
    this.refreshInterval = setInterval(() => {
      this.loadPoints();
    }, 5000);
    
    // S'abonner au point sélectionné pour suspendre le polling pendant l'édition
    this.mapService.selectedPoint$.subscribe(point => {
      if (point) {
        // Suspendre le polling quand un point est sélectionné (drawer ouvert)
        if (this.refreshInterval) {
          clearInterval(this.refreshInterval);
          this.refreshInterval = null;
        }
      } else {
        // Réactiver le polling quand le drawer est fermé
        if (!this.refreshInterval) {
          this.refreshInterval = setInterval(() => {
            this.loadPoints();
          }, 5000);
        }
      }
    });
    
    // S'abonner au trigger de rechargement depuis le MapService
    this.reloadSubscription = this.mapService.reloadPoints$.subscribe(() => {
      this.loadPoints();
    });
    
    // Setup debounced search (300ms)
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.trim().length < 2) {
          this.searchResults = [];
          return [];
        }
        return this.nominatimService.search(query);
      })
    ).subscribe({
      next: (results) => {
        this.searchResults = results;
      },
      error: (error) => {
        console.error('Erreur lors de la recherche:', error);
        this.searchResults = [];
      }
    });
  }

  ngOnDestroy(): void {
    if (this.pointsSubscription) {
      this.pointsSubscription.unsubscribe();
    }
    if (this.reloadSubscription) {
      this.reloadSubscription.unsubscribe();
    }
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  loadPoints(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.pointService.getAll().subscribe({
      next: (data) => {
        // Trier les points: ceux avec order d'abord, puis les autres
        const withOrder = data.filter(p => p.order !== undefined && p.order !== null)
                              .sort((a, b) => (a.order || 0) - (b.order || 0));
        const withoutOrder = data.filter(p => p.order === undefined || p.order === null);
        
        // Assigner un ordre aux points sans ordre
        withoutOrder.forEach((point, index) => {
          point.order = withOrder.length + index + 1;
        });
        
        this.points = [...withOrder, ...withoutOrder];
        this.isLoading = false;
        
        // Partager les points avec le service pour affichage sur la map
        this.mapService.setPoints(this.points);
        
        // Si des points ont été réordonnés, mettre à jour la base de données
        if (withoutOrder.length > 0) {
          this.updateOrdersInDatabase();
        }
        
        // Forcer la détection de changement
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des points:', error);
        this.errorMessage = 'Impossible de charger les points';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onDrop(event: CdkDragDrop<Point[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    // Réorganiser la liste
    moveItemInArray(this.points, event.previousIndex, event.currentIndex);
    
    // Mettre à jour les ordres
    this.points.forEach((point, index) => {
      point.order = index + 1;
    });

    // Partager les points mis à jour
    this.mapService.setPoints(this.points);

    // Si un point est sélectionné, le mettre à jour dans le drawer
    if (this.selectedPoint) {
      // Retrouver le point sélectionné mis à jour
      const updatedPoint = this.points.find(p => p.uuid === this.selectedPoint!.uuid);
      if (updatedPoint) {
        this.mapService.selectPoint(updatedPoint);
      }
    }

    // Mettre à jour la base de données
    this.updateOrdersInDatabase();
  }

  private updateOrdersInDatabase(): void {
    // Mettre à jour chaque point modifié
    this.points.forEach((point) => {
      this.pointService.update(point.uuid, point).subscribe({
        error: (error) => {
          console.error(`Erreur lors de la mise à jour du point ${point.uuid}:`, error);
        }
      });
    });
  }

  getPointDisplayName(point: Point): string {
    if (point.comment) {
      return point.comment;
    }
    return `Point ${point.uuid.substring(0, 8)}`;
  }

  openEquipmentManager(): void {
    // Fermer le drawer s'il est ouvert
    this.mapService.selectPoint(null);
    this.router.navigate(['/equipments']);
  }

  onPointClick(point: Point): void {
    this.selectedPoint = point;
    
    // Sélectionner le point d'abord (ouvrira le drawer)
    this.mapService.selectPoint(point);
    
    // Attendre que le drawer s'ouvre puis recentrer avec offset
    setTimeout(() => {
      const map = this.mapService.getMapInstance();
      if (map && point.latitude && point.longitude) {
        // Calculer l'offset pour compenser la sidebar (300px) et le drawer (420px)
        // On décale vers la droite (+) pour que le point apparaisse à gauche/centre
        const offsetX = 15; // Décalage vers la droite pour centrer dans l'espace visible
        const point2D = map.latLngToContainerPoint([point.latitude, point.longitude]);
        point2D.x += offsetX;
        const targetLatLng = map.containerPointToLatLng(point2D);
        
        map.setView(targetLatLng, 17, {
          animate: true,
          duration: 0.5
        });
      }
    }, 100);
  }

  openImport(): void {
    this.showImportPopup = true;
  }

  closeImport(): void {
    this.showImportPopup = false;
  }
  
  onSearch(): void {
    // Trigger debounced search via Subject
    this.searchSubject.next(this.searchQuery);
  }
  
  goToLocation(result: NominatimResult): void {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    
    const map = this.mapService.getMapInstance();
    if (map) {
      map.setView([lat, lon], 16, {
        animate: true,
        duration: 0.5
      });
      
      // Ajouter un marqueur temporaire
      const L = (window as any).L;
      if (L) {
        const marker = L.marker([lat, lon])
          .addTo(map)
          .bindPopup(result.display_name)
          .openPopup();
        
        // Retirer le marqueur après 5 secondes
        setTimeout(() => {
          map.removeLayer(marker);
        }, 5000);
      }
    }
    
    // Clear search
    this.searchResults = [];
    this.searchQuery = '';
  }
  
  openExport(): void {
    this.showExportPopup = true;
  }
  
  closeExport(): void {
    this.showExportPopup = false;
  }
}
