import { Component, EventEmitter, Input, Output, signal, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Team } from '../../models/teamModel';
import { Employee } from '../../models/employeeModel';
import { Event } from '../../models/eventModel';
import { SecurityZone } from '../../models/securityZoneModel';
import { WS_URL } from '../constants/wsUrl';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export interface TeamFormData {
  team: Partial<Team>;
  selectedEmployees: Employee[];
}

@Component({
  selector: 'app-team-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './team-popup.html',
  styleUrl: './team-popup.scss'
})
export class TeamPopupComponent implements OnDestroy, OnChanges {
  @Input() isEditing = false;
  @Input() team: Partial<Team> = {};
  @Input() allEmployees: Employee[] = [];
  @Input() selectedEmployees: Employee[] = [];
  @Input() events: Event[] = [];
  @Input() securityZones: SecurityZone[] = [];
  
  // Selected events for export (multi-select)
  selectedEventIds: string[] = [];
  
  // QR Code popup properties
  showQRCodePopup = false;
  qrCodeDataURL = '';
  exportStatus = '';
  isExporting = false;
  private ws: WebSocket | null = null;
  
  // Signaux de recherche
  searchLastName = signal('');
  searchFirstName = signal('');
  
  get sortedEmployees(): Employee[] {
    return [...this.allEmployees].sort((a, b) => {
      const firstNameCompare = a.firstName.localeCompare(b.firstName, 'fr');
      return firstNameCompare !== 0 ? firstNameCompare : a.lastName.localeCompare(b.lastName, 'fr');
    });
  }
  
