import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ActionService } from '../ActionService';
import { environment } from '../../../environments/environment';
import { Action } from '../../models/actionModel';

describe('ActionService', () => {
  let service: ActionService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/api/Action`;

const createMockAction = (overrides?: Partial<Action>): Action => ({
  uuid: '1',
  planningId: 'planning-1',
  securityZoneId: 'zone-1',
  type: 0,
  date: new Date(),
  longitude: 1,
  latitude: 1,
  ...overrides
});
const mockActions: Action[] = [
  createMockAction({ uuid: '1' }),
  createMockAction({ uuid: '2' })
];


  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ActionService]
    });

    service = TestBed.inject(ActionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all actions and update actions$', (done) => {
    service.getAll().subscribe(actions => {
      expect(actions.length).toBe(2);
    });

    service.actions$.subscribe(actions => {
      if (actions.length === 2) {
        expect(actions).toEqual(mockActions);
        done();
      }
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockActions);
  });

  it('should get action by id', (done) => {
    service.getById('1').subscribe(action => {
      expect(action).toBeDefined();
      expect(action.uuid).toBe('1');
      done();
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockActions[0]);
  });

  it('should get actions by planning id', (done) => {
    service.getByPlanningId('planning-1').subscribe(actions => {
      expect(actions.length).toBe(2);
      done();
    });

    const req = httpMock.expectOne(`${apiUrl}/planning/planning-1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockActions);
  });

  it('should get actions by security zone id', (done) => {
    service.getBySecurityZoneId('zone-1').subscribe(actions => {
      expect(actions.length).toBe(2);
      done();
    });

    const req = httpMock.expectOne(`${apiUrl}/securityzone/zone-1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockActions);
  });

  it('should create action and update actions$', (done) => {
  const newAction = createMockAction({ uuid: '3' });

  service.create(newAction).subscribe(action => {
    expect(action.uuid).toBe('3');
  });

  service.actions$.subscribe(actions => {
    if (actions.length === 1) {
      expect(actions[0].uuid).toBe('3');
      done();
    }
  });

  const req = httpMock.expectOne(apiUrl);
  expect(req.request.method).toBe('POST');
  req.flush(newAction);
});

 it('should update action and update actions$', (done) => {
  (service as any)._actions$.next([...mockActions]);

  const updated = createMockAction({
    uuid: '1',
    type: 0
  });

  let callCount = 0;
  service.update('1', updated).subscribe(action => {
    expect(action.type).toBe(0);
  });

  service.actions$.subscribe(actions => {
    callCount++;
    const action = actions.find(a => a.uuid === '1');
    if (action?.type === 0 && callCount === 2) {
      done();
    }
  });

  const req = httpMock.expectOne(`${apiUrl}/1`);
  expect(req.request.method).toBe('PUT');
  req.flush(updated);
});

  it('should delete action and update actions$', (done) => {
    (service as any)._actions$.next([...mockActions]);

    service.delete('1').subscribe(() => {});

    service.actions$.subscribe(actions => {
      if (actions.length === 1) {
        expect(actions[0].uuid).toBe('2');
        done();
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should delete all actions', (done) => {
    (service as any)._actions$.next([...mockActions]);

    service.deleteAll().subscribe(response => {
      expect(response.deletedCount).toBe(2);
    });

    service.actions$.subscribe(actions => {
      if (actions.length === 0) {
        done();
      }
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('DELETE');
    req.flush({ deletedCount: 2 });
  });
});
