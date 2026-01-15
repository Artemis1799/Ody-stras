import { Component, EventEmitter, Output, Input, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PointService } from '../../services/PointService';
import { PictureService } from '../../services/PictureService';
import { AreaService } from '../../services/AreaService';
import { PathService } from '../../services/PathService';
import { EquipmentService } from '../../services/EquipmentService';
import { SecurityZoneService } from '../../services/SecurityZoneService';
import { TeamService } from '../../services/TeamService';
import { TeamEmployeeService } from '../../services/TeamEmployeeService';
import { EmployeeService } from '../../services/EmployeeService';
import { Event } from '../../models/eventModel';
import { Point } from '../../models/pointModel';
import { Area } from '../../models/areaModel';
import { RoutePath } from '../../models/routePathModel';
import { SecurityZone } from '../../models/securityZoneModel';
import { forkJoin, Subscription } from 'rxjs';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { ButtonModule } from 'primeng/button';
import { WS_URL } from '../constants/wsUrl';

@Component({
  selector: 'app-export-popup',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './export-popup.html',
  styleUrls: ['./export-popup.scss'],
})
export class ExportPopup implements OnInit, OnDestroy {
  @Input() event!: Event;
  @Output() close = new EventEmitter<void>();
  
  private pointService = inject(PointService);
  private pictureService = inject(PictureService);
  private areaService = inject(AreaService);
  private pathService = inject(PathService);
  private equipmentService = inject(EquipmentService);
  private securityZoneService = inject(SecurityZoneService);
  private teamService = inject(TeamService);
  private teamEmployeeService = inject(TeamEmployeeService);
  private employeeService = inject(EmployeeService);

  // WebSocket export properties
  showQRCode = false;
  qrCodeDataURL = '';
  exportStatus = '';
  isExporting = false;
  private ws: WebSocket | null = null;
  private wsSubscription?: Subscription;

  ngOnInit(): void {
    // Initialisation si nécessaire
  }

  ngOnDestroy(): void {
    this.disconnectWebSocket();
  }

  /**
   * Exporte les données complètes de l'événement via WebSocket avec QR Code
   */
  async exportViaQRCode(): Promise<void> {
    this.isExporting = true;
    this.showQRCode = true;
    this.exportStatus = '📱 Scannez le QR code avec votre téléphone...';

    try {
      // Générer le QR code avec l'URL du serveur WebSocket
      this.qrCodeDataURL = await QRCode.toDataURL(WS_URL, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Connexion au WebSocket et attente du téléphone
      this.connectAndWaitForPhone();

    } catch (error) {
      console.error('❌ Erreur génération QR code:', error);
      this.exportStatus = '❌ Erreur lors de la génération du QR code';
      this.isExporting = false;
    }
  }

  /**
   * Connecte au WebSocket et attend qu'un téléphone se connecte
   */
  private connectAndWaitForPhone(): void {
    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      // S'enregistrer comme client web en attente
      this.ws?.send(JSON.stringify({ type: 'web_waiting', eventUuid: this.event.uuid }));
      this.exportStatus = '📱 Scannez le QR code avec votre téléphone...';
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        // Un téléphone demande les données
        if (message.type === 'phone_requesting') {
          this.exportStatus = '🔄 Téléphone détecté ! Récupération des données...';
          
          // Maintenant on récupère et envoie les données
          this.fetchAndSendData();
        }
        // Confirmation que les données ont été envoyées
        else if (message.type === 'export_confirmed') {
          this.exportStatus = `✅ ${message.summary.points} points envoyés au téléphone !`;
          
          setTimeout(() => {
            this.isExporting = false;
            this.showQRCode = false;
          }, 3000);
        }
      } catch (error) {
        console.error('Erreur parsing message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('❌ Erreur WebSocket:', error);
      this.exportStatus = '❌ Erreur de connexion au serveur';
      this.isExporting = false;
    };

    this.ws.onclose = () => {
      this.ws = null;
    };

    // Timeout après 2 minutes
    setTimeout(() => {
      if (this.isExporting) {
        this.exportStatus = '⏱️ Délai d\'attente dépassé';
        this.isExporting = false;
        this.disconnectWebSocket();
      }
    }, 120000);
  }

  /**
   * Récupère les données et les envoie au serveur pour transmission au téléphone
   * Note: On envoie l'événement, les areas, paths et équipements, PAS les points ni les photos
   * Les points seront créés/modifiés sur le mobile puis renvoyés au PC
   */
  private fetchAndSendData(): void {
    // Récupérer les areas, paths et équipements de cet événement
    forkJoin({
      areas: this.areaService.getByEventId(this.event.uuid),
      paths: this.pathService.getByEventId(this.event.uuid),
      equipments: this.equipmentService.getAll()
    }).subscribe({
      next: ({ areas, paths, equipments }) => {
        this.exportStatus = '📤 Envoi des données au téléphone...';

        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
          console.error('❌ WebSocket non connecté');
          return;
        }

        // On envoie l'événement, les areas, paths et équipements
        // Les points ne sont PAS envoyés - ils seront créés sur le mobile
        const message = {
          type: 'event_export',
          event: this.event,
          points: [], // Pas de points envoyés
          areas: areas,
          paths: paths,
          equipments: equipments,
          metadata: {
            exportDate: new Date().toISOString(),
            totalAreas: areas.length,
            totalPaths: paths.length,
            totalEquipments: equipments.length,
            note: 'Export sans points - les points seront créés sur le mobile'
          }
        };
        this.ws.send(JSON.stringify(message));
      },
      error: (error) => {
        console.error('❌ Erreur récupération données:', error);
        this.exportStatus = '❌ Erreur lors de la récupération des données';
        this.isExporting = false;
      }
    });
  }

