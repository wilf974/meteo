import { io, Socket } from 'socket.io-client';
import type { ForecastResponse } from './openMeteo.service';

interface WeatherRequest {
  requestId: string;
  latitude: number;
  longitude: number;
  startDate?: Date;
  endDate?: Date;
}

interface WeatherResponse {
  requestId: string;
  data: ForecastResponse;
  cached: boolean;
}

interface WeatherGridRequest {
  requestId: string;
  points: Array<{ lat: number; lon: number }>;
  startDate?: Date;
  endDate?: Date;
}

interface WeatherGridResponse {
  requestId: string;
  results: Array<{ lat: number; lon: number; forecast: ForecastResponse | null; error?: string }>;
  cached: number;
  fresh: number;
}

class WebSocketService {
  private socket: Socket | null = null;
  private connected: boolean = false;
  private pendingRequests: Map<string, { resolve: (value: any) => void; reject: (error: any) => void; timeout: NodeJS.Timeout }> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000; // Start with 1 second

  constructor() {
    this.connect();
  }

  private connect() {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    this.socket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connecté');
      this.connected = true;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
    });

    this.socket.on('disconnect', () => {
      console.warn('⚠️ WebSocket déconnecté');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erreur de connexion WebSocket:', error);
      this.reconnectAttempts++;

      // Exponential backoff
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Max 30 seconds
      }
    });

    // Listen for weather responses
    this.socket.on('weather:response', (response: WeatherResponse) => {
      const pending = this.pendingRequests.get(response.requestId);
      if (pending) {
        clearTimeout(pending.timeout);
        pending.resolve(response.data);
        this.pendingRequests.delete(response.requestId);
      }
    });

    // Listen for weather grid responses
    this.socket.on('weather:grid:response', (response: WeatherGridResponse) => {
      const pending = this.pendingRequests.get(response.requestId);
      if (pending) {
        clearTimeout(pending.timeout);
        pending.resolve(response);
        this.pendingRequests.delete(response.requestId);
      }
    });

    // Listen for errors
    this.socket.on('weather:error', ({ requestId, error }: { requestId: string; error: string }) => {
      const pending = this.pendingRequests.get(requestId);
      if (pending) {
        clearTimeout(pending.timeout);
        pending.reject(new Error(error));
        this.pendingRequests.delete(requestId);
      }
    });
  }

  /**
   * Get weather forecast for a single location via WebSocket
   */
  async getForecast(
    latitude: number,
    longitude: number,
    startDate?: Date,
    endDate?: Date,
    timeout: number = 10000
  ): Promise<ForecastResponse> {
    if (!this.socket || !this.connected) {
      throw new Error('WebSocket non connecté');
    }

    const requestId = `weather_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Timeout: La requête a pris trop de temps'));
      }, timeout);

      this.pendingRequests.set(requestId, { resolve, reject, timeout: timeoutId });

      const request: WeatherRequest = {
        requestId,
        latitude,
        longitude,
        startDate,
        endDate,
      };

      this.socket!.emit('weather:request', request);
    });
  }

  /**
   * Get weather forecast for multiple locations via WebSocket (optimized batch request)
   */
  async getWeatherGrid(
    points: Array<{ lat: number; lon: number }>,
    startDate?: Date,
    endDate?: Date,
    timeout: number = 30000
  ): Promise<WeatherGridResponse> {
    if (!this.socket || !this.connected) {
      throw new Error('WebSocket non connecté');
    }

    const requestId = `grid_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Timeout: La requête de grille a pris trop de temps'));
      }, timeout);

      this.pendingRequests.set(requestId, { resolve, reject, timeout: timeoutId });

      const request: WeatherGridRequest = {
        requestId,
        points,
        startDate,
        endDate,
      };

      this.socket!.emit('weather:grid:request', request);
    });
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Manually reconnect
   */
  reconnect() {
    if (this.socket) {
      this.socket.connect();
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.connected = false;
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.connected,
      pendingRequests: this.pendingRequests.size,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

// Singleton instance
export const websocketService = new WebSocketService();
