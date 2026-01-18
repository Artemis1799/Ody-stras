import { Team } from './teamModel';
import { Employee } from './employeeModel';

export interface TeamEmployee {
  teamId: string;
  employeeId: string;
  team?: Team;
  employee?: Employee;
}
