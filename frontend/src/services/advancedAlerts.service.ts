/**
 * Advanced Alerts Service
 * Custom threshold-based weather alerts with notifications
 */

import { type WeatherData } from './openMeteo.service';

export interface AlertThreshold {
  id: string;
  locationLat: number;
  locationLon: number;
  locationName: string;
  type: 'temperature' | 'humidity' | 'windSpeed' | 'precipitation' | 'aqi';
  operator: 'gt' | 'lt' | 'eq'; // greater than, less than, equal
  value: number;
  enabled: boolean;
  notificationTypes: ('browser' | 'email')[];
  email?: string;
  createdAt: number;
}

export interface AlertEvent {
  id: string;
  thresholdId: string;
  triggered: boolean;
  value: number;
  timestamp: number;
  message: string;
}

class AdvancedAlertsService {
  private storageKey = 'advanced_alerts_v1';
  private alertHistory: AlertEvent[] = [];

  /**
   * Create alert threshold
   */
  createThreshold(threshold: Omit<AlertThreshold, 'id' | 'createdAt'>): AlertThreshold {
    return {
      ...threshold,
      id: `alert_${Date.now()}`,
      createdAt: Date.now(),
    };
  }

  /**
   * Save threshold
   */
  saveThreshold(threshold: AlertThreshold) {
    const thresholds = this.getThresholds();
    const existing = thresholds.findIndex((t) => t.id === threshold.id);
    if (existing >= 0) {
      thresholds[existing] = threshold;
    } else {
      thresholds.push(threshold);
    }
    localStorage.setItem(this.storageKey, JSON.stringify(thresholds));
  }

  /**
   * Get all thresholds
   */
  getThresholds(): AlertThreshold[] {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  }

  /**
   * Delete threshold
   */
  deleteThreshold(id: string) {
    const thresholds = this.getThresholds();
    const filtered = thresholds.filter((t) => t.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
  }

  /**
   * Check weather against thresholds and trigger alerts
   */
  checkAlerts(lat: number, lon: number, weather: WeatherData): AlertEvent[] {
    const thresholds = this.getThresholds().filter(
      (t) => t.enabled && t.locationLat === Math.round(lat * 100) / 100 && t.locationLon === Math.round(lon * 100) / 100
    );

    const triggered: AlertEvent[] = [];

    thresholds.forEach((threshold) => {
      let value = 0;
      let fieldName = '';

      switch (threshold.type) {
        case 'temperature':
          value = weather.temperature;
          fieldName = 'Température';
          break;
        case 'humidity':
          value = weather.humidity;
          fieldName = 'Humidité';
          break;
        case 'windSpeed':
          value = weather.windSpeed;
          fieldName = 'Vent';
          break;
        case 'precipitation':
          value = weather.precipitation + weather.rain + weather.showers;
          fieldName = 'Précipitations';
          break;
        case 'aqi':
          value = weather.aqi || 0;
          fieldName = 'AQI';
          break;
      }

      const conditionMet =
        (threshold.operator === 'gt' && value > threshold.value) ||
        (threshold.operator === 'lt' && value < threshold.value) ||
        (threshold.operator === 'eq' && value === threshold.value);

      if (conditionMet) {
        const alert: AlertEvent = {
          id: `event_${Date.now()}_${Math.random()}`,
          thresholdId: threshold.id,
          triggered: true,
          value,
          timestamp: Date.now(),
          message: `Alerte: ${fieldName} ${threshold.operator === 'gt' ? '>' : threshold.operator === 'lt' ? '<' : '='} ${threshold.value} (actuellement ${value.toFixed(1)})`,
        };

        triggered.push(alert);
        this.addToHistory(alert);

        // Trigger notifications
        if (threshold.notificationTypes.includes('browser')) {
          this.sendBrowserNotification(alert.message, threshold.locationName);
        }
      }
    });

    return triggered;
  }

  /**
   * Send browser notification
   */
  private sendBrowserNotification(message: string, location: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`⚠️ Alerte Météo - ${location}`, {
        body: message,
        tag: 'weather-alert',
      });
    }
  }

  /**
   * Add alert to history
   */
  private addToHistory(alert: AlertEvent) {
    this.alertHistory.unshift(alert);
    if (this.alertHistory.length > 100) {
      this.alertHistory = this.alertHistory.slice(0, 100);
    }
  }

  /**
   * Get alert history
   */
  getAlertHistory(): AlertEvent[] {
    return this.alertHistory;
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
}

export const advancedAlerts = new AdvancedAlertsService();
