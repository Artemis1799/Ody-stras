import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EventService } from '../EventService';
import { environment } from '../../../environments/environment';

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

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all events', (done) => {
    service.getAll().subscribe((events) => {
      expect(Array.isArray(events)).toBe(true);
      done();
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should get event by id', (done) => {
    service.getById('event-1').subscribe((event) => {
      expect(event).toBeDefined();
      done();
    });

    const req = httpMock.expectOne(`${apiUrl}/event-1`);
    expect(req.request.method).toBe('GET');
    req.flush({ uuid: 'event-1', name: 'Test Event' });
  });

  it('should create event', (done) => {
    const newEvent = { name: 'New Event' };
    service.create(newEvent as any).subscribe(() => {
      done();
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    req.flush({ uuid: 'event-1', name: 'New Event' });
  });

  it('should update event', (done) => {
    const updated = { name: 'Updated Event' };
    service.update('event-1', updated as any).subscribe(() => {
      done();
    });

    const req = httpMock.expectOne(`${apiUrl}/event-1`);
    expect(req.request.method).toBe('PUT');
    req.flush(updated);
  });

  it('should delete event', (done) => {
    service.delete('event-1').subscribe(() => {
      done();
    });

    const req = httpMock.expectOne(`${apiUrl}/event-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
