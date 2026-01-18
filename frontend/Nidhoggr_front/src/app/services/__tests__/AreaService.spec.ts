import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AreaService } from '../AreaService';
import { environment } from '../../../environments/environment';
import { Area } from '../../models/areaModel';

describe('AreaService', () => {
  let service: AreaService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/api/Area`;

  const createMockArea = (overrides?: Partial<Area>): Area => ({
    uuid: 'area-1',
    eventId: 'event-1',
    colorHex: '#FFFFFF',
    geoJson: '{}',
    ...overrides
  });

  const mockAreas: Area[] = [
    createMockArea({ uuid: 'area-1' }),
    createMockArea({ uuid: 'area-2' })
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AreaService]
    });

    service = TestBed.inject(AreaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all areas and update areas$', (done) => {
    service.getAll().subscribe(areas => {
      expect(areas.length).toBe(2);
    });

    service.areas$.subscribe(areas => {
      if (areas.length === 2) {
        expect(areas).toEqual(mockAreas);
        done();
      }
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockAreas);
  });

  it('should get area by id', (done) => {
    service.getById('area-1').subscribe(area => {
      expect(area.uuid).toBe('area-1');
      done();
    });

    const req = httpMock.expectOne(`${apiUrl}/area-1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockAreas[0]);
  });

  it('should get areas by event id and update areas$', (done) => {
    service.getByEventId('event-1').subscribe(areas => {
      expect(areas.length).toBe(2);
    });

    service.areas$.subscribe(areas => {
      if (areas.length === 2) {
        expect(areas[0].eventId).toBe('event-1');
        done();
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/event/event-1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockAreas);
  });

  it('should create area and update areas$', (done) => {
    const newArea: Omit<Area, 'uuid'> = {
      eventId: 'event-1',
      colorHex: '#000000',
      geoJson: '{}'
    };

    const createdArea = createMockArea({ uuid: 'area-3' });

    service.create(newArea).subscribe(area => {
      expect(area.uuid).toBe('area-3');
    });

    service.areas$.subscribe(areas => {
      if (areas.length === 1) {
        expect(areas[0].uuid).toBe('area-3');
        done();
      }
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    req.flush(createdArea);
  });

  it('should update area and update areas$', (done) => {
    (service as any)._areas$.next([...mockAreas]);

    const updated = createMockArea({
      uuid: 'area-1',
      colorHex: '#FF0000'
    });

    service.update('area-1', updated).subscribe(area => {
      expect(area.colorHex).toBe('#FF0000');
    });

    service.areas$.subscribe(areas => {
      const area = areas.find(a => a.uuid === 'area-1');
      if (area?.colorHex === '#FF0000') {
        done();
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/area-1`);
    expect(req.request.method).toBe('PUT');
    req.flush(updated);
  });

  it('should delete area and update areas$', (done) => {
    (service as any)._areas$.next([...mockAreas]);

    service.delete('area-1').subscribe(() => {});

    service.areas$.subscribe(areas => {
      if (areas.length === 1) {
        expect(areas[0].uuid).toBe('area-2');
        done();
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/area-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should delete all areas', (done) => {
    (service as any)._areas$.next([...mockAreas]);

    service.deleteAll().subscribe(response => {
      expect(response.deletedCount).toBe(2);
    });

    service.areas$.subscribe(areas => {
      if (areas.length === 0) {
        done();
      }
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('DELETE');
    req.flush({ deletedCount: 2 });
  });
});
