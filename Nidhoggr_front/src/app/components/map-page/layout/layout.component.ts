import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PointsSidebarComponent } from '../points-sidebar/points-sidebar.component';
import { PointDrawerComponent } from '../point-drawer/point-drawer.component';
import { PointOfInterestDrawerComponent } from '../point-of-interest-drawer/point-of-interest-drawer.component';
import { SecurityZoneDrawerComponent } from '../security-zone-drawer/security-zone-drawer.component';
import { MapService } from '../../../services/MapService';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, PointsSidebarComponent, PointDrawerComponent, PointOfInterestDrawerComponent, SecurityZoneDrawerComponent],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit {
  constructor(private mapService: MapService) {}

  ngOnInit(): void {
    // Fermer tous les drawers au chargement de la page
    this.mapService.closeAllDrawers();
  }
}