  /**
   * Déconnecte le WebSocket
   */
  private disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Ferme la popup d'export QR Code
   */
  closeQRCodeExport(): void {
    this.showQRCode = false;
    this.isExporting = false;
    this.disconnectWebSocket();
  }

  /**
   * Annule l'export mobile et revient à la vue principale
   */
  cancelExport(): void {
    this.showQRCode = false;
    this.qrCodeDataURL = '';
    this.exportStatus = '';
    this.isExporting = false;
    this.disconnectWebSocket();
  }

  exportExcel(): void {
    forkJoin({
      points: this.pointService.getByEventId(this.event.uuid),
      equipments: this.equipmentService.getAll(),
      paths: this.pathService.getByEventId(this.event.uuid),
      areas: this.areaService.getByEventId(this.event.uuid),
      securityZones: this.securityZoneService.getByEventId(this.event.uuid)
    }).subscribe(({ points, equipments, paths, areas, securityZones }) => {
      const wb = XLSX.utils.book_new();

      // Calculer la quantité totale de chaque équipement depuis les zones de sécurité
      const equipmentQuantities = new Map<string, number>();
      
      securityZones.forEach(zone => {
        if (zone.equipmentId) {
          const count = equipmentQuantities.get(zone.equipmentId) || 0;
          equipmentQuantities.set(zone.equipmentId, count + zone.quantity);
        }
      });

      // Feuille 1: Équipements
      const equipmentsData = equipments.map(equip => ({
        'Type': equip.type ?? '',
        'Description': equip.description ?? '',
        'Quantité': equipmentQuantities.get(equip.uuid) || 0
      }));
      const wsEquipments = XLSX.utils.json_to_sheet(equipmentsData);
      XLSX.utils.book_append_sheet(wb, wsEquipments, 'Équipements');

      // Feuille 2: Points
      const pointsData = points.map(point => ({
        'Nom': point.name ?? '',
        'Latitude': point.latitude ?? '',
        'Longitude': point.longitude ?? '',
        'Commentaire': point.comment ?? '',
        'Ordre': point.order ?? 0,
        'Validé': point.validated ? 'Oui' : 'Non',
        'Point d\'intérêt': point.isPointOfInterest ? 'Oui' : 'Non'
      }));
      const wsPoints = XLSX.utils.json_to_sheet(pointsData);
      XLSX.utils.book_append_sheet(wb, wsPoints, 'Points');

      // Feuille 3: Chemins (Paths)
      const pathsData = paths.map(path => ({
        'Nom': path.name ?? '',
        'Description': path.description ?? '',
        'Couleur': path.colorHex ?? ''
      }));
      const wsPaths = XLSX.utils.json_to_sheet(pathsData);
      XLSX.utils.book_append_sheet(wb, wsPaths, 'Chemins');

      // Feuille 4: Zones (Areas)
      const areasData = areas.map(area => ({
        'Nom': area.name ?? '',
        'Description': area.description ?? '',
        'Couleur': area.colorHex ?? ''
      }));
      const wsAreas = XLSX.utils.json_to_sheet(areasData);
      XLSX.utils.book_append_sheet(wb, wsAreas, 'Zones');

      // Télécharger
      XLSX.writeFile(wb, `${this.event.title || 'Export'}.xlsx`);
    });
  }

