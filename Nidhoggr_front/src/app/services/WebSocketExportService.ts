import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { PointService } from './PointService';
import { PhotoService } from './PhotoService';
import { EquipmentService } from './EquipmentService';
import { EventService } from './EventService';
import { ImagePointService } from './ImagePointsService';
import { Point } from '../models/pointModel';
import { Photo } from '../models/photoModel';
import { Equipment } from '../models/equipmentModel';
import { EventStatus } from '../models/eventModel';
import { ImagePoint } from '../models/imagePointsModel';
import { DEFAULT_EVENT_UUID } from '../shared/constants/default_id';
import { WS_URL } from '../shared/constants/wsUrl';

export interface WebSocketMessage {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketExportService {
  private ws: WebSocket | null = null;
  private progressSubject = new Subject<WebSocketMessage>();
  public progress$ = this.progressSubject.asObservable();
  private existingPoints: Map<string, Point> = new Map();
  private existingPhotos: Map<string, Photo> = new Map();
  private existingEquipments: Map<string, Equipment> = new Map();
  
  // UUID de l'événement en cours d'import (reçu du mobile via metadata)
  private currentEventUuid: string | null = null;

  constructor(
    private pointService: PointService,
    private photoService: PhotoService,
    private equipmentService: EquipmentService,
    private eventService: EventService,
    private imagePointService: ImagePointService
  ) {
    this.loadExistingData();
  }

  /**
   * Charge les données existantes pour vérifier les doublons
   */
  private async loadExistingData(): Promise<void> {
    console.log('🔄 Chargement des données existantes...');
    
    try {
      // Charger les points existants
      this.pointService.getAll().subscribe({
        next: (points) => {
          points.forEach(p => this.existingPoints.set(p.uuid, p));
          console.log(`   📍 ${points.length} points chargés`);
        },
        error: (err) => {
          console.error('   ❌ Erreur chargement points:', err);
        }
      });

      // Charger les photos existantes
      this.photoService.getAll().subscribe({
        next: (photos) => {
          photos.forEach(p => this.existingPhotos.set(p.uuid, p));
          console.log(`   📸 ${photos.length} photos chargées`);
        },
        error: (err) => {
          console.error('   ❌ Erreur chargement photos:', err);
        }
      });

      // Charger les équipements existants
      this.equipmentService.getAll().subscribe({
        next: (equipments) => {
          equipments.forEach(e => this.existingEquipments.set(e.uuid, e));
          console.log(`   ⚙️ ${equipments.length} équipements chargés`);
        },
        error: (err) => {
          console.error('   ❌ Erreur chargement équipements:', err);
        }
      });
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error);
    }
  }

  /**
   * Démarre le serveur WebSocket Node.js puis se connecte
   */
  async startServerAndConnect(): Promise<void> {
    console.log('🚀 Démarrage du processus de connexion WebSocket');
    
    // Réinitialiser l'eventUuid pour un nouvel import
    this.currentEventUuid = null;
    
    // Vérifier si le serveur tourne déjà
    const isRunning = await this.checkServerStatus();
    if (!isRunning) {
      console.warn('⚠️ Serveur WebSocket non démarré. Lancez: npm run ws-server');
    } else {
      console.log('✅ Serveur WebSocket détecté');
    }
    
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
      console.log('⚠️ WebSocket déjà connecté');
      return;
    }

