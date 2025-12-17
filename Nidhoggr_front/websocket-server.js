const WebSocket = require('ws');
const http = require('http');

const WS_PORT = 8765;
const HTTP_PORT = 8766;

function safePreview(obj, max = 200) {
  let str;

  try {
    str = typeof obj === 'string' ? obj : JSON.stringify(obj);
  } catch (e) {
    return '[unserializable object]';
  }

  if (!str) return '';
  return str.length > max ? str.substring(0, max) + '... [truncated]' : str;
}


// Serveur HTTP pour le contrôle
const httpServer = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.url === '/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'running',
      wsPort: WS_PORT,
      clients: wsServer.clients.size
    }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

httpServer.listen(HTTP_PORT);

// Serveur WebSocket
const wsServer = new WebSocket.Server({ port: WS_PORT });

let sessionData = {
  metadata: null,
  points: new Map(),
  photos: new Map(),
  eventUuid: null
};

wsServer.on('connection', (ws) => {
  console.log('👤 Nouveau client connecté');
  
  // Marquer ce client comme étant en attente de savoir son rôle
  ws.clientRole = null; // 'web' ou 'phone'
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      console.log('🔍 Clés du message:', Object.keys(data));
      
      // Le web s'enregistre et attend un téléphone
      if (data.type === 'web_waiting') {
        console.log('🌐 Client web en attente, eventUuid:', data.eventUuid);
        ws.clientRole = 'web';
        ws.eventUuid = data.eventUuid;
      }
      // Le téléphone demande les données (import_request)
      else if (data.type === 'import_request') {
        console.log('📱 Téléphone connecté et demande les données');
        ws.clientRole = 'phone';
        
        // Chercher un client web en attente
        const webClient = Array.from(wsServer.clients).find(
          client => client !== ws && client.clientRole === 'web' && client.readyState === WebSocket.OPEN
        );
        
        if (webClient) {
          console.log('🌐 Client web trouvé, on lui demande d\'envoyer les données');
          // Notifier le web qu'un téléphone est connecté
          webClient.send(JSON.stringify({
            type: 'phone_requesting',
            message: 'Un téléphone demande les données'
          }));
        } else {
          console.log('⚠️ Aucun client web en attente');
          ws.send(JSON.stringify({
            type: 'no_data',
            message: 'Aucun ordinateur en attente d\'export',
            timestamp: new Date().toISOString()
          }));
        }
      }
      // Le web envoie les données de l'événement
      else if (data.type === 'event_export') {
        console.log('📦 Données reçues du web, envoi au téléphone...');
        ws.clientRole = 'web';
        
        // Envoyer directement aux téléphones connectés
        handleEventExport(data, ws);
      }
      // Le mobile envoie tout en un seul message avec un tableau "points"
      else if (data.points && Array.isArray(data.points)) {
        console.log('📦 Données complètes reçues avec', data.points.length, 'points');
        handleBulkData(data, ws);
      } 
      // Format avec type (ancien format si jamais)
      else if (data.type) {
        const msgType = data.type;
        console.log('🔍 Type de message détecté:', msgType);
        
        switch (msgType) {
          case 'metadata':
            console.log('➡️ Appel handleMetadata');
            handleMetadata(data, ws);
            break;
          case 'point':
            console.log('➡️ Appel handlePoint');
            handlePoint(data, ws);
            break;
          case 'photo':
            console.log('➡️ Appel handlePhoto');
            handlePhoto(data, ws);
            break;
          case 'end':
            console.log('➡️ Appel handleEnd');
            handleEnd(data, ws);
            break;
          default:
            console.log('⚠️ Type de message inconnu:', msgType);
            ws.send(`Type inconnu: ${msgType}`);
        }
      } else {
        console.log('⚠️ Format de message non reconnu');
        ws.send('Format de message non reconnu');
      }
    } catch (error) {
      console.error('❌ Erreur JSON:', error.message);
      ws.send('Erreur: JSON invalide');
    }
  });

  ws.on('close', () => {
    // Connexion fermée silencieusement
  });

  ws.on('error', (error) => {
    // Erreur silencieuse
  });
});

