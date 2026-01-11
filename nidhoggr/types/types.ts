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
  AddPoint: { eventId: string; pointIdParam?: string };
  Events: undefined;
  AddEvent: undefined;
  Event: {
    UUID: string;
    Title: string;
    StartDate: string;
    EndDate: string;
    Status: string;
  };
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

export interface Evenement {
  UUID: string;
  Title: string;
  StartDate: string;
  EndDate: string;
  Status:
  | "uninstallation"
  | "completed"
  | "installation"
  | "toOrganize"
  | "inProgress";
}

export interface Equipment {
  UUID: string;
  Type: string;
  Length?: number;
  Description?: string;
  StorageType?: "single" | "multiple";
}

export interface EquipmentListItem {
  label: string;
  value: string;
}

export interface Point {
  UUID: string;
  EventID: string;
  Name: string;
  Latitude: number;
  Longitude: number;
  Comment?: string;
  Validated?: number; // 0 = false, 1 = true (SQLite INTEGER)
  EquipmentID?: string;
  EquipmentQuantity?: number;
  Ordre?: number;
}

export interface PointOnMap {
  UUID: string;
  Latitude: number;
  Longitude: number;
  EquipmentType?: string;
  Name?: string;
}

export interface pointPhotoParams {
  pointId: string;
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

export interface Picture {
  UUID: string;
  Picture: string;
  PointID: string;
}

export type GeoJSONType = "Point" | "LineString" | "Polygon";

export type Coordinates =
  | [number, number]
  | [number, number][]
  | [number, number][][];

export interface GeoJSON {
  type: GeoJSONType;
  coordinates: Coordinates;
}

export interface Path {
  UUID: string;
  EventID: string;
  Name: string;
  ColorHex: string;
  StartDate: string;
  FastestEstimatedSpeed: number;
  SlowestEstimatedSpeed: number;
  GeoJson: string;
}

export interface Employee {
  UUID: string;
  FirstName: string;
  LastName: string;
  Email?: string;
  Phone?: string;
}

export interface Team {
  UUID: string;
  EventID: string;
  TeamName: string;
}

export interface TeamEmployee {
  TeamID: string;
  EmployeeID: string;
}

export interface Planning {
  UUID: string;
  TeamID: string;
}

export interface SecurityArea {
  UUID: string;
  EquipmentID: string;
  Quantity: number;
  InstallationDate: string;
  RemovalDate: string;
  GeoJson: string;
}

export interface Action {
  UUID: string;
  PlanningID: string;
  SecurityAreaID: string;
  Type: "setup" | "removal";
  Date: string;
  Longitude: number;
  Latitude: number;
}

export interface Area {
  UUID: string;
  EventID: string;
  Name?: string;
  ColorHex: string;
  GeoJson: string;
}

export type RenderPathsProps = {
  paths: Path[];
};

export type RenderAreasProps = {
  areas: Area[];
};
