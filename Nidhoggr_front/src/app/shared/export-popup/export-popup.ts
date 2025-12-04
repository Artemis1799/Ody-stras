import { Component, EventEmitter, Output, Input, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PointService } from '../../services/PointService';
import { PhotoService } from '../../services/PhotoService';
import { ImagePointService } from '../../services/ImagePointsService';
import { GeometryService } from '../../services/GeometryService';
import { Event } from '../../models/eventModel';
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
   * Note: On envoie uniquement l'événement et les géométries, PAS les points ni les photos
   * Les points seront créés/modifiés sur le mobile puis renvoyés au PC
   */
  private fetchAndSendData(): void {
    // Récupérer seulement les géométries de cet événement
    this.geometryService.getByEventId(this.event.uuid).subscribe({
      next: (geometries) => {
        console.log('✅ Données récupérées pour export vers mobile');
        console.log('   📋 Event:', this.event.name);
        console.log('   📐 Géométries:', geometries.length);
        console.log('   ⚠️ Points exclus de l\'export (seront créés sur mobile)');
        
        this.exportStatus = '📤 Envoi des données au téléphone...';

        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
          console.error('❌ WebSocket non connecté');
          return;
        }

        // On envoie SEULEMENT l'événement et les géométries
        // Les points ne sont PAS envoyés - ils seront créés sur le mobile
        const message = JSON.stringify({
          type: 'event_export',
          event: this.event,
          points: [], // Pas de points envoyés
          geometries: geometries,
          metadata: {
            exportDate: new Date().toISOString(),
            totalGeometries: geometries.length,
            note: 'Export sans points - les points seront créés sur le mobile'
          }
        });

        this.ws.send(message);
        console.log('✅ Données envoyées au serveur (event + géométries uniquement)');
      },
      error: (error) => {
        console.error('❌ Erreur récupération géométries:', error);
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

  exportPDF(): void {
    forkJoin({
      points: this.pointService.getByEventId(this.event.uuid),
      photos: this.photoService.getAll(),
      imagePoints: this.imagePointService.getAll()
    }).subscribe(({ points, photos, imagePoints }) => {
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