function handleMetadata(data, ws) {
  sessionData.metadata = data;
  sessionData.eventUuid = data.eventUUID;
  console.log('📋 Métadonnées reçues, eventUUID:', data.eventUUID);
  
  // Broadcaster les métadonnées à tous les clients
  const message = JSON.stringify({
    type: 'metadata',
    eventUUID: data.eventUUID,
    timestamp: data.timestamp,
    totalPoints: data.totalPoints,
    totalPhotos: data.totalPhotos
  });
  
  wsServer.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
  
  console.log(`✅ Métadonnées diffusées à ${wsServer.clients.size} client(s)`);
}

function handlePoint(data, ws) {
  const { point, pointIndex, totalPoints } = data;
  const pointUuid = point.UUID;
  
  console.log(`📍 Point reçu ${pointIndex + 1}/${totalPoints}, UUID: ${pointUuid}`);
  
  // Stocker le point
  sessionData.points.set(pointUuid, point);
  sessionData.photos.set(pointUuid, []);
  
  // Broadcaster à TOUS les clients (pas seulement celui qui a envoyé)
  const message = JSON.stringify({
    type: 'point',
    point: point,
    pointIndex: pointIndex,
    totalPoints: totalPoints
  });
  
  wsServer.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
  
  console.log(`✅ Point diffusé à ${wsServer.clients.size} client(s)`);
}

function handlePhoto(data, ws) {
  const { photo, pointUUID, photoIndex, totalPhotos } = data;
  
  console.log(`📸 Photo reçue ${photoIndex + 1}/${totalPhotos} pour point ${pointUUID} (image masquée)`);
  
  // Stocker la photo
  const photos = sessionData.photos.get(pointUUID);
  if (photos) {
    photos.push({
      UUID: photo.UUID,
      Picture_name: photo.Picture_name,
      Picture: photo.Picture
    });
  }
  
  // Broadcaster à TOUS les clients
  const message = JSON.stringify({
    type: 'photo',
    photo: photo,
    pointUUID: pointUUID,
    photoIndex: photoIndex,
    totalPhotos: totalPhotos
  });
  
  wsServer.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
  
  console.log(`✅ Photo diffusée à ${wsServer.clients.size} client(s)`);
}

function handleBulkData(data, ws) {
  console.log('📦 Traitement des données groupées');
  console.log(`   Points reçus: ${data.points.length}`);
  
  // Traiter chaque point
  data.points.forEach((pointData, index) => {
    const pointUuid = pointData.UUID;
    console.log(`📍 Point ${index + 1}/${data.points.length}, UUID: ${pointUuid}`);
    
    // Broadcaster le point
    const pointMessage = JSON.stringify({
      type: 'point',
      point: pointData
    });
    
    wsServer.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(pointMessage);
      }
    });
    
    // Traiter les photos du point
    if (pointData.photos && Array.isArray(pointData.photos)) {
      pointData.photos.forEach((photoData, photoIndex) => {
        console.log(`📸 Photo ${photoIndex + 1}/${pointData.photos.length} pour point ${pointUuid}`);
        
        const photoMessage = JSON.stringify({
          type: 'photo',
          photo: photoData,
          pointUUID: pointUuid
        });
        
        wsServer.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(photoMessage);
          }
        });
      });
    }
  });
  
  // Envoyer le message de fin
  const endMessage = JSON.stringify({
    type: 'end',
    message: `Transfer complete: ${data.points.length} points reçus !`
  });
  
  wsServer.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(endMessage);
    }
  });
  
  console.log(`✅ Traitement terminé, ${data.points.length} points diffusés`);
}

