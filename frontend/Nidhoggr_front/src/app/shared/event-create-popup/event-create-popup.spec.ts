import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventCreatePopup } from './event-create-popup';
import { EventCreatePopupPresenter } from './event-create-popup.presenter';
import { MessageService } from 'primeng/api';
import { Event, EventStatus } from '../../models/eventModel';

describe('EventCreatePopup', () => {
  let component: EventCreatePopup;
  let fixture: ComponentFixture<EventCreatePopup>;
  let presenter: jasmine.SpyObj<EventCreatePopupPresenter>;

  const mockEvent: Event = {
    uuid: 'event-1',
    title: 'New Event',
    startDate: new Date('2026-01-14'),
    endDate: new Date('2026-01-15'),
    status: EventStatus.ToOrganize,
    isArchived: false
  };

  beforeEach(async () => {
    const presenterSpy = jasmine.createSpyObj('EventCreatePopupPresenter', [
      'reset',
      'createEvent'
    ]);
    presenterSpy.reset.and.returnValue(undefined);
    presenterSpy.createEvent.and.returnValue(Promise.resolve(mockEvent));
    presenterSpy.formData = {
      title: '',
      startDate: new Date(),
      endDate: new Date(),
      status: 0,
      isArchived: false
    };

    await TestBed.configureTestingModule({
      imports: [EventCreatePopup, CommonModule, HttpClientTestingModule],
      providers: [
        MessageService
      ]
    }).overrideComponent(EventCreatePopup, {
      remove: { providers: [EventCreatePopupPresenter] },
      add: { providers: [{ provide: EventCreatePopupPresenter, useValue: presenterSpy }] }
    }).compileComponents();

    fixture = TestBed.createComponent(EventCreatePopup);
    component = fixture.componentInstance;
    presenter = component.presenter as jasmine.SpyObj<EventCreatePopupPresenter>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit close event', (done) => {
    component.close.subscribe(() => {
      expect(true).toBe(true);
      done();
    });
    component.close.emit();
  });

  it('should emit event created', (done) => {
    component.eventCreated.subscribe((event: Event) => {
      expect(event).toEqual(mockEvent);
      done();
    });
    component.eventCreated.emit(mockEvent);
  });

  it('should reset presenter on init', () => {
    fixture.detectChanges();
    expect(presenter.reset).toHaveBeenCalled();
  });

  it('should create event on submit', async () => {
    fixture.detectChanges();

    await component.onSubmit();

    expect(presenter.createEvent).toHaveBeenCalled();
  });

  it('should emit eventCreated when submit succeeds', async () => {
    fixture.detectChanges();

    let emittedEvent: Event | undefined;
    component.eventCreated.subscribe((event) => {
      emittedEvent = event;
    });

    await component.onSubmit();

    await fixture.whenStable();
    expect(emittedEvent).toEqual(mockEvent);
  });

  it('should emit close after successful creation', async () => {
    fixture.detectChanges();

    let closed = false;
    component.close.subscribe(() => {
      closed = true;
    });

    await component.onSubmit();
    await fixture.whenStable();

    expect(closed).toBeTrue();
  });

  it('should handle creation error', async () => {
    fixture.detectChanges();
    presenter.createEvent.and.returnValue(Promise.reject(new Error('Creation failed')));

    try {
      await component.onSubmit();
    } catch {
      // Error handled by presenter
    }

    expect(presenter.createEvent).toHaveBeenCalled();
  });
});
