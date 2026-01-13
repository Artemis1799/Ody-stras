import { Routes } from '@angular/router';
import { LayoutComponent } from '../components/map-page/layout/layout.component';
import { MapLoaderComponent } from '../components/map-page/map-loader/map-loader.component';
import { EquipmentManagerComponent } from '../components/equipement-page/equipment-manager.component';
import { AccueilPage } from '../components/accueil-page/accueil-page/accueil-page';
import { PersonnesComponent } from '../components/personnels-page/personnes/personnes.component';
import { TeamsComponent } from '../components/personnels-page/teams/teams.component';
import { HistoriqueComponent } from '../components/historique-page/historique.component';

export const routes: Routes = [
  { path: '', component: AccueilPage },
  {
    path: 'evenements',
    component: LayoutComponent,
    children: [
      { path: '', component: MapLoaderComponent }
    ]
  },
  { path: 'equipments', component: EquipmentManagerComponent },
  { path: 'personnels/personnes', component: PersonnesComponent },
  { path: 'personnels/teams', component: TeamsComponent },
  { path: 'historique', component: HistoriqueComponent }
];
