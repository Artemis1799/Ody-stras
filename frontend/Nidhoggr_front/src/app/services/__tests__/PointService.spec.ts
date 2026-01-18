import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PointService } from '../PointService';
import { environment } from '../../../environments/environment';

describe('PointService', () => {
  let service: PointService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/api/Point`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PointService]
    });

    service = TestBed.inject(PointService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all points', (done) => {
    service.getAll().subscribe((points) => {
      expect(Array.isArray(points)).toBe(true);
      done();
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should get points by event', (done) => {
    service.getByEventId('event-1').subscribe((points) => {
      expect(Array.isArray(points)).toBe(true);
      done();
    });

    const req = httpMock.expectOne(`${apiUrl}/event/event-1`);
    req.flush([]);
  });

  it('should create point', (done) => {
    const newPoint = { 
      name: 'Test Point',
      latitude: 48.8566,
      longitude: 2.3522,
      eventId: 'event-1',
      validated: true
    };
    service.create(newPoint as any).subscribe(() => {
      done();
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    req.flush({ uuid: 'point-1', ...newPoint });
  });

  it('should update point', (done) => {
    const updated = { name: 'Updated Point' };
    service.update('point-1', updated as any).subscribe(() => {
      done();
    });

    const req = httpMock.expectOne(`${apiUrl}/point-1`);
    expect(req.request.method).toBe('PUT');
    req.flush(updated);
  });

  it('should delete point', (done) => {
    service.delete('point-1').subscribe(() => {
      done();
    });

    const req = httpMock.expectOne(`${apiUrl}/point-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
