import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PointsSidebarComponent } from '../points-sidebar/points-sidebar.component';
import { PointDrawerComponent } from '../point-drawer/point-drawer.component';
import { SecurityZoneDrawerComponent } from '../security-zone-drawer/security-zone-drawer.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, PointsSidebarComponent, PointDrawerComponent, SecurityZoneDrawerComponent],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent {}
