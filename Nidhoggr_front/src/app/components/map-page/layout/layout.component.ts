import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PointsSidebarComponent } from '../points-sidebar/points-sidebar.component';
import { PointDrawerComponent } from '../point-drawer/point-drawer.component';
import { PointOfInterestDrawerComponent } from '../point-of-interest-drawer/point-of-interest-drawer.component';
import { SecurityZoneDrawerComponent } from '../security-zone-drawer/security-zone-drawer.component';
import { MapService } from '../../../services/MapService';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    PointsSidebarComponent,
    PointDrawerComponent,
    PointOfInterestDrawerComponent,
    SecurityZoneDrawerComponent,
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit, OnDestroy {
  selectedEventName = '';
  private selectedEventSubscription?: Subscription;

  constructor(private mapService: MapService) {}

  ngOnInit(): void {
    // Fermer tous les drawers au chargement de la page
    this.mapService.closeAllDrawers();

    // S'abonner aux changements d'événement sélectionné
    this.selectedEventSubscription = this.mapService.selectedEvent$.subscribe((event) => {
      this.selectedEventName = event ? event.title : '';
    });
  }

  ngOnDestroy(): void {
    this.selectedEventSubscription?.unsubscribe();
  }
}
