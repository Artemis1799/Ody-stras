import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EquipmentService } from '../EquipmentService';
import { Equipment ,StorageType} from '../../models/equipmentModel';

import { environment } from '../../../environments/environment';

describe('EquipmentService', () => {
  let service: EquipmentService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/api/Equipment`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EquipmentService]
    });

    service = TestBed.inject(EquipmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all equipments and update equipments$', () => {
    const mockEquipments: Equipment[] = [
      { uuid: '1', type: 'Laptop', storageType: StorageType.Single },
      { uuid: '2', type: 'Monitor', storageType: StorageType.Multiple }
    ];

    service.getAll().subscribe(res => {
      expect(res).toEqual(mockEquipments);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockEquipments);

    expect(service.equipments$).toBeTruthy();
    service.equipments$.subscribe(equipments => {
      expect(equipments).toEqual(mockEquipments);
    });
  });

  it('should get equipment by id', () => {
    const mockEquipment: Equipment = { uuid: '1', type: 'Laptop', storageType: StorageType.Single };

    service.getById('1').subscribe(res => {
      expect(res).toEqual(mockEquipment);
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockEquipment);
  });

  it('should create equipment and update equipments$', () => {
    const newEquipment: Equipment = { uuid: 'temp', type: 'Keyboard', storageType: StorageType.Single };

    service.create(newEquipment).subscribe(created => {
    const current = service['_equipments$'].value;
    expect(current).toContain(created);
    });


    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');

    const serverResponse: Equipment = { uuid: '3', type: 'Keyboard', storageType: StorageType.Single };
    req.flush(serverResponse);

    service.equipments$.subscribe(equipments => {
      expect(equipments.find(e => e.uuid === '3')).toEqual(serverResponse);
    });
  });

  it('should update equipment and update equipments$', () => {
    const equipment: Equipment = { uuid: '1', type: 'Laptop', storageType: StorageType.Single };
    service['_equipments$'].next([equipment]);

    const updated: Equipment = { uuid: '1', type: 'Laptop Pro', storageType: StorageType.Single };
    service.update('1', updated).subscribe(res => {
      expect(res).toEqual(updated);
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('PUT');
    req.flush(updated);

    service.equipments$.subscribe(equipments => {
      expect(equipments[0].type).toBe('Laptop Pro');
    });
  });

  it('should delete equipment and update equipments$', () => {
    const equipment: Equipment = { uuid: '1', type: 'Laptop', storageType: StorageType.Single };
    service['_equipments$'].next([equipment]);

    service.delete('1').subscribe();

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    service.equipments$.subscribe(equipments => {
      expect(equipments.length).toBe(0);
    });
  });

  it('should delete all equipments and clear equipments$', () => {
    const equipments: Equipment[] = [
      { uuid: '1', type: 'Laptop', storageType: StorageType.Single },
      { uuid: '2', type: 'Monitor', storageType: StorageType.Multiple }
    ];
    service['_equipments$'].next(equipments);

    service.deleteAll().subscribe(res => {
      expect(res).toEqual({ deletedCount: 2 });
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('DELETE');
    req.flush({ deletedCount: 2 });

    service.equipments$.subscribe(equipmentsList => {
      expect(equipmentsList.length).toBe(0);
    });
  });
});
