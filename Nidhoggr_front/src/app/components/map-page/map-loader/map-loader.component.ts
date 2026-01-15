import { AfterViewInit, Component, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapService, DrawingMode, EventCreationMode } from '../../../services/MapService';
import { AreaService } from '../../../services/AreaService';
import { PathService } from '../../../services/PathService';
import { PointService } from '../../../services/PointService';
import { SecurityZoneService } from '../../../services/SecurityZoneService';
import { EquipmentService } from '../../../services/EquipmentService';
import { PictureService } from '../../../services/PictureService';
import { Point } from '../../../models/pointModel';
import { Event } from '../../../models/eventModel';
import { Area } from '../../../models/areaModel';
import { RoutePath } from '../../../models/routePathModel';
import { SecurityZone } from '../../../models/securityZoneModel';
import { Subscription, forkJoin } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { DeletePopupComponent } from '../../../shared/delete-popup/delete-popup';
import { PointTypePopupComponent } from '../../../shared/point-type-popup/point-type-popup.component';
import { EventCreationGuide } from '../../../shared/event-creation-guide/event-creation-guide';
import { EventConfirmPopup } from '../../../shared/event-confirm-popup/event-confirm-popup';
import {
  GeometryEditDrawerComponent,
  GeometryEditData,
} from '../../../shared/geometry-edit-drawer/geometry-edit-drawer.component';
import { ToastService } from '../../../services/ToastService';

// Interface pour le style d'une polyline
interface PolylineStyle {
  color: string;
  weight: number;
  opacity: number;
}
import { EquipmentSelectPopupComponent } from '../../../shared/equipment-select-popup/equipment-select-popup.component';
import { Equipment } from '../../../models/equipmentModel';

@Component({
  selector: 'app-map-loader',
  standalone: true,
  imports: [
    CommonModule,
    DeletePopupComponent,
    PointTypePopupComponent,
    EquipmentSelectPopupComponent,
    EventCreationGuide,
    EventConfirmPopup,
    GeometryEditDrawerComponent,
  ],
  templateUrl: './map-loader.component.html',
  styleUrls: ['./map-loader.component.scss'],
})
export class MapLoaderComponent implements AfterViewInit, OnDestroy {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private map: any | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private markers: Map<string, any> = new Map();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private geometryLayers: Map<string, any> = new Map(); // Map pour stocker les layers des areas/paths
  private pointsSubscription?: Subscription;
  private selectedEventSubscription?: Subscription;
  private shapesSubscription?: Subscription;
  private focusPointSubscription?: Subscription;
  private focusSecurityZoneSubscription?: Subscription;
  private focusSecurityZoneWithGlowSubscription?: Subscription;
  private clearSecurityZoneGlowSubscription?: Subscription;
  private drawingModeSubscription?: Subscription;
  private securityZonesSubscription?: Subscription;
  private visibleSecurityZoneIdsSubscription?: Subscription;
  private visiblePointIdsSubscription?: Subscription;
  private visiblePointOfInterestIdsSubscription?: Subscription;
  private visibleAreaIdsSubscription?: Subscription;
  private visiblePathIdsSubscription?: Subscription;
  private visibleEquipmentIdsSubscription?: Subscription;
  private eventAreaVisibleSubscription?: Subscription;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private drawnItems: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private drawControl: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private polylineDrawHandler: any = null; // Handler pour le mode dessin polyline
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private polygonDrawHandler: any = null; // Handler pour le mode dessin polygon (event creation)
  private currentDrawingMode: DrawingMode = { active: false, sourcePoint: null, equipment: null };
  private currentEventCreationMode: EventCreationMode = {
    active: false,
    step: 'idle',
    event: null,
    zoneGeoJson: null,
    pathGeoJson: null,
    zoneModificationMode: false,
    pathModificationMode: false,
  };
  private eventCreationModeSubscription?: Subscription;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private eventCreationZoneLayer: any = null; // Layer temporaire pour la zone en création
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private eventCreationPathLayer: any = null; // Layer temporaire pour le path en création
  private hoveredSecurityZoneLayer: L.Polyline | null = null; // Layer de la zone avec glow actuellement
  private hoveredSecurityZoneBorderLayer: L.Polyline | null = null; // Layer de la bordure rouge
  private hoveredSecurityZoneOriginalStyle: PolylineStyle | null = null; // Style original avant glow
  private platformId = inject(PLATFORM_ID);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private selectedLayer: any = null;
  private selectedEvent: Event | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private leafletInstance: any = null;

  // Popup de suppression de géométrie
  showDeleteGeometryConfirm = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private layerToDelete: any = null;

  // Popup de sélection de type de point
  showPointTypePopup = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pendingMarkerLayer: any = null;
  
  // Popup de sélection d'équipement
  showEquipmentSelectPopup = false;
  equipments: Equipment[] = [];
  private selectedEquipmentService: EquipmentService | null = null;

  // Drawer d'édition de géométrie (Area/RoutePath)
  showGeometryEditDrawer = false;
  geometryEditData: GeometryEditData | null = null;