  /**
   * Génère une mini-carte pour une zone de sécurité spécifique
   */
  private async generateSecurityZoneMapImage(zone: SecurityZone): Promise<string | null> {
    return new Promise((resolve) => {
      const allCoords: [number, number][] = [];
      
      // Parser le geoJson de la zone
      const geoJson = typeof zone.geoJson === 'string' ? JSON.parse(zone.geoJson) : zone.geoJson;
      this.extractGeometryCoords(geoJson, allCoords);

      if (allCoords.length === 0) {
        resolve(null);
        return;
      }

      // Calculer le centre et les bounds
      const lats = allCoords.map(c => c[0]);
      const lngs = allCoords.map(c => c[1]);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;

      // Calculer le zoom approprié (plus zoomé pour une zone individuelle)
      const latDiff = maxLat - minLat;
      const lngDiff = maxLng - minLng;
      const maxDiff = Math.max(latDiff, lngDiff);
      
      let zoom = 17;
      if (maxDiff > 0.01) zoom = 15;
      else if (maxDiff > 0.005) zoom = 16;
      else if (maxDiff > 0.002) zoom = 17;
      else zoom = 18;

      // Créer un canvas plus petit pour la mini-carte
      const canvas = document.createElement('canvas');
      const width = 300;
      const height = 150;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(null);
        return;
      }

      this.loadMapTiles(ctx, canvas, centerLat, centerLng, zoom, width, height).then(() => {
        // Dessiner la zone en orange pour la mettre en évidence
        ctx.strokeStyle = '#ff6b35';
        ctx.fillStyle = 'rgba(255, 107, 53, 0.3)';
        ctx.lineWidth = 3;
        
        this.drawGeometryOnCanvas(ctx, geoJson, centerLat, centerLng, zoom, width, height);

        // Ajouter un marqueur au centre
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 8, 0, 2 * Math.PI);
        ctx.fillStyle = '#ff6b35';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        resolve(canvas.toDataURL('image/png'));
      }).catch(() => {
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#999';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Carte non disponible', width / 2, height / 2);
        resolve(canvas.toDataURL('image/png'));
      });
    });
  }

  /**
   * Génère une image de carte avec les points, areas et paths
   */
  private async generateMapImage(points: Point[], areas: Area[], paths: RoutePath[]): Promise<string | null> {
    return new Promise((resolve) => {
      // Calculer les bounds pour centrer la carte
      const allCoords: [number, number][] = [];
      
      // Ajouter les coordonnées des points
      points.forEach(p => {
        if (p.latitude && p.longitude) {
          allCoords.push([p.latitude, p.longitude]);
        }
      });

      // Ajouter les coordonnées des areas
      areas.forEach(a => {
        const geoJson = typeof a.geoJson === 'string' ? JSON.parse(a.geoJson) : a.geoJson;
        this.extractGeometryCoords(geoJson, allCoords);
      });

      // Ajouter les coordonnées des paths
      paths.forEach(p => {
        const geoJson = typeof p.geoJson === 'string' ? JSON.parse(p.geoJson) : p.geoJson;
        this.extractGeometryCoords(geoJson, allCoords);
      });

      if (allCoords.length === 0) {
        resolve(null);
        return;
      }

      // Calculer le centre et les bounds
      const lats = allCoords.map(c => c[0]);
      const lngs = allCoords.map(c => c[1]);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;

      // Calculer le zoom approprié
      const latDiff = maxLat - minLat;
      const lngDiff = maxLng - minLng;
      const maxDiff = Math.max(latDiff, lngDiff);
      
      let zoom = 15;
      if (maxDiff > 0.5) zoom = 10;
      else if (maxDiff > 0.2) zoom = 11;
      else if (maxDiff > 0.1) zoom = 12;
      else if (maxDiff > 0.05) zoom = 13;
      else if (maxDiff > 0.02) zoom = 14;
      else if (maxDiff > 0.01) zoom = 15;
      else zoom = 16;

      // Créer un canvas pour dessiner la carte
      const canvas = document.createElement('canvas');
      const width = 800;
      const height = 400;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(null);
        return;
      }

      // Charger la tuile de fond OpenStreetMap
      //const tileUrl = `https://tile.openstreetmap.org/${zoom}/${this.lonToTileX(centerLng, zoom)}/${this.latToTileY(centerLat, zoom)}.png`;
      
      // Créer l'image de fond avec plusieurs tuiles
      this.loadMapTiles(ctx, canvas, centerLat, centerLng, zoom, width, height).then(() => {
        // Dessiner les areas (polygones) en bleu
        ctx.strokeStyle = '#3388ff';
        ctx.fillStyle = 'rgba(51, 136, 255, 0.2)';
        ctx.lineWidth = 3;

        areas.forEach(a => {
          const geoJson = typeof a.geoJson === 'string' ? JSON.parse(a.geoJson) : a.geoJson;
          this.drawGeometryOnCanvas(ctx, geoJson, centerLat, centerLng, zoom, width, height);
        });

        // Dessiner les paths (polylignes) en rouge
        ctx.strokeStyle = '#a91a1a';
        ctx.lineWidth = 4;

        paths.forEach(p => {
          const geoJson = typeof p.geoJson === 'string' ? JSON.parse(p.geoJson) : p.geoJson;
          this.drawGeometryOnCanvas(ctx, geoJson, centerLat, centerLng, zoom, width, height);
        });

        // Dessiner les points
        points.forEach((p, index) => {
          if (p.latitude && p.longitude) {
            const pos = this.latLngToPixel(p.latitude, p.longitude, centerLat, centerLng, zoom, width, height);
            
            // Cercle extérieur
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 12, 0, 2 * Math.PI);
            ctx.fillStyle = p.validated ? '#2ad783' : '#f87171';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Numéro du point
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(p.order || index + 1), pos.x, pos.y);
          }
        });

        resolve(canvas.toDataURL('image/png'));
      }).catch(() => {
        // En cas d'erreur de chargement des tuiles, dessiner un fond gris
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#666';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Carte non disponible', width / 2, height / 2);
        resolve(canvas.toDataURL('image/png'));
      });
    });
  }

  /**
   * Charge les tuiles de carte OpenStreetMap
   */
  private async loadMapTiles(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, centerLat: number, centerLng: number, zoom: number, width: number, height: number): Promise<void> {
    const tileSize = 256;
    const centerTileX = this.lonToTileX(centerLng, zoom);
    const centerTileY = this.latToTileY(centerLat, zoom);
    
    // Calculer le nombre de tuiles nécessaires
    const tilesX = Math.ceil(width / tileSize) + 1;
    const tilesY = Math.ceil(height / tileSize) + 1;
    
    const startTileX = Math.floor(centerTileX - tilesX / 2);
    const startTileY = Math.floor(centerTileY - tilesY / 2);

    const promises: Promise<void>[] = [];

    for (let tx = 0; tx < tilesX; tx++) {
      for (let ty = 0; ty < tilesY; ty++) {
        const tileX = startTileX + tx;
        const tileY = startTileY + ty + 1; // Tuile normale
        
        const url = `https://tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`;
        
        // Position de la tuile sur le canvas (décalée vers l'ouest et le nord)
        const offsetX = (tileX - centerTileX) * tileSize + width / 2 - 60; 
        const offsetY = (tileY - centerTileY - 1) * tileSize + height / 2 + 105; 

        promises.push(
          new Promise<void>((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              ctx.drawImage(img, offsetX, offsetY, tileSize, tileSize);
              resolve();
            };
            img.onerror = () => resolve(); // Ignorer les erreurs de tuiles individuelles
            img.src = url;
          })
        );
      }
    }

    await Promise.all(promises);
  }

  /**
   * Extrait les coordonnées d'une géométrie GeoJSON
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractGeometryCoords(geoJson: any, coords: [number, number][]): void {
    if (!geoJson) return;
    if (geoJson.type === 'Point') {
      const c = geoJson.coordinates as [number, number];
      coords.push([c[1], c[0]]); // GeoJSON est [lng, lat]
    } else if (geoJson.type === 'LineString') {
      const lineCoords = geoJson.coordinates as [number, number][];
      lineCoords.forEach(c => coords.push([c[1], c[0]]));
    } else if (geoJson.type === 'Polygon') {
      const polyCoords = geoJson.coordinates as [number, number][][];
      polyCoords.forEach(ring => ring.forEach(c => coords.push([c[1], c[0]])));
    }
  }

  /**
   * Dessine une géométrie sur le canvas
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private drawGeometryOnCanvas(ctx: CanvasRenderingContext2D, geoJson: any, centerLat: number, centerLng: number, zoom: number, width: number, height: number): void {
    if (!geoJson) return;

    if (geoJson.type === 'LineString') {
      const coords = geoJson.coordinates as [number, number][];
      if (coords.length > 0) {
        ctx.beginPath();
        const first = this.latLngToPixel(coords[0][1], coords[0][0], centerLat, centerLng, zoom, width, height);
        ctx.moveTo(first.x, first.y);
        coords.slice(1).forEach(c => {
          const pos = this.latLngToPixel(c[1], c[0], centerLat, centerLng, zoom, width, height);
          ctx.lineTo(pos.x, pos.y);
        });
        ctx.stroke();
      }
    } else if (geoJson.type === 'Polygon') {
      const rings = geoJson.coordinates as [number, number][][];
      if (rings.length > 0 && rings[0].length > 0) {
        ctx.beginPath();
        const first = this.latLngToPixel(rings[0][0][1], rings[0][0][0], centerLat, centerLng, zoom, width, height);
        ctx.moveTo(first.x, first.y);
        rings[0].slice(1).forEach(c => {
          const pos = this.latLngToPixel(c[1], c[0], centerLat, centerLng, zoom, width, height);
          ctx.lineTo(pos.x, pos.y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
  }

  /**
   * Convertit longitude en position X de tuile
   */
  private lonToTileX(lon: number, zoom: number): number {
    return Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
  }

  /**
   * Convertit latitude en position Y de tuile
   */
  private latToTileY(lat: number, zoom: number): number {
    return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  }

  /**
   * Convertit lat/lng en position pixel sur le canvas
   */
  private latLngToPixel(lat: number, lng: number, centerLat: number, centerLng: number, zoom: number, width: number, height: number): { x: number; y: number } {
    const scale = Math.pow(2, zoom) * 256;
    
    // Conversion Mercator
    const worldX = (lng + 180) / 360 * scale;
    const worldY = (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * scale;
    
    const centerWorldX = (centerLng + 180) / 360 * scale;
    const centerWorldY = (1 - Math.log(Math.tan(centerLat * Math.PI / 180) + 1 / Math.cos(centerLat * Math.PI / 180)) / Math.PI) / 2 * scale;
    
    return {
      x: width / 2 + (worldX - centerWorldX),
      y: height / 2 + (worldY - centerWorldY)
    };
  }

  exportPDF(): void {
    forkJoin({
      points: this.pointService.getByEventId(this.event.uuid),
      areas: this.areaService.getByEventId(this.event.uuid),
      paths: this.pathService.getByEventId(this.event.uuid),
      securityZones: this.securityZoneService.getByEventId(this.event.uuid),
      equipments: this.equipmentService.getAll(),
      teams: this.teamService.getAll(),
      teamEmployees: this.teamEmployeeService.getAll(),
      employees: this.employeeService.getAll()
    }).subscribe(async ({ points, areas, paths, securityZones, equipments, teams, teamEmployees, employees }) => {
      console.log('🔍 Équipements récupérés pour le PDF:', equipments);
      console.log('📊 Nombre d\'équipements:', equipments.length);
      const doc = new jsPDF();
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;
      const margin = 15;
      let yPosition = 25;
      const eventTitle = this.event.title || 'Export';
      
      // En-tête du document avec fond coloré
      doc.setFillColor(41, 128, 185);
      doc.rect(0, 0, pageWidth, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text(eventTitle, pageWidth / 2, 15, { align: 'center' });
      doc.setFontSize(12);
      doc.text('Rapport complet de l\'événement', pageWidth / 2, 25, { align: 'center' });
      
      yPosition = 45;
      doc.setTextColor(0, 0, 0);

      // Fonction helper pour ajouter un titre de section
      const addSectionTitle = (title: string) => {
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 25;
        }
        doc.setFillColor(52, 73, 94);
        doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(title, margin + 3, yPosition + 2);
        yPosition += 12;
        doc.setTextColor(0, 0, 0);
      };

      // === 1. CARTE RÉCAPITULATIVE ===
      if (points.length > 0 || areas.length > 0 || paths.length > 0) {
        try {
          const mapImageData = await this.generateMapImage(points, areas, paths);
          if (mapImageData) {
            addSectionTitle('Carte récapitulative');
            const mapWidth = pageWidth - 2 * margin;
            const mapHeight = 100;
            doc.addImage(mapImageData, 'PNG', margin, yPosition, mapWidth, mapHeight);
            yPosition += mapHeight + 5;
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text(`${securityZones.length} zone(s) • ${paths.length} chemin(s) • ${points.length} point(s)`, margin, yPosition);
            doc.setTextColor(0, 0, 0);
            yPosition += 15;
          }
        } catch (error) {
          console.error('Erreur lors de la génération de la carte:', error);
        }
      }

      // === 2. ÉQUIPE(S) PRÉSENTE(S) ===
      const allTeams = teams.filter(t => t.eventId === this.event.uuid);
      if (allTeams.length > 0) {
        addSectionTitle(`Équipe(s) présente(s) (${allTeams.length})`);
        allTeams.forEach((team, index) => {
          // Calculer la hauteur nécessaire pour cette équipe
          const teamMemberIds = teamEmployees.filter(te => te.teamId === team.uuid).map(te => te.employeeId);
          const teamMembers = employees.filter(emp => teamMemberIds.includes(emp.uuid));
          const estimatedHeight = 35 + (teamMembers.length * 5);
          
          if (yPosition > pageHeight - estimatedHeight) {
            doc.addPage();
            yPosition = 25;
          }
          
          // Cadre de l'équipe
          doc.setDrawColor(220, 220, 220);
          doc.setFillColor(248, 250, 252);
          doc.roundedRect(margin, yPosition - 3, pageWidth - 2 * margin, estimatedHeight, 3, 3, 'FD');
          
          // Pastille violette (sans numéro)
          doc.setFillColor(138, 43, 226);
          doc.circle(margin + 12, yPosition + 7, 5, 'F');
          
          // Nom de l'équipe
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(50, 50, 50);
          doc.text(`${team.teamName}`, margin + 22, yPosition + 10);
          
          // Membres
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 100, 100);
          
          if (teamMembers.length > 0) {
            let memberY = yPosition + 20;
            teamMembers.forEach((member, mIndex) => {
              doc.setFillColor(230, 230, 230);
              doc.circle(margin + 12, memberY, 2, 'F');
              doc.text(`${member.firstName} ${member.lastName}`, margin + 18, memberY + 1);
              memberY += 5;
            });
          } else {
            doc.setTextColor(180, 180, 180);
            doc.text('Aucun membre assigné', margin + 25, yPosition + 20);
          }
          
          yPosition += estimatedHeight + 5;
          doc.setTextColor(0, 0, 0);
        });
        yPosition += 5;
      }

      // === 4. ZONES DE SÉCURITÉ ===
      if (securityZones.length > 0) {
        addSectionTitle(`Emplacement(s) à sécuriser (${securityZones.length})`);
        
        const colWidth = (pageWidth - 2 * margin - 5) / 2; // Largeur d'une colonne avec 5px d'espacement
        const textWidthCol = colWidth - 20;
        
        // Pré-calculer les hauteurs pour chaque zone
        const zoneHeights: number[] = [];
        securityZones.forEach((zone) => {
          doc.setFontSize(7);
          const commentLines = zone.comment ? doc.splitTextToSize(zone.comment, textWidthCol) : [];
          const baseHeight = 35; // Hauteur de base pour titre + équipement
          const commentHeight = commentLines.length * 3.5;
          zoneHeights.push(Math.max(45, baseHeight + commentHeight));
        });
        
        for (let index = 0; index < securityZones.length; index++) {
          const zone = securityZones[index];
          const isLeftColumn = index % 2 === 0;
          
          // Calculer la hauteur de ligne (max des 2 colonnes)
          const pairIndex = Math.floor(index / 2) * 2;
          const leftHeight = zoneHeights[pairIndex] || 45;
          const rightHeight = zoneHeights[pairIndex + 1] || 45;
          const rowHeight = Math.max(leftHeight, rightHeight);
          
          // Nouvelle ligne toutes les 2 zones
          if (isLeftColumn) {
            if (yPosition > pageHeight - rowHeight - 10) {
              doc.addPage();
              yPosition = 25;
            }
          }
          
          // Position X selon la colonne
          const cardX = isLeftColumn ? margin : margin + colWidth + 5;
          
          // Trouver l'équipement lié
          const equipment = equipments.find(e => e.uuid === zone.equipmentId);
          
          // Dessiner un cadre léger pour la zone
          doc.setDrawColor(200, 200, 200);
          doc.setFillColor(250, 250, 250);
          doc.roundedRect(cardX, yPosition - 3, colWidth, rowHeight, 3, 3, 'FD');
          
          // Pastille colorée (sans numéro)
          doc.setFillColor(255, 107, 53);
          doc.circle(cardX + 8, yPosition + 4, 4, 'F');
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(50, 50, 50);
          doc.text(`Zone ${index + 1}`, cardX + 15, yPosition + 6);
          
          // Informations
          const infoX = cardX + 8;
          let infoY = yPosition + 14;
          
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(80, 80, 80);
          
          if (equipment) {
            doc.setFont('helvetica', 'bold');
            const typeText = doc.splitTextToSize(equipment.type || 'N/A', textWidthCol);
            doc.text(typeText[0], infoX, infoY);
            infoY += 5;
            doc.setFont('helvetica', 'normal');
            doc.text(`Qté: ${zone.quantity} | Long: ${equipment.length || 'N/A'}m`, infoX, infoY);
            infoY += 5;
          } else {
            doc.text(`Équipement: Non trouvé`, infoX, infoY);
            infoY += 5;
          }
          
          if (zone.comment) {
            doc.setFontSize(7);
            doc.setTextColor(120, 120, 120);
            const commentLines = doc.splitTextToSize(zone.comment, textWidthCol);
            doc.text(commentLines, infoX, infoY);
          }
          
          // Avancer à la ligne suivante après 2 zones
          if (!isLeftColumn || index === securityZones.length - 1) {
            yPosition += rowHeight + 5;
          }
          
          doc.setTextColor(0, 0, 0);
        }
        yPosition += 5;
      }

      // === 5. POINTS NORMAUX ===
      const normalPoints = points.filter(p => !p.isPointOfInterest);
      if (normalPoints.length > 0) {
        addSectionTitle(`Points (${normalPoints.length})`);
        
        const colWidth = (pageWidth - 2 * margin - 5) / 2;
        const textWidth = colWidth - 20;
        
        // Pré-calculer les hauteurs pour chaque point
        const pointHeights: number[] = [];
        normalPoints.forEach((point) => {
          doc.setFontSize(9);
          const pointName = point.name || `Point`;
          const nameLines = doc.splitTextToSize(pointName, textWidth);
          doc.setFontSize(7);
          const commentLines = point.comment ? doc.splitTextToSize(point.comment, textWidth) : [];
          const baseHeight = 20;
          const nameHeight = nameLines.length * 4;
          const commentHeight = commentLines.length * 3.5;
          pointHeights.push(Math.max(30, baseHeight + nameHeight + commentHeight));
        });
        
        for (let index = 0; index < normalPoints.length; index++) {
          const point = normalPoints[index];
          const isLeftColumn = index % 2 === 0;
          
          // Calculer la hauteur de ligne (max des 2 colonnes)
          const pairIndex = Math.floor(index / 2) * 2;
          const leftHeight = pointHeights[pairIndex] || 30;
          const rightHeight = pointHeights[pairIndex + 1] || 30;
          const rowHeight = Math.max(leftHeight, rightHeight);
          
          // Nouvelle ligne toutes les 2 points
          if (isLeftColumn) {
            if (yPosition > pageHeight - rowHeight - 10) {
              doc.addPage();
              yPosition = 25;
            }
          }
          
          // Position X selon la colonne
          const cardX = isLeftColumn ? margin : margin + colWidth + 5;
          
          // Cadre léger pour le point
          doc.setDrawColor(230, 230, 230);
          if (point.validated) {
            doc.setFillColor(245, 255, 250);
          } else {
            doc.setFillColor(255, 252, 245);
          }
          doc.roundedRect(cardX, yPosition - 3, colWidth, rowHeight, 2, 2, 'FD');
          
          // Pastille colorée (sans numéro)
          if (point.validated) {
            doc.setFillColor(46, 204, 113);
          } else {
            doc.setFillColor(241, 135, 135);
          }
          doc.circle(cardX + 8, yPosition + 5, 5, 'F');
          
          // Nom du point (multi-lignes)
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(50, 50, 50);
          const pointName = point.name || `Point #${point.order || index + 1}`;
          const nameLines = doc.splitTextToSize(pointName, textWidth);
          doc.text(nameLines, cardX + 16, yPosition + 6);
          
          // Badge validé
          if (point.validated) {
            doc.setFillColor(46, 204, 113);
            doc.roundedRect(cardX + colWidth - 22, yPosition, 18, 5, 1, 1, 'F');
            doc.setFontSize(5);
            doc.setTextColor(255, 255, 255);
            doc.text('VALIDÉ', cardX + colWidth - 13, yPosition + 3.5, { align: 'center' });
          }

          // Commentaire (multi-lignes)
          if (point.comment) {
            doc.setFontSize(7);
            doc.setTextColor(100, 100, 100);
            const commentLines = doc.splitTextToSize(point.comment, textWidth);
            doc.text(commentLines, cardX + 16, yPosition + 6 + (nameLines.length * 4) + 4);
          }
          
          // Avancer à la ligne suivante après 2 points
          if (!isLeftColumn || index === normalPoints.length - 1) {
            yPosition += rowHeight + 5;
          }
          
          doc.setTextColor(0, 0, 0);
        }
        yPosition += 5;
      }

      // === 6. POINTS D'ATTENTION ===
      const attentionPoints = points.filter(p => p.isPointOfInterest);
      if (attentionPoints.length > 0) {
        addSectionTitle(`Points d'attention (${attentionPoints.length})`);
        
        const textWidthAttention = pageWidth - 2 * margin - 25;
        
        for (let index = 0; index < attentionPoints.length; index++) {
          const point = attentionPoints[index];
          
          // Calculer la hauteur dynamique
          doc.setFontSize(9);
          const attentionName = point.name || `Point d'attention #${index + 1}`;
          const nameLines = doc.splitTextToSize(attentionName, textWidthAttention - 20);
          doc.setFontSize(7);
          const commentLines = point.comment ? doc.splitTextToSize(point.comment, textWidthAttention) : [];
          const cardHeight = 15 + (nameLines.length * 4) + (commentLines.length * 3.5);
          
          if (yPosition > pageHeight - cardHeight - 10) {
            doc.addPage();
            yPosition = 25;
          }
          
          const cardX = margin;
          
          // Cadre avec bordure gauche orange (pleine largeur)
          doc.setDrawColor(255, 193, 7);
          doc.setFillColor(255, 251, 235);
          doc.roundedRect(cardX, yPosition - 3, pageWidth - 2 * margin, cardHeight, 2, 2, 'FD');
          doc.setFillColor(255, 193, 7);
          doc.rect(cardX, yPosition - 3, 3, cardHeight, 'F');
          
          // Pastille orange (sans numéro)
          doc.setFillColor(255, 193, 7);
          doc.circle(cardX + 12, yPosition + 5, 5, 'F');
          
          // Nom du point (multi-lignes)
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(50, 50, 50);
          doc.text(nameLines, cardX + 20, yPosition + 6);
          
          // Commentaire (multi-lignes)
          if (commentLines.length > 0) {
            doc.setFontSize(7);
            doc.setTextColor(100, 100, 100);
            doc.text(commentLines, cardX + 20, yPosition + 6 + (nameLines.length * 4) + 4);
          }
          
          yPosition += cardHeight + 5;
          doc.setTextColor(0, 0, 0);
        }
      }

      // === 7. ZONES (AREAS) AVEC COMMENTAIRES ===
      const areasWithComments = areas.filter(a => a.description && a.description.trim().length > 0);
      if (areasWithComments.length > 0) {
        addSectionTitle(`Zones (${areasWithComments.length})`);
        
        const textWidthZone = pageWidth - 2 * margin - 25;
        
        for (let index = 0; index < areasWithComments.length; index++) {
          const area = areasWithComments[index];
          
          // Calculer la hauteur dynamique
          doc.setFontSize(9);
          const areaName = area.name || `Zone #${index + 1}`;
          const nameLines = doc.splitTextToSize(areaName, textWidthZone);
          doc.setFontSize(7);
          const descLines = doc.splitTextToSize(area.description!, textWidthZone);
          const cardHeight = 15 + (nameLines.length * 4) + (descLines.length * 3.5);
          
          if (yPosition > pageHeight - cardHeight - 10) {
            doc.addPage();
            yPosition = 25;
          }
          
          const cardX = margin;
          
          // Cadre avec couleur de la zone (pleine largeur)
          doc.setDrawColor(200, 200, 200);
          doc.setFillColor(250, 250, 255);
          doc.roundedRect(cardX, yPosition - 3, pageWidth - 2 * margin, cardHeight, 2, 2, 'FD');
          
          // Pastille couleur de la zone
          const hexColor = area.colorHex || '#3498db';
          const r = parseInt(hexColor.slice(1, 3), 16);
          const g = parseInt(hexColor.slice(3, 5), 16);
          const b = parseInt(hexColor.slice(5, 7), 16);
          doc.setFillColor(r, g, b);
          doc.circle(cardX + 10, yPosition + 5, 5, 'F');
          
          // Nom de la zone (multi-lignes)
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(50, 50, 50);
          doc.text(nameLines, cardX + 18, yPosition + 6);
          
          // Description/commentaire (multi-lignes)
          doc.setFontSize(7);
          doc.setTextColor(100, 100, 100);
          doc.text(descLines, cardX + 18, yPosition + 6 + (nameLines.length * 4) + 4);
          
          yPosition += cardHeight + 5;
          doc.setTextColor(0, 0, 0);
        }
      }
      
      // Pied de page sur toutes les pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(127, 140, 141);
        doc.text(`Page ${i} / ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
      
      doc.save(`${eventTitle}.pdf`);
    });
  }
}
