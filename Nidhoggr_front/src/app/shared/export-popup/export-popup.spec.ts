import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ExportPopup } from './export-popup';

describe('ExportPopup', () => {
  let component: ExportPopup;
  let fixture: ComponentFixture<ExportPopup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExportPopup],
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExportPopup);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
