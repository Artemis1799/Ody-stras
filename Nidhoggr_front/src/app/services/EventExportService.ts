import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { EventService } from './EventService';
import { PointService } from './PointService';
import { AreaService } from './AreaService';
import { PathService } from './PathService';
import { PictureService } from './PictureService';
import { EquipmentService } from './EquipmentService';
import { Event } from '../models/eventModel';
import { Point } from '../models/pointModel';
import { Area } from '../models/areaModel';
import { RoutePath } from '../models/routePathModel';
import { Picture } from '../models/pictureModel';
import { Equipment } from '../models/equipmentModel';

/**
 * Structure complète des données exportées pour un événement
 */
export interface EventExportData {
  event: Event;
  points: Array<Point & { 
    pictures: Picture[];
    equipment?: Equipment;
  }>;
  areas: Area[];
  paths: RoutePath[];
  exportMetadata: {
    exportDate: Date;
    totalPoints: number;
    totalPictures: number;
    totalAreas: number;
    totalPaths: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class EventExportService {
  constructor(
    private eventService: EventService,
    private pointService: PointService,
    private areaService: AreaService,
    private pathService: PathService,
    private pictureService: PictureService,
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
          points: this.getPointsWithPicturesAndEquipment(eventId),
          areas: this.areaService.getByEventId(eventId),
          paths: this.pathService.getByEventId(eventId)
        });
      }),
      map(({ event, points, areas, paths }) => {
        const totalPictures = points.reduce((sum, p) => sum + p.pictures.length, 0);

        const exportData: EventExportData = {
          event,
          points,
          areas,
          paths,
          exportMetadata: {
            exportDate: new Date(),
            totalPoints: points.length,
            totalPictures,
            totalAreas: areas.length,
            totalPaths: paths.length
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
  private getPointsWithPicturesAndEquipment(eventId: string): Observable<Array<Point & { pictures: Picture[]; equipment?: Equipment }>> {
    return this.pointService.getByEventId(eventId).pipe(
      switchMap(points => {
        if (points.length === 0) {
          return of([]);
        }

        // Récupérer toutes les photos et équipements
        return forkJoin({
          points: of(points),
          allPictures: this.pictureService.getAll(),
          allEquipments: this.equipmentService.getAll()
        }).pipe(
          map(({ points, allPictures, allEquipments }) => {
            // Associer les photos à chaque point via pointId
            return points.map(point => {
              // Trouver les pictures pour ce point
              const pointPictures = allPictures.filter(pic => pic.pointId === point.uuid);

              // Récupérer l'équipement si disponible
              const equipment = point.equipmentId 
                ? allEquipments.find(e => e.uuid === point.equipmentId)
                : undefined;

              return {
                ...point,
                pictures: pointPictures,
                equipment
              };
            });
          })
        );
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
    link.download = `${eventData.event.title || 'event'}_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
