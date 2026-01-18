import { TestBed } from '@angular/core/testing';
import { AuthService } from '../AuthService';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with false for isAuthenticated$ and isInitialized$', (done) => {
    service.isAuthenticated$.subscribe(isAuth => {
      expect(isAuth).toBeFalse();
    });

    service.isInitialized$.subscribe(isInit => {
      expect(isInit).toBeFalse();
      done();
    });
  });

  it('should mark as initialized', (done) => {
    service.markAsInitialized();

    service.isInitialized$.subscribe(isInit => {
      expect(isInit).toBeTrue();
      done();
    });

    expect(service.isInitialized()).toBeTrue();
  });

  it('should login', (done) => {
    service.login();

    service.isAuthenticated$.subscribe(isAuth => {
      expect(isAuth).toBeTrue();
      done();
    });

    expect(service.isAuthenticated()).toBeTrue();
  });

  it('should logout', (done) => {
    service.login(); // first login
    service.logout();

    service.isAuthenticated$.subscribe(isAuth => {
      expect(isAuth).toBeFalse();
      done();
    });

    expect(service.isAuthenticated()).toBeFalse();
  });

  it('should setAuthenticated', (done) => {
    service.setAuthenticated(true);

    let callCount = 0;
    service.isAuthenticated$.subscribe(isAuth => {
      callCount++;
      if (callCount === 1) {
        expect(isAuth).toBeTrue();
      } else if (callCount === 2) {
        expect(isAuth).toBeFalse();
        done();
      }
    });

    expect(service.isAuthenticated()).toBeTrue();

    service.setAuthenticated(false);

    expect(service.isAuthenticated()).toBeFalse();
  });
});
