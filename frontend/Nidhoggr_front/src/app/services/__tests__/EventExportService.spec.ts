import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { EventExportService, EventExportData } from '../EventExportService';
import { EventService } from '../EventService';
import { PointService } from '../PointService';
import { AreaService } from '../AreaService';
import { PathService } from '../PathService';
import { PictureService } from '../PictureService';
import { EquipmentService } from '../EquipmentService';
import { Event, EventStatus } from '../../models/eventModel';
import { Point } from '../../models/pointModel';
import { Area } from '../../models/areaModel';
import { RoutePath } from '../../models/routePathModel';
import { Picture } from '../../models/pictureModel';
import { Equipment, StorageType } from '../../models/equipmentModel';

describe('EventExportService', () => {
  let service: EventExportService;
  let eventService: jasmine.SpyObj<EventService>;
  let pointService: jasmine.SpyObj<PointService>;
  let areaService: jasmine.SpyObj<AreaService>;
  let pathService: jasmine.SpyObj<PathService>;
  let pictureService: jasmine.SpyObj<PictureService>;
  let equipmentService: jasmine.SpyObj<EquipmentService>;

  beforeEach(() => {
    const eventSpy = jasmine.createSpyObj('EventService', ['getById']);
    const pointSpy = jasmine.createSpyObj('PointService', ['getByEventId']);
    const areaSpy = jasmine.createSpyObj('AreaService', ['getByEventId']);
    const pathSpy = jasmine.createSpyObj('PathService', ['getByEventId']);
    const pictureSpy = jasmine.createSpyObj('PictureService', ['getAll']);
    const equipmentSpy = jasmine.createSpyObj('EquipmentService', ['getAll']);

    TestBed.configureTestingModule({
      providers: [
        EventExportService,
        { provide: EventService, useValue: eventSpy },
        { provide: PointService, useValue: pointSpy },
        { provide: AreaService, useValue: areaSpy },
        { provide: PathService, useValue: pathSpy },
        { provide: PictureService, useValue: pictureSpy },
        { provide: EquipmentService, useValue: equipmentSpy }
      ]
    });

    service = TestBed.inject(EventExportService);
    eventService = TestBed.inject(EventService) as jasmine.SpyObj<EventService>;
    pointService = TestBed.inject(PointService) as jasmine.SpyObj<PointService>;
    areaService = TestBed.inject(AreaService) as jasmine.SpyObj<AreaService>;
    pathService = TestBed.inject(PathService) as jasmine.SpyObj<PathService>;
    pictureService = TestBed.inject(PictureService) as jasmine.SpyObj<PictureService>;
    equipmentService = TestBed.inject(EquipmentService) as jasmine.SpyObj<EquipmentService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch complete event data with points, pictures and equipment', (done) => {
    const mockEvent: Event = {
      uuid: 'e1',
      title: 'Event 1',
      startDate: new Date(),
      endDate: new Date(),
      status: EventStatus.ToOrganize
    };

    const mockPoints: Point[] = [
      { uuid: 'p1', eventId: 'e1', name: 'Point 1', latitude: 0, longitude: 0, validated: true, equipmentId: 'eq1' },
      { uuid: 'p2', eventId: 'e1', name: 'Point 2', latitude: 1, longitude: 1, validated: false }
    ];

    const mockAreas: Area[] = [{ uuid: 'a1', eventId: 'e1', colorHex: '#fff', geoJson: '{}' }];
    const mockPaths: RoutePath[] = [
    { 
        uuid: 'r1', 
        eventId: 'e1', 
        name: 'Path 1',
        description: 'Description path 1',
        colorHex: '#ff0000',
        startDate: new Date(),
        fastestEstimatedSpeed: 10,
        slowestEstimatedSpeed: 5,
        geoJson: '{}' 
    }
    ];
    const mockPictures: Picture[] = [
    { uuid: 'pic1', pointId: 'p1', pictureData: 'base64data1' }
    ];
    const mockEquipments: Equipment[] = [{ uuid: 'eq1', type: 'Laptop', storageType: StorageType.Single }];

    eventService.getById.and.returnValue(of(mockEvent));
    pointService.getByEventId.and.returnValue(of(mockPoints));
    areaService.getByEventId.and.returnValue(of(mockAreas));
    pathService.getByEventId.and.returnValue(of(mockPaths));
    pictureService.getAll.and.returnValue(of(mockPictures));
    equipmentService.getAll.and.returnValue(of(mockEquipments));

    service.getCompleteEventData('e1').subscribe((res: EventExportData) => {
      expect(res.event).toEqual(mockEvent);

      // Points et associations
      expect(res.points.length).toBe(2);
      const point1 = res.points.find(p => p.uuid === 'p1')!;
      expect(point1.pictures.length).toBe(1);
      expect(point1.equipment).toEqual(mockEquipments[0]);
      const point2 = res.points.find(p => p.uuid === 'p2')!;
      expect(point2.pictures.length).toBe(0);
      expect(point2.equipment).toBeUndefined();

      // Zones et chemins
      expect(res.areas).toEqual(mockAreas);
      expect(res.paths).toEqual(mockPaths);

      // Metadata
      expect(res.exportMetadata.totalPoints).toBe(2);
      expect(res.exportMetadata.totalPictures).toBe(1);
      expect(res.exportMetadata.totalAreas).toBe(1);
      expect(res.exportMetadata.totalPaths).toBe(1);

      done();
    });
  });

  it('exportToJSON should return a formatted JSON string', () => {
    const mockData: EventExportData = {
      event: { uuid: 'e1', title: 'Event 1', startDate: new Date(), endDate: new Date(), status: EventStatus.ToOrganize },
      points: [],
      areas: [],
      paths: [],
      exportMetadata: { exportDate: new Date(), totalPoints: 0, totalPictures: 0, totalAreas: 0, totalPaths: 0 }
    };

    const json = service.exportToJSON(mockData);
    expect(typeof json).toBe('string');
    const parsed = JSON.parse(json);
    expect(parsed.event.uuid).toBe('e1');
  });

  it('downloadAsJSON should create a blob and trigger download', () => {
    const mockData: EventExportData = {
      event: { uuid: 'e1', title: 'Event 1', startDate: new Date(), endDate: new Date(), status: EventStatus.ToOrganize },
      points: [],
      areas: [],
      paths: [],
      exportMetadata: { exportDate: new Date(), totalPoints: 0, totalPictures: 0, totalAreas: 0, totalPaths: 0 }
    };

    const clickSpy = jasmine.createSpy('click');
    spyOn(document, 'createElement').and.returnValue({ href: '', download: '', click: clickSpy } as any);
    spyOn(URL, 'createObjectURL').and.returnValue('blob:url');
    spyOn(URL, 'revokeObjectURL');

    service.downloadAsJSON(mockData);

    expect(clickSpy).toHaveBeenCalled();
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });
});
