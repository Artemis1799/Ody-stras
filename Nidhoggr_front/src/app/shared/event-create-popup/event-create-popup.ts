import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Event } from '../../models/eventModel';
import { EventCreatePopupPresenter } from './event-create-popup.presenter';

@Component({
  selector: 'app-event-create-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [EventCreatePopupPresenter],
  templateUrl: './event-create-popup.html',
  styleUrls: ['./event-create-popup.scss']
})
export class EventCreatePopup implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() eventCreated = new EventEmitter<Event>();

  constructor(public presenter: EventCreatePopupPresenter) {}

  ngOnInit(): void {
    this.presenter.reset();
  }

  async onSubmit(): Promise<void> {
    try {
      const event = await this.presenter.createEvent();
      this.eventCreated.emit(event);
      this.close.emit();
    } catch {
      // Erreur gérée par le presenter
    }
  }
}
