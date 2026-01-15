import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EquipmentManagerComponent } from './equipment-manager.component';
import { EquipmentService } from '../../services/EquipmentService';
import { PointService } from '../../services/PointService';
import { ToastService } from '../../services/ToastService';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { Equipment } from '../../models/equipmentModel';

describe('EquipmentManagerComponent', () => {
  let component: EquipmentManagerComponent;
  let fixture: ComponentFixture<EquipmentManagerComponent>;
  let equipmentService: jasmine.SpyObj<EquipmentService>;
  let toastService: jasmine.SpyObj<ToastService>;

  const mockEquipment: Equipment = {
    uuid: 'eq-1',
    type: 'Tente',
    description: 'Grande tente',
    length: 10,
    storageType: 1
  };

  beforeEach(async () => {
    const equipmentServiceSpy = jasmine.createSpyObj('EquipmentService', [
      'getAll',
      'create',
      'update',
      'delete'
    ]);
    const toastServiceSpy = jasmine.createSpyObj('ToastService', [
      'success',
      'error'
    ]);
    const pointServiceSpy = jasmine.createSpyObj('PointService', ['getAll', 'create', 'update', 'delete']);

    equipmentServiceSpy.getAll.and.returnValue(of([mockEquipment]));

    await TestBed.configureTestingModule({
      imports: [EquipmentManagerComponent, CommonModule, FormsModule, HttpClientTestingModule],
      providers: [
        { provide: EquipmentService, useValue: equipmentServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: PointService, useValue: pointServiceSpy },
        MessageService
      ]
    }).compileComponents();

    equipmentService = TestBed.inject(EquipmentService) as jasmine.SpyObj<EquipmentService>;
    toastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

    fixture = TestBed.createComponent(EquipmentManagerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load equipments on init', async () => {
    const mockEquipments = [mockEquipment];
    equipmentService.getAll.and.returnValue(of(mockEquipments));

    fixture.detectChanges();
    await fixture.whenStable();

    expect(equipmentService.getAll).toHaveBeenCalled();
  });

  it('should initialize new equipment form with defaults', () => {
    expect(component.newEquipment.type).toBe('');
    expect(component.newEquipment.length).toBe(0);
  });

  it('should show add form when showAddForm is true', () => {
    component.showAddForm = false;
    component.showAddForm = true;
    expect(component.showAddForm).toBe(true);
  });

  it('should set editingEquipment when editing', () => {
    component.editingEquipment = mockEquipment;
    expect(component.editingEquipment).toEqual(mockEquipment);
  });

  it('should show delete confirmation popup', () => {
    component.equipmentToDelete = mockEquipment;
    component.showDeleteConfirm = true;
    expect(component.showDeleteConfirm).toBe(true);
    expect(component.equipmentToDelete).toEqual(mockEquipment);
  });

  it('should clear error message', () => {
    component.errorMessage = 'Test error';
    component.errorMessage = '';
    expect(component.errorMessage).toBe('');
  });

  it('should initialize with no loading state', () => {
    expect(component.isLoading).toBe(false);
  });

  it('should handle equipment creation', (done) => {
    const newEquipment = { ...mockEquipment };
    equipmentService.create.and.returnValue(of(newEquipment));

    equipmentService.create(newEquipment).subscribe((created) => {
      expect(created).toEqual(newEquipment);
      done();
    });
  });

  it('should handle equipment update', (done) => {
    const updatedEquipment = { ...mockEquipment, type: 'Abri' };
    equipmentService.update.and.returnValue(of(updatedEquipment));

    equipmentService.update('eq-1', updatedEquipment).subscribe((updated) => {
      expect(updated.type).toBe('Abri');
      done();
    });
  });

  it('should handle equipment deletion', (done) => {
    equipmentService.delete.and.returnValue(of(undefined));

    equipmentService.delete('eq-1').subscribe(() => {
      expect(equipmentService.delete).toHaveBeenCalledWith('eq-1');
      done();
    });
  });
});
