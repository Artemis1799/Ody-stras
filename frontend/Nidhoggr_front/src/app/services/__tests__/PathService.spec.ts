import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PathService } from '../PathService';
import { environment } from '../../../environments/environment';

describe('PathService', () => {
  let service: PathService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/api/Path`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PathService]
    });
    service = TestBed.inject(PathService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('devrait créer le service', () => {
    expect(service).toBeTruthy();
  });

  it('devrait récupérer tous les chemins', () => {
    const mockPaths = [{ uuid: '1', name: 'Path A', points: [] }];
    service.getAll().subscribe((paths) => {
      expect(paths.length).toBe(1);
    });
    const req = httpMock.expectOne(apiUrl);
    req.flush(mockPaths);
  });

  it('devrait récupérer un chemin par ID', () => {
    const mockPath = { uuid: '1', name: 'Path A', points: [] };
    service.getById('1').subscribe((path) => {
      expect(path.uuid).toBe('1');
    });
    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush(mockPath);
  });

  it('devrait récupérer les chemins par événement', () => {
    const mockPaths = [{ uuid: '1', name: 'Path A', points: [] }];
    service.getByEventId('event-1').subscribe((paths) => {
      expect(paths.length).toBe(1);
    });
    const req = httpMock.expectOne(`${apiUrl}/event/event-1`);
    req.flush(mockPaths);
  });

  it('devrait créer un chemin', () => {
    const newPath = { uuid: '2', name: 'Path B', points: [] };
    service.create(newPath as any).subscribe();
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    req.flush(newPath);
  });

  it('devrait mettre à jour un chemin', () => {
    const updated = { uuid: '1', name: 'Updated Path', points: [] };
    service.update('1', updated as any).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('PUT');
    req.flush(updated);
  });

  it('devrait supprimer un chemin', () => {
    service.delete('1').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('devrait émettre via BehaviorSubject', (done) => {
    const mockPaths = [{ uuid: '1', name: 'Path' }];
    let callCount = 0;
    
    service.paths$.subscribe((paths) => {
      callCount++;
      if (callCount === 2) {  // Only check on second emission (after getAll completes)
        expect(paths.length).toBe(1);
        done();
      }
    });
    
    service.getAll().subscribe();
    const req = httpMock.expectOne(apiUrl);
    req.flush(mockPaths);
  });
});
