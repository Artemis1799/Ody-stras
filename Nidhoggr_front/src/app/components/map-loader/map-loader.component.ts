import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { PointsSidebarComponent } from '../points-sidebar/points-sidebar.component';
import { MapService } from '../../../service/MapService';
import { Point } from '../../../classe/pointModel';

@Component({
  selector: 'app-map-loader',
  standalone: true,
  imports: [PointsSidebarComponent],
  templateUrl: './map-loader.component.html',
  styleUrls: ['./map-loader.component.scss']
})
export class MapLoaderComponent implements AfterViewInit, OnDestroy {
  private map: any | null = null;
  private markers: Map<string, any> = new Map();
  private pointsSubscription: any;
  private selectedPointSubscription: any;

  constructor(private mapService: MapService) {}

  ngAfterViewInit(): void {
    try {
      if (typeof window === 'undefined') { return; }
      const L: any = (window as any).L;
      const center: [number, number] = [48.5846, 7.7507];
      
      // Nettoyer l'ancienne instance si elle existe
      if (this.map && typeof this.map.remove === 'function') {
        this.map.remove();
        this.map = null;
      }
      
      this.map = L.map('map', { center, zoom: 12 });
      
      // Partager l'instance de map avec le service
      this.mapService.setMapInstance(this.map);

      const probe = async (template: string) => {
        try {
          const test = template.replace('{z}', '12').replace('{x}', '2048').replace('{y}', '1365');
          const r = await fetch(test, { method: 'HEAD' });
          return r.ok;
        } catch (err) {
          return false;
        }
      };

      const defaultTemplate = '/assets/tiles/tiles/{z}/{x}/{y}.png';
      const saved = localStorage.getItem('tileUrlTemplate');
      let chosen: string | null = null;
      (async () => {
        if (saved && await probe(saved)) {
          chosen = saved;
        } else if (await probe(defaultTemplate)) {
          chosen = defaultTemplate;
        } else {
          chosen = defaultTemplate;
        }
        let tileLayer = L.tileLayer(chosen, { maxZoom: 20, attribution: '&copy; Local tiles' }).addTo(this.map);
        const input = document.getElementById('tileUrlInput') as HTMLInputElement | null;
        const btn = document.getElementById('tileTestBtn') as HTMLButtonElement | null;
        const status = document.getElementById('tileStatus') as HTMLElement | null;

        if (input) input.value = chosen || '';

        if (btn && input && status) {
          btn.onclick = async () => {
            const tpl = input.value.trim();
            if (!tpl) { status.textContent = 'Entrez un template d\'URL.'; return; }
            status.textContent = 'Test en cours...';
            const ok = await probe(tpl);
            if (ok) {
              try {
                if (typeof (tileLayer as any).setUrl === 'function') {
                  (tileLayer as any).setUrl(tpl);
                } else {
                  this.map.removeLayer(tileLayer);
                  tileLayer = L.tileLayer(tpl, { maxZoom: 20, attribution: '&copy; Local tiles' }).addTo(this.map);
                }
                localStorage.setItem('tileUrlTemplate', tpl);
                status.textContent = 'Template appliqué et sauvegardé.';
              } catch (err) {
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
        try { 
          this.map && this.map.invalidateSize && this.map.invalidateSize(); 
        } catch (e) {} 
      }, 200);
    } catch (e) {
      console.error('Failed to initialize Leaflet map', e);
    }
  }

  private updateMarkers(points: Point[]): void {
    if (!this.map || typeof window === 'undefined') return;
    const L: any = (window as any).L;

    // Supprimer les anciens markers
    this.markers.forEach(marker => {
      this.map.removeLayer(marker);
    });
    this.markers.clear();

    // Ajouter les nouveaux markers
    points.forEach((point, index) => {
      if (point.latitude && point.longitude) {
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

        // Popup avec informations
        const popupContent = `
          <div class="point-popup">
            <strong>${this.getPointDisplayName(point)}</strong><br>
            ${point.comment ? `<em>${point.comment}</em><br>` : ''}
            <small>Ordre: ${point.order || index + 1}</small><br>
            <small>Statut: ${point.isValid ? 'Valide ✓' : 'Invalide ✗'}</small>
          </div>
        `;
        marker.bindPopup(popupContent);

        // Clic sur le marker
        marker.on('click', () => {
          this.mapService.selectPoint(point);
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
