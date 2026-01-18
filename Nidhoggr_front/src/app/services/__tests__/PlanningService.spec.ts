import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PlanningService } from '../PlanningService';
import { environment } from '../../../environments/environment';

describe('PlanningService', () => {
  let service: PlanningService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/api/Planning`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PlanningService]
    });
    service = TestBed.inject(PlanningService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('devrait créer le service', () => {
    expect(service).toBeTruthy();
  });

  it('devrait récupérer tous les plannings', () => {
    const mockPlannings = [{ uuid: '1', teamId: 't1', date: new Date() }];
    service.getAll().subscribe((plannings) => {
      expect(plannings.length).toBe(1);
    });
    const req = httpMock.expectOne(apiUrl);
    req.flush(mockPlannings);
  });

  it('devrait récupérer un planning par ID', () => {
    const mockPlanning = { uuid: '1', teamId: 't1', date: new Date() };
    service.getById('1').subscribe((planning) => {
      expect(planning.uuid).toBe('1');
    });
    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush(mockPlanning);
  });

  it('devrait récupérer le planning par équipe', () => {
    const mockPlanning = { uuid: '1', teamId: 't1', date: new Date() };
    service.getByTeamId('t1').subscribe((planning) => {
      expect(planning.teamId).toBe('t1');
    });
    const req = httpMock.expectOne(`${apiUrl}/team/t1`);
    req.flush(mockPlanning);
  });

  it('devrait récupérer l\'itinéraire', () => {
    const mockActions = [{ uuid: 'a1', planningId: '1' }];
    service.getItinerary('1').subscribe((actions) => {
      expect(actions.length).toBe(1);
    });
    const req = httpMock.expectOne(`${apiUrl}/1/itinerary`);
    req.flush(mockActions);
  });

  it('devrait créer un planning', () => {
    const newPlanning = { uuid: '2', teamId: 't2', date: new Date() };
    service.create(newPlanning as any).subscribe();
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    req.flush(newPlanning);
  });

  it('devrait mettre à jour un planning', () => {
    const updated = { uuid: '1', teamId: 't1', date: new Date() };
    service.update('1', updated as any).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('PUT');
    req.flush(updated);
  });

  it('devrait supprimer un planning', () => {
    service.delete('1').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
