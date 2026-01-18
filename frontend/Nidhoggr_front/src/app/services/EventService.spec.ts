import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EventService } from './EventService';
import { Event, EventStatus } from '../models/eventModel';
import { environment } from '../../environments/environment';

describe('EventService', () => {
  let service: EventService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/api/Event`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EventService]
    });
    service = TestBed.inject(EventService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  const mockEvent: Event = {
    uuid: '1',
    title: 'Test Event',
    startDate: new Date('2026-01-14'),
    endDate: new Date('2026-01-15'),
    status: EventStatus.ToOrganize,
    isArchived: false
  };

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should load events from API and update signals', (done) => {
    const mockEvents = [mockEvent];
    service.load();

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockEvents);

    setTimeout(() => {
      expect(service.events()).toEqual(mockEvents);
      expect(service.initialized()).toBe(true);
      expect(service.loading()).toBe(false);
      done();
    });
  });

  it('should not load if already loading', () => {
    service.load();
    httpMock.expectOne(apiUrl);

    service.load(); // Should not make another request
    httpMock.expectNone(apiUrl);
  });

  it('should refresh events silently', (done) => {
    const mockEvents = [mockEvent];
    service.refresh();

    const req = httpMock.expectOne(apiUrl);
    req.flush(mockEvents);

    setTimeout(() => {
      expect(service.events()).toEqual(mockEvents);
      done();
    });
  });

  it('should get all events and update signals', (done) => {
    const mockEvents = [mockEvent];
    service.getAll().subscribe(() => {
      expect(service.events()).toEqual(mockEvents);
      done();
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockEvents);
  });

  it('should get event by id', (done) => {
    service.getById('1').subscribe((event) => {
      expect(event).toEqual(mockEvent);
      done();
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockEvent);
  });

  it('should create event with optimistic update', (done) => {
    const newEvent: Event = { ...mockEvent, uuid: '' };
    let tempId = '';

    service.create(newEvent).subscribe((created) => {
      expect(created).toEqual(mockEvent);
      expect(service.events().some(e => e.uuid === mockEvent.uuid)).toBe(true);
      done();
    });

    // Check temp event added
    const tempEvents = service.events();
    expect(tempEvents.length).toBe(1);
    tempId = tempEvents[0].uuid;
    expect(tempId.startsWith('temp-')).toBe(true);

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    req.flush(mockEvent);
  });

  it('should update event with optimistic rollback on error', (done) => {
    // First load an event
    service.getAll().subscribe(() => {
      service.update('1', mockEvent).subscribe({
        next: () => {},
        error: () => {
          expect(service.events()).toEqual([mockEvent]);
          done();
        }
      });

      const updateReq = httpMock.expectOne(`${apiUrl}/1`);
      expect(updateReq.request.method).toBe('PUT');
      updateReq.error(new ErrorEvent('Network error'));
    });

    const req = httpMock.expectOne(apiUrl);
    req.flush([mockEvent]);
  });

  it('should delete event with rollback on error', (done) => {
    service.getAll().subscribe(() => {
      service.delete('1').subscribe({
        next: () => {},
        error: () => {
          expect(service.events().length).toBe(1);
          done();
        }
      });

      const deleteReq = httpMock.expectOne(`${apiUrl}/1`);
      expect(deleteReq.request.method).toBe('DELETE');
      deleteReq.error(new ErrorEvent('Network error'));
    });

    const req = httpMock.expectOne(apiUrl);
    req.flush([mockEvent]);
  });

  it('should archive event', (done) => {
    service.getAll().subscribe(() => {
      service.archive('1').subscribe((archived) => {
        expect(archived.isArchived).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('PUT');
      req.flush({ ...mockEvent, isArchived: true });
    });

    const req = httpMock.expectOne(apiUrl);
    req.flush([mockEvent]);
  });

  it('should unarchive event', (done) => {
    const archivedEvent = { ...mockEvent, isArchived: true };
    service.getAll().subscribe(() => {
      service.unarchive('1').subscribe((unarchived) => {
        expect(unarchived.isArchived).toBe(false);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('PUT');
      req.flush({ ...archivedEvent, isArchived: false });
    });

    const req = httpMock.expectOne(apiUrl);
    req.flush([archivedEvent]);
  });

  it('should compute activeEvents correctly', (done) => {
    const archivedEvent = { ...mockEvent, uuid: '2', isArchived: true };
    service.getAll().subscribe(() => {
      expect(service.activeEvents().length).toBe(1);
      expect(service.archivedEvents().length).toBe(1);
      done();
    });

    const req = httpMock.expectOne(apiUrl);
    req.flush([mockEvent, archivedEvent]);
  });

  it('should compute event count', (done) => {
    const events = [mockEvent, { ...mockEvent, uuid: '2' }];
    service.getAll().subscribe(() => {
      expect(service.count()).toBe(2);
      done();
    });

    const req = httpMock.expectOne(apiUrl);
    req.flush(events);
  });
});
