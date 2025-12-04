import { Equipment } from "./equipmentModel";

export interface Point {
  uuid: string;
  eventId: string;
  equipmentId: string | null;
  latitude?: number;
  longitude?: number;
  comment?: string;
  imageId?: string;
  order?: number;
  isValid: boolean;
  created: Date;
  modified: Date;
  equipmentQuantity: number;
  installedAt?: Date | null;
  removedAt?: Date | null;
  event?: Event; 
  equipment?: Equipment;
}