export enum EventStatus {
  Draft = 0,
  Active = 1,
  Completed = 2,
  Cancelled = 3
}

export interface Event {
  uuid: string;
  name: string;
  description: string;
  startDate?: Date;
  status: EventStatus;
  responsibleId?: string;
}