    console.log('🔌 Connexion au WebSocket:', WS_URL);
    
    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connecté avec succès');
        this.progressSubject.next({
          type: 'connected',
          data: { message: 'Connexion établie' }
        });
      };

      this.ws.onerror = (error) => {
        console.error('❌ Erreur WebSocket:', error);
        this.progressSubject.next({
          type: 'error',
          data: { message: 'Erreur de connexion' }
        });
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket déconnecté');
        this.progressSubject.next({
          type: 'disconnected',
          data: { message: 'Connexion fermée' }
        });
        this.ws = null;
      };

      this.ws.onmessage = (event) => {
        console.log('📬 Message WebSocket brut reçu:', event.data);
        
        try {
          const parsedData = JSON.parse(event.data);
          console.log('📬 Message parsé:', parsedData);
          console.log('📬 Type du message:', parsedData.type);
          console.log('📬 Appel de processReceivedData...');
          this.processReceivedData(parsedData);
          this.progressSubject.next({
            type: 'message',
            data: parsedData
          });
        } catch {
          console.log('📬 Message texte reçu (non-JSON):', event.data);
          this.progressSubject.next({
            type: 'message',
            data: event.data
          });
        }
      };

    } catch (error) {
      console.error('❌ Erreur lors de la connexion:', error);
    }
  }

  /**
   * Traite les données reçues du WebSocket
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async processReceivedData(data: any): Promise<void> {
    console.log('📨 Message WebSocket reçu dans processReceivedData');
    console.log('   Type:', data.type);
    console.log('   data.point existe?', !!data.point);
    console.log('   data.photo existe?', !!data.photo);
    console.log('   Données complètes:', JSON.stringify(data, null, 2));
    
    // Traiter les métadonnées pour récupérer l'eventUUID du mobile
    if (data.type === 'metadata' && data.eventUUID) {
      console.log('✅ CONDITION METADATA REMPLIE - Stockage eventUUID du mobile');
      this.currentEventUuid = data.eventUUID;
      console.log('   📋 Event UUID du mobile stocké:', this.currentEventUuid);
      // S'assurer que l'événement existe dans la BD
      await this.ensureEventExists(data.eventUUID);
    } else if (data.type === 'point' && data.point) {
      console.log('✅ CONDITION POINT REMPLIE - Appel de processPoint');
      try {
        await this.processPoint(data.point);
        console.log('✅ processPoint terminé');
      } catch (error) {
        console.error('❌ Erreur dans processPoint:', error);
      }
    } else if (data.type === 'photo' && data.photo) {
      console.log('✅ CONDITION PHOTO REMPLIE - Appel de processPhoto');
      try {
        await this.processPhoto(data.photo, data.pointUUID);
        console.log('✅ processPhoto terminé');
      } catch (error) {
        console.error('❌ Erreur dans processPhoto:', error);
      }
    } else if (data.type === 'end') {
      console.log('✅ CONDITION END REMPLIE - Rechargement des données');
      try {
        await this.loadExistingData();
        // Réinitialiser l'eventUuid pour le prochain import
        console.log('   🔄 Réinitialisation de currentEventUuid (était:', this.currentEventUuid, ')');
        this.currentEventUuid = null;
        console.log('✅ loadExistingData terminé');
      } catch (error) {
        console.error('❌ Erreur dans loadExistingData:', error);
      }
    } else {
      console.log('⚠️ AUCUNE CONDITION REMPLIE');
      console.log('   Type de message:', data.type);
      console.log('   Données manquantes ou type non géré');
    }
  }

  /**
   * Vérifie si un Event existe, sinon le crée
   */
  private async ensureEventExists(eventId: string): Promise<void> {
    console.log('   🔍 Vérification Event:', eventId);
    
    try {
      await new Promise<void>((resolve, reject) => {
        this.eventService.getById(eventId).subscribe({
          next: () => {
            console.log('   ✅ Event existe déjà');
            resolve();
          },
          error: (err) => {
            if (err.status === 404) {
              console.log('   ➕ Event n\'existe pas, création...');
              
              const newEvent = {
                uuid: eventId,
                name: 'Event Mobile Import',
                description: 'Event créé automatiquement lors de l\'import des données mobiles',
                startDate: new Date(),
                status: EventStatus.ToOrganize
              };
              
              this.eventService.create(newEvent).subscribe({
                next: (created) => {
                  console.log('   ✅ Event créé:', created.uuid);
                  resolve();
                },
                error: (createErr) => {
                  console.error('   ❌ Erreur création Event:', createErr);
                  reject(createErr);
                }
              });
            } else {
              console.error('   ❌ Erreur vérification Event:', err);
              reject(err);
            }
          }
        });
      });
    } catch {
      console.error('   ⚠️ Impossible de garantir l\'existence de l\'Event');
    }
  }

  /**
   * Traite un point reçu (création ou modification)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async processPoint(pointData: any): Promise<void> {
    console.log('🔧 processPoint appelé');
    console.log('   Données brutes:', pointData);
    
    // Le mobile peut envoyer en PascalCase ou camelCase
    const uuid = pointData.UUID || pointData.uuid;
    console.log('   🆔 UUID du point:', uuid);
    
    if (!uuid) {
      console.error('   ❌ Pas d\'UUID trouvé dans les données du point!');
      return;
    }
    
    // Récupérer l'eventId : priorité au mobile, sinon currentEventUuid, sinon default
    const mobileEventId = pointData.Event_ID || pointData.eventId;
    const eventIdToUse = mobileEventId || this.currentEventUuid || DEFAULT_EVENT_UUID;
    
    console.log('   📋 EventId du mobile:', mobileEventId);
    console.log('   📋 CurrentEventUuid (metadata):', this.currentEventUuid);
    console.log('   📋 EventId utilisé:', eventIdToUse);
    
    // S'assurer que l'événement existe
    if (eventIdToUse && eventIdToUse !== DEFAULT_EVENT_UUID) {
      await this.ensureEventExists(eventIdToUse);
    }
    
    // Convertir du format mobile vers TypeScript (camelCase)
    const point: Point = {
      uuid: uuid,
      eventId: eventIdToUse,
      equipmentId: '', // Sera défini après vérification de l'équipement
      latitude: pointData.Latitude ?? pointData.latitude,
      longitude: pointData.Longitude ?? pointData.longitude,
      comment: pointData.Commentaire ?? pointData.Comment ?? pointData.comment ?? '',
      imageId: pointData.Image_ID ?? pointData.imageId,
      order: pointData.Ordre ?? pointData.Order ?? pointData.order ?? 0,
      isValid: pointData.Valide !== undefined ? Boolean(pointData.Valide) : (pointData.Is_valid ?? pointData.isValid ?? true),
      equipmentQuantity: 0, // Sera défini après vérification de l'équipement
      created: pointData.Created ? new Date(pointData.Created) : (pointData.created ? new Date(pointData.created) : new Date()),
      modified: pointData.Modified ? new Date(pointData.Modified) : (pointData.modified ? new Date(pointData.modified) : new Date())
    };
    
    // Récupérer l'équipement ID du format mobile
    const mobileEquipmentId = pointData.Equipement_ID || pointData.equipmentId;
    const mobileEquipmentQuantity = pointData.Equipement_quantite ?? pointData.Equipement_quantity ?? pointData.equipmentQuantity ?? 0;
    
    console.log('   📦 Point converti:', point);
    console.log('   ℹ️ Event_ID utilisé:', eventIdToUse);
    console.log('   ℹ️ Equipement_ID du mobile:', mobileEquipmentId);
    
    // Si un équipement est spécifié, vérifier s'il existe ou le créer
    if (mobileEquipmentId) {
      console.log('   ⚙️ Traitement de l\'équipement...');
      
      // Vérifier si l'équipement existe
      const equipmentExists = this.existingEquipments.has(mobileEquipmentId);
      
      if (equipmentExists) {
        console.log('   ✅ Équipement existe déjà:', mobileEquipmentId);
        point.equipmentId = mobileEquipmentId;
        point.equipmentQuantity = mobileEquipmentQuantity;
      } else {
        console.log('   ➕ Création de l\'équipement:', mobileEquipmentId);
        
        // Créer l'équipement d'abord
        const newEquipment: Equipment = {
          uuid: mobileEquipmentId,
          unit: 'pièce', // Unité par défaut (obligatoire en base de données)
          totalStock: mobileEquipmentQuantity,
          remainingStock: mobileEquipmentQuantity
        };
        
        // Essayer de créer l'équipement de manière synchrone
        await new Promise<void>((resolve) => {
          this.equipmentService.create(newEquipment).subscribe({
            next: (created) => {
              console.log('   ✅ Équipement créé:', created.uuid);
              this.existingEquipments.set(created.uuid, created);
              point.equipmentId = created.uuid;
              point.equipmentQuantity = mobileEquipmentQuantity;
              resolve();
            },
            error: (err) => {
              console.error('   ⚠️ Impossible de créer l\'équipement:', err);
              // Continuer sans équipement
              resolve();
            }
          });
        });
      }
    }
    
    console.log('   📦 Point final avant envoi:', point);
    console.log('   🔍 Vérification existence dans l\'API...');
    
    // Vérifier si le point existe déjà dans l'API
    this.pointService.getById(uuid).subscribe({
      next: () => {
        // Le point existe -> UPDATE
        console.log('   🔄 Point trouvé dans l\'API -> MISE À JOUR');
        console.log('   📤 Données envoyées pour UPDATE:', point);
        this.pointService.update(uuid, point).subscribe({
          next: (updated) => {
            console.log(`   ✅ Point ${uuid} mis à jour dans la BD`);
            this.existingPoints.set(uuid, updated);
          },
          error: (err) => {
            console.error(`   ❌ Erreur mise à jour point ${uuid}:`, err);
            console.error('   Status:', err.status);
            console.error('   Message:', err.message);
            console.error('   Détails:', err.error);
          }
        });
      },
      error: (err) => {
        if (err.status === 404) {
          // Le point n'existe pas -> CREATE (garder l'UUID du mobile)
          console.log('   ➕ Point non trouvé dans l\'API (404) -> CRÉATION');
          console.log('   📤 Données envoyées pour CREATE:', point);
          
          this.pointService.create(point).subscribe({
            next: (created) => {
              console.log(`   ✅ Point créé dans la BD avec UUID: ${created.uuid}`);
              this.existingPoints.set(created.uuid, created);
            },
            error: (createErr) => {
              console.error(`   ❌ Erreur création point:`, createErr);
              console.error('   Status:', createErr.status);
              console.error('   Message:', createErr.message);
              console.error('   Détails:', createErr.error);
              console.error('   📦 Données envoyées:', point);
            }
          });
        } else {
          console.error(`   ❌ Erreur vérification existence point ${uuid}:`, err);
          console.error('   Status:', err.status);
          console.error('   Message:', err.message);
        }
      }
    });

    // Gérer l'équipement associé (déjà géré dans la conversion ci-dessus)
  }

  /**
   * Traite une photo reçue (création ou modification)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private processPhoto(photoData: any, pointUUID: string): void {
    console.log('🔧 processPhoto appelé');
    
    // Le mobile peut envoyer en PascalCase ou camelCase
    const uuid = photoData.UUID || photoData.uuid;
    console.log('   Photo UUID:', uuid);
    console.log('   Point UUID:', pointUUID);
    
    if (!uuid) {
      console.error('   ❌ Pas d\'UUID trouvé dans les données de la photo!');
      return;
    }
    
    // Récupérer et nettoyer les données de l'image
    let pictureData = photoData.Picture || photoData.picture || '';
    if (typeof pictureData === 'string' && pictureData.includes(',')) {
      // Enlever le préfixe "data:image/...;base64,"
      pictureData = pictureData.split(',')[1] || pictureData;
    }
    
    // Convertir du format mobile vers TypeScript (camelCase)
    const photo: Photo = {
      uuid: uuid,
      pictureName: photoData.Picture_name || photoData.pictureName || 'photo.jpg',
      picture: pictureData
    };
    
    console.log('   📦 Photo convertie:', { ...photo, picture: '(base64 omis, longueur: ' + photo.picture.length + ')' });
    
    // Vérifier si la photo existe déjà
    if (this.existingPhotos.has(uuid)) {
      console.log('   🔄 MISE À JOUR de la photo', uuid);
      this.photoService.update(uuid, photo).subscribe({
        next: (updated) => {
          console.log(`   ✅ Photo ${uuid} mise à jour dans la BD`);
          this.existingPhotos.set(uuid, updated);
          // Créer la relation ImagePoint
          this.createImagePointRelation(uuid, pointUUID);
        },
        error: (err) => {
          console.error(`   ❌ Erreur mise à jour photo ${uuid}:`, err);
          console.error('   Détails:', err.message, err.error);
        }
      });
    } else {
      console.log('   ➕ CRÉATION de la photo', uuid);
      this.photoService.create(photo).subscribe({
        next: (created) => {
          console.log(`   ✅ Photo ${uuid} créée dans la BD`);
          this.existingPhotos.set(uuid, created);
          // Créer la relation ImagePoint
          this.createImagePointRelation(uuid, pointUUID);
        },
        error: (err) => {
          console.error(`   ❌ Erreur création photo ${uuid}:`, err);
          console.error('   Détails:', err.message, err.error);
        }
      });
    }
  }

  /**
   * Crée la relation ImagePoint entre une photo et un point
   */
  private createImagePointRelation(imageId: string, pointId: string): void {
    console.log('   🔗 Création de la relation ImagePoint');
    console.log('   ImageId:', imageId, 'PointId:', pointId);
    
    // Vérifier si la relation existe déjà
    this.imagePointService.getByIds(imageId, pointId).subscribe({
      next: () => {
        console.log('   ℹ️ Relation ImagePoint existe déjà');
      },
      error: (err) => {
        console.log('   📝 Statut de la vérification:', err.status);
        if (err.status === 404) {
          // La relation n'existe pas, on la crée
          // IMPORTANT: L'API C# attend PascalCase (ImageId, PointId)
          const imagePoint: ImagePoint = {
            imageId: imageId,
            pointId: pointId
          };
          
          console.log('   📤 Envoi de ImagePoint à l\'API:', imagePoint);
          
          this.imagePointService.create(imagePoint).subscribe({
            next: (created: ImagePoint) => {
              console.log('   ✅ Relation ImagePoint créée avec succès!');
              console.log('   📦 Données retournées:', created);
            },
            error: (createErr) => {
              console.error('   ❌ ERREUR CRÉATION ImagePoint:');
              console.error('   Status:', createErr.status);
              console.error('   Message:', createErr.message);
              console.error('   Erreur complète:', createErr);
              console.error('   Détails erreur:', createErr.error);
            }
          });
        } else {
          console.error('   ❌ Erreur vérification ImagePoint (status != 404):');
          console.error('   Status:', err.status);
          console.error('   Erreur:', err);
        }
      }
    });
  }

  /**
   * Traite un équipement reçu (création ou modification)
   */
  private processEquipment(equipmentData: Equipment): void {
    console.log('🔧 processEquipment appelé');
    console.log('   Équipement UUID:', equipmentData.uuid);
    
    const uuid = equipmentData.uuid;
    
    // Convertir du format API vers TypeScript
    const equipment: Equipment = {
      uuid: equipmentData.uuid,
      type: equipmentData.type,
      description: equipmentData.type,
      totalStock: equipmentData.totalStock || 0,
      remainingStock: equipmentData.remainingStock || 0
    };
    
    console.log('   📦 Équipement converti:', equipment);
    
    // Vérifier si l'équipement existe déjà
    if (this.existingEquipments.has(uuid)) {
      console.log('   🔄 MISE À JOUR de l\'équipement', uuid);
      this.equipmentService.update(uuid, equipment).subscribe({
        next: (updated) => {
          console.log(`   ✅ Équipement ${uuid} mis à jour dans la BD`);
          this.existingEquipments.set(uuid, updated);
        },
        error: (err) => {
          console.error(`   ❌ Erreur mise à jour équipement ${uuid}:`, err);
          console.error('   Détails:', err.message, err.error);
        }
      });
    } else {
      console.log('   ➕ CRÉATION de l\'équipement', uuid);
      this.equipmentService.create(equipment).subscribe({
        next: (created) => {
          console.log(`   ✅ Équipement ${uuid} créé dans la BD`);
          this.existingEquipments.set(uuid, created);
        },
        error: (err) => {
          console.error(`   ❌ Erreur création équipement ${uuid}:`, err);
          console.error('   Détails:', err.message, err.error);
        }
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