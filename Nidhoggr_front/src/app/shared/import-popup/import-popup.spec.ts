import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ImportPopup } from './import-popup';

describe('ImportPopup', () => {
  let component: ImportPopup;
  let fixture: ComponentFixture<ImportPopup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportPopup],
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportPopup);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
