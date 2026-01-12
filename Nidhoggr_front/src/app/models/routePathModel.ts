export interface RoutePath {
  uuid: string;
  eventId: string;
  name: string;
  description?: string;
  colorHex: string;
  startDate: Date;
  fastestEstimatedSpeed: number;
  slowestEstimatedSpeed: number;
  geoJson: string;
}
