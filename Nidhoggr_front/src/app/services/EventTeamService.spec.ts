import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EventTeamService } from './EventTeamService';
import { EventTeam } from '../models/eventTeamModel';
import { environment } from '../../environments/environment';

describe('EventTeamService', () => {
  let service: EventTeamService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/api/EventTeam`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EventTeamService]
    });
    service = TestBed.inject(EventTeamService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  const mockEventTeam: EventTeam = {
    eventId: 'event-1',
    teamId: 'team-1'
  };

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should get all event teams', (done) => {
    const mockEventTeams = [mockEventTeam];
    service.getAll().subscribe((eventTeams) => {
      expect(eventTeams).toEqual(mockEventTeams);
      done();
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockEventTeams);
  });

  it('should get event team by composite key', (done) => {
    service.getById('event-1', 'team-1').subscribe((eventTeam) => {
      expect(eventTeam).toEqual(mockEventTeam);
      done();
    });

    const req = httpMock.expectOne(`${apiUrl}/event-1/team-1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockEventTeam);
  });

  it('should create event team', (done) => {
    service.create(mockEventTeam).subscribe((created) => {
      expect(created).toEqual(mockEventTeam);
      done();
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockEventTeam);
    req.flush(mockEventTeam);
  });

  it('should update event team with composite key', (done) => {
    const updated = { ...mockEventTeam };
    service.update('event-1', 'team-1', updated).subscribe((result) => {
      expect(result).toEqual(updated);
      done();
    });

    const req = httpMock.expectOne(`${apiUrl}/event-1/team-1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updated);
    req.flush(updated);
  });

  it('should delete event team with composite key', (done) => {
    service.delete('event-1', 'team-1').subscribe(() => {
      expect(true).toBe(true);
      done();
    });

    const req = httpMock.expectOne(`${apiUrl}/event-1/team-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should delete all event teams', (done) => {
    service.deleteAll().subscribe((result) => {
      expect(result.deletedCount).toBe(3);
      done();
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('DELETE');
    req.flush({ deletedCount: 3 });
  });

  it('should handle 404 error on getById', (done) => {
    service.getById('event-1', 'team-1').subscribe({
      next: () => {},
      error: (error) => {
        expect(error.status).toBe(404);
        done();
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/event-1/team-1`);
    req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
  });

  it('should handle 500 error on create', (done) => {
    service.create(mockEventTeam).subscribe({
      next: () => {},
      error: (error) => {
        expect(error.status).toBe(500);
        done();
      }
    });

    const req = httpMock.expectOne(apiUrl);
    req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
  });
});
