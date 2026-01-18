import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { PointService } from './PointService';
import { PictureService } from './PictureService';
import { EquipmentService } from './EquipmentService';
import { EventService } from './EventService';
import { Point } from '../models/pointModel';
import { Picture } from '../models/pictureModel';
import { Equipment } from '../models/equipmentModel';
import { EventStatus } from '../models/eventModel';
import { DEFAULT_EVENT_UUID } from '../shared/constants/default_id';
import { WS_URL } from '../shared/constants/wsUrl';

export interface WebSocketMessage {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

@Injectable({
  providedIn: 'root',
})
export class WebSocketExportService {
  private ws: WebSocket | null = null;
  private progressSubject = new Subject<WebSocketMessage>();
  public progress$ = this.progressSubject.asObservable();
  private existingPoints: Map<string, Point> = new Map();
  private existingPictures: Map<string, Picture> = new Map();
  private existingEquipments: Map<string, Equipment> = new Map();

  // UUID de l'événement en cours d'import (reçu du mobile via metadata)
  private currentEventUuid: string | null = null;

  // File d'attente pour les photos dont le point n'est pas encore créé
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pendingPictures: Map<string, any[]> = new Map();
  // Points en cours de création (pour éviter les doublons)
  private pointsBeingCreated: Set<string> = new Set();

  constructor(
    private pointService: PointService,
    private pictureService: PictureService,
    private equipmentService: EquipmentService,
    private eventService: EventService
  ) {
    this.loadExistingData();
  }

  /**
   * Charge les données existantes pour vérifier les doublons
   */
  private async loadExistingData(): Promise<void> {
    try {
      // Charger les points existants
      this.pointService.getAll().subscribe({
        next: (points) => {
          points.forEach((p) => this.existingPoints.set(p.uuid, p));
        },
        error: () => {},
      });

      // Charger les pictures existantes
      this.pictureService.getAll().subscribe({
        next: (pictures) => {
          pictures.forEach((p) => this.existingPictures.set(p.uuid, p));
        },
        error: () => {},
      });

      // Charger les équipements existants
      this.equipmentService.getAll().subscribe({
        next: (equipments) => {
          equipments.forEach((e) => this.existingEquipments.set(e.uuid, e));
        },
      });
    } catch {
      // Ignorer les erreurs de chargement
    }
  }

  /**
   * Démarre le serveur WebSocket Node.js puis se connecte
   */
  async startServerAndConnect(): Promise<void> {
    // Réinitialiser l'eventUuid pour un nouvel import
    this.currentEventUuid = null;

    // Réinitialiser les files d'attente
    this.pendingPictures.clear();
    this.pointsBeingCreated.clear();

    // Vérifier si le serveur tourne déjà
    await this.checkServerStatus();

    // Recharger les données existantes
    await this.loadExistingData();

    // Se connecter au serveur
    this.connect();
  }

  /**
   * Vérifie si le serveur est déjà en cours d'exécution
   */
  private async checkServerStatus(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:8766/status');
      if (response.ok) {
        return true;
      }
    } catch {
      // Serveur pas démarré
    }
    return false;
  }

  /**
   * Se connecte au serveur WebSocket et écoute les messages
   */
  connect(): void {
    if (this.ws) {
      return;
    }

    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        this.progressSubject.next({
          type: 'connected',
          data: { message: 'Connexion établie' },
        });
      };

      this.ws.onerror = () => {
        this.progressSubject.next({
          type: 'error',
          data: { message: 'Erreur de connexion' },
        });
      };

      this.ws.onclose = () => {
        this.progressSubject.next({
          type: 'disconnected',
          data: { message: 'Connexion fermée' },
        });
        this.ws = null;
      };

