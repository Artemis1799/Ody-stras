import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PictureService } from '../PictureService';
import { Picture } from '../../models/pictureModel';
import { environment } from '../../../environments/environment';

describe('PictureService', () => {
  let service: PictureService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/api/Picture`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PictureService]
    });
    service = TestBed.inject(PictureService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('devrait créer le service', () => {
    expect(service).toBeTruthy();
  });

  it('devrait récupérer toutes les images', () => {
    const mockPictures: Picture[] = [{ uuid: '1', pointId: 'p1', pictureData: 'base64data' }];
    service.getAll().subscribe((pictures) => {
      expect(pictures.length).toBe(1);
    });
    const req = httpMock.expectOne(apiUrl);
    req.flush(mockPictures);
  });

  it('devrait récupérer une image par ID', () => {
    const mockPicture: Picture = { uuid: '1', pointId: 'p1', pictureData: 'base64data' };
    service.getById('1').subscribe((picture) => {
      expect(picture.uuid).toBe('1');
    });
    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush(mockPicture);
  });

  it('devrait créer une image', () => {
    const newPicture: Picture = { uuid: '2', pointId: 'p2', pictureData: 'base64data' };
    service.create(newPicture).subscribe();
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    req.flush(newPicture);
  });

  it('devrait mettre à jour une image', () => {
    const updated: Picture = { uuid: '1', pointId: 'p1', pictureData: 'newdata' };
    service.update('1', updated).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('PUT');
    req.flush(updated);
  });

  it('devrait supprimer une image', () => {
    service.delete('1').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('devrait émettre via BehaviorSubject', (done) => {
    const mockPictures: Picture[] = [{ uuid: '1', pointId: 'p1', pictureData: 'data' }];
    let callCount = 0;
    
    service.pictures$.subscribe((pictures) => {
      callCount++;
      if (callCount === 2) {  // Only check on second emission (after getAll completes)
        expect(pictures.length).toBe(1);
        done();
      }
    });
    
    service.getAll().subscribe();
    const req = httpMock.expectOne(apiUrl);
    req.flush(mockPictures);
  });

  it('devrait gérer les erreurs', () => {
    service.getById('invalid').subscribe({
      next: () => fail('devrait avoir échoué'),
      error: (error) => {
        expect(error.status).toBe(404);
      }
    });
    const req = httpMock.expectOne(`${apiUrl}/invalid`);
    req.flush('Not found', { status: 404, statusText: 'Not Found' });
  });
});
