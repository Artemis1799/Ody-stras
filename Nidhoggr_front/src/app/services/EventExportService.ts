import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { EventService } from './EventService';
import { PointService } from './PointService';
import { GeometryService } from './GeometryService';
import { PhotoService } from './PhotoService';
import { ImagePointService } from './ImagePointsService';
import { EquipmentService } from './EquipmentService';
import { Event } from '../models/eventModel';
import { Point } from '../models/pointModel';
import { Geometry } from '../models/geometryModel';
import { Photo } from '../models/photoModel';
import { Equipment } from '../models/equipmentModel';

/**
 * Structure complète des données exportées pour un événement
 */
export interface EventExportData {
  event: Event;
  points: Array<Point & { 
    photos: Photo[];
    equipment?: Equipment;
  }>;
  geometries: Geometry[];
  exportMetadata: {
    exportDate: Date;
    totalPoints: number;
    totalPhotos: number;
    totalGeometries: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class EventExportService {
  constructor(
    private eventService: EventService,
    private pointService: PointService,
    private geometryService: GeometryService,
    private photoService: PhotoService,
    private imagePointService: ImagePointService,
    private equipmentService: EquipmentService
  ) {}

  /**
   * Récupère toutes les données complètes d'un événement
   */
  getCompleteEventData(eventId: string): Observable<EventExportData> {
    return this.eventService.getById(eventId).pipe(
      switchMap(event => {

        return forkJoin({
          event: of(event),
          points: this.getPointsWithPhotosAndEquipment(eventId),
          geometries: this.getGeometriesByEvent(eventId)
        });
      }),
      map(({ event, points, geometries }) => {
        const totalPhotos = points.reduce((sum, p) => sum + p.photos.length, 0);

        const exportData: EventExportData = {
          event,
          points,
          geometries,
          exportMetadata: {
            exportDate: new Date(),
            totalPoints: points.length,
            totalPhotos,
            totalGeometries: geometries.length
          }
        };

        return exportData;
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Récupère les points avec leurs photos et équipements associés
   */
  private getPointsWithPhotosAndEquipment(eventId: string): Observable<Array<Point & { photos: Photo[]; equipment?: Equipment }>> {
    return this.pointService.getByEventId(eventId).pipe(
      switchMap(points => {
        if (points.length === 0) {
          return of([]);
        }

        // Récupérer toutes les photos et relations imagePoints
        return forkJoin({
          points: of(points),
          allPhotos: this.photoService.getAll(),
          allImagePoints: this.imagePointService.getAll(),
          allEquipments: this.equipmentService.getAll()
        }).pipe(
          map(({ points, allPhotos, allImagePoints, allEquipments }) => {
            // Associer les photos à chaque point
            return points.map(point => {
              // Trouver les ImagePoints pour ce point
              const pointImagePoints = allImagePoints.filter(ip => ip.pointId === point.uuid);
              
              // Récupérer les photos correspondantes
              const pointPhotos = pointImagePoints
                .map(ip => allPhotos.find(p => p.uuid === ip.imageId))
                .filter((p): p is Photo => p !== undefined);

              // Récupérer l'équipement si disponible
              const equipment = point.equipmentId 
                ? allEquipments.find(e => e.uuid === point.equipmentId)
                : undefined;

              return {
                ...point,
                photos: pointPhotos,
                equipment
              };
            });
          })
        );
      })
    );
  }

  /**
   * Récupère les géométries d'un événement
   */
  private getGeometriesByEvent(eventId: string): Observable<Geometry[]> {
    return this.geometryService.getAll().pipe(
      map(geometries => {
        const eventGeometries = geometries.filter(g => g.eventId === eventId);
        return eventGeometries;
      }),
      catchError(() => {
        return of([]);
      })
    );
  }

  /**
   * Convertit les données d'événement en JSON formaté
   */
  exportToJSON(eventData: EventExportData): string {
    return JSON.stringify(eventData, null, 2);
  }

  /**
   * Télécharge les données d'événement en fichier JSON
   */
  downloadAsJSON(eventData: EventExportData): void {
    const jsonString = this.exportToJSON(eventData);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${eventData.event.name || 'event'}_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
