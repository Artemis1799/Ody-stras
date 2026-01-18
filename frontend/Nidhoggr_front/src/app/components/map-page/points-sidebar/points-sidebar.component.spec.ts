import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PointsSidebarComponent } from './points-sidebar.component';
import { MapService } from '../../../services/MapService';
import { PointService } from '../../../services/PointService';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { Point } from '../../../models/pointModel';

describe('PointsSidebarComponent', () => {
  let component: PointsSidebarComponent;
  let fixture: ComponentFixture<PointsSidebarComponent>;
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
    const mapServiceSpy = jasmine.createSpyObj('MapService', ['selectPoint', 'getPoints']);
    const pointServiceSpy = jasmine.createSpyObj('PointService', ['getAll']);
    const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], { params: of({ id: 'event-1' }) });

    await TestBed.configureTestingModule({
      imports: [PointsSidebarComponent, CommonModule, HttpClientTestingModule],
      providers: [
        { provide: MapService, useValue: mapServiceSpy },
        { provide: PointService, useValue: pointServiceSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy },
        MessageService
      ]
    }).compileComponents();

    mapService = TestBed.inject(MapService) as jasmine.SpyObj<MapService>;
    pointService = TestBed.inject(PointService) as jasmine.SpyObj<PointService>;

    fixture = TestBed.createComponent(PointsSidebarComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get all points', (done) => {
    const points = [mockPoint];
    pointService.getAll.and.returnValue(of(points));

    pointService.getAll().subscribe((result) => {
      expect(result).toEqual(points);
      done();
    });
  });

  it('should select a point from sidebar', () => {
    mapService.selectPoint.and.returnValue(undefined);
    mapService.selectPoint(mockPoint, 0);
    expect(mapService.selectPoint).toHaveBeenCalledWith(mockPoint, 0);
  });

  it('should get points from map service', () => {
    mapService.getPoints.and.returnValue([mockPoint]);
    const points = mapService.getPoints();
    expect(points.length).toBe(1);
    expect(points[0]).toEqual(mockPoint);
  });

  it('should display multiple points in sidebar', (done) => {
    const points = [
      mockPoint,
      { ...mockPoint, uuid: 'point-2', name: 'Point 2' }
    ];
    pointService.getAll.and.returnValue(of(points));

    pointService.getAll().subscribe((result) => {
      expect(result.length).toBe(2);
      done();
    });
  });

  it('should handle point selection by name', () => {
    mapService.selectPoint.and.returnValue(undefined);
    const selectedPoint = mockPoint;
    mapService.selectPoint(selectedPoint);
    expect(mapService.selectPoint).toHaveBeenCalledWith(selectedPoint);
  });

  it('should handle validated and unvalidated points', () => {
    const validatedPoint = { ...mockPoint, validated: true };
    const unvalidatedPoint = { ...mockPoint, validated: false };

    expect(validatedPoint.validated).toBe(true);
    expect(unvalidatedPoint.validated).toBe(false);
  });
});
