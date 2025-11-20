import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PointService } from '../service/PointService';
import { PhotoService } from '../service/PhotoService';
import { ImagePointService } from '../service/ImagePointsService';
import { EquipmentService } from '../service/EquipmentService';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('Nidhoggr_front');

  constructor(
    private pointService: PointService,
    private photoService: PhotoService,
    private imagePointService: ImagePointService,
    private equipmentService: EquipmentService,
  ) {}
  async ngOnInit(): Promise<void> {
    try {
      if (typeof window === 'undefined') { return; }

      // load data from services and log results (non-blocking)
      forkJoin({
        points: this.pointService.getAll(),
        photos: this.photoService.getAll(),
        imagePoints: this.imagePointService.getAll(),
        equipments: this.equipmentService.getAll(),
      }).subscribe({
        next: result => console.log('App: data loaded', result),
        error: err => console.error('App: error loading data', err),
      });
    } catch (e) {
      console.error('Failed to initialize Leaflet map', e);
    }
  }
}
