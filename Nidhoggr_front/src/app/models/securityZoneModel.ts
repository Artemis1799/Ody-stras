import { Equipment } from './equipmentModel';

export interface SecurityZone {
  uuid: string;
  eventId: string;
  equipmentId: string;
  quantity: number;
  comment?: string;
  installationDate: Date;
  removalDate: Date;
  geoJson: string;
  event: Event; 
  equipment?: Equipment;
}
