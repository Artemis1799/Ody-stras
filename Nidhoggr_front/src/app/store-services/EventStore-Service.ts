import { Injectable } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { Event } from '../models/eventModel';

@Injectable({
  providedIn: 'root',
})
export class EventStoreService {
  private selectedEventSubject = new BehaviorSubject<Event | null>(null);
  public selectedEvent$: Observable<Event | null> = this.selectedEventSubject.asObservable();

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}

  /**
   * Récupère l'UUID de l'événement depuis les query params de l'URL
   */
  getEventUuidFromUrl(): string | null {
    const uuid = this.activatedRoute.snapshot.queryParamMap.get('eventId');
    return uuid;
  }

  /**
   * Définit l'événement sélectionné et met à jour l'URL
   */
  setSelectedEvent(event: Event | null): void {
    this.selectedEventSubject.next(event);

    // Mettre à jour l'URL
    if (event) {
      this.router.navigate([], {
        relativeTo: this.activatedRoute,
        queryParams: { eventId: event.uuid },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    } else {
      // Supprimer le paramètre eventId de l'URL
      this.router.navigate([], {
        relativeTo: this.activatedRoute,
        queryParams: { eventId: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  }

  /**
   * Récupère l'événement sélectionné
   */
  getSelectedEvent(): Event | null {
    return this.selectedEventSubject.value;
  }

  /**
   * Initialise le store avec l'URL (à appeler au ngOnInit du composant parent)
   */
  initializeFromUrl(): string | null {
    return this.getEventUuidFromUrl();
  }
}
