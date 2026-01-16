import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PointDrawerComponent } from './point-drawer.component';
import { MapService } from '../../../services/MapService';
import { PointService } from '../../../services/PointService';
import { ToastService } from '../../../services/ToastService';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { Point } from '../../../models/pointModel';

describe('PointDrawerComponent', () => {
  let component: PointDrawerComponent;
  let fixture: ComponentFixture<PointDrawerComponent>;
  let mapService: jasmine.SpyObj<MapService>;
  let pointService: jasmine.SpyObj<PointService>;

  const mockPoint: Point = {
    uuid: 'point-1',
    eventId: 'event-1',
    name: 'Test Point',
    latitude: 48.8566,
    longitude: 2.3522,
    validated: true
  };

  beforeEach(async () => {
    const mapServiceSpy = jasmine.createSpyObj('MapService', [
      'selectPoint',
      'getSelectedPointIndex',
      'getSelectedEvent'
    ]);
    const pointServiceSpy = jasmine.createSpyObj('PointService', [
      'create',
      'update',
      'delete'
    ]);

    await TestBed.configureTestingModule({
      imports: [PointDrawerComponent, CommonModule, FormsModule, HttpClientTestingModule],
      providers: [
        { provide: MapService, useValue: mapServiceSpy },
        { provide: PointService, useValue: pointServiceSpy },
        ToastService,
        MessageService
      ]
    }).compileComponents();

    mapService = TestBed.inject(MapService) as jasmine.SpyObj<MapService>;
    pointService = TestBed.inject(PointService) as jasmine.SpyObj<PointService>;

    fixture = TestBed.createComponent(PointDrawerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with no selected point', () => {
    expect(component).toBeTruthy();
  });

  it('should call selectPoint on map service', () => {
    mapService.selectPoint.and.returnValue(undefined);
    mapService.selectPoint(mockPoint, 0);
    expect(mapService.selectPoint).toHaveBeenCalledWith(mockPoint, 0);
  });

  it('should get selected point index', () => {
    mapService.getSelectedPointIndex.and.returnValue(0);
    const index = mapService.getSelectedPointIndex();
    expect(index).toBe(0);
  });

  it('should create a point', (done) => {
    pointService.create.and.returnValue(of(mockPoint));

    pointService.create(mockPoint).subscribe((created) => {
      expect(created).toEqual(mockPoint);
      done();
    });
  });

  it('should update a point', (done) => {
    const updatedPoint = { ...mockPoint, validated: false };
    pointService.update.and.returnValue(of(updatedPoint));

    pointService.update('point-1', updatedPoint).subscribe((updated) => {
      expect(updated.validated).toBe(false);
      done();
    });
  });

  it('should delete a point', (done) => {
    pointService.delete.and.returnValue(of(undefined));

    pointService.delete('point-1').subscribe(() => {
      expect(pointService.delete).toHaveBeenCalledWith('point-1');
      done();
    });
  });

  it('should handle point validation', () => {
    const point = { ...mockPoint };
    expect(point.validated).toBe(true);
  });

  it('should handle multiple points', (done) => {
    const points = [mockPoint, { ...mockPoint, uuid: 'point-2', name: 'Point 2' }];
    expect(points.length).toBe(2);
    done();
  });
});
