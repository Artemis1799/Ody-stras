import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { MapService } from '../../../services/MapService';
import { Point } from '../../../models/pointModel';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-map-loader',
  standalone: true,
  imports: [],
  templateUrl: './map-loader.component.html',
  styleUrls: ['./map-loader.component.scss']
})
export class MapLoaderComponent implements AfterViewInit, OnDestroy {
  private map: any | null = null;
  private markers: Map<string, any> = new Map();
  private pointsSubscription?: Subscription;
  private selectedPointSubscription?: Subscription;

  constructor(private mapService: MapService) {}

  ngAfterViewInit(): void {
    try {
      if (typeof window === 'undefined') { return; }
      const L: any = (window as any).L;
      const center: [number, number] = [48.5846, 7.7507];
      
      // Limites géographiques basées sur les tuiles téléchargées
      const bounds = L.latLngBounds(
        L.latLng(48.5130, 7.6380), // Sud-Ouest (MINLAT, MINLON)
        L.latLng(48.6500, 7.8780)  // Nord-Est (MAXLAT, MAXLON)
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
        maxBoundsViscosity: 1.0      
      });
      
      // Partager l'instance de map avec le service
      this.mapService.setMapInstance(this.map);

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
      if (saved && (saved.includes('localhost:8080') || saved.startsWith('http://') || saved.startsWith('https://'))) {
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
          attribution: '&copy; Local tiles' 
        }).addTo(this.map);
        const input = document.getElementById('tileUrlInput') as HTMLInputElement | null;
        const btn = document.getElementById('tileTestBtn') as HTMLButtonElement | null;
        const status = document.getElementById('tileStatus') as HTMLElement | null;

        if (input) input.value = chosen || '';

        if (btn && input && status) {
          btn.onclick = async () => {
            if (!this.map) return;
            const tpl = input.value.trim();
            if (!tpl) { status.textContent = 'Entrez un template d\'URL.'; return; }
            status.textContent = 'Test en cours...';
            const ok = await probe(tpl);
            if (ok) {
              try {
                if (typeof tileLayer.setUrl === 'function') {
                  tileLayer.setUrl(tpl);
                } else {
                  if (this.map) {
                    this.map.removeLayer(tileLayer);
                    tileLayer = L.tileLayer(tpl, { maxZoom: 20, attribution: '&copy; Local tiles' }).addTo(this.map);
                  }
                }
                localStorage.setItem('tileUrlTemplate', tpl);
                status.textContent = 'Template appliqué et sauvegardé.';
              } catch {
                status.textContent = 'Erreur lors de l\'application du template.';
              }
            } else {
              status.textContent = 'Le test a échoué (404 ou indisponible). Vérifiez l\'URL dans l\'interface du tile server.';
            }
          };
        }
      })();

      // S'abonner aux changements de points
      this.pointsSubscription = this.mapService.points$.subscribe(points => {
        this.updateMarkers(points);
      });

      // S'abonner à la sélection de points
      this.selectedPointSubscription = this.mapService.selectedPoint$.subscribe(point => {
        this.highlightMarker(point);
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
    this.markers.forEach(marker => {
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
            popupAnchor: [0, -42]
          })
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
      marker.openPopup();
    }
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
        duration: 0.5
      });
    }
  }

  ngOnDestroy(): void {
    // Nettoyer les subscriptions
    if (this.pointsSubscription) {
      this.pointsSubscription.unsubscribe();
    }
    if (this.selectedPointSubscription) {
      this.selectedPointSubscription.unsubscribe();
    }

    // Nettoyer les markers
    this.markers.forEach(marker => {
      if (this.map) {
        this.map.removeLayer(marker);
      }
    });
    this.markers.clear();

    // Nettoyer la map
    if (this.map && typeof this.map.remove === 'function') {
      this.map.remove();
      this.map = null;
    }
  }
}
