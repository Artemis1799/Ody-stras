export enum ActionType {
  Setup = 0,
  Removal = 1
}

export interface Action {
  uuid: string;
  planningId: string;
  securityZoneId: string;
  type: ActionType;
  date: Date;
  longitude: number;
  latitude: number;
}
