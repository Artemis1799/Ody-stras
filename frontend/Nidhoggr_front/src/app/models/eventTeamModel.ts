import { Event } from './eventModel';
import { Team } from './teamModel';

export interface EventTeam {
  eventId: string;
  teamId: string;
  event?: Event;
  team?: Team;
}
