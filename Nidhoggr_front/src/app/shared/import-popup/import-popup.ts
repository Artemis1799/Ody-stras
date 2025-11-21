import { Component, EventEmitter, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as QRCode from 'qrcode';
import { WebSocketExportService } from '../../services/WebSocketExportService';

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
  wsUrl = 'ws://192.168.1.128:8765';
  
  private wsExportService = inject(WebSocketExportService);

  async ngOnInit(): Promise<void> {
    // Démarrer le serveur et se connecter
    await this.wsExportService.startServerAndConnect();
    
    // Générer le QR code
    try {
      this.qrCodeDataUrl = await QRCode.toDataURL(this.wsUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('Erreur génération QR code:', error);
    }
  }
  
  closeModal(): void {
    this.wsExportService.disconnect();
    this.close.emit();
  }
}
