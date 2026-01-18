import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventEditPopup } from './event-edit-popup';
import { EventService } from '../../services/EventService';
import { MapService } from '../../services/MapService';
import { ToastService } from '../../services/ToastService';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { Event, EventStatus } from '../../models/eventModel';

describe('EventEditPopup', () => {
  let component: EventEditPopup;
  let fixture: ComponentFixture<EventEditPopup>;
  let eventService: jasmine.SpyObj<EventService>;
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
    const eventServiceSpy = jasmine.createSpyObj('EventService', ['update', 'delete', 'archive', 'unarchive']);
    const mapServiceSpy = jasmine.createSpyObj('MapService', ['setEventAreaVisible', 'getEventAreaVisible']);
    const toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);
    mapServiceSpy.getEventAreaVisible.and.returnValue(of(true));

    await TestBed.configureTestingModule({
      imports: [EventEditPopup, CommonModule, FormsModule, HttpClientTestingModule],
      providers: [
        { provide: EventService, useValue: eventServiceSpy },
        { provide: MapService, useValue: mapServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        MessageService
      ]
    }).compileComponents();

    eventService = TestBed.inject(EventService) as jasmine.SpyObj<EventService>;
    mapService = TestBed.inject(MapService) as jasmine.SpyObj<MapService>;

    fixture = TestBed.createComponent(EventEditPopup);
    component = fixture.componentInstance;
    component.event = mockEvent;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit close event', (done) => {
    component.close.subscribe(() => {
      expect(true).toBe(true);
      done();
    });
    component.close.emit();
  });

  it('should emit eventUpdated', (done) => {
    component.eventUpdated.subscribe((event) => {
      expect(event).toEqual(mockEvent);
      done();
    });
    component.eventUpdated.emit(mockEvent);
  });

  it('should emit eventDeleted', (done) => {
    component.eventDeleted.subscribe((id) => {
      expect(id).toBe('event-1');
      done();
    });
    component.eventDeleted.emit('event-1');
  });

  it('should initialize form data on init', () => {
    component.ngOnInit();
    expect(component.formData.title).toBe(mockEvent.title);
    expect(component.formData.status).toBeDefined();
  });

  it('should set event area visibility', () => {
    mapService.setEventAreaVisible.and.returnValue(undefined);
    component.eventAreaVisible = true;
    mapService.setEventAreaVisible(true);
    expect(mapService.setEventAreaVisible).toHaveBeenCalledWith(true);
  });

  it('should initialize isSubmitting as false', () => {
    expect(component.isSubmitting).toBe(false);
  });

  it('should initialize errorMessage as empty', () => {
    expect(component.errorMessage).toBe('');
  });

  it('should initialize showDeleteConfirm as false', () => {
    expect(component.showDeleteConfirm).toBe(false);
  });

  it('should toggle delete confirmation', () => {
    component.showDeleteConfirm = false;
    component.showDeleteConfirm = true;
    expect(component.showDeleteConfirm).toBe(true);
  });

  it('should handle archive toggle', () => {
    component.isArchived = false;
    component.isArchived = true;
    expect(component.isArchived).toBe(true);
  });

  it('should update event', (done) => {
    const updated = { ...mockEvent, title: 'Updated Event' };
    eventService.update.and.returnValue(of(updated));

    eventService.update('event-1', updated).subscribe((result) => {
      expect(result.title).toBe('Updated Event');
      done();
    });
  });

  it('should delete event', (done) => {
    eventService.delete.and.returnValue(of(undefined));

    eventService.delete('event-1').subscribe(() => {
      expect(eventService.delete).toHaveBeenCalledWith('event-1');
      done();
    });
  });
});
