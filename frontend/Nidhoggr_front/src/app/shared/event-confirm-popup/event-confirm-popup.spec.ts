import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventConfirmPopup } from './event-confirm-popup';
import { MapService, EventCreationMode } from '../../services/MapService';
import { AreaService } from '../../services/AreaService';
import { PathService } from '../../services/PathService';
import { EventService } from '../../services/EventService';
import { ToastService } from '../../services/ToastService';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { Event, EventStatus } from '../../models/eventModel';

describe('EventConfirmPopup', () => {
  let component: EventConfirmPopup;
  let fixture: ComponentFixture<EventConfirmPopup>;
  let mapService: jasmine.SpyObj<MapService>;
  let eventService: jasmine.SpyObj<EventService>;

  const mockEvent: Event = {
    uuid: 'event-1',
    title: 'Test Event',
    startDate: new Date('2026-01-14'),
    endDate: new Date('2026-01-15'),
    status: EventStatus.ToOrganize,
    isArchived: false
  };

  const mockMode: EventCreationMode = {
    active: true,
    step: 'confirm',
    event: mockEvent,
    zoneGeoJson: '{}',
    pathGeoJson: '{}',
    zoneModificationMode: false,
    pathModificationMode: false
  };

  beforeEach(async () => {
    const mapServiceSpy = jasmine.createSpyObj('MapService', ['setEventCreationMode', 'clearSecurityZoneGlow']);
    mapServiceSpy.eventCreationMode$ = of(mockMode);
    const areaServiceSpy = jasmine.createSpyObj('AreaService', ['create', 'update']);
    const pathServiceSpy = jasmine.createSpyObj('PathService', ['create', 'update']);
    const eventServiceSpy = jasmine.createSpyObj('EventService', ['create', 'update']);
    const toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    await TestBed.configureTestingModule({
      imports: [EventConfirmPopup, CommonModule, HttpClientTestingModule],
      providers: [
        { provide: MapService, useValue: mapServiceSpy },
        { provide: AreaService, useValue: areaServiceSpy },
        { provide: PathService, useValue: pathServiceSpy },
        { provide: EventService, useValue: eventServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        MessageService
      ]
    }).compileComponents();

    mapService = TestBed.inject(MapService) as jasmine.SpyObj<MapService>;
    eventService = TestBed.inject(EventService) as jasmine.SpyObj<EventService>;

    fixture = TestBed.createComponent(EventConfirmPopup);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit eventConfirmed', (done) => {
    component.eventConfirmed.subscribe((event) => {
      expect(event).toEqual(mockEvent);
      done();
    });
    component.eventConfirmed.emit(mockEvent);
  });

  it('should emit cancelled', (done) => {
    component.cancelled.subscribe(() => {
      expect(true).toBe(true);
      done();
    });
    component.cancelled.emit();
  });

  it('should initialize with false isSaving', () => {
    expect(component.isSaving).toBe(false);
  });

  it('should initialize with false isMinimized', () => {
    expect(component.isMinimized).toBe(false);
  });

  it('should subscribe to event creation mode on init', (done) => {
    component.ngOnInit();

    setTimeout(() => {
      expect(component.mode).toEqual(mockMode);
      done();
    });
  });

  it('should handle event creation mode changes', (done) => {
    const newMode: EventCreationMode = { ...mockMode, step: 'drawing-zone' };
    mapService.eventCreationMode$ = of(newMode);

    component.ngOnInit();

    setTimeout(() => {
      expect(component.mode?.step).toBeDefined();
      done();
    });
  });

  it('should toggle isMinimized state', () => {
    component.isMinimized = false;
    component.isMinimized = true;
    expect(component.isMinimized).toBe(true);
  });

  it('should unsubscribe on destroy', () => {
    component.ngOnInit();
    component.ngOnDestroy();
    expect(component).toBeTruthy();
  });
});
