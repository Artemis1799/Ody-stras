import { Equipment } from "./equipmentModel";

export interface Point {
  uuid: string;
  eventId: string;
  name: string;
  latitude: number;
  longitude: number;
  comment?: string;
  order?: number;
  validated: boolean;
  equipmentId?: string;
  equipment?: Equipment;
  isPointOfInterest?: boolean;
}