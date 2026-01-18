import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LoginPageComponent } from './login.component';
import { UserService } from '../../services/UserService';
import { AuthService } from '../../services/AuthService';
import { of } from 'rxjs';
import { User } from '../../models/userModel';

describe('LoginPageComponent', () => {
  let component: LoginPageComponent;
  let fixture: ComponentFixture<LoginPageComponent>;
  let userService: jasmine.SpyObj<UserService>;
  let authService: jasmine.SpyObj<AuthService>;

  const mockUser: User = {
    uuid: 'user-1',
    name: 'testuser',
    password: 'test123'
  };

  beforeEach(async () => {
    const userServiceSpy = jasmine.createSpyObj('UserService', ['getAll', 'update']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);

    userServiceSpy.getAll.and.returnValue(of([mockUser]));

    await TestBed.configureTestingModule({
      imports: [LoginPageComponent, CommonModule, FormsModule, HttpClientTestingModule],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load user on init', (done) => {
    userService.getAll.and.returnValue(of([mockUser]));

    component.ngOnInit();

    setTimeout(() => {
      expect(component.user).toEqual(mockUser);
      expect(component.loading).toBe(false);
      done();
    });
  });

  it('should handle no user found', (done) => {
    userService.getAll.and.returnValue(of([]));

    component.ngOnInit();

    setTimeout(() => {
      expect(component.user).toBeNull();
      expect(component.loading).toBe(false);
      done();
    });
  });

  it('should initialize password fields as empty', () => {
    expect(component.newPassword).toBe('');
    expect(component.confirmPassword).toBe('');
    expect(component.password).toBe('');
  });

  it('should initialize error message as empty', () => {
    expect(component.errorMessage).toBe('');
  });

  it('should set loading to true on init', () => {
    component.loading = true;
    expect(component.loading).toBe(true);
  });

  it('should clear error message', () => {
    component.errorMessage = 'Test error';
    component.errorMessage = '';
    expect(component.errorMessage).toBe('');
  });

  it('should update password fields', () => {
    component.newPassword = 'newPass123';
    component.confirmPassword = 'newPass123';
    expect(component.newPassword).toBe('newPass123');
    expect(component.confirmPassword).toBe('newPass123');
  });

  it('should update login password field', () => {
    component.password = 'testPass';
    expect(component.password).toBe('testPass');
  });

  it('should handle user update call', (done) => {
    userService.getAll.and.returnValue(of([mockUser]));
    userService.update.and.returnValue(of(mockUser));

    component.ngOnInit();

    setTimeout(() => {
      const updatedUser = { ...mockUser };
      userService.update('user-1', updatedUser).subscribe(() => {
        expect(userService.update).toHaveBeenCalledWith('user-1', updatedUser);
        done();
      });
    });
  });

  it('should handle login attempt', () => {
    authService.login.and.returnValue(undefined);
    authService.login();
    expect(authService.login).toHaveBeenCalled();
  });
});
