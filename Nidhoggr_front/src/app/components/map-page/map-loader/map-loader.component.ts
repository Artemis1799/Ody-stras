import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { MapService } from '../../../services/MapService';
import { GeometryService } from '../../../services/GeometryService';
import { PointService } from '../../../services/PointService';
import { Point } from '../../../models/pointModel';
import { Event } from '../../../models/eventModel';
import { Geometry, GeometryProperties } from '../../../models/geometryModel';
import { Subscription } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';

@Component({
  selector: 'app-map-loader',
  standalone: true,
  imports: [],
  templateUrl: './map-loader.component.html',
  styleUrls: ['./map-loader.component.scss'],
})
export class MapLoaderComponent implements AfterViewInit, OnDestroy {
  private openedPoint: Point | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private map: any | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private markers: Map<string, any> = new Map();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private geometryLayers: Map<string, any> = new Map(); // Map pour stocker les layers des géométries
  private pointsSubscription?: Subscription;
  private selectedPointSubscription?: Subscription;
  private selectedEventSubscription?: Subscription;
  private geometriesSubscription?: Subscription;
  private focusPointSubscription?: Subscription;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private drawnItems: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private drawControl: any = null;
  private platformId = inject(PLATFORM_ID);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private selectedLayer: any = null;
  private selectedEvent: Event | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private leafletInstance: any = null;

