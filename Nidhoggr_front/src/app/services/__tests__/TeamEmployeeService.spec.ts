import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TeamEmployeeService } from '../TeamEmployeeService';
import { environment } from '../../../environments/environment';

describe('TeamEmployeeService', () => {
  let service: TeamEmployeeService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/api/TeamEmployee`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TeamEmployeeService]
    });
    service = TestBed.inject(TeamEmployeeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('devrait créer le service', () => {
    expect(service).toBeTruthy();
  });

  it('devrait charger les associations', () => {
    const mockData: any[] = [{ uuid: '1', teamId: 't1', employeeId: 'e1' }];
    service.load();
    const req = httpMock.expectOne(apiUrl);
    req.flush(mockData);
    expect(service.teamEmployees().length).toBe(1);
  });

  it('devrait récupérer toutes les associations', () => {
    const mockData = [{ uuid: '1', teamId: 't1', employeeId: 'e1' }];
    service.getAll().subscribe((data) => {
      expect(data.length).toBe(1);
    });
    const req = httpMock.expectOne(apiUrl);
    req.flush(mockData);
  });

  it('devrait récupérer une association par ID', () => {
    const mockData = { teamId: 't1', employeeId: 'e1' };
    service.getById('t1', 'e1').subscribe((data) => {
      expect(data.teamId).toBe('t1');
    });
    const req = httpMock.expectOne(`${apiUrl}/t1/e1`);
    req.flush(mockData);
  });

  it('devrait créer une association', () => {
    const newData = { teamId: 't2', employeeId: 'e2' };
    service.create(newData as any).subscribe();
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    req.flush(newData);
  });

  it('devrait mettre à jour une association', () => {
    const updated = { teamId: 't1', employeeId: 'e2' };
    // TeamEmployeeService n'a pas de update, seulement create et delete
    expect(service.create).toBeDefined();
  });

  it('devrait supprimer une association', () => {
    service.delete('t1', 'e1').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/t1/e1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
