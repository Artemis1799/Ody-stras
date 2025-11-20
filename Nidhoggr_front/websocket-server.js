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
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      console.log('🔍 Clés du message:', Object.keys(data));
      
      // Le mobile envoie tout en un seul message avec un tableau "points"
      if (data.points && Array.isArray(data.points)) {
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