  constructor(
    private mapService: MapService,
    private areaService: AreaService,
    private pathService: PathService,
    private pointService: PointService,
    private securityZoneService: SecurityZoneService,
    private equipmentService: EquipmentService,
    private pictureService: PictureService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngAfterViewInit(): void {
    try {
      if (!isPlatformBrowser(this.platformId)) {
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L: any = (window as any).L;
      const center: [number, number] = [48.5846, 7.7507];

      // Limites géographiques basées sur les tuiles téléchargées
      const bounds = L.latLngBounds(
        L.latLng(48.485, 7.572), // Sud-Ouest (MINLAT, MINLON)
        L.latLng(48.65, 7.878) // Nord-Est (MAXLAT, MAXLON)
      );

      // Nettoyer l'ancienne instance si elle existe
      if (this.map && typeof this.map.remove === 'function') {
        this.map.remove();
        this.map = null;
      }

      this.map = L.map('map', {
        center,
        zoom: 13,
        minZoom: 13,
        maxZoom: 18,
        maxBounds: bounds,
        maxBoundsViscosity: 1.0,
        zoomControl: false,
      });

      // Partager l'instance de map avec le service
      this.mapService.setMapInstance(this.map);

      // Charger Leaflet Draw dynamiquement pour éviter les problèmes SSR
      import('leaflet-draw')
        .then(() => {
          this.leafletInstance = L;
          this.initializeDrawControls(L);

          // S'abonner aux changements d'événement sélectionné
          this.selectedEventSubscription = this.mapService.selectedEvent$.subscribe((event) => {
            this.selectedEvent = event;
            this.updateDrawControlState();
          });
        })
        .catch((err) => {
          console.error('Erreur lors du chargement de Leaflet Draw:', err);
        });

      const probe = async (template: string) => {
        try {
          const test = template.replace('{z}', '13').replace('{x}', '4272').replace('{y}', '2827');
          const r = await fetch(test, { method: 'HEAD' });
          return r.ok;
        } catch {
          return false;
        }
      };

      const defaultTemplate = '/assets/tiles/tiles/{z}/{x}/{y}.png';

      // Nettoyer le localStorage si l'URL contient localhost:8080 ou une URL externe
      const saved = localStorage.getItem('tileUrlTemplate');
      if (
        saved &&
        (saved.includes('localhost:8080') ||
          saved.startsWith('http://') ||
          saved.startsWith('https://'))
      ) {
        localStorage.removeItem('tileUrlTemplate');
      }

      let chosen: string = defaultTemplate;
      (async () => {
        if (!this.map) return;

        // Utiliser uniquement les tuiles locales
        chosen = defaultTemplate;
        if (!this.map) return;
        let tileLayer = L.tileLayer(chosen, {
          minZoom: 13,
          maxZoom: 18,
          attribution: '&copy; Local tiles',
        }).addTo(this.map);
        const input = document.getElementById('tileUrlInput') as HTMLInputElement | null;
        const btn = document.getElementById('tileTestBtn') as HTMLButtonElement | null;
        const status = document.getElementById('tileStatus') as HTMLElement | null;

        if (input) input.value = chosen || '';

        if (btn && input && status) {
          btn.onclick = async () => {
            if (!this.map) return;
            const tpl = input.value.trim();
            if (!tpl) {
              status.textContent = "Entrez un template d'URL.";
              return;
            }
            status.textContent = 'Test en cours...';
            const ok = await probe(tpl);
            if (ok) {
              try {
                if (typeof tileLayer.setUrl === 'function') {
                  tileLayer.setUrl(tpl);
                } else {
                  if (this.map) {
                    this.map.removeLayer(tileLayer);
                    tileLayer = L.tileLayer(tpl, {
                      maxZoom: 20,
                      attribution: '&copy; Local tiles',
                    }).addTo(this.map);
                  }
                }
                localStorage.setItem('tileUrlTemplate', tpl);
                status.textContent = 'Template appliqué et sauvegardé.';
              } catch {
                status.textContent = "Erreur lors de l'application du template.";
              }
            } else {
              status.textContent =
                "Le test a échoué (404 ou indisponible). Vérifiez l'URL dans l'interface du tile server.";
            }
          };
        }
      })();

      // S'abonner aux changements de points
      this.pointsSubscription = this.mapService.points$.subscribe((points) => {
        this.updateMarkers(points);
      });

      // S'abonner au focus sur un point (depuis la timeline)
      this.focusPointSubscription = this.mapService.focusPoint$.subscribe((point) => {
        this.centerMapOnPoint(point);
      });

      // S'abonner au focus sur une security zone (depuis la sidebar)
      this.focusSecurityZoneSubscription = this.mapService.focusSecurityZone$.subscribe((zone) => {
        this.centerMapOnSecurityZone(zone, false);
      });

      // S'abonner au focus sur une security zone avec glow (depuis la timeline)
      this.focusSecurityZoneWithGlowSubscription = this.mapService.focusSecurityZoneWithGlow$.subscribe((zone) => {
        this.centerMapOnSecurityZone(zone, true);
      });

      // S'abonner au signal pour retirer le glow
      this.clearSecurityZoneGlowSubscription = this.mapService.clearSecurityZoneGlow$.subscribe(() => {
        this.removeGlowFromSecurityZone();
      });

      // S'abonner au mode dessin pour les SecurityZones
      this.drawingModeSubscription = this.mapService.drawingMode$.subscribe((mode) => {
        this.handleDrawingModeChange(mode);
      });

      // S'abonner au mode création d'événement (zone puis chemin)
      this.eventCreationModeSubscription = this.mapService.eventCreationMode$.subscribe((mode) => {
        this.handleEventCreationModeChange(mode);
      });

      // S'abonner aux SecurityZones pour les afficher sur la carte
      this.securityZonesSubscription = this.mapService.securityZones$.subscribe((zones) => {
        // Récupérer les UUIDs des zones actuelles
        const currentZoneIds = new Set(zones.map(z => z.uuid));
        
        // Supprimer les zones qui ne sont plus dans la liste
        const layersToDelete: string[] = [];
        this.geometryLayers.forEach((layer, uuid) => {
          if (layer.shapeType === 'securityZone' && !currentZoneIds.has(uuid)) {
            layersToDelete.push(uuid);
          }
        });
        
        // Supprimer les layers identifiés
        layersToDelete.forEach(uuid => {
          const layer = this.geometryLayers.get(uuid);
          if (layer) {
            // Retirer de tous les groupes possibles
            if (this.drawnItems && this.drawnItems.hasLayer(layer)) {
              this.drawnItems.removeLayer(layer);
            }
            if (this.map && this.map.hasLayer(layer)) {
              this.map.removeLayer(layer);
            }
            // Fermer le popup si ouvert
            if (layer.closePopup) {
              layer.closePopup();
            }
            // Retirer de la map des géométries
            this.geometryLayers.delete(uuid);
          }
        });
        
        // Ajouter les nouvelles zones
        zones.forEach((zone) => {
          this.addSecurityZoneToMap(zone);
        });
      });

      // Émettre les bounds initiaux de la carte
      this.emitMapBounds();

      // Écouter les événements de déplacement/zoom pour mettre à jour les bounds
      this.map.on('moveend', () => {
        this.emitMapBounds();
      });

      // S'abonner au signal de recentrage sur le projet
      this.mapService.centerOnProject$.subscribe(() => {
        this.centerOnAllSecurityZones();
      });

      // S'abonner aux zones en surbrillance pour mettre à jour leur style
      this.mapService.highlightedSecurityZones$.subscribe((highlightedIds) => {
        this.updateSecurityZonesHighlight(highlightedIds);
      });

      // S'abonner au filtre des zones visibles (filtre équipement de la sidebar)
      this.visibleSecurityZoneIdsSubscription = this.mapService.visibleSecurityZoneIds$.subscribe((visibleIds) => {
        this.updateSecurityZonesVisibility(visibleIds);
      });

      // S'abonner aux filtres de visibilité des points, areas, paths et équipements
      this.visiblePointIdsSubscription = this.mapService.visiblePointIds$.subscribe((visibleIds) => {
        this.updatePointsVisibility(visibleIds);
      });

      this.visiblePointOfInterestIdsSubscription = this.mapService.visiblePointOfInterestIds$.subscribe((visibleIds) => {
        this.updatePointOfInterestVisibility(visibleIds);
      });

      this.visibleAreaIdsSubscription = this.mapService.visibleAreaIds$.subscribe((visibleIds) => {
        this.updateAreasVisibility(visibleIds);
      });

      this.visiblePathIdsSubscription = this.mapService.visiblePathIds$.subscribe((visibleIds) => {
        this.updatePathsVisibility(visibleIds);
      });

      this.visibleEquipmentIdsSubscription = this.mapService.visibleEquipmentIds$.subscribe((visibleIds) => {
        this.updateEquipmentPathsVisibility(visibleIds);
      });

      // S'abonner à la visibilité de l'area de l'événement
      this.eventAreaVisibleSubscription = this.mapService.eventAreaVisible$.subscribe((visible) => {
        this.updateEventAreaVisibility(visible);
      });

      // Forcer Leaflet à recalculer la taille
      setTimeout(() => {
        if (this.map && this.map.invalidateSize) {
          this.map.invalidateSize();
        }
      }, 200);

      // Recalcul supplémentaire pour s'assurer que la navbar est prise en compte
      setTimeout(() => {
        if (this.map && this.map.invalidateSize) {
          this.map.invalidateSize();
        }
      }, 500);
    } catch (e) {
      console.error('Failed to initialize Leaflet map', e);
    }
  }

  private updateMarkers(points: Point[]): void {
    if (!this.map || typeof window === 'undefined') return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L: any = (window as any).L;

    // Supprimer les anciens markers
    this.markers.forEach((marker) => {
      if (this.map) {
        this.map.removeLayer(marker);
      }
    });
    this.markers.clear();

    // Ajouter les nouveaux markers
    points.forEach((point) => {
      if (this.map && point.latitude && point.longitude) {
        let markerIcon;
        
        if (point.isPointOfInterest) {
          // Utiliser l'image pour les points d'intérêt
          markerIcon = L.icon({
            iconUrl: '/assets/icons/point-attention.png',
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -40]
          });
        } else if (point.validated) {
          // Utiliser l'image pour les points validés
          markerIcon = L.icon({
            iconUrl: '/assets/icons/point-valider.png',
            iconSize: [26, 42],
            iconAnchor: [16, 48],
            popupAnchor: [0, -48]
          });
        } else {
          // Utiliser l'image pour les points normaux
          markerIcon = L.icon({
            iconUrl: '/assets/icons/point-classique.png',
            iconSize: [48, 42],
            iconAnchor: [20, 40],
            popupAnchor: [0, -40]
          });
        }

        const marker = L.marker([point.latitude, point.longitude], {
          title: this.getPointDisplayName(point),
          icon: markerIcon,
        }).addTo(this.map);

        // Clic sur le marker - ouvre le drawer
        marker.on('click', () => {
          this.onMarkerClick(point);
        });

        this.markers.set(point.uuid, marker);
      }
    });
  }

  /**
   * Émet les bounds actuels de la carte vers le MapService
   */
  private emitMapBounds(): void {
    if (!this.map) return;

    const bounds = this.map.getBounds();
    this.mapService.setMapBounds({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    });
  }

  /**
   * Centre la carte pour afficher toutes les security zones
   */
  private centerOnAllSecurityZones(): void {
    if (!this.map) return;

    const zones = this.mapService.getSecurityZones();
    if (zones.length === 0) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L: any = (window as any).L;
    const allCoords: Array<[number, number]> = [];

    zones.forEach((zone) => {
      if (!zone.geoJson) return;
      try {
        const geometry = JSON.parse(zone.geoJson);
        let coordinates: number[][] = [];

        if (geometry.type === 'LineString') {
          coordinates = geometry.coordinates;
        } else if (geometry.type === 'MultiLineString') {
          coordinates = geometry.coordinates.flat();
        } else if (geometry.type === 'Feature' && geometry.geometry) {
          if (geometry.geometry.type === 'LineString') {
            coordinates = geometry.geometry.coordinates;
          } else if (geometry.geometry.type === 'MultiLineString') {
            coordinates = geometry.geometry.coordinates.flat();
          }
        }

        coordinates.forEach((coord) => {
          allCoords.push([coord[1], coord[0]]); // [lat, lng]
        });
      } catch (e) {
        console.error('Erreur parsing geoJson:', e);
      }
    });

    if (allCoords.length > 0) {
      const latLngBounds = L.latLngBounds(allCoords);
      this.map.fitBounds(latLngBounds, { padding: [50, 50], animate: true });
    }
  }

  /**
   * Met à jour la surbrillance des security zones en fonction des IDs fournis
   */
  private updateSecurityZonesHighlight(highlightedIds: string[]): void {
    // Parcourir toutes les security zones sur la carte
    this.geometryLayers.forEach((layer, uuid) => {
      if (layer.shapeType !== 'securityZone') return;

      const isHighlighted = highlightedIds.includes(uuid);

      if (isHighlighted) {
        // Style surbrillance: plus épais, couleur vive
        layer.setStyle({
          color: '#2ad783',
          weight: 6,
          opacity: 1,
        });
        // Mettre au premier plan
        layer.bringToFront();
      } else {
        // Style normal: discret
        layer.setStyle({
          color: '#ff6b6b',
          weight: 2,
          opacity: 0.4,
        });
      }
    });
  }

  /**
   * Met à jour la visibilité des security zones en fonction du filtre équipement de la sidebar
   * @param visibleIds - tableau d'IDs des zones à afficher, ou null pour afficher toutes les zones
   */
  private updateSecurityZonesVisibility(visibleIds: string[] | null): void {
    if (!this.drawnItems) return;

    // Parcourir toutes les security zones sur la carte
    this.geometryLayers.forEach((layer, uuid) => {
      if (layer.shapeType !== 'securityZone') return;

      // Si visibleIds est null, afficher toutes les zones
      // Sinon, afficher uniquement les zones dont l'ID est dans la liste
      const shouldBeVisible = visibleIds === null || visibleIds.includes(uuid);

      if (shouldBeVisible) {
        // Afficher la zone si elle n'est pas déjà affichée
        if (!this.drawnItems.hasLayer(layer)) {
          this.drawnItems.addLayer(layer);
        }
      } else {
        // Masquer la zone
        if (this.drawnItems.hasLayer(layer)) {
          this.drawnItems.removeLayer(layer);
        }
      }
    });
  }

  /**
   * Met à jour la visibilité de l'area de l'événement (zone créée lors de la création de l'événement)
   * @param visible - true pour afficher, false pour masquer
   */
  private updateEventAreaVisibility(visible: boolean): void {
    if (!this.drawnItems) return;

    // Parcourir toutes les areas sur la carte
    this.geometryLayers.forEach((layer, uuid) => {
      if (layer.shapeType !== 'area') return;

      // Vérifier si c'est l'area de l'événement (nom commence par "Zone - ")
      const area = this.mapService.getAreas().find((a) => a.uuid === uuid);
      if (!area || !area.name?.startsWith('Zone - ')) return;

      if (visible) {
        // Afficher l'area si elle n'est pas déjà affichée
        if (!this.drawnItems.hasLayer(layer)) {
          this.drawnItems.addLayer(layer);
        }
      } else {
        // Masquer l'area
        if (this.drawnItems.hasLayer(layer)) {
          this.drawnItems.removeLayer(layer);
        }
      }
    });
  }

  /**
   * Met à jour la visibilité des points normaux en fonction du filtre de la sidebar
   * @param visibleIds - tableau d'IDs des points à afficher, ou null pour afficher tous les points
   */
  private updatePointsVisibility(visibleIds: string[] | null): void {
    const points = this.mapService.getPoints();
    
    points.forEach((point) => {
      if (point.isPointOfInterest) return; // Ne pas toucher aux points d'intérêt ici
      
      const marker = this.markers.get(point.uuid);
      if (!marker) return;

      const shouldBeVisible = visibleIds === null || visibleIds.includes(point.uuid);

      if (shouldBeVisible) {
        if (!this.map?.hasLayer(marker)) {
          this.map?.addLayer(marker);
        }
      } else {
        if (this.map?.hasLayer(marker)) {
          this.map?.removeLayer(marker);
        }
      }
    });
  }

  /**
   * Met à jour la visibilité des points d'intérêt en fonction du filtre de la sidebar
   * @param visibleIds - tableau d'IDs des points d'intérêt à afficher, ou null pour afficher tous
   */
  private updatePointOfInterestVisibility(visibleIds: string[] | null): void {
    const points = this.mapService.getPoints();
    
    points.forEach((point) => {
      if (!point.isPointOfInterest) return; // Ne toucher que les points d'intérêt
      
      const marker = this.markers.get(point.uuid);
      if (!marker) return;

      const shouldBeVisible = visibleIds === null || visibleIds.includes(point.uuid);

      if (shouldBeVisible) {
        if (!this.map?.hasLayer(marker)) {
          this.map?.addLayer(marker);
        }
      } else {
        if (this.map?.hasLayer(marker)) {
          this.map?.removeLayer(marker);
        }
      }
    });
  }

  /**
   * Met à jour la visibilité des areas (géométries) en fonction du filtre de la sidebar
   * @param visibleIds - tableau d'IDs des areas à afficher, ou null pour afficher toutes les areas
   */
  private updateAreasVisibility(visibleIds: string[] | null): void {
    if (!this.drawnItems) return;

    this.geometryLayers.forEach((layer, uuid) => {
      if (layer.shapeType !== 'area') return;

      const shouldBeVisible = visibleIds === null || visibleIds.includes(uuid);

      if (shouldBeVisible) {
        if (!this.drawnItems.hasLayer(layer)) {
          this.drawnItems.addLayer(layer);
        }
      } else {
        if (this.drawnItems.hasLayer(layer)) {
          this.drawnItems.removeLayer(layer);
        }
      }
    });
  }

  /**
   * Met à jour la visibilité des parcours (paths) en fonction du filtre de la sidebar
   * @param visibleIds - tableau d'IDs des paths à afficher, ou null pour afficher tous les paths
   */
  private updatePathsVisibility(visibleIds: string[] | null): void {
    if (!this.drawnItems) return;

    this.geometryLayers.forEach((layer, uuid) => {
      if (layer.shapeType !== 'path') return;

      const shouldBeVisible = visibleIds === null || visibleIds.includes(uuid);

      if (shouldBeVisible) {
        if (!this.drawnItems.hasLayer(layer)) {
          this.drawnItems.addLayer(layer);
        }
      } else {
        if (this.drawnItems.hasLayer(layer)) {
          this.drawnItems.removeLayer(layer);
        }
      }
    });
  }

  /**
   * Met à jour la visibilité des tracés d'équipements en fonction du filtre de la sidebar
   * @param visibleIds - tableau d'IDs des équipements à afficher, ou null pour afficher tous
   */
  private updateEquipmentPathsVisibility(visibleIds: string[] | null): void {
    if (!this.drawnItems) return;

    const paths = this.mapService.getPaths();

    this.geometryLayers.forEach((layer, uuid) => {
      // Identifier les équipements en regardant si le chemin correspondant commence par "Chemin "
      const correspondingPath = paths.find(p => p.uuid === uuid);
      if (!correspondingPath || !correspondingPath.name || !correspondingPath.name.startsWith('Chemin ')) return;

      const shouldBeVisible = visibleIds === null || visibleIds.includes(uuid);

      if (shouldBeVisible) {
        if (!this.drawnItems.hasLayer(layer)) {
          this.drawnItems.addLayer(layer);
        }
      } else {
        if (this.drawnItems.hasLayer(layer)) {
          this.drawnItems.removeLayer(layer);
        }
      }
    });
  }

  private centerMapOnPoint(point: Point): void {
    if (!this.map || !point.latitude || !point.longitude) return;

    // Calculer directement le centre décalé pour compenser le drawer
    // Le drawer fait 26.25rem (420px), donc on décale de 210px (la moitié)
    const drawerWidth = 420; // 26.25rem
    const offsetX = drawerWidth / 2;

    // Convertir le décalage en pixels vers un décalage en coordonnées
    const targetPoint = this.map.project([point.latitude, point.longitude], 19);
    targetPoint.x += offsetX;
    const offsetCenter = this.map.unproject(targetPoint, 19);

    this.map.setView([offsetCenter.lat, offsetCenter.lng], 19, {
      animate: true,
      duration: 0.5,
    });
  }

  private centerMapOnSecurityZone(zone: SecurityZone, applyGlow: boolean = false): void {
    if (!this.map || !zone.geoJson) return;

    // Appliquer le glow seulement si c'est depuis la timeline
    if (applyGlow) {
      this.applyGlowToSecurityZone(zone.uuid);
    }

    try {
      const geometry = JSON.parse(zone.geoJson);
      let coordinates: number[][] = [];

      if (geometry.type === 'LineString') {
        coordinates = geometry.coordinates;
      } else if (geometry.type === 'MultiLineString') {
        coordinates = geometry.coordinates.flat();
      } else if (geometry.type === 'Feature' && geometry.geometry) {
        coordinates = geometry.geometry.coordinates;
      }

      if (coordinates.length > 0) {
        // Calculer le centre de la polyline
        const lats = coordinates.map((c) => c[1]);
        const lons = coordinates.map((c) => c[0]);
        const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
        const centerLon = (Math.min(...lons) + Math.max(...lons)) / 2;

        // Calculer directement le centre décalé pour compenser le drawer
        // Le drawer fait 26.25rem (420px), donc on décale de 210px (la moitié)
        const drawerWidth = 420; // 26.25rem
        const offsetX = drawerWidth / 2;

        // Convertir le décalage en pixels vers un décalage en coordonnées
        const targetPoint = this.map.project([centerLat, centerLon], 19);
        targetPoint.x += offsetX;
        const offsetCenter = this.map.unproject(targetPoint, 19);

        this.map.setView([offsetCenter.lat, offsetCenter.lng], 19, {
          animate: true,
          duration: 0.5,
        });

        // Ouvrir le popup sur la zone après l'animation
        setTimeout(() => {
          this.openSecurityZonePopup(zone, centerLat, centerLon);
        }, 550);
      }
    } catch {
      // Erreur de parsing, ne rien faire
    }
  }

  /**
   * Applique un effet de glow au layer d'une security zone
   */
  private applyGlowToSecurityZone(zoneUuid: string): void {
    try {
      // Retirer le glow de la zone précédente de manière sûre
      if (this.hoveredSecurityZoneLayer && this.hoveredSecurityZoneOriginalStyle) {
        try {
          if (this.map && this.map.hasLayer(this.hoveredSecurityZoneLayer)) {
            this.hoveredSecurityZoneLayer.setStyle(this.hoveredSecurityZoneOriginalStyle);
            const polylineElement = this.hoveredSecurityZoneLayer.getElement();
            if (polylineElement) {
              polylineElement.classList.remove('glow-effect');
            }
          }

          // Retirer l'ancienne bordure rouge
          if (this.hoveredSecurityZoneBorderLayer && this.map && this.map.hasLayer(this.hoveredSecurityZoneBorderLayer)) {
            this.map.removeLayer(this.hoveredSecurityZoneBorderLayer);
          }
        } catch (error) {
          console.debug('Error removing previous glow:', error);
        }
      }

      // Appliquer le glow au nouveau layer
      const layer = this.geometryLayers.get(zoneUuid);
      if (layer && this.map && this.map.hasLayer(layer)) {
        // Stocker le style original
        this.hoveredSecurityZoneOriginalStyle = {
          color: layer.options.color || '#ff6b6b',
          weight: layer.options.weight || 4,
          opacity: layer.options.opacity || 1,
        };

        // Appliquer le style avec glow
        layer.setStyle({
          color: '#2ad783', // Vert du design system
          weight: 6,
          opacity: 1,
          dashArray: undefined,
          lineCap: 'round',
          lineJoin: 'round',
        });

        // Ajouter la classe CSS pour le glow
        const polylineElement = layer.getElement();
        if (polylineElement) {
          polylineElement.classList.add('glow-effect');
        }

        // Créer une ligne rouge en-dessous comme bordure
        if (typeof window !== 'undefined') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const L: any = (window as any).L;
          
          // Récupérer les coordonnées de la ligne verte
          const coords = layer.getLatLngs();
          
          const borderLayer = L.polyline(coords, {
            color: 'black',
            weight: 12,
            opacity: 1,
            dashArray: undefined,
            lineCap: 'round',
            lineJoin: 'round',
          });
          
          // Ajouter la bordure à la carte (elle doit être en-dessous)
          this.drawnItems.addLayer(borderLayer);
          this.hoveredSecurityZoneBorderLayer = borderLayer;
        }

        this.hoveredSecurityZoneLayer = layer;
        if (this.hoveredSecurityZoneLayer) {
          this.hoveredSecurityZoneLayer.bringToFront();
        }
      }
    } catch (error) {
      console.error('Error applying glow:', error);
    }
  }

