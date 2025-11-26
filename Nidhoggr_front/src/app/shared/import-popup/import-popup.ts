import { Component, EventEmitter, Output, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as QRCode from 'qrcode';
import { WebSocketExportService } from '../../services/WebSocketExportService';
import { WS_URL } from '../constants/wsUrl';

@Component({
  selector: 'app-import-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './import-popup.html',
  styleUrls: ['./import-popup.scss'],
})
export class ImportPopup implements OnInit {
  @Output() close = new EventEmitter<void>();
  
  qrCodeDataUrl = '';
  public WS_URL = WS_URL;
  isReady = false;
  
  private wsExportService = inject(WebSocketExportService);
  private cdr = inject(ChangeDetectorRef);

  async ngOnInit(): Promise<void> {
    // Démarrer le serveur et se connecter
    await this.wsExportService.startServerAndConnect();
    
    // Générer le QR code
    try {
      this.qrCodeDataUrl = await QRCode.toDataURL(this.WS_URL, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      // Marquer comme prêt une fois le QR code généré
      this.isReady = true;
      this.cdr.detectChanges(); // Forcer la détection des changements
    } catch (error) {
      console.error('Erreur génération QR code:', error);
      this.isReady = true; // Afficher quand même en cas d'erreur
      this.cdr.detectChanges();
    }
  }
  
  closeModal(): void {
    this.wsExportService.disconnect();
    this.close.emit();
  }
}
