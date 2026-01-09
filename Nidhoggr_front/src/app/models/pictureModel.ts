export interface Picture {
  uuid: string;
  pointId?: string;
  securityZoneId?: string;
  pictureData: string; // Base64 encoded byte array
}