      this.ws.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          this.processReceivedData(parsedData);
          this.progressSubject.next({
            type: 'message',
            data: parsedData,
          });
        } catch {
          this.progressSubject.next({
            type: 'message',
            data: event.data,
          });
        }
      };
    } catch {
      // Ignorer les erreurs de connexion WebSocket
    }
  }

  /**
   * Traite les données reçues du WebSocket
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async processReceivedData(data: any): Promise<void> {
    // Traiter les métadonnées pour récupérer l'eventUUID du mobile
    if (data.type === 'metadata' && data.eventUUID) {
      this.currentEventUuid = data.eventUUID;
      // S'assurer que l'événement existe dans la BD
      await this.ensureEventExists(data.eventUUID);
    } else if (data.type === 'point' && data.point) {
      try {
        await this.processPoint(data.point);
      } catch {
        // Ignorer les erreurs de traitement
      }
    } else if ((data.type === 'picture' || data.type === 'photo') && (data.picture || data.photo)) {
      try {
        // Supporter les deux formats : 'picture' (nouveau) et 'photo' (ancien/mobile)
        const photoData = data.picture || data.photo;
        await this.processPicture(photoData, data.pointUUID);
      } catch {
        // Ignorer les erreurs de traitement
      }
    } else if (data.type === 'end') {
      try {
        await this.loadExistingData();
        // Réinitialiser l'eventUuid pour le prochain import
        this.currentEventUuid = null;
      } catch {
        // Ignorer les erreurs de rechargement
      }
    }
  }

  /**
   * Vérifie si un Event existe, sinon le crée
   */
  private async ensureEventExists(eventId: string): Promise<void> {
    try {
      await new Promise<void>((resolve, reject) => {
        this.eventService.getById(eventId).subscribe({
          next: () => {
            resolve();
          },
          error: (err) => {
            if (err.status === 404) {
              const newEvent = {
                uuid: eventId,
                title: 'Event Mobile Import',
                startDate: new Date(),
                endDate: new Date(),
                status: EventStatus.ToOrganize,
              };

              this.eventService.create(newEvent).subscribe({
                next: () => {
                  resolve();
                },
                error: (createErr) => {
                  reject(createErr);
                },
              });
            } else {
              reject(err);
            }
          },
        });
      });
    } catch {
      // Ignorer l'erreur si l'événement ne peut pas être créé
    }
  }

  /**
   * Traite un point reçu (création ou modification)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, complexity
  private async processPoint(pointData: any): Promise<void> {
    // Le mobile peut envoyer en PascalCase ou camelCase
    const uuid = pointData.UUID || pointData.uuid;

    if (!uuid) {
      return;
    }

    // Marquer le point comme en cours de création
    this.pointsBeingCreated.add(uuid);

    // Récupérer l'eventId : priorité au mobile, sinon currentEventUuid, sinon default
    const mobileEventId = pointData.EventID || pointData.Event_ID || pointData.eventId;
    const eventIdToUse = mobileEventId || this.currentEventUuid || DEFAULT_EVENT_UUID;

    // S'assurer que l'événement existe
    if (eventIdToUse && eventIdToUse !== DEFAULT_EVENT_UUID) {
      await this.ensureEventExists(eventIdToUse);
    }

    // Récupérer l'équipement ID du format mobile
    const mobileEquipmentId =
      pointData.EquipmentID || pointData.Equipement_ID || pointData.equipmentId;
    // Vérifier si c'est un GUID "null" ou vide
    const isNullEquipmentId =
      !mobileEquipmentId || mobileEquipmentId === '00000000-0000-0000-0000-000000000000';

    // Convertir du format mobile vers TypeScript (camelCase)
    const point: Point = {
      uuid: uuid,
      eventId: eventIdToUse,
      name: pointData.Name ?? pointData.name ?? '',
      latitude: pointData.Latitude ?? pointData.latitude,
      longitude: pointData.Longitude ?? pointData.longitude,
      comment: pointData.Comment ?? pointData.Commentaire ?? pointData.comment ?? '',
      order: pointData.Ordre ?? pointData.Order ?? pointData.order ?? 0,
      validated:
        pointData.Validated !== undefined
          ? Boolean(pointData.Validated)
          : pointData.Valide !== undefined
          ? Boolean(pointData.Valide)
          : true,
      isPointOfInterest: pointData.IsPointOfInterest ?? pointData.isPointOfInterest ?? false,
      equipmentId: isNullEquipmentId ? null : mobileEquipmentId,
    };

    // Si un équipement valide est spécifié, vérifier s'il existe ou le créer
    if (!isNullEquipmentId && mobileEquipmentId) {
      // Vérifier si l'équipement existe
      const equipmentExists = this.existingEquipments.has(mobileEquipmentId);

      if (equipmentExists) {
        point.equipmentId = mobileEquipmentId;
      } else {
        // Créer l'équipement d'abord
        const newEquipment: Equipment = {
          uuid: mobileEquipmentId,
          length: 0,
        };

        // Essayer de créer l'équipement de manière synchrone
        await new Promise<void>((resolve) => {
          this.equipmentService.create(newEquipment).subscribe({
            next: (created) => {
              this.existingEquipments.set(created.uuid, created);
              point.equipmentId = created.uuid;
              resolve();
            },
            error: () => {
              // Continuer sans équipement
              resolve();
            },
          });
        });
      }
    }

    // Créer ou mettre à jour le point de manière synchrone
    await new Promise<void>((resolve) => {
      this.pointService.getById(uuid).subscribe({
        next: () => {
          // Le point existe -> UPDATE
          this.pointService.update(uuid, point).subscribe({
            next: (updated) => {
              console.log('✅ Point mis à jour:', uuid);
              this.existingPoints.set(uuid, updated);
              this.pointsBeingCreated.delete(uuid);
              // Traiter les photos en attente pour ce point
              this.processPendingPicturesForPoint(uuid);
              resolve();
            },
            error: (err) => {
              console.error('❌ Erreur mise à jour point:', uuid, err);
              this.pointsBeingCreated.delete(uuid);
              resolve();
            },
          });
        },
        error: (err) => {
          if (err.status === 404) {
            // Le point n'existe pas -> CREATE (garder l'UUID du mobile)
            this.pointService.create(point).subscribe({
              next: (created) => {
                console.log('✅ Point créé:', created.uuid);
                this.existingPoints.set(created.uuid, created);
                this.pointsBeingCreated.delete(uuid);
                // Traiter les photos en attente pour ce point
                this.processPendingPicturesForPoint(uuid);
                resolve();
              },
              error: (createErr) => {
                console.error('❌ Erreur création point:', uuid, createErr);
                this.pointsBeingCreated.delete(uuid);
                resolve();
              },
            });
          } else {
            console.error('❌ Erreur vérification point:', uuid, err);
            this.pointsBeingCreated.delete(uuid);
            resolve();
          }
        },
      });
    });
  }

  /**
   * Traite les photos en attente pour un point donné
   */
  private processPendingPicturesForPoint(pointUUID: string): void {
    const pendingPhotos = this.pendingPictures.get(pointUUID);
    if (pendingPhotos && pendingPhotos.length > 0) {
      console.log(
        `📸 Traitement de ${pendingPhotos.length} photo(s) en attente pour point ${pointUUID}`
      );
      pendingPhotos.forEach((photoData) => {
        this.processPictureInternal(photoData, pointUUID);
      });
      this.pendingPictures.delete(pointUUID);
    }
  }

  /**
   * Traite une picture reçue (création ou modification)
   * Met la photo en file d'attente si le point n'existe pas encore
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private processPicture(pictureData: any, pointUUID: string): void {
    const uuid = pictureData.UUID || pictureData.uuid;

    if (!uuid) {
      console.warn('⚠️ Picture ignorée: UUID manquant', pictureData);
      return;
    }

    if (!pointUUID) {
      console.warn('⚠️ Picture ignorée: pointUUID manquant pour picture', uuid);
      return;
    }

    // Vérifier si le point existe déjà ou est en cours de création
    const pointExists = this.existingPoints.has(pointUUID);
    const pointBeingCreated = this.pointsBeingCreated.has(pointUUID);

    if (!pointExists && pointBeingCreated) {
      // Le point est en cours de création, mettre la photo en attente
      console.log(`⏳ Photo ${uuid} mise en attente (point ${pointUUID} en cours de création)`);
      if (!this.pendingPictures.has(pointUUID)) {
        this.pendingPictures.set(pointUUID, []);
      }
      this.pendingPictures.get(pointUUID)!.push(pictureData);
      return;
    }

    if (!pointExists && !pointBeingCreated) {
      // Le point n'existe pas encore et n'est pas en cours de création
      // Mettre en attente quand même, le point arrivera plus tard
      console.log(`⏳ Photo ${uuid} mise en attente (point ${pointUUID} pas encore reçu)`);
      if (!this.pendingPictures.has(pointUUID)) {
        this.pendingPictures.set(pointUUID, []);
      }
      this.pendingPictures.get(pointUUID)!.push(pictureData);
      return;
    }

    // Le point existe, traiter la photo immédiatement
    this.processPictureInternal(pictureData, pointUUID);
  }

  /**
   * Traite effectivement une picture (création ou modification dans la BDD)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private processPictureInternal(pictureData: any, pointUUID: string): void {
    const uuid = pictureData.UUID || pictureData.uuid;

    // Récupérer et nettoyer les données de l'image
    let imageData =
      pictureData.PictureData ||
      pictureData.pictureData ||
      pictureData.Picture ||
      pictureData.picture ||
      '';

    if (!imageData) {
      console.warn('⚠️ Picture ignorée: données image manquantes pour picture', uuid);
      return;
    }

    if (typeof imageData === 'string' && imageData.includes(',')) {
      // Enlever le préfixe "data:image/...;base64,"
      imageData = imageData.split(',')[1] || imageData;
    }

    // Convertir du format mobile vers TypeScript (camelCase)
    const picture: Picture = {
      uuid: uuid,
      pointId: pointUUID,
      pictureData: imageData,
    };

    console.log(
      '📸 Traitement picture:',
      uuid,
      'pour point:',
      pointUUID,
      '(données:',
      imageData.substring(0, 50) + '...)'
    );

    // Vérifier si la picture existe déjà
    if (this.existingPictures.has(uuid)) {
      this.pictureService.update(uuid, picture).subscribe({
        next: (updated) => {
          console.log('✅ Picture mise à jour:', uuid);
          this.existingPictures.set(uuid, updated);
        },
        error: (err) => {
          console.error('❌ Erreur mise à jour picture:', uuid, err);
        },
      });
    } else {
      this.pictureService.create(picture).subscribe({
        next: (created) => {
          console.log('✅ Picture créée:', uuid);
          this.existingPictures.set(uuid, created);
        },
        error: (err) => {
          console.error('❌ Erreur création picture:', uuid, err);
        },
      });
    }
  }

  /**
   * Traite un équipement reçu (création ou modification)
   */
  private processEquipment(equipmentData: Equipment): void {
    const uuid = equipmentData.uuid;

    // Convertir du format API vers TypeScript
    const equipment: Equipment = {
      uuid: equipmentData.uuid,
      type: equipmentData.type,
      description: equipmentData.description,
      length: equipmentData.length || 0,
    };

    // Vérifier si l'équipement existe déjà
    if (this.existingEquipments.has(uuid)) {
      this.equipmentService.update(uuid, equipment).subscribe({
        next: (updated) => {
          this.existingEquipments.set(uuid, updated);
        },
        error: () => {},
      });
    } else {
      this.equipmentService.create(equipment).subscribe({
        next: (created) => {
          this.existingEquipments.set(uuid, created);
        },
        error: () => {},
      });
    }
  }

  /**
   * Déconnecte le WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Vérifie si le WebSocket est connecté
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
