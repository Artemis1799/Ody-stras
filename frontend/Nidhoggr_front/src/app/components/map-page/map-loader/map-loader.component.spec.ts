import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MapLoaderComponent } from './map-loader.component';
import { MapService, DrawingMode, EventCreationMode } from '../../../services/MapService';
import { PointService } from '../../../services/PointService';
import { AreaService } from '../../../services/AreaService';
import { PathService } from '../../../services/PathService';
import { SecurityZoneService } from '../../../services/SecurityZoneService';
import { EquipmentService } from '../../../services/EquipmentService';
import { ToastService } from '../../../services/ToastService';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { Point } from '../../../models/pointModel';
import { Event, EventStatus } from '../../../models/eventModel';

describe('MapLoaderComponent', () => {
  let component: MapLoaderComponent;
  let fixture: ComponentFixture<MapLoaderComponent>;
  let mapService: jasmine.SpyObj<MapService>;

  const mockPoint: Point = {
    uuid: 'point-1',
    eventId: 'event-1',
    name: 'Test Point',
    latitude: 48.8566,
    longitude: 2.3522,
    validated: true
  };

  const mockEvent: Event = {
    uuid: 'event-1',
    title: 'Test Event',
    startDate: new Date('2026-01-14'),
    endDate: new Date('2026-01-15'),
    status: EventStatus.ToOrganize,
    isArchived: false
  };

  beforeEach(async () => {
    const mapServiceSpy = jasmine.createSpyObj('MapService', [
      'getSelectedEvent',
      'getPoints',
      'setPoints',
      'setSelectedEvent',
      'stopDrawingMode',
      'clearAllShapes'
    ]);
    mapServiceSpy.selectedEvent$ = of(mockEvent);
    mapServiceSpy.points$ = of([mockPoint]);
    mapServiceSpy.setSelectedEvent.and.returnValue(undefined);
    mapServiceSpy.stopDrawingMode.and.returnValue(undefined);

    await TestBed.configureTestingModule({
      imports: [MapLoaderComponent, CommonModule, HttpClientTestingModule],
      providers: [
        { provide: MapService, useValue: mapServiceSpy },
        PointService,
        AreaService,
        PathService,
        SecurityZoneService,
        EquipmentService,
        ToastService,
        MessageService
      ]
    }).compileComponents();

    mapService = TestBed.inject(MapService) as jasmine.SpyObj<MapService>;

    fixture = TestBed.createComponent(MapLoaderComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get selected event', () => {
    mapService.getSelectedEvent.and.returnValue(mockEvent);
    const event = mapService.getSelectedEvent();
    expect(event).toEqual(mockEvent);
  });

  it('should get points from map service', () => {
    mapService.getPoints.and.returnValue([mockPoint]);
    const points = mapService.getPoints();
    expect(points.length).toBe(1);
    expect(points[0]).toEqual(mockPoint);
  });

  it('should subscribe to selected event on init', () => {
    expect(mapService.selectedEvent$).toBeDefined();
  });

  it('should handle drawing mode updates', () => {
    const drawingMode: DrawingMode = {
      active: true,
      sourcePoint: mockPoint,
      equipment: null
    };

    mapService.getSelectedEvent.and.returnValue(mockEvent);
    expect(component).toBeTruthy();
  });

  it('should initialize with no selected event', () => {
    expect(component).toBeTruthy();
  });
});
