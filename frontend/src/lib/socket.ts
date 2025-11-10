import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connecté');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket déconnecté');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRoom(roomId: string) {
    this.socket?.emit('join-room', roomId);
  }

  leaveRoom(roomId: string) {
    this.socket?.emit('leave-room', roomId);
  }

  sendMapAnnotation(roomId: string, annotation: any) {
    this.socket?.emit('map-annotation', { roomId, ...annotation });
  }

  onMapAnnotation(callback: (data: any) => void) {
    this.socket?.on('map-annotation', callback);
  }

  sendCursorMove(roomId: string, position: { lat: number; lng: number }) {
    this.socket?.emit('cursor-move', { roomId, position });
  }

  onCursorMove(callback: (data: any) => void) {
    this.socket?.on('cursor-move', callback);
  }

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();
