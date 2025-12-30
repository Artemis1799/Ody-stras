export interface RoutePath {
  uuid: string;
  eventId: string;
  name: string;
  colorHex: string;
  startDate: Date;
  fastestEstimatedSpeed: number;
  slowestEstimatedSpeed: number;
  geoJson: string;
}
