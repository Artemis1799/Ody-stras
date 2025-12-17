import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { 
  Geometry, 
  GeoJSONFeature, 
  GeoJSONFeatureCollection,
  GeoJSONGeometry,
  GeometryProperties
} from '../models/geometryModel';
import { environment } from '../../environments/environment';

/**
 * Interface pour les données envoyées/reçues du backend
 * Le backend renvoie geoJson et properties comme objets JSON directement
 */
interface GeometryDTO {
  uuid?: string;
  eventId: string;
  type: string;
  geoJson: GeoJSONGeometry;  // Objet JSON
  properties: GeometryProperties;  // Objet JSON
  created?: Date;
  modified?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class GeometryService {
  private apiUrl = `${environment.apiUrl}/api/geometries`;
  private geometriesSubject = new BehaviorSubject<Geometry[]>([]);
  
  geometries$ = this.geometriesSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Convertit un DTO du backend en Geometry pour le frontend
   */
  private fromDTO(dto: GeometryDTO): Geometry {
    return {
      uuid: dto.uuid || '',
      eventId: dto.eventId,
      type: dto.type as Geometry['type'],
      geoJson: dto.geoJson,
      properties: dto.properties || {},
      created: dto.created ? new Date(dto.created) : new Date(),
      modified: dto.modified ? new Date(dto.modified) : new Date()
    };
  }

  /**
   * Convertit une Geometry du frontend en DTO pour le backend
   */
  private toDTO(geometry: Partial<Geometry>): Partial<GeometryDTO> {
    const dto: Partial<GeometryDTO> = {};
    
    if (geometry.uuid) dto.uuid = geometry.uuid;
    if (geometry.eventId) dto.eventId = geometry.eventId;
    if (geometry.type) dto.type = geometry.type;
    if (geometry.geoJson) dto.geoJson = geometry.geoJson;
    if (geometry.properties) dto.properties = geometry.properties;
    if (geometry.created) dto.created = geometry.created;
    if (geometry.modified) dto.modified = geometry.modified;
    
    return dto;
  }

  getAll(): Observable<Geometry[]> {
    return this.http.get<GeometryDTO[]>(this.apiUrl).pipe(
      map(dtos => dtos.map(dto => this.fromDTO(dto))),
      tap(geometries => this.geometriesSubject.next(geometries))
    );
  }

  getById(uuid: string): Observable<Geometry> {
    return this.http.get<GeometryDTO>(`${this.apiUrl}/${uuid}`).pipe(
      map(dto => this.fromDTO(dto))
    );
  }

  getByEventId(eventId: string): Observable<Geometry[]> {
    return this.http.get<GeometryDTO[]>(`${this.apiUrl}/event/${eventId}`).pipe(
      map(dtos => dtos.map(dto => this.fromDTO(dto))),
      tap(geometries => this.geometriesSubject.next(geometries))
    );
  }

  create(geometry: Partial<Geometry>): Observable<Geometry> {
    const dto = this.toDTO(geometry);
    return this.http.post<GeometryDTO>(this.apiUrl, dto).pipe(
      map(responseDto => this.fromDTO(responseDto)),
      tap(created => {
        const current = this.geometriesSubject.value;
        this.geometriesSubject.next([...current, created]);
      })
    );
  }

  update(uuid: string, geometry: Partial<Geometry>): Observable<Geometry> {
    const dto = this.toDTO(geometry);
    return this.http.put<GeometryDTO>(`${this.apiUrl}/${uuid}`, dto).pipe(
      map(responseDto => this.fromDTO(responseDto)),
      tap(updated => {
        const current = this.geometriesSubject.value;
        const index = current.findIndex(g => g.uuid === uuid);
        if (index !== -1) {
          current[index] = updated;
          this.geometriesSubject.next([...current]);
        }
      })
    );
  }

  delete(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${uuid}`).pipe(
      tap(() => {
        const current = this.geometriesSubject.value;
        this.geometriesSubject.next(current.filter(g => g.uuid !== uuid));
      })
    );
  }

  exportAsGeoJSON(): GeoJSONFeatureCollection {
    const geometries = this.geometriesSubject.value;
    const features: GeoJSONFeature[] = geometries.map(geometry => ({
      type: 'Feature',
      id: geometry.uuid,
      geometry: geometry.geoJson,
      properties: geometry.properties
    }));

    return {
      type: 'FeatureCollection',
      features
    };
  }

  exportGeometryAsGeoJSON(geometry: Geometry): GeoJSONFeature {
    return {
      type: 'Feature',
      id: geometry.uuid,
      geometry: geometry.geoJson,
      properties: geometry.properties
    };
  }

  importGeoJSON(featureCollection: GeoJSONFeatureCollection, eventId: string): Observable<Geometry>[] {
    const observables: Observable<Geometry>[] = [];

    featureCollection.features.forEach(feature => {
      const geometry: Partial<Geometry> = {
        eventId,
        type: feature.geometry.type,
        geoJson: feature.geometry,
        properties: feature.properties,
        created: new Date(),
        modified: new Date()
      };

      observables.push(this.create(geometry));
    });

    return observables;
  }

  leafletToGeoJSON(layer: L.Layer): GeoJSONGeometry | null {
    if (!layer || typeof (layer as L.Layer & { toGeoJSON?: () => GeoJSON.Feature }).toGeoJSON !== 'function') {
      return null;
    }

    const geoJSON = (layer as L.Layer & { toGeoJSON: () => GeoJSON.Feature }).toGeoJSON();
    return geoJSON.geometry as GeoJSONGeometry;
  }

  saveFromLeafletLayer(
    layer: L.Layer,
    eventId: string,
    properties: GeometryProperties = {}
  ): Observable<Geometry> | null {
    const geoJson = this.leafletToGeoJSON(layer);
    
    if (!geoJson) {
      return null;
    }

    const geometry: Partial<Geometry> = {
      eventId,
      type: geoJson.type,
      geoJson,
      properties: {
        ...properties,
        created: new Date(),
        modified: new Date()
      },
      created: new Date(),
      modified: new Date()
    };

    return this.create(geometry);
  }

  downloadGeoJSON(filename: string = 'geometries.geojson'): void {
    const geoJSON = this.exportAsGeoJSON();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(geoJSON, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
}
