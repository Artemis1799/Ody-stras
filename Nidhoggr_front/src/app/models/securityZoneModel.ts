import { Equipment } from './equipmentModel';
import { Team } from './teamModel';
import { Event } from './eventModel';

export interface SecurityZone {
  uuid: string;
  eventId: string;
  equipmentId: string;
  quantity: number;
  comment?: string;
  installationDate: Date;
  removalDate: Date;
  geoJson: string;
  installationTeamId?: string;
  removalTeamId?: string;
  event: Event; 
  equipment?: Equipment;
  installationTeam?: Team;
  removalTeam?: Team;
}
