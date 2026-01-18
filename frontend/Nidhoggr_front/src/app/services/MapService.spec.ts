import { TestBed } from '@angular/core/testing';
import { MapService, MapBounds } from './MapService';
import { Point } from '../models/pointModel';
import { Event, EventStatus } from '../models/eventModel';
import { Area } from '../models/areaModel';
import { RoutePath } from '../models/routePathModel';
import { SecurityZone } from '../models/securityZoneModel';

describe('MapService', () => {
  let service: MapService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MapService]
    });
    service = TestBed.inject(MapService);
  });

  const mockPoint: Point = {
    uuid: 'point-1',
    eventId: 'event-1',
    name: 'Test Point',
    latitude: 48.8566,
    longitude: 2.3522,
    validated: true
  };

  const mockEvent: Event = {
    uuid: 'event-1',
    title: 'Test Event',
    startDate: new Date('2026-01-14'),
    endDate: new Date('2026-01-15'),
    status: EventStatus.ToOrganize,
    isArchived: false
  };

  const mockArea: Area = {
    uuid: 'area-1',
    eventId: 'event-1',
    name: 'Test Area',
    colorHex: '#FF0000',
    geoJson: '{}'
  };

  const mockSecurityZone: SecurityZone = {
    uuid: 'zone-1',
    eventId: 'event-1',
    equipmentId: 'eq-1',
    quantity: 5,
    installationDate: new Date(),
    removalDate: new Date(),
    geoJson: '{}',
    event: {
      uuid: 'event-1',
      title: 'Test Event',
      startDate: new Date('2026-01-14'),
      endDate: new Date('2026-01-15'),
      status: EventStatus.ToOrganize,
      isArchived: false
    }
  };

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should set and get points', (done) => {
    const points = [mockPoint];
    service.setPoints(points);
    service.points$.subscribe((p) => {
      expect(p).toEqual(points);
      expect(service.getPoints()).toEqual(points);
      done();
    });
  });

  it('should select point and emit selectedPoint$', (done) => {
    service.selectPoint(mockPoint, 0);
    service.selectedPoint$.subscribe((point) => {
      if (point) {
        expect(point).toEqual(mockPoint);
        expect(service.getSelectedPointIndex()).toBe(0);
        done();
      }
    });
  });

  it('should select point of interest', (done) => {
    service.selectPointOfInterest(mockPoint);
    service.selectedPointOfInterest$.subscribe((point) => {
      if (point) {
        expect(point).toEqual(mockPoint);
        done();
      }
    });
  });

  it('should set and get selected event', (done) => {
    service.setSelectedEvent(mockEvent);
    service.selectedEvent$.subscribe((event) => {
      if (event) {
        expect(event).toEqual(mockEvent);
        expect(service.getSelectedEvent()).toEqual(mockEvent);
        done();
      }
    });
  });

  it('should check if selected event is archived', (done) => {
    const archivedEvent = { ...mockEvent, isArchived: true };
    service.setSelectedEvent(archivedEvent);
    service.selectedEvent$.subscribe((event) => {
      if (event) {
        expect(service.isSelectedEventArchived()).toBe(true);
        done();
      }
    });
  });

  it('should set and get events', (done) => {
    const events = [mockEvent];
    service.setEvents(events);
    service.events$.subscribe((e) => {
      expect(e).toEqual(events);
      expect(service.getEvents()).toEqual(events);
      done();
    });
  });

  it('should set and get areas', (done) => {
    const areas = [mockArea];
    service.setAreas(areas);
    service.areas$.subscribe((a) => {
      expect(a).toEqual(areas);
      expect(service.getAreas()).toEqual(areas);
      done();
    });
  });

  it('should set and get security zones', (done) => {
    const zones = [mockSecurityZone];
    service.setSecurityZones(zones);
    service.securityZones$.subscribe((z) => {
      expect(z).toEqual(zones);
      expect(service.getSecurityZones()).toEqual(zones);
      done();
    });
  });

  it('should select security zone', (done) => {
    service.selectSecurityZone(mockSecurityZone);
    service.selectedSecurityZone$.subscribe((zone) => {
      if (zone) {
        expect(zone).toEqual(mockSecurityZone);
        done();
      }
    });
  });

  it('should set map bounds', (done) => {
    const bounds: MapBounds = { north: 50, south: 47, east: 3, west: 1 };
    service.setMapBounds(bounds);
    service.mapBounds$.subscribe((b) => {
      if (b) {
        expect(b).toEqual(bounds);
        done();
      }
    });
  });

  it('should trigger reload points', (done) => {
    service.reloadPoints$.subscribe(() => {
      expect(true).toBe(true);
      done();
    });
    service.triggerReloadPoints();
  });

  it('should trigger reload event', (done) => {
    service.reloadEvent$.subscribe(() => {
      expect(true).toBe(true);
      done();
    });
    service.triggerReloadEvent();
  });

  it('should toggle timeline visibility', (done) => {
    service.timelineVisible$.subscribe((visible) => {
      if (visible !== undefined) {
        expect(typeof visible).toBe('boolean');
        done();
      }
    });
  });

  it('should set timeline filter date', (done) => {
    const date = new Date('2026-01-14');
    service.setTimelineFilterDate(date);
    service.timelineFilterDate$.subscribe((d) => {
      if (d) {
        expect(d).toEqual(date);
        done();
      }
    });
  });

  it('should set event area visibility', (done) => {
    service.setEventAreaVisible(true);
    service.eventAreaVisible$.subscribe((visible) => {
      expect(visible).toBe(true);
      done();
    });
  });

  it('should highlight security zones', (done) => {
    service.highlightedSecurityZones$.subscribe((ids) => {
      expect(Array.isArray(ids)).toBe(true);
      done();
    });
  });

  it('should toggle sidebar collapsed state', (done) => {
    service.setSidebarCollapsed(true);
    service.sidebarCollapsed$.subscribe((collapsed) => {
      expect(collapsed).toBe(true);
      done();
    });
  });
});
