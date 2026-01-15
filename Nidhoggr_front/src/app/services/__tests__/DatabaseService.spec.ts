import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DatabaseService } from '../DatabaseService';
import { environment } from '../../../environments/environment';

describe('DatabaseService', () => {
  let service: DatabaseService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/api/Database`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DatabaseService]
    });

    service = TestBed.inject(DatabaseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Vérifie qu'aucune requête HTTP n'est en attente
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should reset database', (done) => {
    const mockResponse = { users: 5, events: 10 };

    service.resetDatabase().subscribe(res => {
      expect(res).toEqual(mockResponse);
      done();
    });

    const req = httpMock.expectOne(`${apiUrl}/reset`);
    expect(req.request.method).toBe('DELETE');
    req.flush(mockResponse);
  });

  it('should seed test data', (done) => {
    const mockResponse = 'Test data seeded';

    service.seedTestData().subscribe(res => {
      expect(res).toBe(mockResponse);
      done();
    });

    const req = httpMock.expectOne(`${apiUrl}/seed`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({}); // Vérifie que le corps est vide
    req.flush(mockResponse);
  });
});
