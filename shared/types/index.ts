// Types partagés entre backend et frontend

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  preferences?: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  theme?: 'light' | 'dark';
  defaultLayers?: string[];
  notifications?: boolean;
  language?: string;
}

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  description: string;
  icon: string;
  timestamp: string;
}

export interface Alert {
  id: string;
  name: string;
  description?: string;
  conditions: AlertConditions;
  zone?: AlertZone;
  isActive: boolean;
  notificationChannels: NotificationChannels;
  lastTriggered?: Date;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertConditions {
  parameters: AlertParameter[];
  logic: 'AND' | 'OR';
}

export interface AlertParameter {
  type: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  value: number;
  unit: string;
}

export interface AlertZone {
  type: 'circle' | 'polygon';
  coordinates: number[][];
  radius?: number;
}

export interface NotificationChannels {
  email: boolean;
  push: boolean;
  sms: boolean;
}

export interface LayerConfig {
  id: string;
  name: string;
  type: 'heatmap' | 'overlay' | 'vector' | 'contour' | 'point';
  enabled: boolean;
  opacity: number;
  order: number;
  available: boolean;
}

export interface MapAnnotation {
  id: string;
  userId: string;
  type: 'marker' | 'polyline' | 'polygon' | 'circle';
  coordinates: number[][];
  properties: {
    color?: string;
    text?: string;
    radius?: number;
  };
  createdAt: Date;
}

export interface ForecastData {
  location: {
    lat: number;
    lon: number;
    name: string;
    country: string;
  };
  forecast: WeatherData[];
}
