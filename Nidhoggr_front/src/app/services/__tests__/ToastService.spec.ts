import { TestBed } from '@angular/core/testing';
import { ToastService } from '../ToastService';
import { MessageService } from 'primeng/api';

describe('ToastService', () => {
  let service: ToastService;
  let messageServiceSpy: jasmine.SpyObj<MessageService>;

  beforeEach(() => {
    messageServiceSpy = jasmine.createSpyObj('MessageService', ['add', 'clear']);

    TestBed.configureTestingModule({
      providers: [
        ToastService,
        { provide: MessageService, useValue: messageServiceSpy }
      ]
    });

    service = TestBed.inject(ToastService);
  });

  it('devrait créer le service', () => {
    expect(service).toBeTruthy();
  });

  it('devrait afficher un message de succès', () => {
    service.showSuccess('Success', 'Operation completed');

    expect(messageServiceSpy.add).toHaveBeenCalledWith({
      severity: 'success',
      summary: 'Success',
      detail: 'Operation completed',
      life: 3000
    });
  });

  it('devrait afficher un message d\'erreur', () => {
    service.showError('Error', 'An error occurred');

    expect(messageServiceSpy.add).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'Error',
      detail: 'An error occurred',
      life: 5000
    });
  });

  it('devrait afficher un message d\'information', () => {
    service.showInfo('Info', 'Information message');

    expect(messageServiceSpy.add).toHaveBeenCalledWith({
      severity: 'info',
      summary: 'Info',
      detail: 'Information message',
      life: 3000
    });
  });

  it('devrait afficher un message d\'avertissement', () => {
    service.showWarning('Warning', 'Be careful');

    expect(messageServiceSpy.add).toHaveBeenCalledWith({
      severity: 'warn',
      summary: 'Warning',
      detail: 'Be careful',
      life: 4000
    });
  });

  it('devrait utiliser un détail vide par défaut', () => {
    service.showSuccess('Test');

    expect(messageServiceSpy.add).toHaveBeenCalledWith(
      jasmine.objectContaining({
        detail: ''
      })
    );
  });

  it('devrait effacer tous les messages', () => {
    service.clear();
    expect(messageServiceSpy.clear).toHaveBeenCalled();
  });

  it('devrait avoir des durées différentes pour chaque type', () => {
    service.showSuccess('S', 'S');
    service.showError('E', 'E');
    service.showInfo('I', 'I');
    service.showWarning('W', 'W');

    const calls = messageServiceSpy.add.calls.all();
    expect(calls[0].args[0].life).toBe(3000); // success
    expect(calls[1].args[0].life).toBe(5000); // error (plus long)
    expect(calls[2].args[0].life).toBe(3000); // info
    expect(calls[3].args[0].life).toBe(4000); // warning
  });

  it('devrait pouvoir afficher plusieurs messages successifs', () => {
    service.showSuccess('First', 'First detail');
    service.showError('Second', 'Second detail');

    expect(messageServiceSpy.add).toHaveBeenCalledTimes(2);
  });
});
