import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LayoutComponent } from './layout.component';
import { MapService } from '../../../services/MapService';
import { MessageService } from 'primeng/api';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { Event, EventStatus } from '../../../models/eventModel';

describe('LayoutComponent', () => {
  let component: LayoutComponent;
  let fixture: ComponentFixture<LayoutComponent>;
  let mapService: jasmine.SpyObj<MapService>;

  const mockEvent: Event = {
    uuid: 'event-1',
    title: 'Test Event',
    startDate: new Date('2026-01-14'),
    endDate: new Date('2026-01-15'),
    status: EventStatus.ToOrganize,
    isArchived: false
  };

  beforeEach(async () => {
    const mapServiceSpy = jasmine.createSpyObj('MapService', ['closeAllDrawers']);
    mapServiceSpy.selectedEvent$ = of(mockEvent);
    const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], { params: of({ id: 'event-1' }) });

    await TestBed.configureTestingModule({
      imports: [LayoutComponent, CommonModule, HttpClientTestingModule],
      providers: [
        { provide: MapService, useValue: mapServiceSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy },
        MessageService
      ]
    }).compileComponents();

    mapService = TestBed.inject(MapService) as jasmine.SpyObj<MapService>;

    fixture = TestBed.createComponent(LayoutComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should close all drawers on init', () => {
    component.ngOnInit();
    expect(mapService.closeAllDrawers).toHaveBeenCalled();
  });

  it('should subscribe to selected event on init', (done) => {
    component.ngOnInit();

    setTimeout(() => {
      expect(component.selectedEventName).toBe('Test Event');
      done();
    });
  });

  it('should update event name when selected event changes', (done) => {
    const newEvent = { ...mockEvent, title: 'Updated Event' };
    mapService.selectedEvent$ = of(newEvent);

    component.ngOnInit();

    setTimeout(() => {
      expect(component.selectedEventName).toBe('Updated Event');
      done();
    });
  });

  it('should set empty event name when no event selected', (done) => {
    mapService.selectedEvent$ = of(null);

    component.ngOnInit();

    setTimeout(() => {
      expect(component.selectedEventName).toBe('');
      done();
    });
  });

  it('should unsubscribe on destroy', () => {
    component.ngOnInit();
    component.ngOnDestroy();
    expect(component.selectedEventName).toBeDefined();
  });

  it('should initialize with empty event name', () => {
    expect(component.selectedEventName).toBe('');
  });
});