  /**
   * Retire l'effet de glow de la zone survolée
   */
  private removeGlowFromSecurityZone(): void {
    if (this.hoveredSecurityZoneLayer && this.hoveredSecurityZoneOriginalStyle) {
      try {
        // Vérifier que le layer existe toujours sur la carte
        if (this.map && this.map.hasLayer(this.hoveredSecurityZoneLayer)) {
          this.hoveredSecurityZoneLayer.setStyle(this.hoveredSecurityZoneOriginalStyle);
          const polylineElement = this.hoveredSecurityZoneLayer.getElement();
          if (polylineElement) {
            polylineElement.classList.remove('glow-effect');
          }
        }

        // Retirer la bordure rouge
        if (this.hoveredSecurityZoneBorderLayer && this.map && this.map.hasLayer(this.hoveredSecurityZoneBorderLayer)) {
          this.map.removeLayer(this.hoveredSecurityZoneBorderLayer);
        }
      } catch (error) {
        // Ignorer les erreurs si le layer a été supprimé
        console.debug('Layer already removed:', error);
      }
      
      this.hoveredSecurityZoneLayer = null;
      this.hoveredSecurityZoneBorderLayer = null;
      this.hoveredSecurityZoneOriginalStyle = null;
    }
  }

  /**
   * Ouvre un popup sur une SecurityZone avec les informations de l'équipement
   */
  private openSecurityZonePopup(zone: SecurityZone, lat: number, lon: number): void {
    if (typeof window === 'undefined') return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L: any = (window as any).L;

    // Calculer la longueur de la géométrie
    const length = this.calculateGeometryLength(zone.geoJson);
    const formattedLength =
      length < 1000 ? `${length.toFixed(1)} m` : `${(length / 1000).toFixed(2)} km`;

    // Fonction pour afficher le popup
    const showPopup = (equipmentName: string) => {
      const popupContent = `
        <div class="security-zone-popup" style="text-align: center; min-width: 150px;">
          <strong style="color: #2ad783;">${equipmentName}</strong><br>
          <span style="font-size: 0.875rem; color: #8b949e;">
            Longueur: ${formattedLength}<br>
          </span>
        </div>
      `;

      // Récupérer le layer si disponible
      const layer = this.geometryLayers.get(zone.uuid);
      if (layer && layer.bindPopup) {
        layer.bindPopup(popupContent).openPopup();
      } else {
        // Créer un popup temporaire si le layer n'est pas trouvé
        L.popup().setLatLng([lat, lon]).setContent(popupContent).openOn(this.map);
      }
    };

    // Si l'équipement est déjà disponible, afficher le popup directement
    if (zone.equipment?.type) {
      showPopup(zone.equipment.type);
    } else if (zone.equipmentId) {
      // Charger l'équipement si pas disponible
      this.equipmentService.getById(zone.equipmentId).subscribe({
        next: (equipment) => {
          showPopup(equipment.type || 'Équipement');
        },
        error: () => {
          showPopup('Équipement');
        },
      });
    } else {
      showPopup('Équipement');
    }
  }

