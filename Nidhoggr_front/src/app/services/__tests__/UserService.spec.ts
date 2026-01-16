import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from '../UserService';
import { User, LoginRequest, LoginResponse } from '../../models/userModel';
import { environment } from '../../../environments/environment';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/api/User`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService]
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('devrait créer le service', () => {
    expect(service).toBeTruthy();
  });

  it('devrait récupérer tous les utilisateurs', () => {
    const mockUsers: User[] = [
      { uuid: '1', name: 'User 1' },
      { uuid: '2', name: 'User 2' }
    ];

    service.getAll().subscribe((users) => {
      expect(users.length).toBe(2);
    });

    const req = httpMock.expectOne(apiUrl);
    req.flush(mockUsers);
  });

  it('devrait récupérer un utilisateur par ID', () => {
    const mockUser: User = { uuid: '1', name: 'User 1' };

    service.getById('1').subscribe((user) => {
      expect(user.uuid).toBe('1');
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush(mockUser);
  });

  it('devrait créer un nouvel utilisateur', () => {
    const newUser: User = { uuid: '3', name: 'New User' };

    service.create(newUser).subscribe((user) => {
      expect(user.uuid).toBe('3');
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    req.flush(newUser);
  });

  it('devrait mettre à jour un utilisateur', () => {
    const userId = '1';
    const updatedUser: User = { uuid: userId, name: 'Updated' };

    service.update(userId, updatedUser).subscribe((user) => {
      expect(user.name).toBe('Updated');
    });

    const req = httpMock.expectOne(`${apiUrl}/${userId}`);
    expect(req.request.method).toBe('PUT');
    req.flush(updatedUser);
  });

  it('devrait supprimer un utilisateur', () => {
    service.delete('1').subscribe();

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('devrait supprimer tous les utilisateurs', () => {
    service.deleteAll().subscribe((response) => {
      expect(response.deletedCount).toBe(5);
    });

    const req = httpMock.expectOne(apiUrl);
    req.flush({ deletedCount: 5 });
  });

  it('devrait connecter un utilisateur', () => {
    const loginRequest: LoginRequest = { name: 'admin', password: 'admin123' };
    const mockResponse: LoginResponse = { message: 'Success', token: 'jwt-token' };

    service.login(loginRequest).subscribe((response) => {
      expect(response.token).toBe('jwt-token');
    });

    const req = httpMock.expectOne(`${apiUrl}/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('devrait vérifier l\'authentification', () => {
    service.verifyAuth().subscribe((response) => {
      expect(response.authenticated).toBe(true);
    });

    const req = httpMock.expectOne(`${apiUrl}/verify`);
    req.flush({ authenticated: true });
  });

  it('devrait déconnecter l\'utilisateur', () => {
    service.logout().subscribe((response) => {
      expect(response.message).toBeDefined();
    });

    const req = httpMock.expectOne(`${apiUrl}/logout`);
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Success' });
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
