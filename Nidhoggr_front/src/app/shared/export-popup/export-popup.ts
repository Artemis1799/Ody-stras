import { Component, EventEmitter, Output, inject } from '@angular/core';
import { PointService } from '../../services/PointService';
import { PhotoService } from '../../services/PhotoService';
import { ImagePointService } from '../../services/ImagePointsService';
import { EventService } from '../../services/EventService';
import { forkJoin } from 'rxjs';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-export-popup',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './export-popup.html',
  styleUrls: ['./export-popup.scss'],
})
export class ExportPopup {
  @Output() close = new EventEmitter<void>();
  
  private pointService = inject(PointService);
  private photoService = inject(PhotoService);
  private imagePointService = inject(ImagePointService);
  private eventService = inject(EventService);

  private eventTitle = 'Export_Points';

  exportExcel(): void {
    this.pointService.getAll().subscribe(points => {
      const generateExcel = () => {
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
        XLSX.writeFile(wb, `${this.eventTitle}.xlsx`);
      };

      // Récupérer le titre de l'événement depuis le premier point
      if (points.length > 0 && points[0].eventId) {
        this.eventService.getById(points[0].eventId).subscribe(event => {
          this.eventTitle = event.name || 'Export_Points';
          generateExcel();
        });
      } else {
        generateExcel();
      }
    });
  }

  exportPDF(): void {
    forkJoin({
      points: this.pointService.getAll(),
      photos: this.photoService.getAll(),
      imagePoints: this.imagePointService.getAll()
    }).subscribe(({ points, photos, imagePoints }) => {
      const generatePDF = () => {
        const doc = new jsPDF();
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;
        const margin = 15;
        let yPosition = 25;
        
        // En-tête du document avec fond coloré
        doc.setFillColor(41, 128, 185);
        doc.rect(0, 0, pageWidth, 35, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.text(this.eventTitle, pageWidth / 2, 15, { align: 'center' });
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
        
        doc.save(`${this.eventTitle}.pdf`);
      };

      // Récupérer le titre de l'événement depuis le premier point
      if (points.length > 0 && points[0].eventId) {
        this.eventService.getById(points[0].eventId).subscribe(event => {
          this.eventTitle = event.name || 'Export_Points';
          generatePDF();
        });
      } else {
        generatePDF();
      }
    });
  }
}
