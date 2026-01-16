const WebSocket = require('ws');
const http = require('http');
const os = require('os');

// Fonction pour obtenir l'IP locale
function getLocalIp() {
  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Ignorer IPv6 et loopback
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const WS_HOST = getLocalIp();
const WS_PORT = 8765;
const HTTP_PORT = 8766;

console.log(`🚀 WebSocket server running on ws://${WS_HOST}:${WS_PORT}`);

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

  // Endpoint pour récupérer l'IP du serveur
  if (req.url === '/config' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        wsHost: WS_HOST,
        wsPort: WS_PORT,
        wsUrl: `ws://${WS_HOST}:${WS_PORT}`,
      })
    );
    return;
  }

  if (req.url === '/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'running',
        wsPort: WS_PORT,
        clients: wsServer.clients.size,
      })
    );
  } else {
    res.writeHead(404);
    res.end();
  }
});

httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
  console.log(`📡 HTTP server running on http://0.0.0.0:${HTTP_PORT}`);
});

// Serveur WebSocket
const wsServer = new WebSocket.Server({ port: WS_PORT });

let sessionData = {
  metadata: null,
  points: new Map(),
  photos: new Map(),
  eventUuid: null,
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
      // Le web s'enregistre pour le planning et attend un téléphone
      else if (data.type === 'web_waiting_planning') {
        console.log('🌐 Client web en attente (planning), teamUuid:', data.teamUuid);
        ws.clientRole = 'web';
        ws.teamUuid = data.teamUuid;
        ws.waitingType = 'planning'; // Différencier du web_waiting classique
      }
      // Le téléphone demande les données (import_request)
      else if (data.type === 'import_request') {
        console.log('📱 Téléphone connecté et demande les données');
        ws.clientRole = 'phone';

        // Chercher un client web en attente (web_waiting ou web_waiting_planning)
        const webClient = Array.from(wsServer.clients).find(
          (client) =>
            client !== ws && client.clientRole === 'web' && client.readyState === WebSocket.OPEN
        );

        if (webClient) {
          console.log("🌐 Client web trouvé, on lui demande d'envoyer les données");
          // Notifier le web qu'un téléphone est connecté
          webClient.send(
            JSON.stringify({
              type: 'phone_requesting',
              message: 'Un téléphone demande les données',
            })
          );
        } else {
          console.log('⚠️ Aucun client web en attente');
          ws.send(
            JSON.stringify({
              type: 'no_data',
              message: "Aucun ordinateur en attente d'export",
              timestamp: new Date().toISOString(),
            })
          );
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
          case 'planning_data':
            console.log('➡️ Appel handlePlanningData');
            handlePlanningData(data, ws);
            break;
          default:
            console.log('⚠️ Type de message inconnu:', msgType);
            ws.send(JSON.stringify({ type: 'error', message: `Type inconnu: ${msgType}` }));
        }
      } else {
        console.log('⚠️ Format de message non reconnu');
        ws.send(JSON.stringify({ type: 'error', message: 'Format de message non reconnu' }));
      }
    } catch (error) {
      console.error('❌ Erreur JSON:', error.message);
      ws.send(JSON.stringify({ type: 'error', message: 'Erreur: JSON invalide' }));
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
    totalPhotos: data.totalPhotos,
  });

  wsServer.clients.forEach((client) => {
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
    totalPoints: totalPoints,
  });

  wsServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });

  console.log(`✅ Point diffusé à ${wsServer.clients.size} client(s)`);
}

function handlePhoto(data, ws) {
  const { photo, pointUUID, photoIndex, totalPhotos } = data;

  console.log(
    `📸 Photo reçue ${photoIndex + 1}/${totalPhotos} pour point ${pointUUID} (image masquée)`
  );

  // Stocker la photo
  const photos = sessionData.photos.get(pointUUID);
  if (photos) {
    photos.push({
      UUID: photo.UUID,
      Picture_name: photo.Picture_name,
      Picture: photo.Picture,
    });
  }

  // Broadcaster à TOUS les clients
  const message = JSON.stringify({
    type: 'photo',
    photo: photo,
    pointUUID: pointUUID,
    photoIndex: photoIndex,
    totalPhotos: totalPhotos,
  });

  wsServer.clients.forEach((client) => {
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
    const pointUuid = pointData.UUID || pointData.uuid;
    console.log(`📍 Point ${index + 1}/${data.points.length}, UUID: ${pointUuid}`);

    // Broadcaster le point
    const pointMessage = JSON.stringify({
      type: 'point',
      point: pointData,
    });

    wsServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(pointMessage);
      }
    });

    // Traiter les photos du point (supporter PascalCase et camelCase)
    const photos =
      pointData.photos || pointData.Photos || pointData.pictures || pointData.Pictures || [];
    if (Array.isArray(photos) && photos.length > 0) {
      console.log(`📸 ${photos.length} photo(s) trouvée(s) pour point ${pointUuid}`);
      photos.forEach((photoData, photoIndex) => {
        console.log(`📸 Photo ${photoIndex + 1}/${photos.length} pour point ${pointUuid}`);

        const photoMessage = JSON.stringify({
          type: 'photo',
          photo: photoData,
          pointUUID: pointUuid,
        });

        wsServer.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(photoMessage);
          }
        });
      });
    } else {
      console.log(`ℹ️ Aucune photo pour point ${pointUuid}`);
    }
  });

  // Envoyer le message de fin
  const endMessage = JSON.stringify({
    type: 'end',
    message: `Transfer complete: ${data.points.length} points reçus !`,
  });

  wsServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(endMessage);
    }
  });

  console.log(`✅ Traitement terminé, ${data.points.length} points diffusés`);
}

