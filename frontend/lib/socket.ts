import { io, Socket } from 'socket.io-client';
import { APP_CONFIG } from './config';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;

  let token = '';
  if (typeof window !== 'undefined') {
    const tokensStr = localStorage.getItem('cleanai_tokens');
    if (tokensStr) {
      try {
        const parsed = JSON.parse(tokensStr);
        token = parsed.accessToken;
      } catch (e) {
        console.error('Failed to parse socket tokens', e);
      }
    }
  }

  const backendUrl = APP_CONFIG.socketUrl;

  socket = io(backendUrl, {
    auth: { token },
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
}

export function disconnectSocket() {
  if (socket && socket.connected) {
    socket.disconnect();
    socket = null;
  }
}
