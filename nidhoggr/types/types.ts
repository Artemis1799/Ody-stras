import { Float } from "react-native/Libraries/Types/CodegenTypes";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

export type RootStackParamList = {
  EventScreen: Evenement;
  Map: { eventId: string };
  SimulateScreen: { eventUUID: string };
  Points: { eventUUID: string };
  ExportEvent: { eventUUID: string };
  ImportEvent: undefined;
  AddPhoto: { pointId: string };
  AddPoint: { eventId: string } | { eventId: string; pointIdParam: string };
  Event: {
    UUID: string;
    Nom: string;
    Description: string;
    Date_debut: string;
    Status: string;
  };
  Events: undefined;
  AddEvent: undefined;
};

export type EventScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "EventScreen"
>;
export interface createPointParams {
  eventId: string;
  pointIdParam: string;
}
export interface mapParams {
  eventId: string;
  eventName: string;
}
export interface pointPhotoParams {
  pointId: string;
}
export interface Evenement {
  UUID: string;
  Nom: string;
  Date_debut: string;
  Status: string;
  Responsable: string;
  Description: string;
}

export interface Equipement {
  UUID: string;
  Type: string;
  Description?: string;
  Unite?: string;
  Stock_total: Float;
  Stock_restant: Float;
}

export interface EquipementList {
  label: string;
  value: string;
}

export interface Point {
  UUID: string;
  Latitude: Float;
  Longitude: Float;
  Commentaire: string;
  Equipement_quantite: number;
  Equipement_ID: string;
  Event_ID: string;
  Ordre?: number;
}
export interface PointOnMap {
  UUID: string;
  Latitude: Float;
  Longitude: Float;
  EquipType: string;
  Equipement_quantite: number;
}
export interface UserLocation {
  latitude: number;
  longitude: number;
}

export interface EventScreenProps {
  eventUUID: string;
  eventName: string;
  eventDescription: string;
  eventDate: string;
  eventStatus: string;
}

export interface Photos {
  UUID: string;
  Picture: string;
  Picture_name?: string;
}
