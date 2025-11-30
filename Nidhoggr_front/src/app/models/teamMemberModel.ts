import { Team } from './teamModel';
import { Member } from './memberModel';

export interface TeamMember {
  teamId: string;
  memberId: string;
  team?: Team;
  member?: Member;
}
