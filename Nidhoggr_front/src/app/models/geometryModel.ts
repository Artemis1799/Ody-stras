/**
 * Type de géométrie GeoJSON
 */
export type GeometryType = 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon';

/**
 * Position: [longitude, latitude] ou [longitude, latitude, altitude]
 */
export type Position = [number, number] | [number, number, number];

/**
 * Interface de base pour les géométries GeoJSON
 */
export interface GeoJSONGeometry {
  type: GeometryType;
  coordinates: Position | Position[] | Position[][] | Position[][][];
}

/**
 * Point GeoJSON
 */
export interface GeoJSONPoint extends GeoJSONGeometry {
  type: 'Point';
  coordinates: Position;
}

/**
 * LineString GeoJSON (ligne/chemin)
 */
export interface GeoJSONLineString extends GeoJSONGeometry {
  type: 'LineString';
  coordinates: Position[];
}

/**
 * Polygon GeoJSON
 */
export interface GeoJSONPolygon extends GeoJSONGeometry {
  type: 'Polygon';
  coordinates: Position[][];
}

/**
 * Propriétés personnalisées pour une géométrie
 */
export interface GeometryProperties {
  name?: string;
  description?: string;
  color?: string;
  created?: Date;
  modified?: Date;
  [key: string]: unknown;
}

/**
 * Feature GeoJSON complète avec propriétés
 */
export interface GeoJSONFeature {
  type: 'Feature';
  geometry: GeoJSONGeometry;
  properties: GeometryProperties;
  id?: string;
}

/**
 * Collection de features GeoJSON
 */
export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

/**
 * Modèle de géométrie pour l'application
 */
export interface Geometry {
  uuid: string;
  eventId: string;
  type: GeometryType;
  geoJson: GeoJSONGeometry;
  properties: GeometryProperties;
  created: Date;
  modified: Date;
}
