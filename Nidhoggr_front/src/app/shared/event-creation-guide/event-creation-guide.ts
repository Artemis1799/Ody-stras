import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { MapService, EventCreationMode, EventCreationStep } from '../../services/MapService';

@Component({
  selector: 'app-event-creation-guide',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-creation-guide.html',
  styleUrls: ['./event-creation-guide.scss']
})
export class EventCreationGuide implements OnInit, OnDestroy {
  mode: EventCreationMode | null = null;
  isMinimized = false;
  private subscription?: Subscription;

  constructor(
    private mapService: MapService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subscription = this.mapService.eventCreationMode$.subscribe(mode => {
      const previousStep = this.mode?.step;
      this.mode = mode;
      // Réinitialiser l'état minimisé lors du changement d'étape
      if (mode.step === 'drawing-zone' || mode.step === 'drawing-path') {
        this.isMinimized = false;
      }
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  get currentStep(): EventCreationStep {
    return this.mode?.step ?? 'idle';
  }

  get isActive(): boolean {
    return this.mode?.active ?? false;
  }

  get eventTitle(): string {
    return this.mode?.event?.title ?? '';
  }

  get isZoneModificationMode(): boolean {
    return this.mode?.zoneModificationMode ?? false;
  }

  get isPathModificationMode(): boolean {
    return this.mode?.pathModificationMode ?? false;
  }

  get isModificationMode(): boolean {
    return this.isZoneModificationMode || this.isPathModificationMode;
  }

  toggleMinimize(): void {
    this.isMinimized = !this.isMinimized;
  }

  onCancel(): void {
    this.mapService.cancelEventCreation();
  }

  onValidateModification(): void {
    // Valider les modifications et revenir à l'étape de confirmation
    this.mapService.validateModification();
  }
}
