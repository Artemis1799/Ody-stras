import { Team } from './teamModel';
import { Action } from './actionModel';

export interface Planning {
  uuid: string;
  teamId: string;
  team?: Team;
  actions?: Action[];
}
