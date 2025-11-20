const WebSocket = require('ws');
const http = require('http');

const WS_PORT = 8765;
const HTTP_PORT = 8766;

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
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      const msgType = data.type;

      switch (msgType) {
        case 'metadata':
          handleMetadata(data, ws);
          break;
        case 'point':
          handlePoint(data, ws);
          break;
        case 'photo':
          handlePhoto(data, ws);
          break;
        case 'end':
          handleEnd(data, ws);
          break;
        default:
          console.warn(`⚠️  Type de message inconnu:`, msgType);
          ws.send(`Type inconnu: ${msgType}`);
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
  ws.send('Métadonnées reçues');
}

function handlePoint(data, ws) {
  const { point, pointIndex, totalPoints } = data;
  const pointUuid = point.UUID;
  
  console.log(`📍 Point reçu ${pointIndex + 1}/${totalPoints}, UUID: ${pointUuid}`);
  
  // Stocker le point
  sessionData.points.set(pointUuid, point);
  sessionData.photos.set(pointUuid, []);
  
  // Renvoyer le point au client Angular pour traitement API
  ws.send(JSON.stringify({
    type: 'point',
    point: point,
    pointIndex: pointIndex,
    totalPoints: totalPoints
  }));
  
  console.log('✅ Point renvoyé au client Angular');
}

function handlePhoto(data, ws) {
  const { photo, pointUUID, photoIndex, totalPhotos } = data;
  
  console.log(`📸 Photo reçue ${photoIndex + 1}/${totalPhotos} pour point ${pointUUID}`);
  
  // Stocker la photo
  const photos = sessionData.photos.get(pointUUID);
  if (photos) {
    photos.push({
      UUID: photo.UUID,
      Picture_name: photo.Picture_name,
      Picture: photo.Picture
    });
  }
  
  // Renvoyer la photo au client Angular pour traitement API
  ws.send(JSON.stringify({
    type: 'photo',
    photo: photo,
    pointUUID: pointUUID,
    photoIndex: photoIndex,
    totalPhotos: totalPhotos
  }));
  
  console.log('✅ Photo renvoyée au client Angular');
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
  
  console.log('📦 Données assemblées:', JSON.stringify(eventData, null, 2));
  
  // Envoyer le message de fin au client Angular
  ws.send(JSON.stringify({
    type: 'end',
    message: `Transfer complete: ${sessionData.points.size} points et ${totalPhotos} photos reçus !`,
    summary: {
      totalPoints: sessionData.points.size,
      totalPhotos: totalPhotos
    }
  }));
  
  console.log('✅ Message de fin envoyé au client Angular');
  
  // Réinitialiser pour la prochaine session
  sessionData = {
    metadata: null,
    points: new Map(),
    photos: new Map(),
    eventUuid: null
  };
}
