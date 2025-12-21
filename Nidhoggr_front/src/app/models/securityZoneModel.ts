import { Equipment } from './equipmentModel';

export interface SecurityZone {
  uuid: string;
  eventId: string;
  equipmentId: string;
  quantity: number;
  installationDate: Date;
  removalDate: Date;
  geoJson: string;
  equipment?: Equipment;
}
