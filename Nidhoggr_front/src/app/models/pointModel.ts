import { Equipment } from "./equipmentModel";

export interface Point {
  uuid: string;
  eventId: string;
  equipmentId: string;
  latitude?: number;
  longitude?: number;
  comment?: string;
  imageId?: string;
  order?: number;
  isValid: boolean;
  created: Date;
  modified: Date;
  equipmentQuantity: number;
  event?: any; // Vous pouvez typer Event si vous avez le modèle
  equipment?: Equipment;
}