/**
 * Récupère l'IP du serveur WebSocket via l'endpoint /config
 */
async function getServerIp(): Promise<string> {
  try {
    // D'abord, essayer de récupérer la config du serveur HTTP
    // qui écoute sur la même machine que le serveur WebSocket
    const hostname = window.location.hostname;
    
    // Essayer sur le port 8766
    const response = await fetch(`http://${hostname}:8766/config`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Config récupérée du serveur:', data.wsUrl);
      return data.wsUrl || `ws://localhost:8765`;
    }
  } catch (error) {
    console.warn('⚠️ Impossible de récupérer la config du serveur:', error);
  }
  
  return 'ws://localhost:8765'; // Fallback
}

/**
 * Fonction pour obtenir l'IP locale (côté serveur SSR)
 */
function getLocalIp(): string {
  // En navigateur, pas d'accès à os
  if (typeof window !== 'undefined') {
    return 'localhost';
  }

  try {
    const os = require('os');
    const interfaces = os.networkInterfaces();

    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        // Ignorer IPv6 et loopback
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  } catch (error) {
    console.warn('Erreur détection IP:', error);
  }

  return '127.0.0.1';
}

/**
 * Récupère l'URL WebSocket
 * - Côté serveur : détecte l'IP locale automatiquement
 * - Côté navigateur : récupère l'IP du serveur via /config
 */
export async function getWebSocketUrl(): Promise<string> {
  // Côté serveur (SSR)
  if (typeof window === 'undefined') {
    const localIp = getLocalIp();
    const wsPort = 8765;
    return `ws://${localIp}:${wsPort}`;
  }
  
  // Côté navigateur : appeler le serveur pour connaître l'IP
  return getServerIp();
}

// Export synchrone pour compatibilité (sera remplacé dynamiquement)
export const WS_URL = 'ws://localhost:8765'; // Placeholder, remplacé au runtime