  @Output() selectedEmployeesChange = new EventEmitter<Employee[]>();
  @Output() save = new EventEmitter<TeamFormData>();
  @Output() close = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges): void {
    // Pas besoin d'initialiser selectedEventIds ici, c'est fait dans la popup d'export
  }
  
  getFilteredEmployees(): Employee[] {
    const lastNameFilter = this.searchLastName().toLowerCase().trim();
    const firstNameFilter = this.searchFirstName().toLowerCase().trim();
    
    return this.sortedEmployees.filter(employee => {
      const matchesLastName = !lastNameFilter || employee.lastName.toLowerCase().includes(lastNameFilter);
      const matchesFirstName = !firstNameFilter || employee.firstName.toLowerCase().includes(firstNameFilter);
      
      return matchesLastName && matchesFirstName;
    });
  }

  isEmployeeSelected(employee: Employee): boolean {
    return this.selectedEmployees.some(e => e.uuid === employee.uuid);
  }

  toggleEmployee(employee: Employee): void {
    if (this.isEmployeeSelected(employee)) {
      this.selectedEmployees = this.selectedEmployees.filter(e => e.uuid !== employee.uuid);
    } else {
      this.selectedEmployees = [...this.selectedEmployees, employee];
    }
    this.selectedEmployeesChange.emit(this.selectedEmployees);
  }

  onSave(): void {
    if (this.team.teamName?.trim() && this.team.eventId) {
      this.save.emit({
        team: { ...this.team },
        selectedEmployees: [...this.selectedEmployees]
      });
    }
  }

  onClose(): void {
    this.close.emit();
  }
  
  parseNumber(value: string | number | null): number | undefined {
    if (!value) return undefined;
    const num = parseInt(String(value), 10);
    return isNaN(num) ? undefined : num;
  }

  generatePlanningPDF(): void {
    if (!this.team.uuid) return;

    const teamId = this.team.uuid;
    const installationZones = this.securityZones.filter(z => z.installationTeamId === teamId);
    const removalZones = this.securityZones.filter(z => z.removalTeamId === teamId);

    // Tri par date
    installationZones.sort((a, b) => new Date(a.installationDate).getTime() - new Date(b.installationDate).getTime());
    removalZones.sort((a, b) => new Date(a.removalDate).getTime() - new Date(b.removalDate).getTime());

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    let yPosition = 25;

    const teamName = this.team.teamName || 'Équipe';
    const eventName = this.events.find(e => e.uuid === this.team.eventId)?.title || '';
    const generatedDate = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // === EN-TÊTE DU DOCUMENT ===
    doc.setFillColor(23, 28, 34);
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    // Titre principal
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(`Planning - ${teamName}`, pageWidth / 2, 22, { align: 'center' });
    
    // Sous-titre événement
    if (eventName) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(139, 148, 158);
      doc.text(eventName, pageWidth / 2, 32, { align: 'center' });
    }

    yPosition = 62;
    doc.setTextColor(0, 0, 0);

    // === MEMBRES DE L'ÉQUIPE ===
    if (this.selectedEmployees.length > 0) {
      // Icône utilisateurs (petit cercle)
      doc.setFillColor(42, 215, 131);
      doc.circle(margin + 4, yPosition - 2, 3, 'F');
      
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(23, 28, 34);
      doc.text('Membre(s) de l\'équipe', margin + 12, yPosition);
      yPosition += 10;
      
      // Liste des membres dans un encadré
      doc.setFillColor(245, 247, 250);
      const membersText = this.selectedEmployees.map(e => `${e.firstName} ${e.lastName}`).join('  •  ');
      const memberLines = doc.splitTextToSize(membersText, pageWidth - 2 * margin - 10);
      const boxHeight = memberLines.length * 6 + 8;
      doc.roundedRect(margin, yPosition - 4, pageWidth - 2 * margin, boxHeight, 3, 3, 'F');
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(52, 73, 94);
      doc.text(memberLines, margin + 5, yPosition + 2);
      yPosition += boxHeight + 12;
    }

    // Section Installation
    yPosition = this.renderSection(doc, 'Équipement(s) à poser', installationZones, 'installation', yPosition, margin, pageWidth, pageHeight);

    // Section Dépose
    yPosition = this.renderSection(doc, 'Équipement(s) à récupérer', removalZones, 'removal', yPosition, margin, pageWidth, pageHeight);

    // Si aucune zone assignée
    if (installationZones.length === 0 && removalZones.length === 0) {
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 30, 3, 3, 'F');
      doc.setFontSize(11);
      doc.setTextColor(127, 140, 141);
      doc.text('Aucun équipement assigné à cette équipe.', pageWidth / 2, yPosition + 18, { align: 'center' });
    }

    // Pied de page
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
      doc.setFontSize(8);
      doc.setTextColor(127, 140, 141);
      doc.text(`${teamName} - ${eventName}`, margin, pageHeight - 8);
      doc.text(`Page ${i} / ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
    }

    doc.save(`Planning_${teamName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  }

  private renderSection(
    doc: jsPDF,
    title: string,
    zones: SecurityZone[],
    type: 'installation' | 'removal',
    yPosition: number,
    margin: number,
    pageWidth: number,
    pageHeight: number
  ): number {
    if (zones.length === 0) return yPosition;

    // Ajouter de l'espace avant le titre de section
    yPosition += 8;

    // Vérifier si on a besoin d'une nouvelle page
    if (yPosition > pageHeight - 70) {
      doc.addPage();
      yPosition = 25;
    }

    // === TITRE DE SECTION ===
    const isInstall = type === 'installation';
    const mainColor = isInstall ? [52, 136, 108] : [156, 89, 82]; // Vert sauge ou Terracotta doux
    const lightBg = isInstall ? [240, 248, 245] : [250, 244, 243]; // Fond très clair
    
    // Bande de couleur à gauche + fond
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.roundedRect(margin, yPosition - 6, pageWidth - 2 * margin, 14, 2, 2, 'F');
    doc.setFillColor(mainColor[0], mainColor[1], mainColor[2]);
    doc.rect(margin, yPosition - 6, 4, 14, 'F');
    
    // Texte du titre
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(mainColor[0], mainColor[1], mainColor[2]);
    doc.text(title, margin + 10, yPosition + 2);
    
    // Badge avec le nombre
    const badgeText = `${zones.length}`;
    const badgeWidth = doc.getTextWidth(badgeText) + 8;
    doc.setFillColor(mainColor[0], mainColor[1], mainColor[2]);
    doc.roundedRect(pageWidth - margin - badgeWidth - 5, yPosition - 4, badgeWidth, 10, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(badgeText, pageWidth - margin - badgeWidth / 2 - 5, yPosition + 2, { align: 'center' });
    
    yPosition += 18;

    // === EN-TÊTE DU TABLEAU ===
    const dateColX = pageWidth - margin - 60;
    const qtyColX = pageWidth - margin - 25;
    
    doc.setFillColor(245, 247, 250);
    doc.rect(margin, yPosition - 4, pageWidth - 2 * margin, 10, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 110, 120);
    doc.text('ÉQUIPEMENT', margin + 5, yPosition + 2);
    doc.text('DATE', dateColX, yPosition + 2);
    doc.text('QTÉ', qtyColX, yPosition + 2);
    yPosition += 12;

    doc.setTextColor(0, 0, 0);

    // === LIGNES DU TABLEAU ===
    zones.forEach((zone, index) => {
      if (yPosition > pageHeight - 25) {
        doc.addPage();
        yPosition = 25;
        // Répéter l'en-tête sur la nouvelle page
        const dateColX = pageWidth - margin - 60;
        const qtyColX = pageWidth - margin - 25;
        
        doc.setFillColor(245, 247, 250);
        doc.rect(margin, yPosition - 4, pageWidth - 2 * margin, 10, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 110, 120);
        doc.text('ÉQUIPEMENT', margin + 5, yPosition + 2);
        doc.text('DATE', dateColX, yPosition + 2);
        doc.text('QTÉ', qtyColX, yPosition + 2);
        yPosition += 12;
        doc.setTextColor(0, 0, 0);
      }

      // Ligne alternée
      if (index % 2 === 0) {
        doc.setFillColor(252, 252, 253);
        doc.rect(margin, yPosition - 4, pageWidth - 2 * margin, 12, 'F');
      }
      
      // Bordure gauche colorée
      doc.setFillColor(mainColor[0], mainColor[1], mainColor[2]);
      doc.rect(margin, yPosition - 4, 2, 12, 'F');

      const date = type === 'installation' ? zone.installationDate : zone.removalDate;
      const dateStr = new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short'
      });

      // Données
      const equipName = zone.equipment?.type || 'Équipement';
      const dateColX = pageWidth - margin - 60;
      const qtyColX = pageWidth - margin - 25;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(23, 28, 34);
      doc.text(equipName, margin + 5, yPosition + 3);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 90, 100);
      doc.text(dateStr, dateColX, yPosition + 3);
      doc.text(String(zone.quantity), qtyColX, yPosition + 3);
      
      yPosition += 12;
      
      // Commentaire sur une ligne séparée si présent
      if (zone.comment) {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 25;
        }
        doc.setFontSize(8);
        doc.setTextColor(120, 130, 140);
        const commentLines = doc.splitTextToSize(`→ ${zone.comment}`, pageWidth - 2 * margin - 10);
        doc.text(commentLines, margin + 5, yPosition);
        yPosition += commentLines.length * 4 + 4;
      }
    });

    yPosition += 8;
    return yPosition;
  }

  ngOnDestroy(): void {
    this.disconnectWebSocket();
  }

  /**
   * Ouvre la popup d'export planning pour sélectionner les événements
   */
  async exportPlanningQRCode(): Promise<void> {
    if (!this.team.uuid) return;

    // Réinitialiser la sélection d'événements
    this.selectedEventIds = [];
    this.qrCodeDataURL = '';
    this.exportStatus = '';
    this.isExporting = false;
    this.showQRCodePopup = true;
  }

  /**
   * Confirme la sélection des événements et génère le QR Code
   */
  async confirmAndGenerateQRCode(): Promise<void> {
    if (!this.team.uuid || this.selectedEventIds.length === 0) return;

    this.isExporting = true;
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
      this.ws?.send(JSON.stringify({ type: 'web_waiting_planning', teamUuid: this.team.uuid }));
      this.exportStatus = '📱 Scannez le QR code avec votre téléphone...';
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('📨 Message reçu:', message.type);

        if (message.type === 'phone_requesting') {
          console.log('📱 Téléphone connecté, envoi du planning...');
          this.exportStatus = '🔄 Téléphone détecté ! Envoi du planning...';
          this.sendPlanningData();
        } else if (message.type === 'export_confirmed') {
          console.log('✅ Export confirmé:', message);
          this.exportStatus = '✅ Planning envoyé au téléphone !';
          
          setTimeout(() => {
            this.isExporting = false;
            this.showQRCodePopup = false;
            this.disconnectWebSocket();
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
   * Envoie les données du planning via WebSocket
   */
  private sendPlanningData(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocket non connecté');
      return;
    }

    const teamId = this.team.uuid!;
    
    // Filtrer les zones de sécurité par équipe ET par événements sélectionnés
    const selectedEvents = this.selectedEventIds.length > 0 ? this.selectedEventIds : [];
    
    const installationZones = this.securityZones.filter(z => 
      z.installationTeamId === teamId && 
      (selectedEvents.length === 0 || selectedEvents.includes(z.eventId))
    );
    const removalZones = this.securityZones.filter(z => 
      z.removalTeamId === teamId && 
      (selectedEvents.length === 0 || selectedEvents.includes(z.eventId))
    );

    // Tri par date
    installationZones.sort((a, b) => new Date(a.installationDate).getTime() - new Date(b.installationDate).getTime());
    removalZones.sort((a, b) => new Date(a.removalDate).getTime() - new Date(b.removalDate).getTime());

    const selectedEventNames = this.events
      .filter(e => selectedEvents.includes(e.uuid))
      .map(e => e.title)
      .join(', ');
    const eventName = selectedEventNames || this.events.find(e => e.uuid === this.team.eventId)?.title || '';

    // Construire l'objet JSON du planning
    const planningData = {
      type: 'planning_data',
      team: {
        uuid: this.team.uuid,
        name: this.team.teamName,
        number: this.team.teamNumber,
        eventId: this.team.eventId,
        eventName: eventName
      },
      members: this.selectedEmployees.map(e => ({
        uuid: e.uuid,
        firstName: e.firstName,
        lastName: e.lastName
      })),
      installations: installationZones.map(z => ({
        uuid: z.uuid,
        equipmentType: z.equipment?.type || '',
        quantity: z.quantity,
        date: z.installationDate,
        comment: z.comment || '',
        geoJson: z.geoJson
      })),
      removals: removalZones.map(z => ({
        uuid: z.uuid,
        equipmentType: z.equipment?.type || '',
        quantity: z.quantity,
        date: z.removalDate,
        comment: z.comment || '',
        geoJson: z.geoJson
      }))
    };

    // Console.log le JSON
    console.log('📋 Planning JSON export:', JSON.stringify(planningData, null, 2));

    this.ws.send(JSON.stringify(planningData));
    console.log('✅ Planning envoyé au serveur WebSocket');
    this.exportStatus = '📤 Envoi du planning...';
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
   * Ferme le popup QR code
   */
  closeQRCodePopup(): void {
    this.showQRCodePopup = false;
    this.qrCodeDataURL = '';
    this.exportStatus = '';
    this.isExporting = false;
    this.disconnectWebSocket();
  }

  /**
   * Vérifie si un événement est sélectionné pour l'export
   */
  isEventSelected(eventId: string): boolean {
    return this.selectedEventIds.includes(eventId);
  }

  /**
   * Bascule la sélection d'un événement
   */
  toggleEventSelection(eventId: string): void {
    const index = this.selectedEventIds.indexOf(eventId);
    if (index > -1) {
      this.selectedEventIds = this.selectedEventIds.filter(id => id !== eventId);
    } else {
      this.selectedEventIds = [...this.selectedEventIds, eventId];
    }
  }

  /**
   * Sélectionne tous les événements
   */
  selectAllEvents(): void {
    this.selectedEventIds = this.events.map(e => e.uuid);
  }

  /**
   * Désélectionne tous les événements
   */
  clearEventSelection(): void {
    this.selectedEventIds = [];
  }
}
