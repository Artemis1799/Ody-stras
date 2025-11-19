import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import * as maplibregl from 'maplibre-gl';

@Component({
  selector: 'app.ts',
  templateUrl: 'app.html',
  styleUrls: ['app.scss']
})
export class OfflineMapComponent implements OnInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;
  map!: maplibregl.Map;

  ngOnInit(): void {
    this.initializeMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove(); 
    }
  }

  initializeMap(): void {
    this.map = new maplibregl.Map({
      container: this.mapContainer.nativeElement,
      style: 'http://localhost:8080/styles/basic-preview/style.json', 
      center: [7.7635, 48.5465], 
      zoom: 13
    });
  }
}