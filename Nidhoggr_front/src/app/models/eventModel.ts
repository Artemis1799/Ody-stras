export enum EventStatus {
  ToOrganize = 0,
  InProgress = 1,
  Installation = 2,
  Uninstallation = 3,
  Completed = 4
}

export interface Event {
  uuid: string;
  title: string;
  startDate: Date;
  endDate: Date;
  status: EventStatus;
  minDurationMinutes?: number;
  maxDurationMinutes?: number;
  isArchived?: boolean;
  isFavorite?: boolean;
}
