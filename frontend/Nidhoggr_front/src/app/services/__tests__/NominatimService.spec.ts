import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NominatimService, NominatimResult } from '../NominatimService';

describe('NominatimService', () => {
  let service: NominatimService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:8080';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NominatimService]
    });
    service = TestBed.inject(NominatimService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('devrait créer le service', () => {
    expect(service).toBeTruthy();
  });

  it('devrait rechercher des lieux', () => {
    const mockResults: NominatimResult[] = [
      {
        place_id: 123,
        lat: '48.8566',
        lon: '2.3522',
        display_name: 'Paris, France',
        boundingbox: ['48.8', '48.9', '2.3', '2.4']
      }
    ];

    service.search('Paris').subscribe((results) => {
      expect(results.length).toBe(1);
      expect(results[0].display_name).toBe('Paris, France');
    });

    const req = httpMock.expectOne(
      `${apiUrl}/search?q=Paris&format=json&limit=10`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResults);
  });

  it('devrait encoder la requête de recherche', () => {
    const mockResults: NominatimResult[] = [];

    service.search('New York').subscribe();

    const req = httpMock.expectOne((request) => {
      return request.url.includes('New%20York');
    });
    req.flush(mockResults);
  });

  it('devrait faire une recherche inversée par coordonnées', () => {
    const mockResult: NominatimResult = {
      place_id: 456,
      lat: '48.8566',
      lon: '2.3522',
      display_name: '8 Rue de Rivoli, 75004 Paris',
      boundingbox: ['48.85', '48.86', '2.35', '2.36']
    };

    service.reverse(48.8566, 2.3522).subscribe((result) => {
      expect(result.display_name).toContain('Paris');
    });

    const req = httpMock.expectOne(
      `${apiUrl}/reverse?lat=48.8566&lon=2.3522&format=json`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResult);
  });

  it('devrait gérer les erreurs de recherche', () => {
    service.search('invalid').subscribe({
      next: () => fail('devrait avoir échoué'),
      error: (error) => {
        expect(error.status).toBe(500);
      }
    });

    const req = httpMock.expectOne((request) => {
      return request.url.includes('/search');
    });
    req.flush('Server error', { status: 500, statusText: 'Server Error' });
  });

  it('devrait gérer les résultats vides', () => {
    service.search('zzzzzzzzzzz').subscribe((results) => {
      expect(results.length).toBe(0);
    });

    const req = httpMock.expectOne((request) => {
      return request.url.includes('/search');
    });
    req.flush([]);
  });

  it('devrait inclure les paramètres corrects dans la requête', () => {
    service.search('test').subscribe();

    const req = httpMock.expectOne((request) => {
      return (
        request.url.includes('format=json') &&
        request.url.includes('limit=10')
      );
    });
    req.flush([]);
  });
});
