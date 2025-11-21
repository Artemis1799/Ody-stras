import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportPopup } from './import-popup';

describe('ImportPopup', () => {
  let component: ImportPopup;
  let fixture: ComponentFixture<ImportPopup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportPopup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportPopup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
