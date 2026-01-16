import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EmployeeService } from '../EmployeeService';
import { Employee } from '../../models/employeeModel';
import { environment } from '../../../environments/environment';

describe('EmployeeService', () => {
  let service: EmployeeService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/api/Employee`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EmployeeService]
    });

    service = TestBed.inject(EmployeeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Vérifie qu'aucune requête HTTP n'est en attente
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load employees and set signals', () => {
    const mockEmployees: Employee[] = [
      { uuid: '1', lastName: 'Doe', firstName: 'John' },
      { uuid: '2', lastName: 'Smith', firstName: 'Jane' }
    ];

    service.load();

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockEmployees);

    expect(service.employees()).toEqual(mockEmployees);
    expect(service.initialized()).toBeTrue();
    expect(service.loading()).toBeFalse();
    expect(service.count()).toBe(2);
  });

  it('should refresh employees without changing loading', () => {
    const mockEmployees: Employee[] = [
      { uuid: '1', lastName: 'Doe', firstName: 'John' }
    ];

    service.refresh();

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockEmployees);

    expect(service.employees()).toEqual(mockEmployees);
  });

  it('should create employee optimistically and replace with server response', () => {
    const newEmployee: Employee = { uuid: 'temp', lastName: 'New', firstName: 'Emp' };
    service.create(newEmployee).subscribe(created => {
      expect(service.employees().some(e => e.uuid === created.uuid)).toBeTrue();
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');

    const serverResponse: Employee = { uuid: '3', lastName: 'Server', firstName: 'Emp' };
    req.flush(serverResponse);

    expect(service.employees().some(e => e.uuid === '3')).toBeTrue();
  });

  it('should update employee optimistically and restore on error', () => {
    const employee: Employee = { uuid: '1', lastName: 'Doe', firstName: 'John' };
    service['_employees'].set([employee]);

    const updated: Employee = { uuid: '1', lastName: 'Doe', firstName: 'Johnny' };
    service.update('1', updated).subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('PUT');
    req.error(new ProgressEvent('error')); // simule une erreur HTTP

    // L'ancien employee doit être restauré
    expect(service.employees()[0].firstName).toBe('John');
  });

  it('should delete employee optimistically and restore on error', () => {
    const employee: Employee = { uuid: '1', lastName: 'Doe', firstName: 'John' };
    service['_employees'].set([employee]);

    service.delete('1').subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.error(new ProgressEvent('error')); // simule une erreur

    // L'employé doit être restauré
    expect(service.employees().length).toBe(1);
    expect(service.employees()[0].uuid).toBe('1');
  });

  it('should deleteAll and restore on error', () => {
    const employee: Employee = { uuid: '1', lastName: 'Doe', firstName: 'John' };
    service['_employees'].set([employee]);

    service.deleteAll().subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('DELETE');
    req.error(new ProgressEvent('error'));

    // L'employé doit être restauré
    expect(service.employees().length).toBe(1);
  });

  it('should get all employees via getAll()', () => {
    const mockEmployees: Employee[] = [
      { uuid: '1', lastName: 'Doe', firstName: 'John' }
    ];

    service.getAll().subscribe(res => {
      expect(res).toEqual(mockEmployees);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockEmployees);
  });

  it('should get employee by id', () => {
    const employee: Employee = { uuid: '1', lastName: 'Doe', firstName: 'John' };

    service.getById('1').subscribe(res => {
      expect(res).toEqual(employee);
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(employee);
  });
});
