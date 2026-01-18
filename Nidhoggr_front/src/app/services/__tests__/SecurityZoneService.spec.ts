import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SecurityZoneService } from '../SecurityZoneService';
import { environment } from '../../../environments/environment';

describe('SecurityZoneService', () => {
  let service: SecurityZoneService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/api/SecurityZone`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SecurityZoneService]
    });
    service = TestBed.inject(SecurityZoneService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('devrait créer le service', () => {
    expect(service).toBeTruthy();
  });

  it('devrait récupérer toutes les zones', () => {
    const mockZones = [{ uuid: '1', name: 'Zone A', latitude: 48.8566, longitude: 2.3522 }];
    service.getAll().subscribe((zones) => {
      expect(zones.length).toBe(1);
    });
    const req = httpMock.expectOne(apiUrl);
    req.flush(mockZones);
  });

  it('devrait récupérer une zone par ID', () => {
    const mockZone = { uuid: '1', name: 'Zone A', latitude: 48.8566, longitude: 2.3522 };
    service.getById('1').subscribe((zone) => {
      expect(zone.uuid).toBe('1');
    });
    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush(mockZone);
  });

  it('devrait récupérer les zones par événement', () => {
    const mockZones = [{ uuid: '1', name: 'Zone A' }];
    service.getByEventId('event-1').subscribe((zones) => {
      expect(zones.length).toBe(1);
    });
    const req = httpMock.expectOne(`${apiUrl}/event/event-1`);
    req.flush(mockZones);
  });

  it('devrait créer une zone', () => {
    const newZone = { uuid: '2', name: 'Zone B', latitude: 48.9, longitude: 2.4 };
    service.create(newZone as any).subscribe();
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    req.flush(newZone);
  });

  it('devrait mettre à jour une zone', () => {
    const updated = { uuid: '1', name: 'Updated Zone', latitude: 48.8566, longitude: 2.3522 };
    service.update('1', updated as any).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('PUT');
    req.flush(updated);
  });

  it('devrait supprimer une zone', () => {
    service.delete('1').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('devrait émettre via BehaviorSubject', (done) => {
    const mockZones = [{ uuid: '1', name: 'Zone' }];
    let callCount = 0;
    
    service.securityZones$.subscribe((zones) => {
      callCount++;
      if (callCount === 2) {  // Only check on second emission (after getAll completes)
        expect(zones.length).toBe(1);
        done();
      }
    });
    
    service.getAll().subscribe();
    const req = httpMock.expectOne(apiUrl);
    req.flush(mockZones);
  });
});
