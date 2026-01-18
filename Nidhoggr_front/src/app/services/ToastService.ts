import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  constructor(private messageService: MessageService) {}

  /**
   * Affiche un toast de succès
   */
  showSuccess(summary: string, detail: string = '') {
    this.messageService.add({
      severity: 'success',
      summary,
      detail,
      life: 3000
    });
  }

  /**
   * Affiche un toast d'erreur
   */
  showError(summary: string, detail: string = '') {
    this.messageService.add({
      severity: 'error',
      summary,
      detail,
      life: 5000
    });
  }

  /**
   * Affiche un toast d'information
   */
  showInfo(summary: string, detail: string = '') {
    this.messageService.add({
      severity: 'info',
      summary,
      detail,
      life: 3000
    });
  }

  /**
   * Affiche un toast d'avertissement
   */
  showWarning(summary: string, detail: string = '') {
    this.messageService.add({
      severity: 'warn',
      summary,
      detail,
      life: 4000
    });
  }

  /**
   * Efface tous les messages
   */
  clear() {
    this.messageService.clear();
  }
}
