import { Component, EventEmitter, Output, inject } from '@angular/core';
import { PointService } from '../../services/PointService';
import { PhotoService } from '../../services/PhotoService';
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

  exportExcel(): void {
    this.pointService.getAll().subscribe(points => {
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
      XLSX.writeFile(wb, 'points_export.xlsx');
    });
  }

  exportPDF(): void {
    forkJoin({
      points: this.pointService.getAll(),
      photos: this.photoService.getAll()
    }).subscribe(({ points, photos }) => {
      const doc = new jsPDF();
      let yPosition = 20;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      
      doc.setFontSize(16);
      doc.text('Export des Points', margin, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      
      points.forEach((point, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(12);
        doc.text(`Point ${index + 1}`, margin, yPosition);
        yPosition += 7;
        
        doc.setFontSize(10);
        doc.text(`UUID: ${point.uuid}`, margin + 5, yPosition);
        yPosition += 5;
        
        const coords = `Coordonnées: ${point.latitude ?? 'N/A'}, ${point.longitude ?? 'N/A'}`;
        doc.text(coords, margin + 5, yPosition);
        yPosition += 5;
        
        const equipment = `Équipement: ${point.equipment?.type ?? point.equipment?.description ?? 'N/A'}`;
        doc.text(equipment, margin + 5, yPosition);
        yPosition += 5;
        
        doc.text(`Quantité: ${point.equipmentQuantity ?? 0}`, margin + 5, yPosition);
        yPosition += 5;
        
        if (point.comment) {
          const commentLines = doc.splitTextToSize(`Commentaire: ${point.comment}`, 170);
          doc.text(commentLines, margin + 5, yPosition);
          yPosition += commentLines.length * 5;
        }
        
        doc.text(`Valide: ${point.isValid ? 'Oui' : 'Non'}`, margin + 5, yPosition);
        yPosition += 5;
        
        // Find and add photo if available
        const photo = photos.find(p => p.uuid === point.imageId);
        if (photo && photo.picture) {
          try {
            // Check if we have space for image, otherwise new page
            if (yPosition > pageHeight - 80) {
              doc.addPage();
              yPosition = 20;
            }
            
            doc.text(`Photo: ${photo.pictureName}`, margin + 5, yPosition);
            yPosition += 5;
            
            // Add base64 image (assuming photo.picture is base64 with data:image prefix)
            const imgData = photo.picture.startsWith('data:') ? photo.picture : `data:image/jpeg;base64,${photo.picture}`;
            doc.addImage(imgData, 'JPEG', margin + 5, yPosition, 60, 60);
            yPosition += 65;
          } catch (err) {
            console.error('Error adding image to PDF:', err);
            doc.text('(Image non disponible)', margin + 5, yPosition);
            yPosition += 5;
          }
        }
        
        yPosition += 5; // Space between points
      });
      
      doc.save('points_export.pdf');
    });
  }
}
