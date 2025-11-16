/**
 * Weather History Service
 * Stores local weather history for trend analysis
 * Stores in localStorage with daily aggregates
 */

export interface DailyWeatherSnapshot {
  date: string; // YYYY-MM-DD
  minTemp: number;
  maxTemp: number;
  avgTemp: number;
  precipitation: number;
  avgHumidity: number;
  avgWindSpeed: number;
  aqi?: number;
}

export interface LocationHistory {
  lat: number;
  lon: number;
  name: string;
  data: DailyWeatherSnapshot[];
}

class WeatherHistoryService {
  private storageKey = 'weather_history_v1';
  private maxDaysPerLocation = 90;

  /**
   * Save daily weather snapshot for location
   */
  saveSnapshot(lat: number, lon: number, name: string, snapshot: Omit<DailyWeatherSnapshot, 'date'>) {
    const today = new Date().toISOString().split('T')[0];
    const history = this.getHistory(lat, lon) || { lat, lon, name, data: [] };

    // Remove today's entry if exists and add new one
    history.data = history.data.filter((d) => d.date !== today);
    history.data.unshift({ date: today, ...snapshot });

    // Keep only maxDaysPerLocation
    if (history.data.length > this.maxDaysPerLocation) {
      history.data = history.data.slice(0, this.maxDaysPerLocation);
    }

    this.saveToStorage(lat, lon, history);
  }

  /**
   * Get history for location
   */
  getHistory(lat: number, lon: number): LocationHistory | null {
    const key = this.getLocationKey(lat, lon);
    const stored = localStorage.getItem(`${this.storageKey}:${key}`);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Get trend data for analysis
   */
  getTrend(lat: number, lon: number, days: number = 7) {
    const history = this.getHistory(lat, lon);
    if (!history) return null;

    const data = history.data.slice(0, days).reverse();
    return {
      dates: data.map((d) => d.date),
      temperatures: data.map((d) => d.avgTemp),
      precipitation: data.map((d) => d.precipitation),
      humidity: data.map((d) => d.avgHumidity),
      windSpeed: data.map((d) => d.avgWindSpeed),
    };
  }

  /**
   * Calculate statistics
   */
  getStats(lat: number, lon: number, days: number = 7) {
    const history = this.getHistory(lat, lon);
    if (!history || history.data.length === 0) return null;

    const data = history.data.slice(0, days);
    const temps = data.map((d) => d.avgTemp);
    const precip = data.map((d) => d.precipitation);

    return {
      avgTemp: temps.reduce((a, b) => a + b) / temps.length,
      minTemp: Math.min(...temps),
      maxTemp: Math.max(...temps),
      totalPrecipitation: precip.reduce((a, b) => a + b, 0),
      rainyDays: data.filter((d) => d.precipitation > 0).length,
    };
  }

  /**
   * Clear old data (called periodically)
   */
  clearOldData(daysToKeep: number = 90) {
    const keys = Object.keys(localStorage);
    const prefix = `${this.storageKey}:`;

    keys.forEach((key) => {
      if (key.startsWith(prefix)) {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const history: LocationHistory = JSON.parse(stored);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

            history.data = history.data.filter((d) => new Date(d.date) > cutoffDate);

            if (history.data.length === 0) {
              localStorage.removeItem(key);
            } else {
              localStorage.setItem(key, JSON.stringify(history));
            }
          } catch {
            // Ignore corrupted entries
          }
        }
      }
    });
  }

  private getLocationKey(lat: number, lon: number): string {
    return `${Math.round(lat * 100) / 100},${Math.round(lon * 100) / 100}`;
  }

  private saveToStorage(lat: number, lon: number, history: LocationHistory) {
    const key = this.getLocationKey(lat, lon);
    localStorage.setItem(`${this.storageKey}:${key}`, JSON.stringify(history));
  }
}

export const weatherHistory = new WeatherHistoryService();
