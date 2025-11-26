import { Routes } from '@angular/router';
import { LayoutComponent } from '../components/layout/layout.component';
import { MapLoaderComponent } from '../components/map-loader/map-loader.component';
import { EquipmentManagerComponent } from '../components/equipment-manager/equipment-manager.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'map', pathMatch: 'full' },
      { path: 'map', component: MapLoaderComponent },
      { path: 'equipments', component: EquipmentManagerComponent }
    ]
  }
];
