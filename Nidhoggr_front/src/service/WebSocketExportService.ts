import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { PointService } from './PointService';
import { PhotoService } from './PhotoService';
import { EquipmentService } from './EquipmentService';
import { Point } from '../classe/pointModel';
import { Photo } from '../classe/photoModel';
import { Equipment } from '../classe/equipmentModel';

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

  constructor(
    private pointService: PointService,
    private photoService: PhotoService,
    private equipmentService: EquipmentService
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
          this.processReceivedData(parsedData);
          this.progressSubject.next({
            type: 'message',
            data: parsedData
          });
        } catch (e) {
          console.log('📬 Message texte reçu:', event.data);
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
  private processReceivedData(data: any): void {
    console.log('📨 Message WebSocket reçu');
    console.log('   Type:', data.type);
    console.log('   Données:', data);
    
    if (data.type === 'point' && data.point) {
      console.log('📍 Traitement d\'un point...');
      this.processPoint(data.point);
    } else if (data.type === 'photo' && data.photo) {
      console.log('📸 Traitement d\'une photo...');
      this.processPhoto(data.photo, data.pointUUID);
    } else if (data.type === 'end') {
      console.log('✅ Fin de réception - Rechargement des données');
      this.loadExistingData();
    } else {
      console.log('⚠️ Type de message non géré ou données manquantes');
    }
  }

  /**
   * Traite un point reçu (création ou modification)
   */
  private processPoint(pointData: any): void {
    console.log('🔧 processPoint appelé');
    console.log('   Données brutes:', pointData);
    
    const uuid = pointData.UUID;
    console.log('   🆔 UUID du point:', uuid);
    
    // Convertir du format API (PascalCase) vers TypeScript (camelCase)
    const point: any = {
      uuid: pointData.UUID,
      eventId: pointData.Event_ID,
      equipmentId: pointData.Equipement_ID,
      latitude: pointData.Latitude,
      longitude: pointData.Longitude,
      comment: pointData.Commentaire,
      imageId: pointData.Image_ID,
      order: pointData.Ordre,
      isValid: pointData.Valide === 1,
      equipmentQuantity: pointData.Equipement_quantite
    };
    
    console.log('   📦 Point converti:', point);
    console.log('   🔍 Vérification existence dans l\'API...');
    
    // Vérifier si le point existe déjà dans l'API
    this.pointService.getById(uuid).subscribe({
      next: (existingPoint) => {
        // Le point existe -> UPDATE
        console.log('   🔄 Point trouvé dans l\'API -> MISE À JOUR');
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
          // Le point n'existe pas -> CREATE (sans UUID, l'API le générera)
          console.log('   ➕ Point non trouvé dans l\'API (404) -> CRÉATION');
          const pointWithoutUuid = { ...point };
          delete pointWithoutUuid.uuid; // Retirer l'UUID pour laisser l'API le générer
          
          console.log('   📤 Envoi à l\'API:', pointWithoutUuid);
          
          this.pointService.create(pointWithoutUuid).subscribe({
            next: (created) => {
              console.log(`   ✅ Point créé dans la BD avec UUID: ${created.uuid}`);
              console.log(`   ℹ️ UUID mobile ${uuid} -> UUID BD ${created.uuid}`);
              this.existingPoints.set(created.uuid, created);
            },
            error: (createErr) => {
              console.error(`   ❌ Erreur création point:`, createErr);
              console.error('   Status:', createErr.status);
              console.error('   Message:', createErr.message);
              console.error('   Détails:', createErr.error);
            }
          });
        } else {
          console.error(`   ❌ Erreur vérification existence point ${uuid}:`, err);
          console.error('   Status:', err.status);
          console.error('   Message:', err.message);
        }
      }
    });

    // Gérer l'équipement associé
    if (pointData.Equipement_ID) {
      console.log('   ⚙️ Traitement équipement:', pointData.Equipement_ID);
      this.processEquipment({
        uuid: pointData.Equipement_ID,
        type: pointData.EquipType,
        quantity: pointData.Equipement_quantite
      });
    }
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
      pointId: pointUUID,
      pictureName: photoData.Picture_name,
      picture: photoData.Picture,
      created: new Date(),
      modified: new Date()
    };
    
    console.log('   📦 Photo convertie:', { ...photo, picture: '(base64 omis)' });
    
    // Vérifier si la photo existe déjà
    if (this.existingPhotos.has(uuid)) {
      console.log('   🔄 MISE À JOUR de la photo', uuid);
      this.photoService.update(uuid, photo).subscribe({
        next: (updated) => {
          console.log(`   ✅ Photo ${uuid} mise à jour dans la BD`);
          this.existingPhotos.set(uuid, updated);
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
        },
        error: (err) => {
          console.error(`   ❌ Erreur création photo ${uuid}:`, err);
          console.error('   Détails:', err.message, err.error);
        }
      });
    }
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
      quantity: equipmentData.quantity,
      created: new Date(),
      modified: new Date()
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