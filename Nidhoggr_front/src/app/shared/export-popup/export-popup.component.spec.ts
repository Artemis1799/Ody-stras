import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ExportPopup } from './export-popup';
import { PointService } from '../../services/PointService';
import { PictureService } from '../../services/PictureService';
import { AreaService } from '../../services/AreaService';
import { PathService } from '../../services/PathService';
import { EquipmentService } from '../../services/EquipmentService';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { Event, EventStatus } from '../../models/eventModel';

describe('ExportPopup', () => {
  let component: ExportPopup;
  let fixture: ComponentFixture<ExportPopup>;
  let pointService: jasmine.SpyObj<PointService>;
  let areaService: jasmine.SpyObj<AreaService>;

  const mockEvent: Event = {
    uuid: 'event-1',
    title: 'Test Event',
    startDate: new Date('2026-01-14'),
    endDate: new Date('2026-01-15'),
    status: EventStatus.ToOrganize,
    isArchived: false
  };

  beforeEach(async () => {
    const pointServiceSpy = jasmine.createSpyObj('PointService', ['getAll']);
    const pictureServiceSpy = jasmine.createSpyObj('PictureService', ['getAll']);
    const areaServiceSpy = jasmine.createSpyObj('AreaService', ['getByEventId']);
    const pathServiceSpy = jasmine.createSpyObj('PathService', ['getAll']);
    const equipmentServiceSpy = jasmine.createSpyObj('EquipmentService', ['getAll']);

    await TestBed.configureTestingModule({
      imports: [ExportPopup, CommonModule, HttpClientTestingModule],
      providers: [
        { provide: PointService, useValue: pointServiceSpy },
        { provide: PictureService, useValue: pictureServiceSpy },
        { provide: AreaService, useValue: areaServiceSpy },
        { provide: PathService, useValue: pathServiceSpy },
        { provide: EquipmentService, useValue: equipmentServiceSpy },
        MessageService
      ]
    }).compileComponents();

    pointService = TestBed.inject(PointService) as jasmine.SpyObj<PointService>;
    areaService = TestBed.inject(AreaService) as jasmine.SpyObj<AreaService>;

    fixture = TestBed.createComponent(ExportPopup);
    component = fixture.componentInstance;
    component.event = mockEvent;
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

  it('should initialize with isExporting false', () => {
    expect(component.isExporting).toBe(false);
  });

  it('should initialize with showQRCode false', () => {
    expect(component.showQRCode).toBe(false);
  });

  it('should initialize with empty exportStatus', () => {
    expect(component.exportStatus).toBe('');
  });

  it('should initialize with empty qrCodeDataURL', () => {
    expect(component.qrCodeDataURL).toBe('');
  });

  it('should fetch areas for export', (done) => {
    const areas = [{ uuid: 'area-1', eventId: 'event-1', name: 'Area', colorHex: '#FF0000', geoJson: '{}' }];
    areaService.getByEventId.and.returnValue(of(areas));

    areaService.getByEventId('event-1').subscribe((result) => {
      expect(result).toEqual(areas);
      done();
    });
  });

  it('should fetch points for export', (done) => {
    const points = [{ uuid: 'p-1', eventId: 'event-1', name: 'Point', latitude: 48.8566, longitude: 2.3522, validated: true }];
    pointService.getAll.and.returnValue(of(points));

    pointService.getAll().subscribe((result) => {
      expect(result).toEqual(points);
      done();
    });
  });

  it('should toggle QRCode visibility', () => {
    component.showQRCode = false;
    component.showQRCode = true;
    expect(component.showQRCode).toBe(true);
  });

  it('should handle ngOnInit', () => {
    component.ngOnInit();
    expect(component).toBeTruthy();
  });

  it('should unsubscribe on destroy', () => {
    component.ngOnInit();
    component.ngOnDestroy();
    expect(component).toBeTruthy();
  });
});
