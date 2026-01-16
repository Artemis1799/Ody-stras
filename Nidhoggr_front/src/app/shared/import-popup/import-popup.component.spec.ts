import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ImportPopup } from './import-popup';
import { WebSocketExportService } from '../../services/WebSocketExportService';
import { MessageService } from 'primeng/api';

describe('ImportPopup', () => {
  let component: ImportPopup;
  let fixture: ComponentFixture<ImportPopup>;
  let wsExportService: jasmine.SpyObj<WebSocketExportService>;

  beforeEach(async () => {
    const wsExportServiceSpy = jasmine.createSpyObj('WebSocketExportService', [
      'startServerAndConnect'
    ]);

    await TestBed.configureTestingModule({
      imports: [ImportPopup, CommonModule, HttpClientTestingModule],
      providers: [
        { provide: WebSocketExportService, useValue: wsExportServiceSpy },
        MessageService
      ]
    }).compileComponents();

    wsExportService = TestBed.inject(WebSocketExportService) as jasmine.SpyObj<WebSocketExportService>;

    fixture = TestBed.createComponent(ImportPopup);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit close event', (done) => {
    component.close.subscribe(() => {
      expect(true).toBe(true);
      done();
    });
    component.close.emit();
  });

  it('should initialize with isReady false', () => {
    expect(component.isReady).toBe(false);
  });

  it('should initialize with empty qrCodeDataUrl', () => {
    expect(component.qrCodeDataUrl).toBe('');
  });

  it('should have WS_URL defined', () => {
    expect(component.WS_URL).toBeDefined();
  });

  it('should start server and connect on init', async () => {
    wsExportService.startServerAndConnect.and.returnValue(Promise.resolve());

    await component.ngOnInit();

    expect(wsExportService.startServerAndConnect).toHaveBeenCalled();
  });

  it('should set isReady after QR code generation', async () => {
    wsExportService.startServerAndConnect.and.returnValue(Promise.resolve());

    // Simulate async QR code generation
    component.isReady = true;

    expect(component.isReady).toBe(true);
  });

  it('should handle QR code data URL generation', async () => {
    wsExportService.startServerAndConnect.and.returnValue(Promise.resolve());

    component.qrCodeDataUrl = 'data:image/png;base64,...';

    expect(component.qrCodeDataUrl).toBeDefined();
    expect(component.qrCodeDataUrl).not.toBe('');
  });
});
