import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SecurityZoneDrawerComponent } from './security-zone-drawer.component';
import { MapService } from '../../../services/MapService';
import { SecurityZoneService } from '../../../services/SecurityZoneService';
import { EquipmentService } from '../../../services/EquipmentService';
import { ToastService } from '../../../services/ToastService';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { SecurityZone } from '../../../models/securityZoneModel';
import { Event, EventStatus } from '../../../models/eventModel';

describe('SecurityZoneDrawerComponent (Equipment Drawer)', () => {
  let component: SecurityZoneDrawerComponent;
  let fixture: ComponentFixture<SecurityZoneDrawerComponent>;
  let mapService: jasmine.SpyObj<MapService>;
  let securityZoneService: jasmine.SpyObj<SecurityZoneService>;

  const mockEvent: Event = {
    uuid: 'event-1',
    title: 'Test Event',
    startDate: new Date('2026-01-14'),
    endDate: new Date('2026-01-15'),
    status: EventStatus.ToOrganize,
    isArchived: false
  };

  const mockSecurityZone: SecurityZone = {
    uuid: 'zone-1',
    eventId: 'event-1',
    equipmentId: 'eq-1',
    quantity: 5,
    installationDate: new Date(),
    removalDate: new Date(),
    geoJson: '{}',
    event: mockEvent
  };

  beforeEach(async () => {
    const mapServiceSpy = jasmine.createSpyObj('MapService', [
      'getSelectedEvent',
      'selectSecurityZone'
    ]);
    const securityZoneServiceSpy = jasmine.createSpyObj('SecurityZoneService', [
      'create',
      'update',
      'delete',
      'getByEventId'
    ]);

    await TestBed.configureTestingModule({
      imports: [SecurityZoneDrawerComponent, CommonModule, HttpClientTestingModule],
      providers: [
        { provide: MapService, useValue: mapServiceSpy },
        { provide: SecurityZoneService, useValue: securityZoneServiceSpy },
        EquipmentService,
        ToastService,
        MessageService
      ]
    }).compileComponents();

    mapService = TestBed.inject(MapService) as jasmine.SpyObj<MapService>;
    securityZoneService = TestBed.inject(SecurityZoneService) as jasmine.SpyObj<SecurityZoneService>;

    fixture = TestBed.createComponent(SecurityZoneDrawerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get security zones by event', (done) => {
    const zones = [mockSecurityZone];
    securityZoneService.getByEventId.and.returnValue(of(zones));

    securityZoneService.getByEventId('event-1').subscribe((result) => {
      expect(result).toEqual(zones);
      done();
    });
  });

  it('should create a security zone', (done) => {
    securityZoneService.create.and.returnValue(of(mockSecurityZone));

    securityZoneService.create(mockSecurityZone).subscribe((created) => {
      expect(created).toEqual(mockSecurityZone);
      done();
    });
  });

  it('should update a security zone', (done) => {
    const updated = { ...mockSecurityZone, quantity: 10 };
    securityZoneService.update.and.returnValue(of(updated));

    securityZoneService.update('zone-1', updated).subscribe((result) => {
      expect(result.quantity).toBe(10);
      done();
    });
  });

  it('should delete a security zone', (done) => {
    securityZoneService.delete.and.returnValue(of(undefined));

    securityZoneService.delete('zone-1').subscribe(() => {
      expect(securityZoneService.delete).toHaveBeenCalledWith('zone-1');
      done();
    });
  });

  it('should select a security zone', () => {
    mapService.selectSecurityZone.and.returnValue(undefined);
    mapService.selectSecurityZone(mockSecurityZone);
    expect(mapService.selectSecurityZone).toHaveBeenCalledWith(mockSecurityZone);
  });
});
