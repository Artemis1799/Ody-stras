import { Float } from "react-native/Libraries/Types/CodegenTypes";

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
  Equipement_quantite: any;
  Equipement_ID: any;
  Event_ID: string;
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
