import { TestBed } from '@angular/core/testing';
import { WebSocketExportService } from '../WebSocketExportService';
import { PointService } from '../PointService';
import { PictureService } from '../PictureService';
import { EquipmentService } from '../EquipmentService';
import { EventService } from '../EventService';
import { of, throwError } from 'rxjs';
import { EventStatus } from '../../models/eventModel';

describe('WebSocketExportService', () => {
  let service: WebSocketExportService;
  let pointServiceSpy: jasmine.SpyObj<PointService>;
  let pictureServiceSpy: jasmine.SpyObj<PictureService>;
  let equipmentServiceSpy: jasmine.SpyObj<EquipmentService>;
  let eventServiceSpy: jasmine.SpyObj<EventService>;
  let webSocketMock: any;

  beforeEach(() => {
    pointServiceSpy = jasmine.createSpyObj('PointService', ['getAll', 'getById', 'create', 'update']);
    pictureServiceSpy = jasmine.createSpyObj('PictureService', ['getAll', 'create', 'update']);
    equipmentServiceSpy = jasmine.createSpyObj('EquipmentService', ['getAll', 'create', 'update']);
    eventServiceSpy = jasmine.createSpyObj('EventService', ['getById', 'create']);

    pointServiceSpy.getAll.and.returnValue(of([]));
    pictureServiceSpy.getAll.and.returnValue(of([]));
    equipmentServiceSpy.getAll.and.returnValue(of([]));

    TestBed.configureTestingModule({
      providers: [
        WebSocketExportService,
        { provide: PointService, useValue: pointServiceSpy },
        { provide: PictureService, useValue: pictureServiceSpy },
        { provide: EquipmentService, useValue: equipmentServiceSpy },
        { provide: EventService, useValue: eventServiceSpy }
      ]
    });

    service = TestBed.inject(WebSocketExportService);

    webSocketMock = {
      onopen: null,
      onerror: null,
      onclose: null,
      onmessage: null,
      close: jasmine.createSpy('close'),
      readyState: WebSocket.OPEN
    };

    spyOn(window, 'WebSocket').and.returnValue(webSocketMock as any);
    spyOn(window, 'fetch').and.returnValue(Promise.resolve({ ok: true } as Response));
  });

  it('devrait créer le service', () => {
    expect(service).toBeTruthy();
  });

  it('devrait se connecter au WebSocket', () => {
    service.connect();
    expect(window.WebSocket).toHaveBeenCalled();
  });

  it('devrait émettre connecté', (done) => {
    service.progress$.subscribe((message) => {
      if (message.type === 'connected') {
        expect(message.data.message).toBe('Connexion établie');
        done();
      }
    });
    service.connect();
    webSocketMock.onopen();
  });

  it('devrait créer un point reçu', (done) => {
    const pointData = {
      type: 'point',
      point: { UUID: 'point-1', Name: 'Test', Latitude: 48.8566, Longitude: 2.3522 }
    };

    pointServiceSpy.getById.and.returnValue(throwError({ status: 404 }));
    pointServiceSpy.create.and.returnValue(of(pointData.point as any));

    service.connect();
    webSocketMock.onmessage({ data: JSON.stringify(pointData) });

    setTimeout(() => {
      expect(pointServiceSpy.create).toHaveBeenCalled();
      done();
    }, 100);
  });

  it('devrait créer une image reçue', (done) => {
    const pictureData = {
      type: 'picture',
      picture: { UUID: 'pic-1', PictureData: 'base64data' },
      pointUUID: 'point-1'
    };

    pictureServiceSpy.create.and.returnValue(of(pictureData.picture as any));

    service.connect();
    webSocketMock.onmessage({ data: JSON.stringify(pictureData) });

    setTimeout(() => {
      expect(pictureServiceSpy.create).toHaveBeenCalled();
      done();
    }, 100);
  });

  it('devrait déconnecter le WebSocket', () => {
    service.connect();
    service.disconnect();
    expect(webSocketMock.close).toHaveBeenCalled();
  });

  it('devrait vérifier si connecté', () => {
    service.connect();
    expect(service.isConnected()).toBe(true);
  });

  it('devrait gérer les erreurs de connexion', (done) => {
    service.progress$.subscribe((message) => {
      if (message.type === 'error') {
        expect(message.data.message).toBe('Erreur de connexion');
        done();
      }
    });
    service.connect();
    webSocketMock.onerror();
  });

  it('devrait traiter les métadonnées d\'événement', (done) => {
    const metadata = { type: 'metadata', eventUUID: 'event-123' };
    eventServiceSpy.getById.and.returnValue(of({ uuid: 'event-123', title: 'Event', startDate: new Date(), endDate: new Date(), status: EventStatus.ToOrganize } as unknown as any));

    service.connect();
    webSocketMock.onmessage({ data: JSON.stringify(metadata) });

    setTimeout(() => {
      expect(service['currentEventUuid']).toBe('event-123');
      done();
    }, 100);
  });
});
