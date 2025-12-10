import { Component, EventEmitter, Output, Input, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PointService } from '../../services/PointService';
import { PhotoService } from '../../services/PhotoService';
import { ImagePointService } from '../../services/ImagePointsService';
import { GeometryService } from '../../services/GeometryService';
import { EquipmentService } from '../../services/EquipmentService';
import { Event } from '../../models/eventModel';
import { Point } from '../../models/pointModel';
import { Geometry, GeoJSONGeometry } from '../../models/geometryModel';
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
  private photoService = inject(PhotoService);
  private imagePointService = inject(ImagePointService);
  private geometryService = inject(GeometryService);
  private equipmentService = inject(EquipmentService);

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
    console.log('🔌 Connexion au WebSocket:', WS_URL);
    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      console.log('✅ WebSocket connecté');
      // S'enregistrer comme client web en attente
      this.ws?.send(JSON.stringify({ type: 'web_waiting', eventUuid: this.event.uuid }));
      this.exportStatus = '📱 Scannez le QR code avec votre téléphone...';
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('📨 Message reçu:', message.type);

        // Un téléphone demande les données
        if (message.type === 'phone_requesting') {
          console.log('📱 Téléphone connecté, récupération des données...');
          this.exportStatus = '🔄 Téléphone détecté ! Récupération des données...';
          
          // Maintenant on récupère et envoie les données
          this.fetchAndSendData();
        }
        // Confirmation que les données ont été envoyées
        else if (message.type === 'export_confirmed') {
          console.log('✅ Export confirmé:', message);
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
      console.log('🔌 WebSocket déconnecté');
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
   * Note: On envoie l'événement, les géométries et les équipements, PAS les points ni les photos
   * Les points seront créés/modifiés sur le mobile puis renvoyés au PC
   */
  private fetchAndSendData(): void {
    // Récupérer les géométries de cet événement et les équipements
    forkJoin({
      geometries: this.geometryService.getByEventId(this.event.uuid),
      equipments: this.equipmentService.getAll()
    }).subscribe({
      next: ({ geometries, equipments }) => {
        console.log('✅ Données récupérées pour export vers mobile');
        console.log('   📋 Event:', this.event.name);
        console.log('   📐 Géométries:', geometries.length);
        console.log('   🔧 Équipements:', equipments.length);
        console.log('   ⚠️ Points exclus de l\'export (seront créés sur mobile)');
        
        this.exportStatus = '📤 Envoi des données au téléphone...';

        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
          console.error('❌ WebSocket non connecté');
          return;
        }

        // On envoie l'événement, les géométries et les équipements
        // Les points ne sont PAS envoyés - ils seront créés sur le mobile
        const message = {
          type: 'event_export',
          event: this.event,
          points: [], // Pas de points envoyés
          geometries: geometries,
          equipments: equipments,
          metadata: {
            exportDate: new Date().toISOString(),
            totalGeometries: geometries.length,
            totalEquipments: equipments.length,
            note: 'Export sans points - les points seront créés sur le mobile'
          }
        };

        console.log('📤 JSON envoyé au serveur WebSocket:', JSON.stringify(message, null, 2));

        this.ws.send(JSON.stringify(message));
        console.log('✅ Données envoyées au serveur (event + géométries + équipements)');
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
    this.pointService.getByEventId(this.event.uuid).subscribe(points => {
      // Prepare data for Excel
      const data = points.map(point => ({
        'Latitude': point.latitude ?? '',
        'Longitude': point.longitude ?? '',
        'Équipement': point.equipment?.type ?? point.equipment?.description ?? '',
        'Quantité': point.equipmentQuantity ?? 0,
        'Commentaire': point.comment ?? '',
        'Date création': point.created ? new Date(point.created).toLocaleString('fr-FR') : '',
      }));
      
      // Create worksheet and workbook
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Points');
      
      // Download
      XLSX.writeFile(wb, `${this.event.name || 'Export_Points'}.xlsx`);
    });
  }

  /**
   * Génère une image de carte avec les points et géométries
   */
  private async generateMapImage(points: Point[], geometries: Geometry[]): Promise<string | null> {
    return new Promise((resolve) => {
      // Calculer les bounds pour centrer la carte
      const allCoords: [number, number][] = [];
      
      // Ajouter les coordonnées des points
      points.forEach(p => {
        if (p.latitude && p.longitude) {
          allCoords.push([p.latitude, p.longitude]);
        }
      });

      // Ajouter les coordonnées des géométries
      geometries.forEach(g => {
        this.extractGeometryCoords(g.geoJson, allCoords);
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
      const tileUrl = `https://tile.openstreetmap.org/${zoom}/${this.lonToTileX(centerLng, zoom)}/${this.latToTileY(centerLat, zoom)}.png`;
      
      // Créer l'image de fond avec plusieurs tuiles
      this.loadMapTiles(ctx, canvas, centerLat, centerLng, zoom, width, height).then(() => {
        // Dessiner les géométries
        ctx.strokeStyle = '#2ad783';
        ctx.fillStyle = 'rgba(42, 215, 131, 0.2)';
        ctx.lineWidth = 3;

        geometries.forEach(g => {
          this.drawGeometryOnCanvas(ctx, g.geoJson, centerLat, centerLng, zoom, width, height);
        });

        // Dessiner les points
        points.forEach((p, index) => {
          if (p.latitude && p.longitude) {
            const pos = this.latLngToPixel(p.latitude, p.longitude, centerLat, centerLng, zoom, width, height);
            
            // Cercle extérieur
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 12, 0, 2 * Math.PI);
            ctx.fillStyle = p.isValid ? '#2ad783' : '#f87171';
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
        const tileY = startTileY + ty;
        
        const url = `https://tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`;
        
        // Position de la tuile sur le canvas
        const offsetX = (tileX - centerTileX) * tileSize + width / 2;
        const offsetY = (tileY - centerTileY) * tileSize + height / 2;

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
  private extractGeometryCoords(geoJson: GeoJSONGeometry, coords: [number, number][]): void {
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
  private drawGeometryOnCanvas(ctx: CanvasRenderingContext2D, geoJson: GeoJSONGeometry, centerLat: number, centerLng: number, zoom: number, width: number, height: number): void {
    ctx.strokeStyle = '#2ad783';
    ctx.fillStyle = 'rgba(42, 215, 131, 0.3)';
    ctx.lineWidth = 3;

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
      photos: this.photoService.getAll(),
      imagePoints: this.imagePointService.getAll(),
      geometries: this.geometryService.getByEventId(this.event.uuid)
    }).subscribe(async ({ points, photos, imagePoints, geometries }) => {
      const doc = new jsPDF();
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;
      const margin = 15;
      let yPosition = 25;
      const eventTitle = this.event.name || 'Export_Points';
      
      // En-tête du document avec fond coloré
      doc.setFillColor(41, 128, 185);
      doc.rect(0, 0, pageWidth, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text(eventTitle, pageWidth / 2, 15, { align: 'center' });
      doc.setFontSize(12);
      doc.text('Rapport d\'export des points', pageWidth / 2, 25, { align: 'center' });
      
      yPosition = 45;
      doc.setTextColor(0, 0, 0);

      // === CARTE RÉCAPITULATIVE ===
      if (points.length > 0 || geometries.length > 0) {
        try {
          const mapImageData = await this.generateMapImage(points, geometries);
          if (mapImageData) {
            // Titre de la section carte
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Carte récapitulative', margin, yPosition);
            yPosition += 8;

            // Dimensions de la carte (format paysage dans la page)
            const mapWidth = pageWidth - 2 * margin;
            const mapHeight = 100;

            doc.addImage(mapImageData, 'PNG', margin, yPosition, mapWidth, mapHeight);
            yPosition += mapHeight + 10;

            // Légende
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text(`${points.length} point(s) • ${geometries.length} géométrie(s)`, margin, yPosition);
            doc.setTextColor(0, 0, 0);
            yPosition += 15;
          }
        } catch (error) {
          console.error('Erreur lors de la génération de la carte:', error);
          // Continuer sans la carte en cas d'erreur
        }
      }
      
      points.forEach((point, index) => {
        // Vérifier si on a besoin d'une nouvelle page
        if (yPosition > pageHeight - 80) {
          doc.addPage();
          yPosition = 25;
        }
        
        // Titre du point avec fond gris
        doc.setFillColor(236, 240, 241);
        doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 10, 'F');
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Point #${point.order || index + 1}`, margin + 3, yPosition + 2);
        
        // Badge de validation
        const badgeX = pageWidth - margin - 25;
        if (point.isValid) {
          doc.setFillColor(46, 204, 113);
          doc.setTextColor(255, 255, 255);
        } else {
          doc.setFillColor(231, 76, 60);
          doc.setTextColor(255, 255, 255);
        }
        doc.roundedRect(badgeX, yPosition - 3, 20, 6, 1, 1, 'F');
        doc.setFontSize(8);
        doc.text(point.isValid ? 'Validé' : 'Non validé', badgeX + 10, yPosition + 1, { align: 'center' });
        
        yPosition += 12;
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        // Informations du point en colonnes
        const col1X = margin + 5;
        const col2X = pageWidth / 2 + 5;
        
        // Colonne 1
        doc.setFont('helvetica', 'bold');
        doc.text('Coordonnées:', col1X, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(`Lat: ${point.latitude?.toFixed(6) ?? 'N/A'}`, col1X + 5, yPosition + 5);
        doc.text(`Lon: ${point.longitude?.toFixed(6) ?? 'N/A'}`, col1X + 5, yPosition + 10);
        
        // Colonne 2
        doc.setFont('helvetica', 'bold');
        doc.text('Équipement:', col2X, yPosition);
        doc.setFont('helvetica', 'normal');
        const equipText = point.equipment?.type ?? point.equipment?.description ?? 'N/A';
        doc.text(equipText, col2X + 5, yPosition + 5);
        doc.text(`Quantité: ${point.equipmentQuantity ?? 0}`, col2X + 5, yPosition + 10);
        
        yPosition += 18;
        
        // Commentaire
        if (point.comment) {
          doc.setFont('helvetica', 'bold');
          doc.text('Commentaire:', col1X, yPosition);
          doc.setFont('helvetica', 'normal');
          const commentLines = doc.splitTextToSize(point.comment, pageWidth - 2 * margin - 10);
          doc.text(commentLines, col1X + 5, yPosition + 5);
          yPosition += 5 + commentLines.length * 5;
        }
        
        yPosition += 3;
        
        // Photos
        const pointImagePoints = imagePoints.filter(ip => ip.pointId === point.uuid);
        const pointPhotos = pointImagePoints
          .map(ip => photos.find(p => p.uuid === ip.imageId))
          .filter(p => p != null);
        
        if (pointPhotos.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.text(`Photos (${pointPhotos.length}):`, col1X, yPosition);
          yPosition += 7;
          doc.setFont('helvetica', 'normal');
          
          for (let photoIndex = 0; photoIndex < pointPhotos.length; photoIndex++) {
            const photo = pointPhotos[photoIndex];
            
            // Afficher uniquement les photos impaires (colonnes de gauche)
            if (photoIndex % 2 === 0) {
              if (yPosition > pageHeight - 90) {
                doc.addPage();
                yPosition = 25;
              }
              
              doc.setFontSize(9);
              doc.text(`Image ${photoIndex + 1}/${pointPhotos.length}`, col1X + 5, yPosition);
              yPosition += 5;
              
              if (photo.picture) {
                try {
                  const imgData = photo.picture.startsWith('data:') ? photo.picture : `data:image/jpeg;base64,${photo.picture}`;
                  doc.addImage(imgData, 'JPEG', col1X + 5, yPosition, 70, 70);
                } catch (err) {
                  console.error('Error adding image to PDF:', err);
                  doc.text('(Image non disponible)', col1X + 5, yPosition);
                }
              } else {
                doc.text('(Image non disponible)', col1X + 5, yPosition);
              }
              
              // Afficher la photo paire (colonne de droite) si elle existe
              if (photoIndex + 1 < pointPhotos.length) {
                const nextPhoto = pointPhotos[photoIndex + 1];
                doc.setFontSize(9);
                doc.text(`Image ${photoIndex + 2}/${pointPhotos.length}`, col2X + 5, yPosition - 5);
                
                if (nextPhoto.picture) {
                  try {
                    const nextImgData = nextPhoto.picture.startsWith('data:') ? nextPhoto.picture : `data:image/jpeg;base64,${nextPhoto.picture}`;
                    doc.addImage(nextImgData, 'JPEG', col2X + 5, yPosition, 70, 70);
                  } catch (err) {
                    console.error('Error adding image to PDF:', err);
                    doc.text('(Image non disponible)', col2X + 5, yPosition);
                  }
                } else {
                  doc.text('(Image non disponible)', col2X + 5, yPosition);
                }
              }
              
              yPosition += 75;
            }
          }
        }
        
        // Ligne de séparation entre les points
        yPosition += 8;
        doc.setDrawColor(189, 195, 199);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;
      });
      
      // Pied de page sur toutes les pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(127, 140, 141);
        doc.text(`Page ${i} / ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
      }
      
      doc.save(`${eventTitle}.pdf`);
    });
  }
}
