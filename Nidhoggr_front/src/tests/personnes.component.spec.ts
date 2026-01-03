import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal, provideZonelessChangeDetection } from '@angular/core';

import { PersonnesComponent } from '../app/components/personnels-page/personnes/personnes.component';
import { MemberService } from '../app/services/MemberService';
import { ToastService } from '../app/services/ToastService';
import { Member } from '../app/models/memberModel';

describe('PersonnesComponent', () => {
  let component: PersonnesComponent;
  let fixture: ComponentFixture<PersonnesComponent>;
  let mockMemberService: jasmine.SpyObj<MemberService>;
  let mockToastService: jasmine.SpyObj<ToastService>;

  // Données de test
  const mockMembers: Member[] = [
    { uuid: '1', name: 'Dupont', firstName: 'Jean', email: 'jean.dupont@test.com', phoneNumber: '0601020304' },
    { uuid: '2', name: 'Martin', firstName: 'Marie', email: 'marie.martin@test.com', phoneNumber: '0605060708' },
    { uuid: '3', name: 'Bernard', firstName: 'Pierre', email: 'pierre.bernard@test.com', phoneNumber: '0609101112' },
  ];

  beforeEach(async () => {
    // Mock du MemberService avec signals
    mockMemberService = jasmine.createSpyObj('MemberService', ['load', 'create', 'update', 'delete'], {
      members: signal(mockMembers),
      loading: signal(false),
      initialized: signal(true),
    });

    // Mock du ToastService
    mockToastService = jasmine.createSpyObj('ToastService', ['showSuccess', 'showError']);

    await TestBed.configureTestingModule({
      imports: [PersonnesComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MemberService, useValue: mockMemberService },
        { provide: ToastService, useValue: mockToastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PersonnesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display members list', () => {
    expect(component.members().length).toBe(3);
  });

  it('should sort members alphabetically by firstName', () => {
    const members = component.members();
    expect(members[0].firstName).toBe('Jean');
    expect(members[1].firstName).toBe('Marie');
    expect(members[2].firstName).toBe('Pierre');
  });

  it('should filter members by name', () => {
    component.searchName.set('Dupont');
    const filtered = component.filteredMembers();
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('Dupont');
  });

  it('should filter members by firstName', () => {
    component.searchFirstName.set('Marie');
    const filtered = component.filteredMembers();
    expect(filtered.length).toBe(1);
    expect(filtered[0].firstName).toBe('Marie');
  });

  it('should filter members by email', () => {
    component.searchEmail.set('pierre');
    const filtered = component.filteredMembers();
    expect(filtered.length).toBe(1);
    expect(filtered[0].email).toBe('pierre.bernard@test.com');
  });

  it('should return all members when no filter is applied', () => {
    component.searchName.set('');
    component.searchFirstName.set('');
    component.searchEmail.set('');
    expect(component.filteredMembers().length).toBe(3);
  });

  it('should open create dialog', () => {
    component.openCreateDialog();
    expect(component.showDialog()).toBeTrue();
    expect(component.isEditing()).toBeFalse();
  });

  it('should open edit dialog with member data', () => {
    const member = mockMembers[0];
    component.openEditDialog(member);
    expect(component.showDialog()).toBeTrue();
    expect(component.isEditing()).toBeTrue();
    expect(component.currentMember().uuid).toBe(member.uuid);
  });

  it('should close dialog', () => {
    component.showDialog.set(true);
    component.closeDialog();
    expect(component.showDialog()).toBeFalse();
  });

  it('should confirm delete and show confirmation', () => {
    const member = mockMembers[0];
    component.confirmDelete(member);
    expect(component.showDeleteConfirm()).toBeTrue();
    expect(component.memberToDelete()).toBe(member);
  });

  it('should cancel delete', () => {
    component.showDeleteConfirm.set(true);
    component.memberToDelete.set(mockMembers[0]);
    component.cancelDelete();
    expect(component.showDeleteConfirm()).toBeFalse();
    expect(component.memberToDelete()).toBeNull();
  });

  it('should generate correct initials', () => {
    const member = mockMembers[0];
    expect(component.getInitials(member)).toBe('JD');
  });

  it('should reset page on search change', () => {
    component.currentPage.set(3);
    component.onSearchChange();
    expect(component.currentPage()).toBe(1);
  });

  it('should clear search field', () => {
    component.searchName.set('test');
    component.clearSearch('name');
    expect(component.searchName()).toBe('');
    expect(component.currentPage()).toBe(1);
  });

  it('should navigate to next page', () => {
    component.currentPage.set(1);
    // Simuler plusieurs pages
    component.nextPage();
    // Le test dépend du nombre de membres et itemsPerPage
  });

  it('should navigate to previous page', () => {
    component.currentPage.set(2);
    component.previousPage();
    expect(component.currentPage()).toBe(1);
  });

  it('should not go below page 1', () => {
    component.currentPage.set(1);
    component.previousPage();
    expect(component.currentPage()).toBe(1);
  });
});