function handleEnd(data, ws) {
  // Calculer le total de photos
  let totalPhotos = 0;
  sessionData.photos.forEach(photos => {
    totalPhotos += photos.length;
  });
  
  console.log('🏁 Fin de transfert');
  console.log(`   📊 ${sessionData.points.size} points et ${totalPhotos} photos reçus`);
  
  // Assembler les données complètes
  const completePoints = [];
  sessionData.points.forEach((pointData, pointUuid) => {
    const pointWithPhotos = {
      ...pointData,
      photos: sessionData.photos.get(pointUuid) || []
    };
    completePoints.push(pointWithPhotos);
  });
  
  const eventData = {
    event_uuid: sessionData.eventUuid,
    timestamp: new Date().toISOString(),
    total_points: completePoints.length,
    points: completePoints
  };
  
  console.log('📦 Données assemblées (aperçu):', safePreview(eventData, 200));
  
  // Broadcaster le message de fin à TOUS les clients
  const endMessage = JSON.stringify({
    type: 'end',
    message: `Transfer complete: ${sessionData.points.size} points et ${totalPhotos} photos reçus !`,
    summary: {
      totalPoints: sessionData.points.size,
      totalPhotos: totalPhotos
    }
  });
  
  wsServer.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(endMessage);
    }
  });
  
  console.log(`✅ Message de fin diffusé à ${wsServer.clients.size} client(s)`);
  
  // Réinitialiser pour la prochaine session
  sessionData = {
    metadata: null,
    points: new Map(),
    photos: new Map(),
    eventUuid: null
  };
}

/**
 * Gère l'export complet d'un événement vers le téléphone
 */
function handleEventExport(data, ws) {
  console.log('📤 Export d\'événement vers le téléphone');
  console.log('   Événement:', data.event?.name || 'Sans nom');
  console.log('   Points:', data.points?.length || 0);
  console.log('   Géométries:', data.geometries?.length || 0);
  console.log('   Équipements:', data.equipments?.length || 0);

  let clientsSent = 0;

  // Compter les clients téléphones
  wsServer.clients.forEach(client => {
    if (client !== ws && client.clientRole === 'phone' && client.readyState === WebSocket.OPEN) {
      clientsSent++;
    }
  });

  // Envoyer les données au format attendu par le mobile (event_data)
  const eventDataMessage = {
    type: 'event_data',
    event: {
      uuid: data.event.uuid,
      name: data.event.name,
      description: data.event.description,
      startDate: data.event.startDate,
      endDate: data.event.endDate || null,
      status: data.event.status,
      responsable: data.event.responsable || ''
    },
    points: data.points.map(point => ({
      uuid: point.uuid,
      eventId: point.eventId,
      equipmentId: point.equipmentId,
      latitude: point.latitude,
      longitude: point.longitude,
      comment: point.comment,
      imageId: null,
      order: point.order,
      isValid: point.isValid,
      equipmentQuantity: point.equipmentQuantity,
      created: point.created,
      modified: point.modified,
      equipment: point.equipment ? {
        uuid: point.equipment.uuid,
        type: point.equipment.type,
        description: point.equipment.description,
        unit: point.equipment.unit,
        totalStock: point.equipment.totalStock || 0,
        remainingStock: point.equipment.remainingStock || 0
      } : null,
      photos: (point.photos || []).map(photo => ({
        uuid: photo.uuid,
        pictureName: photo.pictureName,
        picture: photo.picture
      }))
    })),
    geometries: (data.geometries || []).map(geom => ({
      uuid: geom.uuid,
      eventId: geom.eventId,
      type: geom.type,
      geoJson: geom.geoJson,
      properties: geom.properties
    })),
    equipments: (data.equipments || []).map(equip => ({
      uuid: equip.uuid,
      type: equip.type,
      description: equip.description,
      unit: equip.unit,
      totalStock: equip.totalStock || 0,
      remainingStock: equip.remainingStock || 0
    })),
    metadata: {
      exportDate: new Date().toISOString(),
      version: '1.0'
    }
  };

  // Envoyer uniquement aux téléphones
  wsServer.clients.forEach(client => {
    if (client !== ws && client.clientRole === 'phone' && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(eventDataMessage));
    }
  });

  console.log(`📦 Données event_data envoyées à ${clientsSent} téléphone(s)`);
  
  // Confirmer à l'expéditeur (web)
  ws.send(JSON.stringify({
    type: 'export_confirmed',
    message: `Données envoyées à ${clientsSent} téléphone(s)`,
    summary: {
      points: data.points?.length || 0,
      photos: data.points?.reduce((sum, p) => sum + (p.photos?.length || 0), 0) || 0,
      geometries: data.geometries?.length || 0,
      equipments: data.equipments?.length || 0
    }
  }));
}