  constructor(
    private mapService: MapService,
    private geometryService: GeometryService,
    private pointService: PointService
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
        L.latLng(48.513, 7.638), // Sud-Ouest (MINLAT, MINLON)
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
        maxZoom: 17,
        maxBounds: bounds,
        maxBoundsViscosity: 1.0,
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
          maxZoom: 17,
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

      // S'abonner à la sélection de points
      this.selectedPointSubscription = this.mapService.selectedPoint$.subscribe((point) => {
        this.highlightMarker(point);
      });

      // S'abonner au focus sur un point (depuis la timeline)
      this.focusPointSubscription = this.mapService.focusPoint$.subscribe((point) => {
        this.centerMapOnPoint(point);
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
    points.forEach((point, index) => {
      if (this.map && point.latitude && point.longitude) {
        const marker = L.marker([point.latitude, point.longitude], {
          title: this.getPointDisplayName(point),
          icon: L.divIcon({
            className: 'custom-marker',
            html: `<div class="marker-pin ${point.isValid ? 'valid' : 'invalid'}">
                     <span class="marker-number">${point.order || index + 1}</span>
                   </div>`,
            iconSize: [30, 42],
            iconAnchor: [15, 42],
            popupAnchor: [0, -42],
          }),
        }).addTo(this.map);

        // Popup avec informations (ne s'ouvre que manuellement)
        const popupContent = `
          <div class="point-popup">
            <strong>${this.getPointDisplayName(point)}</strong><br>
            <small>Ordre: ${point.order || index + 1}</small><br>
            <small>Statut: ${point.isValid ? 'Valide ✓' : 'Invalide ✗'}</small>
          </div>
        `;
        marker.bindPopup(popupContent, { autoClose: false, closeOnClick: false });

        // Clic sur le marker - ouvre le drawer au lieu du popup
        marker.on('click', () => {
          this.onMarkerClick(point);
        });

        this.markers.set(point.uuid, marker);
      }
    });
  }

  private highlightMarker(point: Point | null): void {
    if (!point) return;

    const marker = this.markers.get(point.uuid);
    if (marker) {
      if (this.openedPoint && this.openedPoint.uuid !== point.uuid) {
        const openedMarker = this.markers.get(this.openedPoint.uuid);
        openedMarker.closePopup();
      }
      marker.openPopup();
      this.openedPoint = point;
    }
  }

  private centerMapOnPoint(point: Point): void {
    if (!this.map || !point.latitude || !point.longitude) return;
    this.highlightMarker(point);
    this.map.setView([point.latitude - 0.001, point.longitude], 17, {
      animate: true,
      duration: 0.5,
    });
  }

  private getPointDisplayName(point: Point): string {
    if (point.comment) {
      return point.comment;
    }
    return `Point ${point.uuid.substring(0, 8)}`;
  }

  private onMarkerClick(point: Point): void {
    // Sélectionner le point (ouvrira automatiquement le drawer)
    this.mapService.selectPoint(point);

    // Zoomer et centrer sur le point
    if (this.map && point.latitude && point.longitude) {
      this.map.setView([point.latitude, point.longitude], 17, {
        animate: true,
        duration: 0.5,
      });
    }
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
            icon: L.divIcon({
              className: 'custom-marker',
              html: `<div class="marker-pin newly-created">
                     </div>`,
              iconSize: [30, 42],
              iconAnchor: [15, 42],
              popupAnchor: [0, -42],
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
    // Supprimer les layers du groupe drawnItems
    if (this.drawnItems) {
      this.drawnItems.clearLayers();
    }

    // Vider la map des géométries
    this.geometryLayers.clear();

    // Vider la liste des géométries dans le service
    this.mapService.clearGeometries();
  }

  /**
   * Charge et affiche les géométries d'un événement sur la carte
   */
  private loadEventGeometries(event: Event): void {
    // Charger les géométries depuis l'API
    this.geometryService.getByEventId(event.uuid).subscribe({
      next: (geometries) => {
        // Mettre à jour le MapService avec les géométries chargées
        this.mapService.setGeometries(geometries);

        // Afficher les géométries sur la carte
        geometries.forEach((geometry) => {
          this.addGeometryToMap(geometry);
        });
      },
      error: (error) => {
        console.error('Erreur lors du chargement des géométries:', error);
        this.mapService.setGeometries([]);
      },
    });
  }

  /**
   * Ajoute une géométrie à la carte
   */
  private addGeometryToMap(geometry: Geometry): void {
    if (!this.map || !this.drawnItems || typeof window === 'undefined') return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L: any = (window as any).L;
    const geoJson = geometry.geoJson;

    if (!geoJson || !geoJson.type) {
      console.warn('GeoJSON invalide pour la géométrie:', geometry.uuid);
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let layer: any = null;
      // Couleurs standardisées: lignes en rouge, zones en bleu
      const LINE_COLOR = '#a91a1a'; // Rouge pour les lignes
      const ZONE_COLOR = '#3388ff'; // Bleu pour les zones

      switch (geoJson.type) {
        case 'Point': {
          const coords = geoJson.coordinates as [number, number];
          layer = L.marker([coords[1], coords[0]], {
            icon: L.divIcon({
              className: 'custom-marker',
              html: `<div class="marker-pin newly-created"></div>`,
              iconSize: [30, 42],
              iconAnchor: [15, 42],
              popupAnchor: [0, -42],
            }),
          });
          break;
        }

        case 'LineString': {
          const lineCoords = (geoJson.coordinates as [number, number][]).map((c) => [c[1], c[0]]);
          layer = L.polyline(lineCoords, {
            color: LINE_COLOR,
            weight: 4,
          });
          break;
        }

        case 'Polygon': {
          const polygonCoords = (geoJson.coordinates as [number, number][][])[0].map((c) => [
            c[1],
            c[0],
          ]);
          layer = L.polygon(polygonCoords, {
            color: ZONE_COLOR,
            fillOpacity: 0.2,
            weight: 3,
          });
          break;
        }

        default:
          // Pour les autres types, utiliser geoJSON de Leaflet avec couleur bleue par défaut
          layer = L.geoJSON(geoJson, {
            style: {
              color: ZONE_COLOR,
              fillOpacity: 0.2,
              weight: 3,
            },
          });
          break;
      }

      if (layer) {
        // Associer l'UUID à la couche
        layer.geometryUuid = geometry.uuid;

        // Ajouter au groupe drawnItems
        this.drawnItems.addLayer(layer);

        // Stocker dans la map
        this.geometryLayers.set(geometry.uuid, layer);

        // Rendre interactive
        this.makeLayerInteractive(layer);
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout de la géométrie à la carte:", error);
    }
  }

  /**
   * Gère la création d'une nouvelle géométrie ou d'un point
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private onGeometryCreated(e: any): void {
    if (!this.drawnItems || typeof window === 'undefined') return;

    // Vérifier qu'un événement est sélectionné
    if (!this.selectedEvent) {
      console.warn('Aucun événement sélectionné - élément non sauvegardé');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L: any = (window as any).L;
    const type = e.layerType;
    const layer = e.layer;

    // Si c'est un marker, le sauvegarder comme Point
    if (type === 'marker') {
      this.saveMarkerAsPoint(layer, L);
      return;
    }

    // Sinon, sauvegarder comme Geometry
    this.saveLayerAsGeometry(layer, type);
  }

  /**
   * Sauvegarde un marker Leaflet comme Point dans la base de données
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private saveMarkerAsPoint(layer: any, L: any): void {
    const latlng = layer.getLatLng();

    // Mettre à jour l'icône du marker
    layer.setIcon(
      L.divIcon({
        className: 'custom-marker',
        html: `<div class="marker-pin newly-created"></div>`,
        iconSize: [30, 42],
        iconAnchor: [15, 42],
        popupAnchor: [0, -42],
      })
    );

    // Ajouter au groupe
    this.drawnItems.addLayer(layer);

    // Créer le point
    const currentPoints = this.mapService.getMapInstance()
      ? Array.from(this.markers.keys()).length
      : 0;

    const pointData: Partial<Point> = {
      eventId: this.selectedEvent!.uuid,
      latitude: latlng.lat,
      longitude: latlng.lng,
      order: currentPoints + 1,
      isValid: false,
      comment: ' ',
    };

    this.pointService.create(pointData).subscribe({
      next: (point) => {
        // Associer l'UUID au layer
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (layer as any).pointUuid = point.uuid;

        // Ajouter le marker à notre Map de markers
        this.markers.set(point.uuid, layer);

        // Mettre à jour les points dans le MapService
        const currentPoints = [...this.mapService['pointsSubject'].value, point];
        this.mapService.setPoints(currentPoints);

        // Rendre le marker interactif
        this.makeMarkerInteractive(layer, point);

        // Ouvrir le drawer du point créé
        this.mapService.selectPoint(point);
      },
      error: (error) => {
        console.error('Erreur lors de la sauvegarde du point:', error);
      },
    });
  }

  /**
   * Sauvegarde une forme Leaflet comme Geometry dans la base de données
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private saveLayerAsGeometry(layer: any, type: string): void {
    // Ajouter la forme au groupe
    this.drawnItems.addLayer(layer);

    // Préparer les propriétés
    const properties: GeometryProperties = {
      name: `${type} - ${new Date().toLocaleString()}`,
      color: this.getLayerColor(layer),
      created: new Date(),
      modified: new Date(),
    };

    // Sauvegarder dans le service avec l'UUID de l'événement sélectionné
    const saveObservable = this.geometryService.saveFromLeafletLayer(
      layer,
      this.selectedEvent!.uuid,
      properties
    );

    if (saveObservable) {
      saveObservable.subscribe({
        next: (geometry) => {
          // Associer l'UUID à la couche pour les modifications futures
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (layer as any).geometryUuid = geometry.uuid;

          // Ajouter la géométrie à la liste locale
          this.mapService.addGeometry(geometry);

          // Rendre la forme sélectionnable après la sauvegarde
          this.makeLayerInteractive(layer);
        },
        error: (error) => {
          console.error('Erreur lors de la sauvegarde de la géométrie:', error);
          // Rendre quand même la forme interactive même en cas d'erreur
          this.makeLayerInteractive(layer);
        },
      });
    } else {
      // Si pas de sauvegarde, rendre quand même interactive
      this.makeLayerInteractive(layer);
    }
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

      // Sélectionner le point
      this.mapService.selectPoint(point);
    });
  }

  /**
   * Gère la modification de géométries existantes
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private onGeometriesEdited(e: any): void {
    const layers = e.layers;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    layers.eachLayer((layer: any) => {
      if (layer.geometryUuid) {
        const geoJson = this.geometryService.leafletToGeoJSON(layer);

        if (geoJson) {
          const properties: GeometryProperties = {
            color: this.getLayerColor(layer),
            modified: new Date(),
          };

          this.geometryService
            .update(layer.geometryUuid, {
              geoJson,
              properties,
              modified: new Date(),
            })
            .subscribe({
              next: () => {}, // Modification réussie
              error: (error) => {
                console.error('Erreur lors de la modification:', error);
              },
            });
        }
      }
    });
  }

  /**
   * Gère la suppression de géométries
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private onGeometriesDeleted(e: any): void {
    const layers = e.layers;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    layers.eachLayer((layer: any) => {
      if (layer.geometryUuid) {
        const geometryUuid = layer.geometryUuid;
        this.geometryService.delete(geometryUuid).subscribe({
          next: () => {
            // Retirer la géométrie de la liste locale
            this.mapService.removeGeometry(geometryUuid);
          },
          error: (error) => {
            console.error('Erreur lors de la suppression:', error);
          },
        });
      }
    });
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

      // Créer un popup avec option de suppression
      const popupContent = `
        <div class="geometry-popup" style="text-align: center;">
          <strong>Élément géométrique</strong><br>
          <br>
          <button id="delete-geometry-btn" style="margin: 5px; padding: 8px 12px; cursor: pointer; background: #ff6b6b; color: white; border: none; border-radius: 4px;">
            🗑️ Supprimer
          </button>
        </div>
      `;

      // Créer et ouvrir le popup
      if (layer.bindPopup) {
        layer.bindPopup(popupContent).openPopup();

        // Attacher l'événement au bouton après l'ouverture du popup
        setTimeout(() => {
          const deleteBtn = document.getElementById('delete-geometry-btn');

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
   * Supprime une géométrie
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private deleteGeometry(layer: any): void {
    if (!layer) return;

    const confirmed = confirm('Voulez-vous vraiment supprimer cet élément géométrique ?');

    if (confirmed) {
      // Fermer le popup
      if (layer.closePopup) {
        layer.closePopup();
      }

      // Supprimer du groupe
      if (this.drawnItems) {
        this.drawnItems.removeLayer(layer);
      }

      // Supprimer de la base de données si sauvegardé
      if (layer.geometryUuid) {
        this.geometryService.delete(layer.geometryUuid).subscribe({
          next: () => {
            // Retirer la géométrie de la liste locale
            this.mapService.removeGeometry(layer.geometryUuid);
          },
          error: (error) => {
            console.error('Erreur lors de la suppression:', error);
          },
        });
      }

      // Réinitialiser la sélection
      this.selectedLayer = null;
    }
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

  ngOnDestroy(): void {
    // Nettoyer les subscriptions
    if (this.pointsSubscription) {
      this.pointsSubscription.unsubscribe();
    }
    if (this.selectedPointSubscription) {
      this.selectedPointSubscription.unsubscribe();
    }
    if (this.selectedEventSubscription) {
      this.selectedEventSubscription.unsubscribe();
    }
    if (this.geometriesSubscription) {
      this.geometriesSubscription.unsubscribe();
    }
    if (this.focusPointSubscription) {
      this.focusPointSubscription.unsubscribe();
    }

    // Nettoyer les markers
    this.markers.forEach((marker) => {
      if (this.map) {
        this.map.removeLayer(marker);
      }
    });
    this.markers.clear();

    // Nettoyer les géométries
    this.geometryLayers.clear();

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
