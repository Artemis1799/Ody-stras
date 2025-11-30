export enum EventStatus {
  Uninstalling = 0,
  Finished = 1,
  Installing = 2,
  ToOrganize = 3
}

export interface Event {
  uuid: string;
  name: string;
  description: string;
  startDate?: Date;
  status: EventStatus;
}
