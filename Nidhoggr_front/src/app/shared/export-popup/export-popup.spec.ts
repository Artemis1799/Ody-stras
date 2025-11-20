import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportPopup } from './export-popup';

describe('ExportPopup', () => {
  let component: ExportPopup;
  let fixture: ComponentFixture<ExportPopup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExportPopup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExportPopup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
