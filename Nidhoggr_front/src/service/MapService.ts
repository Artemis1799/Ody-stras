import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Point } from '../classe/pointModel';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private pointsSubject = new BehaviorSubject<Point[]>([]);
  private mapInstanceSubject = new BehaviorSubject<any>(null);
  private selectedPointSubject = new BehaviorSubject<Point | null>(null);

  points$: Observable<Point[]> = this.pointsSubject.asObservable();
  mapInstance$: Observable<any> = this.mapInstanceSubject.asObservable();
  selectedPoint$: Observable<Point | null> = this.selectedPointSubject.asObservable();

  setPoints(points: Point[]): void {
    this.pointsSubject.next(points);
  }

  setMapInstance(map: any): void {
    this.mapInstanceSubject.next(map);
  }

  selectPoint(point: Point | null): void {
    this.selectedPointSubject.next(point);
  }

  getMapInstance(): any {
    return this.mapInstanceSubject.value;
  }
}
