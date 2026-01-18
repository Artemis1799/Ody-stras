import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TeamService } from '../TeamService';
import { Team } from '../../models/teamModel';
import { environment } from '../../../environments/environment';

describe('TeamService', () => {
  let service: TeamService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/api/Team`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TeamService]
    });

    service = TestBed.inject(TeamService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('devrait créer le service', () => {
    expect(service).toBeTruthy();
  });

  it('devrait initialiser les signals', () => {
    expect(service.teams()).toEqual([]);
    expect(service.loading()).toBe(false);
    expect(service.initialized()).toBe(false);
    expect(service.count()).toBe(0);
  });

  it('devrait charger les équipes', () => {
    const mockTeams: Team[] = [
      { uuid: '1', eventId: 'event-1', teamName: 'Team A' },
      { uuid: '2', eventId: 'event-1', teamName: 'Team B' }
    ];

    service.load();

    const req = httpMock.expectOne(apiUrl);
    req.flush(mockTeams);

    expect(service.teams()).toEqual(mockTeams);
    expect(service.initialized()).toBe(true);
  });

  it('devrait créer une équipe', () => {
    const newTeam: Team = { uuid: '1', eventId: 'event-1', teamName: 'New Team' };

    service.create(newTeam).subscribe();

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    req.flush(newTeam);

    expect(service.count()).toBe(1);
  });

  it('devrait mettre à jour une équipe', () => {
    const team: Team = { uuid: '1', eventId: 'event-1', teamName: 'Original' };
    service['_teams'].set([team]);

    const updated: Team = { ...team, teamName: 'Updated' };
    service.update('1', updated).subscribe();

    expect(service.teams()[0].teamName).toBe('Updated');

    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush(updated);
  });

  it('devrait supprimer une équipe', () => {
    service['_teams'].set([{ uuid: '1', eventId: 'event-1', teamName: 'Team' }]);

    service.delete('1').subscribe();

    expect(service.teams().length).toBe(0);

    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush(null);
  });

  it('devrait restaurer l\'état en cas d\'erreur de mise à jour', (done) => {
    const originalTeam: Team = { uuid: '1', eventId: 'event-1', teamName: 'Original' };
    service['_teams'].set([originalTeam]);

    const updated: Team = { ...originalTeam, teamName: 'Updated' };

    service.update('1', updated).subscribe({
      next: () => fail('devrait avoir échoué'),
      error: () => {
        expect(service.teams()[0].teamName).toBe('Original');
        done();
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush('Error', { status: 404, statusText: 'Not Found' });
  });

  it('devrait récupérer toutes les équipes', () => {
    const mockTeams: Team[] = [{ uuid: '1', eventId: 'event-1', teamName: 'Team A' }];

    service.getAll().subscribe((teams) => {
      expect(teams).toEqual(mockTeams);
    });

    const req = httpMock.expectOne(apiUrl);
    req.flush(mockTeams);
  });

  it('devrait récupérer une équipe par ID', () => {
    const mockTeam: Team = { uuid: '1', eventId: 'event-1', teamName: 'Team A' };

    service.getById('1').subscribe((team) => {
      expect(team).toEqual(mockTeam);
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush(mockTeam);
  });

  it('devrait récupérer les équipes par événement', () => {
    const mockTeams: Team[] = [{ uuid: '1', eventId: 'event-1', teamName: 'Team A' }];

    service.getByEventId('event-1').subscribe((teams) => {
      expect(teams).toEqual(mockTeams);
    });

    const req = httpMock.expectOne(`${apiUrl}/event/event-1`);
    req.flush(mockTeams);
  });

  it('devrait supprimer toutes les équipes', () => {
    service['_teams'].set([{ uuid: '1', eventId: 'event-1', teamName: 'Team' }]);

    service.deleteAll().subscribe((response) => {
      expect(response.deletedCount).toBe(1);
    });

    expect(service.teams().length).toBe(0);

    const req = httpMock.expectOne(apiUrl);
    req.flush({ deletedCount: 1 });
  });

  it('devrait rafraîchir les équipes', () => {
    const newTeams: Team[] = [{ uuid: '2', eventId: 'event-1', teamName: 'New Team' }];

    service.refresh();

    const req = httpMock.expectOne(apiUrl);
    req.flush(newTeams);

    expect(service.teams()).toEqual(newTeams);
  });
});
