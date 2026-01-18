import { Area } from './areaModel';
import { RoutePath } from './routePathModel';

export type GeometryType = 'area' | 'path';

export interface GeometryEditData {
  type: GeometryType;
  data: Area | RoutePath;
}