  /**
   * Calcule la longueur totale d'une polyline à partir du GeoJSON en mètres
   */
  private calculateGeometryLength(geoJson: string): number {
    if (!geoJson) return 0;

    try {
      const geometry = JSON.parse(geoJson);
      let coordinates: number[][] = [];

      if (geometry.type === 'LineString') {
        coordinates = geometry.coordinates;
      } else if (geometry.type === 'MultiLineString') {
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
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private getPointDisplayName(point: Point): string {
    if (point.comment) {
      return point.comment;
    }
    return `Point ${point.uuid.substring(0, 8)}`;
  }

  private onMarkerClick(point: Point): void {
    // Fermer tous les popups ouverts
    this.closeAllPopups();

    // Traiter différemment selon le type de point
    if (point.isPointOfInterest) {
      // Pour un point d'intérêt, ouvrir le drawer spécifique
      this.mapService.selectPointOfInterest(point);

      // Zoomer et centrer sur le point
      if (this.map && point.latitude && point.longitude) {
        this.map.setView([point.latitude, point.longitude], 18, {
          animate: true,
          duration: 0.5,
        });
      }
    } else {
      // Pour un point normal, ouvrir le drawer classique avec son ordre
      this.mapService.selectPoint(point, point.order);

      // Zoomer et centrer sur le point
      if (this.map && point.latitude && point.longitude) {
        this.map.setView([point.latitude, point.longitude], 18, {
          animate: true,
          duration: 0.5,
        });
      }
    }
  }

  /**
   * Ferme tous les popups ouverts sur la carte
   */
  private closeAllPopups(): void {
    if (!this.map) return;
    this.map.closePopup();
  }

  /**
   * Initialise les contrôles de dessin Leaflet Draw
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private initializeDrawControls(L: any): void {
    if (!this.map || typeof window === 'undefined') return;

    // Créer le groupe de formes dessinées
    this.drawnItems = new L.FeatureGroup();
    this.map.addLayer(this.drawnItems);

    // Les contrôles de dessin ne seront ajoutés que si un événement est sélectionné
    // On enregistre seulement les événements ici

    // Événement : forme créée
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.map.on(L.Draw.Event.CREATED, (e: any) => {
      this.onGeometryCreated(e);
    });

    // Événement : forme modifiée
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.map.on(L.Draw.Event.EDITED, (e: any) => {
      this.onGeometriesEdited(e);
    });

    // Événement : forme supprimée
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.map.on(L.Draw.Event.DELETED, (e: any) => {
      this.onGeometriesDeleted(e);
    });
  }

  /**
   * Met à jour l'état des contrôles de dessin selon l'événement sélectionné
   */
  private updateDrawControlState(): void {
    if (!this.map || !this.leafletInstance || typeof window === 'undefined') return;

    const L = this.leafletInstance;

    // Supprimer le contrôle existant
    if (this.drawControl) {
      this.map.removeControl(this.drawControl);
      this.drawControl = null;
    }

    // Nettoyer les géométries existantes de l'ancien événement
    this.clearExistingGeometries();

    // Ajouter le contrôle seulement si un événement est sélectionné
    if (this.selectedEvent) {
      // Couleurs standardisées: lignes en rouge, zones en bleu
      const LINE_COLOR = '#a91a1a'; // Rouge pour les lignes
      const ZONE_COLOR = '#3388ff'; // Bleu pour les zones (polygones, cercles)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const drawOptions: any = {
        position: 'topright',
        draw: {
          polyline: {
            shapeOptions: {
              color: LINE_COLOR,
              weight: 4,
            },
          },
          polygon: {
            allowIntersection: false,
            drawError: {
              color: '#e1e100',
              message: '<strong>Erreur:</strong> Les bords ne doivent pas se croiser!',
            },
            shapeOptions: {
              color: ZONE_COLOR,
            },
          },
          rectangle: false,
          circle: false,
          marker: {
            icon: L.icon({
              iconUrl: '/assets/icons/point-classique.png',
              iconSize: [40, 40],
              iconAnchor: [20, 40],
              popupAnchor: [0, -40]
            }),
          },
          circlemarker: false,
        },
        edit: {
          featureGroup: this.drawnItems,
          remove: true,
        },
      };

      this.drawControl = new L.Control.Draw(drawOptions);
      this.map.addControl(this.drawControl);

      // Charger et afficher les géométries de l'événement sélectionné
      this.loadEventGeometries(this.selectedEvent);
    }
  }

  /**
   * Supprime toutes les géométries existantes de la carte
   */
  private clearExistingGeometries(): void {
    // Supprimer les layers du groupe drawnItems complètement
    if (this.drawnItems) {
      this.drawnItems.clearLayers();
    }

    // Supprimer tous les layers de geometryLayers de la carte
    this.geometryLayers.forEach((layer) => {
      if (this.map && layer) {
        this.map.removeLayer(layer);
      }
    });

    // Vider la map des géométries
    this.geometryLayers.clear();

    // Vider la liste des areas/paths dans le service
    this.mapService.clearAllShapes();
  }

  /**
   * Charge et affiche les areas et paths d'un événement sur la carte
   */
  private loadEventGeometries(event: Event): void {
    // Charger les areas et paths en parallèle
    forkJoin({
      areas: this.areaService.getByEventId(event.uuid),
      paths: this.pathService.getByEventId(event.uuid),
    }).subscribe({
      next: ({ areas, paths }) => {
        // Mettre à jour le MapService
        this.mapService.setAreas(areas);
        this.mapService.setPaths(paths);

        // Afficher les areas sur la carte
        areas.forEach((area) => {
          this.addAreaToMap(area);
        });

        // Afficher les paths sur la carte
        paths.forEach((path) => {
          this.addPathToMap(path);
        });
      },
      error: (error) => {
        console.error('Erreur lors du chargement des areas/paths:', error);
        this.mapService.setAreas([]);
        this.mapService.setPaths([]);
      },
    });
  }

  /**
   * Ajoute une Area (polygon) à la carte
   */
  // eslint-disable-next-line complexity
  private addAreaToMap(area: Area): void {
    if (!this.map || !this.drawnItems || typeof window === 'undefined') return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L: any = (window as any).L;

    try {
      const geoJson = typeof area.geoJson === 'string' ? JSON.parse(area.geoJson) : area.geoJson;

      if (!geoJson || !geoJson.coordinates) {
        console.warn("GeoJSON invalide pour l'area:", area.uuid);
        return;
      }

      // Convertir les coordonnées [lng, lat] en [lat, lng] pour Leaflet
      const polygonCoords = geoJson.coordinates[0].map((c: [number, number]) => [c[1], c[0]]);

      const layer = L.polygon(polygonCoords, {
        color: area.colorHex || '#3388ff',
        fillOpacity: 0.2,
        weight: 3,
      });

      // Associer l'UUID à la couche
      layer.areaUuid = area.uuid;
      layer.shapeType = 'area';

      // Vérifier si c'est l'area de l'événement et si elle doit être visible
      const isEventArea = area.name?.startsWith('Zone - ');
      const eventAreaVisible = this.mapService.getEventAreaVisible();
      const shouldBeVisible = !isEventArea || eventAreaVisible;

      // Ajouter au groupe drawnItems seulement si visible
      if (shouldBeVisible) {
        this.drawnItems.addLayer(layer);
      }

      // Stocker dans la map (même si masquée, pour pouvoir la réafficher plus tard)
      this.geometryLayers.set(area.uuid, layer);

      // Rendre interactive
      this.makeLayerInteractive(layer);
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'area à la carte:", error);
    }
  }

  /**
   * Ajoute un Path (polyline) à la carte
   */
  private addPathToMap(path: RoutePath): void {
    if (!this.map || !this.drawnItems || typeof window === 'undefined') return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L: any = (window as any).L;

    try {
      const geoJson = typeof path.geoJson === 'string' ? JSON.parse(path.geoJson) : path.geoJson;

      if (!geoJson || !geoJson.coordinates) {
        console.warn('GeoJSON invalide pour le path:', path.uuid);
        return;
      }

      // Convertir les coordonnées [lng, lat] en [lat, lng] pour Leaflet
      const lineCoords = geoJson.coordinates.map((c: [number, number]) => [c[1], c[0]]);

      const layer = L.polyline(lineCoords, {
        color: path.colorHex || '#a91a1a',
        weight: 4,
      });

      // Associer l'UUID à la couche
      layer.pathUuid = path.uuid;
      layer.shapeType = 'path';

      // Ajouter au groupe drawnItems
      this.drawnItems.addLayer(layer);

      // Stocker dans la map
      this.geometryLayers.set(path.uuid, layer);

      // Rendre interactive
      this.makeLayerInteractive(layer);
    } catch (error) {
      console.error("Erreur lors de l'ajout du path à la carte:", error);
    }
  }

  /**
   * Ajoute une SecurityZone (polyline) à la carte
   */
  private addSecurityZoneToMap(zone: SecurityZone): void {
    if (!this.map || !this.drawnItems || typeof window === 'undefined') return;

    // Éviter de dupliquer si déjà présente
    if (this.geometryLayers.has(zone.uuid)) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L: any = (window as any).L;

    try {
      const geoJson = typeof zone.geoJson === 'string' ? JSON.parse(zone.geoJson) : zone.geoJson;

      if (!geoJson || !geoJson.coordinates) {
        console.warn('GeoJSON invalide pour la security zone:', zone.uuid);
        return;
      }

      // Convertir les coordonnées [lng, lat] en [lat, lng] pour Leaflet
      const lineCoords = geoJson.coordinates.map((c: [number, number]) => [c[1], c[0]]);

      const layer = L.polyline(lineCoords, {
        color: '#ff6b6b',
        weight: 4,
      });

      // Associer l'UUID à la couche
      layer.securityZoneUuid = zone.uuid;
      layer.shapeType = 'securityZone';

      // Vérifier si cette zone doit être visible selon le filtre actuel
      const visibleIds = this.mapService.getVisibleSecurityZoneIds();
      const shouldBeVisible = visibleIds === null || visibleIds.includes(zone.uuid);

      // Ajouter au groupe drawnItems seulement si visible
      if (shouldBeVisible) {
        this.drawnItems.addLayer(layer);
      }

      // Stocker dans la map (même si masquée, pour pouvoir la réafficher plus tard)
      this.geometryLayers.set(zone.uuid, layer);

      // Rendre interactive (avec comportement spécifique aux SecurityZones)
      this.makeSecurityZoneInteractive(layer, zone);
    } catch (error) {
      console.error("Erreur lors de l'ajout de la security zone à la carte:", error);
    }
  }

  /**
   * Gère la création d'une nouvelle géométrie ou d'un point
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private onGeometryCreated(e: any): void {
    if (!this.drawnItems || typeof window === 'undefined') return;

    // Si on est en mode création d'événement, rediriger vers les handlers appropriés
    if (this.mapService.isEventCreationActive()) {
      const creationMode = this.mapService.getEventCreationMode();

      if (creationMode.step === 'drawing-zone') {
        this.onEventZoneDrawn(e);
        return;
      } else if (creationMode.step === 'drawing-path') {
        this.onEventPathDrawn(e);
        return;
      }
      return;
    }

    // Vérifier qu'un événement est sélectionné
    if (!this.selectedEvent) {
      console.warn('Aucun événement sélectionné - élément non sauvegardé');
      return;
    }

    const type = e.layerType;
    const layer = e.layer;

    // Si c'est un marker, afficher la popup de sélection de type
    if (type === 'marker') {
      this.pendingMarkerLayer = layer;
      this.showPointTypePopup = true;
      this.cdr.detectChanges();
      return;
    }

    // Sinon, sauvegarder comme Geometry
    this.saveLayerAsGeometry(layer, type);
  }

  /**
   * Sauvegarde un marker Leaflet comme Point dans la base de données
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private saveMarkerAsPoint(layer: any, L: any, isPointOfInterest: boolean = false): void {
    const latlng = layer.getLatLng();

    // Ajouter au groupe
    this.drawnItems.addLayer(layer);

    // Créer le point
    const currentPoints = this.mapService.getMapInstance()
      ? Array.from(this.markers.keys()).length
      : 0;

    const pointData: Partial<Point> = {
      eventId: this.selectedEvent!.uuid,
      name: isPointOfInterest
        ? `Point d'intérêt ${currentPoints + 1}`
        : `Point ${currentPoints + 1}`,
      latitude: latlng.lat,
      longitude: latlng.lng,
      order: isPointOfInterest ? undefined : currentPoints + 1,
      validated: false,
      comment: '',
      isPointOfInterest: isPointOfInterest,
    };

    this.pointService.create(pointData).subscribe({
      next: (point) => {
        console.log('Point créé reçu du backend:', point);
        console.log('isPointOfInterest:', point.isPointOfInterest);

        // Si le backend ne renvoie pas isPointOfInterest, utiliser la valeur locale
        if (point.isPointOfInterest === undefined && pointData.isPointOfInterest !== undefined) {
          point.isPointOfInterest = pointData.isPointOfInterest;
        }

        // Mettre à jour l'icône du marker avec l'image selon le type de point
        const iconUrl = point.isPointOfInterest 
          ? '/assets/icons/point-attention.png'
          : '/assets/icons/point-classique.png';
        
        layer.setIcon(
          L.icon({
            iconUrl: iconUrl,
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -40]
          })
        );

        // Associer l'UUID au layer
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (layer as any).pointUuid = point.uuid;

        // Ajouter le marker à notre Map de markers
        this.markers.set(point.uuid, layer);

        // Mettre à jour les points dans le MapService
        const updatedPoints = [...this.mapService['pointsSubject'].value, point];
        this.mapService.setPoints(updatedPoints);

        // Rendre le marker interactif
        this.makeMarkerInteractive(layer, point);

        // Ouvrir le drawer approprié selon le type de point
        if (point.isPointOfInterest) {
          this.mapService.selectPointOfInterest(point);
        } else {
          this.mapService.selectPoint(point, point.order);
        }
      },
      error: (error) => {
        console.error('Erreur lors de la sauvegarde du point:', error);
      },
    });
  }

  /**
   * Sauvegarde une forme Leaflet comme Area ou Path dans la base de données
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private saveLayerAsGeometry(layer: any, type: string): void {
    // Ajouter la forme au groupe
    this.drawnItems.addLayer(layer);

    // Convertir en GeoJSON
    const geoJson = this.leafletToGeoJSON(layer);
    if (!geoJson) {
      this.makeLayerInteractive(layer);
      return;
    }

    const geoJsonString = JSON.stringify(geoJson);
    const colorHex = this.getLayerColor(layer);

    // Si c'est un polygon -> Area, sinon (polyline) -> Path
    if (type === 'polygon' || type === 'rectangle' || type === 'circle') {
      const areaData = {
        eventId: this.selectedEvent!.uuid,
        name: `Zone ${new Date().toLocaleString()}`,
        colorHex: colorHex,
        geoJson: geoJsonString,
      };

      this.areaService.create(areaData).subscribe({
        next: (createdArea) => {
          layer.areaUuid = createdArea.uuid;
          layer.shapeType = 'area';
          this.geometryLayers.set(createdArea.uuid, layer);
          this.mapService.addArea(createdArea);
          this.makeLayerInteractive(layer);
        },
        error: (error) => {
          console.error("Erreur lors de la sauvegarde de l'area:", error);
          this.makeLayerInteractive(layer);
        },
      });
    } else {
      // polyline
      const pathData = {
        eventId: this.selectedEvent!.uuid,
        name: `Chemin ${new Date().toLocaleString()}`,
        colorHex: colorHex,
        startDate: new Date(),
        fastestEstimatedSpeed: 5, // Valeurs par défaut
        slowestEstimatedSpeed: 3,
        geoJson: geoJsonString,
      };

      this.pathService.create(pathData).subscribe({
        next: (createdPath) => {
          layer.pathUuid = createdPath.uuid;
          layer.shapeType = 'path';
          this.geometryLayers.set(createdPath.uuid, layer);
          this.mapService.addPath(createdPath);
          this.makeLayerInteractive(layer);
        },
        error: (error) => {
          console.error('Erreur lors de la sauvegarde du path:', error);
          this.makeLayerInteractive(layer);
        },
      });
    }
  }

  /**
   * Convertit un layer Leaflet en GeoJSON
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private leafletToGeoJSON(layer: any): any {
    if (!layer || typeof layer.toGeoJSON !== 'function') {
      return null;
    }
    const geoJSON = layer.toGeoJSON();
    return geoJSON.geometry;
  }

  /**
   * Rend un marker de point interactif
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private makeMarkerInteractive(layer: any, point: Point): void {
    if (!layer) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    layer.on('click', (e: any) => {
      if (typeof window === 'undefined') return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L: any = (window as any).L;
      L.DomEvent.stopPropagation(e);

      // Utiliser onMarkerClick pour gérer les deux types de points
      this.onMarkerClick(point);
    });
  }

  /**
   * Gère la modification d'areas/paths existants
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private onGeometriesEdited(e: any): void {
    const layers = e.layers;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    layers.eachLayer((layer: any) => {
      const geoJson = this.leafletToGeoJSON(layer);
      if (!geoJson) return;

      const geoJsonString = JSON.stringify(geoJson);
      const colorHex = this.getLayerColor(layer);

      if (layer.areaUuid) {
        // C'est une Area
        const currentArea = this.mapService.getAreas().find((a) => a.uuid === layer.areaUuid);
        if (currentArea) {
          const updatedArea: Area = {
            ...currentArea,
            geoJson: geoJsonString,
            colorHex: colorHex,
          };
          this.areaService.update(layer.areaUuid, updatedArea).subscribe({
            next: (updated) => this.mapService.updateArea(updated),
            error: (error) => console.error("Erreur lors de la modification de l'area:", error),
          });
        }
      } else if (layer.pathUuid) {
        // C'est un Path
        const currentPath = this.mapService.getPaths().find((p) => p.uuid === layer.pathUuid);
        if (currentPath) {
          const updatedPath: RoutePath = {
            ...currentPath,
            geoJson: geoJsonString,
            colorHex: colorHex,
          };
          this.pathService.update(layer.pathUuid, updatedPath).subscribe({
            next: (updated) => this.mapService.updatePath(updated),
            error: (error) => console.error('Erreur lors de la modification du path:', error),
          });
        }
      }
    });
  }

  /**
   * Gère la suppression d'areas/paths
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private onGeometriesDeleted(e: any): void {
    const layers = e.layers;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    layers.eachLayer((layer: any) => {
      if (layer.areaUuid) {
        const areaUuid = layer.areaUuid;
        this.areaService.delete(areaUuid).subscribe({
          next: () => this.mapService.removeArea(areaUuid),
          error: (error) => console.error("Erreur lors de la suppression de l'area:", error),
        });
      } else if (layer.pathUuid) {
        const pathUuid = layer.pathUuid;
        this.pathService.delete(pathUuid).subscribe({
          next: () => this.mapService.removePath(pathUuid),
          error: (error) => console.error('Erreur lors de la suppression du path:', error),
        });
      }
    });
  }

  /**
   * Vérifie si un layer est une géométrie d'événement (zone ou parcours)
   * et retourne les informations pour le popup
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getEventGeometryInfo(layer: any): { title: string; type: 'zone' | 'path' } | null {
    // Vérifier si c'est une Area d'événement
    if (layer.areaUuid) {
      const area = this.mapService.getAreas().find((a) => a.uuid === layer.areaUuid);
      if (area && area.name && area.name.startsWith('Zone - ')) {
        // Extraire le nom de l'événement
        const eventTitle = area.name.substring('Zone - '.length);
        return {
          title: `Zone de l'événement ${eventTitle}`,
          type: 'zone',
        };
      }
    }

    // Vérifier si c'est un Path d'événement
    if (layer.pathUuid) {
      const path = this.mapService.getPaths().find((p) => p.uuid === layer.pathUuid);
      if (path && path.name && path.name.startsWith('Tracé - ')) {
        // Extraire le nom de l'événement
        const eventTitle = path.name.substring('Tracé - '.length);
        return {
          title: `Parcours de l'événement ${eventTitle}`,
          type: 'path',
        };
      }
    }

    return null;
  }

  /**
   * Récupère les informations d'une géométrie (Area ou RoutePath) pour l'affichage dans le popup
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getGeometryInfo(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    layer: any
  ): { type: 'area' | 'path'; uuid: string; name?: string; description?: string } | null {
    if (layer.areaUuid) {
      const area = this.mapService.getAreas().find((a) => a.uuid === layer.areaUuid);
      if (area) {
        return {
          type: 'area',
          uuid: area.uuid,
          name: area.name,
          description: area.description,
        };
      }
    }

    if (layer.pathUuid) {
      const path = this.mapService.getPaths().find((p) => p.uuid === layer.pathUuid);
      if (path) {
        return {
          type: 'path',
          uuid: path.uuid,
          name: path.name,
          description: path.description,
        };
      }
    }

    return null;
  }

  /**
   * Ouvre le drawer d'édition pour une Area ou un RoutePath
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private openGeometryEditDrawer(layer: any): void {
    // Fermer le popup Leaflet d'abord
    if (layer.closePopup) {
      layer.closePopup();
    }

    if (layer.areaUuid) {
      const area = this.mapService.getAreas().find((a) => a.uuid === layer.areaUuid);
      if (area) {
        this.geometryEditData = { type: 'area', data: area };
        this.showGeometryEditDrawer = true;
        this.cdr.detectChanges();
      }
    } else if (layer.pathUuid) {
      const path = this.mapService.getPaths().find((p) => p.uuid === layer.pathUuid);
      if (path) {
        this.geometryEditData = { type: 'path', data: path };
        this.showGeometryEditDrawer = true;
        this.cdr.detectChanges();
      }
    }
  }

  /**
   * Rend une couche interactive (sélectionnable et modifiable)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private makeLayerInteractive(layer: any): void {
    if (!layer) return;

    // Ajouter un événement de clic pour sélectionner la forme
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    layer.on('click', (e: any) => {
      if (typeof window === 'undefined') return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L: any = (window as any).L;

      // Arrêter la propagation pour éviter les conflits
      L.DomEvent.stopPropagation(e);

      // Mettre en surbrillance la forme sélectionnée
      this.highlightLayer(layer);
      this.selectedLayer = layer;

      // Vérifier si c'est une géométrie d'événement (zone ou parcours)
      const eventGeometryInfo = this.getEventGeometryInfo(layer);

      // Récupérer les infos de la géométrie (Area ou RoutePath)
      const geometryInfo = this.getGeometryInfo(layer);

      let popupContent: string;

      if (eventGeometryInfo) {
        // Popup spécial pour les géométries d'événement (sans bouton supprimer, avec bouton modifier)
        popupContent = `
          <div class="geometry-popup" style="text-align: center;">
            <strong>${eventGeometryInfo.title}</strong>
            ${
              geometryInfo?.description
                ? `<p style="margin: 8px 0; color: #8b949e; font-size: 12px;">${geometryInfo.description}</p>`
                : ''
            }
            <br>
            <button id="edit-geometry-btn" style="margin: 5px; padding: 8px 12px; cursor: pointer; background: #2ad783; color: #0d1117; border: none; border-radius: 4px; font-weight: 600;">
              ✏️ Modifier
            </button>
          </div>
        `;
      } else if (geometryInfo) {
        // Popup pour Area ou RoutePath avec nom, description et boutons
        const displayName =
          geometryInfo.name ||
          (geometryInfo.type === 'area' ? 'Zone sans nom' : 'Parcours sans nom');
        popupContent = `
          <div class="geometry-popup" style="text-align: center;">
            <strong>${displayName}</strong>
            ${
              geometryInfo.description
                ? `<p style="margin: 8px 0; color: #8b949e; font-size: 12px;">${geometryInfo.description}</p>`
                : ''
            }
            <br>
            <button id="edit-geometry-btn" style="margin: 5px; padding: 8px 12px; cursor: pointer; background: #2ad783; color: #0d1117; border: none; border-radius: 4px; font-weight: 600;">
              ✏️ Modifier
            </button>
            <button id="delete-geometry-btn" style="margin: 5px; padding: 8px 12px; cursor: pointer; background: #ff6b6b; color: white; border: none; border-radius: 4px;">
              🗑️ Supprimer
            </button>
          </div>
        `;
      } else {
        // Popup standard avec option de suppression uniquement
        popupContent = `
          <div class="geometry-popup" style="text-align: center;">
            <strong>Élément géométrique</strong><br>
            <br>
            <button id="delete-geometry-btn" style="margin: 5px; padding: 8px 12px; cursor: pointer; background: #ff6b6b; color: white; border: none; border-radius: 4px;">
              🗑️ Supprimer
            </button>
          </div>
        `;
      }

      // Créer et ouvrir le popup
      if (layer.bindPopup) {
        layer.bindPopup(popupContent).openPopup();

        // Attacher les événements aux boutons après l'ouverture du popup
        setTimeout(() => {
          const editBtn = document.getElementById('edit-geometry-btn');
          const deleteBtn = document.getElementById('delete-geometry-btn');

          if (editBtn && geometryInfo) {
            editBtn.onclick = (event) => {
              event.stopPropagation();
              this.openGeometryEditDrawer(layer);
              // Fermer le popup
              if (layer.closePopup) layer.closePopup();
            };
          }

          if (deleteBtn) {
            deleteBtn.onclick = (event) => {
              event.stopPropagation();
              this.deleteGeometry(layer);
            };
          }
        }, 100);
      }
    });

    // Ajouter un événement de survol pour indiquer que c'est cliquable (léger épaississement)
    layer.on('mouseover', () => {
      if (layer.setStyle && this.selectedLayer !== layer) {
        layer.setStyle({
          weight: 5,
        });
      }
    });

    layer.on('mouseout', () => {
      if (layer.setStyle && this.selectedLayer !== layer) {
        // Restaurer l'épaisseur normale selon le type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const L: any = (window as any).L;
        const isLine = layer instanceof L.Polyline && !(layer instanceof L.Polygon);
        layer.setStyle({
          weight: isLine ? 4 : 3,
        });
      }
    });
  }

  /**
   * Met en surbrillance une couche sélectionnée (léger épaississement uniquement)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private highlightLayer(layer: any): void {
    if (!this.drawnItems || typeof window === 'undefined') return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L: any = (window as any).L;

    // Réinitialiser l'épaisseur de toutes les couches
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.drawnItems.eachLayer((l: any) => {
      if (l.setStyle) {
        // Restaurer l'épaisseur normale
        const isLine = l instanceof L.Polyline && !(l instanceof L.Polygon);
        l.setStyle({
          weight: isLine ? 4 : 3,
        });
      }
    });

    // Épaissir légèrement la couche sélectionnée
    if (layer.setStyle) {
      layer.setStyle({
        weight: 6,
      });
    }
  }

  /**
   * Supprime une area ou un path
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private deleteGeometry(layer: any): void {
    if (!layer) return;

    // Fermer le popup Leaflet d'abord
    if (layer.closePopup) {
      layer.closePopup();
    }

    this.layerToDelete = layer;
    this.showDeleteGeometryConfirm = true;
    this.cdr.detectChanges();
  }

  cancelDeleteGeometry(): void {
    this.showDeleteGeometryConfirm = false;
    this.layerToDelete = null;
  }

  // ============= Édition de géométrie =============

  closeGeometryEditDrawer(): void {
    this.showGeometryEditDrawer = false;
    this.geometryEditData = null;
  }

  onGeometryUpdated(data: GeometryEditData): void {
    // Mettre à jour les données dans le MapService
    if (data.type === 'area') {
      const areas = this.mapService.getAreas();
      const index = areas.findIndex((a) => a.uuid === data.data.uuid);
      if (index !== -1) {
        areas[index] = data.data as Area;
        this.mapService.setAreas([...areas]);

        // Mettre à jour l'affichage de la couche Leaflet
        const layer = this.geometryLayers.get(data.data.uuid);
        if (layer) {
          layer.setStyle({
            color: (data.data as Area).colorHex || '#3388ff',
          });
        }
      }
    } else {
      const paths = this.mapService.getPaths();
      const index = paths.findIndex((p) => p.uuid === data.data.uuid);
      if (index !== -1) {
        paths[index] = data.data as RoutePath;
        this.mapService.setPaths([...paths]);

        // Mettre à jour l'affichage de la couche Leaflet
        const layer = this.geometryLayers.get(data.data.uuid);
        if (layer) {
          layer.setStyle({
            color: (data.data as RoutePath).colorHex || '#3388ff',
          });
        }
      }
    }
    this.closeGeometryEditDrawer();
  }

  confirmDeleteGeometry(): void {
    const layer = this.layerToDelete;
    if (!layer) return;

    this.showDeleteGeometryConfirm = false;
    this.layerToDelete = null;

    // Fermer le popup
    if (layer.closePopup) {
      layer.closePopup();
    }

    // Supprimer du groupe
    if (this.drawnItems) {
      this.drawnItems.removeLayer(layer);
    }

    // Supprimer de la base de données si sauvegardé
    if (layer.areaUuid) {
      this.areaService.delete(layer.areaUuid).subscribe({
        next: () => this.mapService.removeArea(layer.areaUuid),
        error: (error) => console.error("Erreur lors de la suppression de l'area:", error),
      });
    } else if (layer.pathUuid) {
      this.pathService.delete(layer.pathUuid).subscribe({
        next: () => this.mapService.removePath(layer.pathUuid),
        error: (error) => console.error('Erreur lors de la suppression du path:', error),
      });
    }

    // Réinitialiser la sélection
    this.selectedLayer = null;
  }

  /**
   * Récupère la couleur d'une couche Leaflet
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getLayerColor(layer: any): string {
    if (layer.options && layer.options.color) {
      return layer.options.color;
    }
    return '#3388ff'; // Couleur par défaut
  }

  /**
   * Gère les changements du mode dessin pour les SecurityZones
   */
  // eslint-disable-next-line complexity
  private handleDrawingModeChange(mode: DrawingMode): void {
    if (!this.map || typeof window === 'undefined') return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L: any = (window as any).L;

    if (mode.active && mode.sourcePoint && mode.equipment) {
      this.currentDrawingMode = mode;

      // Masquer le contrôle de dessin standard
      if (this.drawControl) {
        this.map.removeControl(this.drawControl);
      }

      // Créer le handler polyline uniquement
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.polylineDrawHandler = new (L.Draw as any).Polyline(this.map, {
        shapeOptions: {
          color: '#ff6b6b',
          weight: 4,
          opacity: 0.8,
        },
      });

      // Écouter la création de la polyline
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.map.once('draw:created', (e: any) => {
        this.onSecurityZoneDrawn(e);
      });

      // Activer le handler
      this.polylineDrawHandler.enable();

      // Centrer la carte sur le point source
      if (mode.sourcePoint.latitude && mode.sourcePoint.longitude) {
        this.map.setView([mode.sourcePoint.latitude, mode.sourcePoint.longitude], 17);
      }
    } else {
      // Désactiver le mode dessin
      if (this.polylineDrawHandler) {
        this.polylineDrawHandler.disable();
        this.polylineDrawHandler = null;
      }

      // Réafficher le contrôle de dessin standard
      if (this.drawControl && this.map) {
        this.map.addControl(this.drawControl);
      }

      this.currentDrawingMode = { active: false, sourcePoint: null, equipment: null };
    }
  }

  /**
   * Gère la création d'une SecurityZone après le dessin de la polyline
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, complexity
  private onSecurityZoneDrawn(e: any): void {
    const layer = e.layer;
    const { sourcePoint, equipment } = this.currentDrawingMode;

    if (!sourcePoint || !equipment || !this.selectedEvent) {
      this.mapService.stopDrawingMode();
      return;
    }

    // Convertir la polyline en GeoJSON
    const geoJson = this.leafletToGeoJSON(layer);
    if (!geoJson) {
      this.toastService.showError('Erreur', 'Impossible de créer la géométrie');
      this.mapService.stopDrawingMode();
      return;
    }

    // Calculer la quantité en fonction de la longueur de la géométrie et de l'équipement
    const geoJsonString = JSON.stringify(geoJson);
    const geometryLength = this.calculateGeometryLength(geoJsonString);
    let quantity = 1;
    if (equipment.length && equipment.length > 0 && geometryLength > 0) {
      const rawQuantity = geometryLength / equipment.length;
      const decimalPart = rawQuantity - Math.floor(rawQuantity);
      quantity = decimalPart >= 0.2 ? Math.ceil(rawQuantity) : Math.floor(rawQuantity);
      if (quantity < 1) quantity = 1;
    }

    // Créer la SecurityZone avec le commentaire du point et la quantité calculée
    // Utiliser les dates de début et fin d'événement pour les dates de pose/dépose
    const installationDate = this.selectedEvent.startDate
      ? new Date(this.selectedEvent.startDate)
      : new Date();
    const removalDate = this.selectedEvent.endDate
      ? new Date(this.selectedEvent.endDate)
      : new Date();

    const securityZoneData: Partial<SecurityZone> = {
      eventId: this.selectedEvent.uuid,
      equipmentId: equipment.uuid,
      quantity: quantity,
      comment: sourcePoint.comment || '', // Transférer le commentaire du point
      installationDate: installationDate,
      removalDate: removalDate,
      geoJson: geoJsonString,
    };

    this.securityZoneService.create(securityZoneData as SecurityZone).subscribe({
      next: (createdZone) => {
        // Associer l'UUID et le type au layer
        layer.securityZoneUuid = createdZone.uuid;
        layer.shapeType = 'securityZone';
        
        // Toujours ajouter la zone nouvellement créée (ignorer le filtre pour les nouvelles zones)
        this.drawnItems.addLayer(layer);
        
        // Stocker dans la map
        this.geometryLayers.set(createdZone.uuid, layer);

        // Rendre interactive
        this.makeSecurityZoneInteractive(layer, createdZone);

        // Ajouter au MapService
        this.mapService.addSecurityZone(createdZone);

        // Transférer les photos du point vers la SecurityZone
        this.pictureService
          .transferFromPointToSecurityZone(sourcePoint.uuid, createdZone.uuid)
          .subscribe({
            next: () => {
              // Photos transférées avec succès
            },
            error: (error) => {
              console.error('Erreur lors du transfert des photos:', error);
            },
          });

        // Supprimer le point d'origine
        this.pointService.delete(sourcePoint.uuid).subscribe({
          next: () => {
            // Retirer le marker de la carte
            const marker = this.markers.get(sourcePoint.uuid);
            if (marker && this.map) {
              this.map.removeLayer(marker);
              this.markers.delete(sourcePoint.uuid);
            }

            // Mettre à jour la liste des points
            const currentPoints = this.mapService['pointsSubject'].value;
            this.mapService.setPoints(
              currentPoints.filter((p: Point) => p.uuid !== sourcePoint.uuid)
            );

            this.toastService.showSuccess(
              'Zone de sécurité créée',
              'Complétez maintenant les dates de pose et dépose'
            );

            // Ouvrir le drawer de la SecurityZone pour l'étape 2/2
            this.mapService.selectSecurityZone(createdZone);
          },
          error: (error) => {
            console.error('Erreur lors de la suppression du point:', error);
            // On continue quand même car la zone est créée
            this.mapService.selectSecurityZone(createdZone);
          },
        });

        // Arrêter le mode dessin
        this.mapService.stopDrawingMode();
      },
      error: (error) => {
        console.error('Erreur lors de la création de la zone de sécurité:', error);
        this.toastService.showError('Erreur', 'Impossible de créer la zone de sécurité');
        this.mapService.stopDrawingMode();
      },
    });
  }

  /**
   * Rend une SecurityZone interactive
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private makeSecurityZoneInteractive(layer: any, zone: SecurityZone): void {
    if (!layer) return;

    // Stocker l'UUID pour récupérer la zone à jour lors du clic
    const zoneUuid = zone.uuid;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    layer.on('click', (e: any) => {
      if (typeof window === 'undefined') return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L: any = (window as any).L;
      L.DomEvent.stopPropagation(e);

      // Récupérer la zone à jour depuis le MapService
      const currentZones = this.mapService.getSecurityZones();
      const currentZone = currentZones.find((z) => z.uuid === zoneUuid);

      if (currentZone) {
        // Centrer la carte et ouvrir le popup
        this.mapService.focusOnSecurityZone(currentZone);
        // Ouvrir le drawer
        this.mapService.selectSecurityZone(currentZone);
      }
    });
  }

  /**
   * Gère la sélection du type de point dans la popup
   */
  onPointTypeSelected(isPointOfInterest: boolean): void {
    if (!this.pendingMarkerLayer || typeof window === 'undefined') return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L: any = (window as any).L;

    // Sauvegarder le marker avec le type choisi
    this.saveMarkerAsPoint(this.pendingMarkerLayer, L, isPointOfInterest);

    // Réinitialiser l'état de la popup
    this.showPointTypePopup = false;
    this.pendingMarkerLayer = null;
    this.cdr.detectChanges();
  }

  /**
   * Gère l'annulation de la popup de type de point
   */
  onPointTypePopupCancelled(): void {
    // Supprimer le marker temporaire
    if (this.pendingMarkerLayer && this.map) {
      this.map.removeLayer(this.pendingMarkerLayer);
    }

    // Réinitialiser l'état de la popup
    this.showPointTypePopup = false;
    this.pendingMarkerLayer = null;
    this.cdr.detectChanges();
  }

  /**
   * Gère la demande de sélection d'équipement depuis la popup de type de point
   */
  onEquipmentRequired(): void {
    console.log('[MapLoader] onEquipmentRequired called');
    // Fermer la popup de type de point
    this.showPointTypePopup = false;
    
    // Charger les équipements et ouvrir la popup de sélection
    this.equipmentService.getAll().subscribe({
      next: (equipments) => {
        this.equipments = equipments;
        this.showEquipmentSelectPopup = true;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des équipements:', error);
        this.toastService.showError('Erreur', 'Impossible de charger les équipements');
        // Annuler en cas d'erreur
        this.onPointTypePopupCancelled();
      }
    });
  }

  /**
   * Gère la sélection d'un équipement
   */
  onEquipmentSelected(equipment: Equipment): void {
    if (!this.pendingMarkerLayer || !this.selectedEvent || typeof window === 'undefined') return;

    // Créer un point temporaire avec les coordonnées du marker
    const latlng = this.pendingMarkerLayer.getLatLng();
    const tempPoint: Point = {
      uuid: 'temp-' + Date.now(),
      name: 'Point temporaire',
      latitude: latlng.lat,
      longitude: latlng.lng,
      comment: '',
      eventId: this.selectedEvent.uuid,
      isPointOfInterest: false,
      validated: false
    };

    // Fermer la popup
    this.showEquipmentSelectPopup = false;
    
    // Supprimer le marker temporaire
    if (this.map) {
      this.map.removeLayer(this.pendingMarkerLayer);
    }
    this.pendingMarkerLayer = null;

    // Activer le mode dessin avec le point et l'équipement
    this.mapService.startDrawingMode(tempPoint, equipment);
    
    this.cdr.detectChanges();
  }

  /**
   * Gère l'annulation de la sélection d'équipement
   */
  onEquipmentSelectCancelled(): void {
    // Supprimer le marker temporaire
    if (this.pendingMarkerLayer && this.map) {
      this.map.removeLayer(this.pendingMarkerLayer);
    }

    // Réinitialiser l'état
    this.showEquipmentSelectPopup = false;
    this.pendingMarkerLayer = null;
    this.cdr.detectChanges();
  }

  /**
   * Gère les changements du mode création d'événement (zone puis chemin)
   */
  // eslint-disable-next-line complexity
  private handleEventCreationModeChange(mode: EventCreationMode): void {
    if (!this.map || typeof window === 'undefined') return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L: any = (window as any).L;
    this.currentEventCreationMode = mode;
    if (this.drawControl && this.map) {
      this.map.removeControl(this.drawControl);
    }

    if (mode.step === 'drawing-zone') {
      // En mode modification de zone, activer l'édition du layer existant
      if (mode.zoneModificationMode && this.eventCreationZoneLayer) {
        // Activer le mode édition sur le layer existant
        this.enableLayerEditing(this.eventCreationZoneLayer, L, 'zone');
      } else {
        // Supprimer uniquement le layer zone existant (garder le path s'il existe)
        this.clearEventCreationZoneLayer();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.polygonDrawHandler = new (L.Draw as any).Polygon(this.map, {
          allowIntersection: false,
          drawError: {
            color: '#e1e100',
            message: '<strong>Erreur:</strong> Les bords ne doivent pas se croiser!',
          },
          shapeOptions: {
            color: '#3388ff',
            fillOpacity: 0.2,
            weight: 3,
          },
        });

        this.polygonDrawHandler.enable();
      }
    } else if (mode.step === 'drawing-path') {
      // Désactiver le handler polygon s'il existe
      if (this.polygonDrawHandler) {
        this.polygonDrawHandler.disable();
        this.polygonDrawHandler = null;
      }

      // Désactiver le mode édition du layer zone s'il était actif
      this.disableLayerEditing(this.eventCreationZoneLayer);

      // En mode modification de path, activer l'édition du layer existant
      if (mode.pathModificationMode && this.eventCreationPathLayer) {
        // Activer le mode édition sur le layer existant
        this.enableLayerEditing(this.eventCreationPathLayer, L, 'path');
      } else {
        // Supprimer uniquement le layer path existant (garder la zone)
        this.clearEventCreationPathLayer();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.polylineDrawHandler = new (L.Draw as any).Polyline(this.map, {
          shapeOptions: {
            color: '#a91a1a',
            weight: 4,
            opacity: 0.8,
          },
        });

        this.polylineDrawHandler.enable();
      }
    } else if (mode.step === 'confirm' || mode.step === 'idle') {
      // Désactiver les handlers si actifs
      if (this.polygonDrawHandler) {
        this.polygonDrawHandler.disable();
        this.polygonDrawHandler = null;
      }
      if (this.polylineDrawHandler) {
        this.polylineDrawHandler.disable();
        this.polylineDrawHandler = null;
      }

      // Désactiver le mode édition des layers
      this.disableLayerEditing(this.eventCreationZoneLayer);
      this.disableLayerEditing(this.eventCreationPathLayer);

      // Réafficher le contrôle de dessin standard si un événement est sélectionné
      if (mode.step === 'idle' && this.selectedEvent && this.drawControl) {
        this.map.addControl(this.drawControl);
      }
    }
  }

  /**
   * Active le mode édition sur un layer existant
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private enableLayerEditing(layer: any, L: any, type: 'zone' | 'path'): void {
    if (!layer || !this.map) return;

    // Activer le mode édition sur le layer
    if (layer.editing) {
      layer.editing.enable();
    }

    // Changer le style pour indiquer le mode édition
    if (layer.setStyle) {
      layer.setStyle({
        dashArray: '10, 10',
        weight: type === 'zone' ? 4 : 5,
      });
    }

    // Stocker le type d'édition en cours pour pouvoir récupérer le geoJson à la validation
    layer._editType = type;
  }

  /**
   * Désactive le mode édition sur un layer et retourne le geoJson final
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private disableLayerEditing(layer: any): void {
    if (!layer) return;

    // Récupérer le geoJson final AVANT de désactiver l'édition
    if (layer._editType && layer.editing && layer.editing.enabled()) {
      const geoJson = this.leafletToGeoJSON(layer);
      if (geoJson) {
        const geoJsonString = JSON.stringify(geoJson);
        this.mapService.updateEventGeoJson(layer._editType, geoJsonString);
      }
    }

    if (layer.editing) {
      layer.editing.disable();
    }

    // Restaurer le style normal
    if (layer.setStyle) {
      layer.setStyle({
        dashArray: null,
      });
    }

    // Nettoyer
    delete layer._editType;
  }

  /**
   * Callback quand la zone de l'événement est dessinée
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private onEventZoneDrawn(e: any): void {
    const layer = e.layer;

    const geoJson = this.leafletToGeoJSON(layer);
    if (!geoJson) {
      this.toastService.showError('Erreur', 'Impossible de créer la zone');
      this.mapService.cancelEventCreation();
      return;
    }

    layer.setStyle({
      color: '#3388ff',
      fillOpacity: 0.15,
      weight: 2,
    });
    layer.addTo(this.map);

    // Mettre le layer en arrière-plan pour qu'il soit sous les autres éléments
    if (layer.bringToBack) {
      layer.bringToBack();
    }

    this.eventCreationZoneLayer = layer;

    // Passer à l'étape suivante
    const geoJsonString = JSON.stringify(geoJson);
    this.mapService.setEventZoneGeoJson(geoJsonString);
  }

  /**
   * Callback quand le chemin de l'événement est dessiné
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private onEventPathDrawn(e: any): void {
    const layer = e.layer;

    const geoJson = this.leafletToGeoJSON(layer);
    if (!geoJson) {
      this.toastService.showError('Erreur', 'Impossible de créer le tracé');
      this.mapService.cancelEventCreation();
      return;
    }

    layer.setStyle({
      color: '#a91a1a',
      weight: 3,
      opacity: 0.7,
    });
    layer.addTo(this.map);

    // Mettre le layer en arrière-plan pour qu'il soit sous les autres éléments
    if (layer.bringToBack) {
      layer.bringToBack();
    }

    this.eventCreationPathLayer = layer;

    // Passer à l'étape de confirmation
    const geoJsonString = JSON.stringify(geoJson);
    this.mapService.setEventPathGeoJson(geoJsonString);
  }

  /**
   * Nettoie uniquement le layer zone de création d'événement
   */
  private clearEventCreationZoneLayer(): void {
    if (this.map && this.eventCreationZoneLayer) {
      this.map.removeLayer(this.eventCreationZoneLayer);
      this.eventCreationZoneLayer = null;
    }
  }

  /**
   * Nettoie uniquement le layer path de création d'événement
   */
  private clearEventCreationPathLayer(): void {
    if (this.map && this.eventCreationPathLayer) {
      this.map.removeLayer(this.eventCreationPathLayer);
      this.eventCreationPathLayer = null;
    }
  }

  /**
   * Nettoie tous les layers temporaires de création d'événement
   */
  private clearAllEventCreationLayers(): void {
    this.clearEventCreationZoneLayer();
    this.clearEventCreationPathLayer();
  }

  /**
   * Nettoie complètement le mode création d'événement
   */
  private cleanupEventCreationDrawing(): void {
    // Désactiver les handlers
    if (this.polygonDrawHandler) {
      this.polygonDrawHandler.disable();
      this.polygonDrawHandler = null;
    }
    if (this.polylineDrawHandler) {
      this.polylineDrawHandler.disable();
      this.polylineDrawHandler = null;
    }

    this.clearAllEventCreationLayers();

    // Réinitialiser le mode
    this.currentEventCreationMode = {
      active: false,
      step: 'idle',
      event: null,
      zoneGeoJson: null,
      pathGeoJson: null,
      zoneModificationMode: false,
      pathModificationMode: false,
    };

    // Réafficher le contrôle de dessin standard si un événement est sélectionné
    if (this.selectedEvent && this.drawControl && this.map) {
      this.map.addControl(this.drawControl);
    }
  }

  /**
   * Appelé quand l'événement est confirmé depuis le popup
   */
  onEventConfirmed(): void {
    this.cleanupEventCreationDrawing();
  }

  /**
   * Appelé quand la création d'événement est annulée depuis le popup
   */
  onEventCreationCancelled(): void {
    this.cleanupEventCreationDrawing();
  }

  ngOnDestroy(): void {
    // Réinitialiser l'événement sélectionné
    this.mapService.setSelectedEvent(null);

    // Arrêter le mode dessin si actif
    this.mapService.stopDrawingMode();

    // Unsubscribe de tous les observables
    this.pointsSubscription?.unsubscribe();
    this.selectedEventSubscription?.unsubscribe();
    this.shapesSubscription?.unsubscribe();
    this.focusPointSubscription?.unsubscribe();
    this.focusSecurityZoneSubscription?.unsubscribe();
    this.focusSecurityZoneWithGlowSubscription?.unsubscribe();
    this.clearSecurityZoneGlowSubscription?.unsubscribe();
    this.drawingModeSubscription?.unsubscribe();
    this.securityZonesSubscription?.unsubscribe();
    this.eventCreationModeSubscription?.unsubscribe();
    this.visibleSecurityZoneIdsSubscription?.unsubscribe();
    this.visiblePointIdsSubscription?.unsubscribe();
    this.visiblePointOfInterestIdsSubscription?.unsubscribe();
    this.visibleAreaIdsSubscription?.unsubscribe();
    this.visiblePathIdsSubscription?.unsubscribe();
    this.visibleEquipmentIdsSubscription?.unsubscribe();
    this.eventAreaVisibleSubscription?.unsubscribe();

    // Nettoyer les markers
    this.markers.forEach((marker) => {
      if (this.map) {
        this.map.removeLayer(marker);
      }
    });
    this.markers.clear();

    // Nettoyer les areas/paths
    this.clearExistingGeometries();

    // Nettoyer le contrôle de dessin
    if (this.drawControl && this.map) {
      this.map.removeControl(this.drawControl);
      this.drawControl = null;
    }

    // Nettoyer les formes dessinées
    if (this.drawnItems && this.map) {
      this.map.removeLayer(this.drawnItems);
      this.drawnItems = null;
    }

    // Nettoyer la map
    if (this.map && typeof this.map.remove === 'function') {
      this.map.remove();
      this.map = null;
    }
  }
}
