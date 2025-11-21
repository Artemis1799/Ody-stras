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

export interface WebSocketMessage {
  type: string;
  data: any;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketExportService {
  private wsUrl = 'ws://localhost:8765';
  private ws: WebSocket | null = null;
  private progressSubject = new Subject<WebSocketMessage>();
  public progress$ = this.progressSubject.asObservable();
  private existingPoints: Map<string, Point> = new Map();
  private existingPhotos: Map<string, Photo> = new Map();
  private existingEquipments: Map<string, Equipment> = new Map();
  
  // Event ID fixe pour tous les points
  private readonly DEFAULT_EVENT_ID = '89a3c61e-b614-4cbf-9224-e159929ca26d';

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
    
    // Créer l'Event par défaut si nécessaire
    await this.ensureEventExists(this.DEFAULT_EVENT_ID);
    
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
    } catch (e) {
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

    console.log('🔌 Connexion au WebSocket:', this.wsUrl);
    
    try {
      this.ws = new WebSocket(this.wsUrl);

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
        } catch (e) {
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
  private async processReceivedData(data: any): Promise<void> {
    console.log('📨 Message WebSocket reçu dans processReceivedData');
    console.log('   Type:', data.type);
    console.log('   data.point existe?', !!data.point);
    console.log('   data.photo existe?', !!data.photo);
    console.log('   Données complètes:', JSON.stringify(data, null, 2));
    
    if (data.type === 'point' && data.point) {
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
                status: EventStatus.Active
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
    } catch (error) {
      console.error('   ⚠️ Impossible de garantir l\'existence de l\'Event');
    }
  }

  /**
   * Traite un point reçu (création ou modification)
   */
  private async processPoint(pointData: any): Promise<void> {
    console.log('🔧 processPoint appelé');
    console.log('   Données brutes:', pointData);
    
    const uuid = pointData.UUID;
    console.log('   🆔 UUID du point:', uuid);
    
    // Convertir du format API (PascalCase) vers TypeScript (camelCase)
    const point: any = {
      uuid: pointData.UUID,
      eventId: this.DEFAULT_EVENT_ID, // Utiliser l'Event ID fixe
      equipmentId: '', // Sera défini après vérification de l'équipement
      latitude: pointData.Latitude,
      longitude: pointData.Longitude,
      comment: pointData.Commentaire,
      imageId: pointData.Image_ID,
      order: pointData.Ordre,
      isValid: pointData.Valide === 1,
      equipmentQuantity: 0, // Sera défini après vérification de l'équipement
      created: pointData.Created ? new Date(pointData.Created) : new Date(),
      modified: pointData.Modified ? new Date(pointData.Modified) : new Date()
    };
    
    console.log('   📦 Point converti:', point);
    console.log('   ℹ️ Event_ID utilisé:', this.DEFAULT_EVENT_ID);
    console.log('   ℹ️ Equipement_ID du mobile:', pointData.Equipement_ID);
    
    // Si un équipement est spécifié, vérifier s'il existe ou le créer
    if (pointData.Equipement_ID && pointData.EquipType) {
      console.log('   ⚙️ Traitement de l\'équipement...');
      
      // Vérifier si l'équipement existe
      const equipmentExists = this.existingEquipments.has(pointData.Equipement_ID);
      
      if (equipmentExists) {
        console.log('   ✅ Équipement existe déjà:', pointData.Equipement_ID);
        point.equipmentId = pointData.Equipement_ID;
        point.equipmentQuantity = pointData.Equipement_quantite || 0;
      } else {
        console.log('   ➕ Création de l\'équipement:', pointData.Equipement_ID);
        
        // Créer l'équipement d'abord
        const newEquipment: any = {
          uuid: pointData.Equipement_ID,
          type: pointData.EquipType,
          description: pointData.EquipType,
          totalStock: pointData.Equipement_quantite || 0,
          remainingStock: pointData.Equipement_quantite || 0
        };
        
        // Essayer de créer l'équipement de manière synchrone
        await new Promise<void>((resolve) => {
          this.equipmentService.create(newEquipment).subscribe({
            next: (created) => {
              console.log('   ✅ Équipement créé:', created.uuid);
              this.existingEquipments.set(created.uuid, created);
              point.equipmentId = created.uuid;
              point.equipmentQuantity = pointData.Equipement_quantite || 0;
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
      next: (existingPoint) => {
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
  private processPhoto(photoData: any, pointUUID: string): void {
    console.log('🔧 processPhoto appelé');
    console.log('   Photo UUID:', photoData.UUID);
    console.log('   Point UUID:', pointUUID);
    
    const uuid = photoData.UUID;
    
    // Convertir du format API vers TypeScript
    const photo: any = {
      uuid: photoData.UUID,
      pictureName: photoData.Picture_name,
      picture: photoData.Picture
    };
    
    console.log('   📦 Photo convertie:', { ...photo, picture: '(base64 omis)' });
    
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
      next: (existing: ImagePoint) => {
        console.log('   ℹ️ Relation ImagePoint existe déjà');
      },
      error: (err: any) => {
        console.log('   📝 Statut de la vérification:', err.status);
        if (err.status === 404) {
          // La relation n'existe pas, on la crée
          // IMPORTANT: L'API C# attend PascalCase (ImageId, PointId)
          const imagePoint: any = {
            ImageId: imageId,
            PointId: pointId
          };
          
          console.log('   📤 Envoi de ImagePoint à l\'API:', imagePoint);
          
          this.imagePointService.create(imagePoint).subscribe({
            next: (created: ImagePoint) => {
              console.log('   ✅ Relation ImagePoint créée avec succès!');
              console.log('   📦 Données retournées:', created);
            },
            error: (createErr: any) => {
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
  private processEquipment(equipmentData: any): void {
    console.log('🔧 processEquipment appelé');
    console.log('   Équipement UUID:', equipmentData.uuid);
    
    const uuid = equipmentData.uuid;
    
    // Convertir du format API vers TypeScript
    const equipment: any = {
      uuid: equipmentData.uuid,
      type: equipmentData.type,
      description: equipmentData.type,
      totalStock: equipmentData.quantity || 0,
      remainingStock: equipmentData.quantity || 0
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