function handleEnd(data, ws) {
  // Calculer le total de photos
  let totalPhotos = 0;
  sessionData.photos.forEach((photos) => {
    totalPhotos += photos.length;
  });

  console.log('🏁 Fin de transfert');
  console.log(`   📊 ${sessionData.points.size} points et ${totalPhotos} photos reçus`);

  // Assembler les données complètes
  const completePoints = [];
  sessionData.points.forEach((pointData, pointUuid) => {
    const pointWithPhotos = {
      ...pointData,
      photos: sessionData.photos.get(pointUuid) || [],
    };
    completePoints.push(pointWithPhotos);
  });

  const eventData = {
    event_uuid: sessionData.eventUuid,
    timestamp: new Date().toISOString(),
    total_points: completePoints.length,
    points: completePoints,
  };

  console.log('📦 Données assemblées (aperçu):', safePreview(eventData, 200));

  // Broadcaster le message de fin à TOUS les clients
  const endMessage = JSON.stringify({
    type: 'end',
    message: `Transfer complete: ${sessionData.points.size} points et ${totalPhotos} photos reçus !`,
    summary: {
      totalPoints: sessionData.points.size,
      totalPhotos: totalPhotos,
    },
  });

  wsServer.clients.forEach((client) => {
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
    eventUuid: null,
  };
}

/**
 * Gère l'export complet d'un événement vers le téléphone
 */
function handleEventExport(data, ws) {
  console.log("📤 Export d'événement vers le téléphone");
  console.log('   Événement:', data.event?.title || data.event?.name || 'Sans nom');
  console.log('   Areas:', data.areas?.length || 0);
  console.log('   Paths:', data.paths?.length || 0);
  console.log('   Équipements:', data.equipments?.length || 0);

  let clientsSent = 0;

  // Compter les clients téléphones
  wsServer.clients.forEach((client) => {
    if (client !== ws && client.clientRole === 'phone' && client.readyState === WebSocket.OPEN) {
      clientsSent++;
    }
  });

  // Envoyer les données au format attendu par le mobile (event_data)
  const eventDataMessage = {
    type: 'event_data',
    event: {
      uuid: data.event.uuid,
      title: data.event.title || data.event.name,
      description: data.event.description,
      startDate: data.event.startDate,
      endDate: data.event.endDate || null,
      status: data.event.status,
      responsable: data.event.responsable || '',
    },
    areas: (data.areas || []).map((area) => ({
      uuid: area.uuid,
      eventId: area.eventId,
      geoJson: area.geoJson,
      name: area.name,
      color: area.color,
    })),
    paths: (data.paths || []).map((path) => ({
      uuid: path.uuid,
      eventId: path.eventId,
      geoJson: path.geoJson,
      name: path.name,
      color: path.color,
    })),
    equipments: (data.equipments || []).map((equip) => ({
      uuid: equip.uuid,
      type: equip.type,
      description: equip.description,
      length: equip.length,
      storageType: equip.storageType,
    })),
    metadata: {
      exportDate: new Date().toISOString(),
      version: '1.0',
    },
  };

  // Envoyer uniquement aux téléphones
  wsServer.clients.forEach((client) => {
    if (client !== ws && client.clientRole === 'phone' && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(eventDataMessage));
    }
  });

  console.log(`📦 Données event_data envoyées à ${clientsSent} téléphone(s)`);

  // Confirmer à l'expéditeur (web)
  ws.send(
    JSON.stringify({
      type: 'export_confirmed',
      message: `Données envoyées à ${clientsSent} téléphone(s)`,
      summary: {
        areas: data.areas?.length || 0,
        paths: data.paths?.length || 0,
        equipments: data.equipments?.length || 0,
      },
    })
  );
}

/**
 * Gère l'export du planning d'une équipe vers le téléphone
 */
function handlePlanningData(data, ws) {
  console.log('📤 Export de planning vers le téléphone');
  console.log('   Équipe:', data.team?.name || 'Sans nom');
  console.log('   Membres:', data.members?.length || 0);
  console.log('   Installations:', data.installations?.length || 0);
  console.log('   Retraits:', data.removals?.length || 0);

  let clientsSent = 0;

  // Envoyer les données aux téléphones connectés
  wsServer.clients.forEach((client) => {
    if (client !== ws && client.clientRole === 'phone' && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
      clientsSent++;
    }
  });

  console.log(`📦 Planning envoyé à ${clientsSent} téléphone(s)`);

  // Confirmer à l'expéditeur (web)
  ws.send(
    JSON.stringify({
      type: 'export_confirmed',
      message: `Planning envoyé à ${clientsSent} téléphone(s)`,
      summary: {
        teamName: data.team?.name || '',
        members: data.members?.length || 0,
        installations: data.installations?.length || 0,
        removals: data.removals?.length || 0,
      },
    })
  );
}
