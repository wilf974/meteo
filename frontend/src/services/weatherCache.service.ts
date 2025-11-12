import { getForecast, type ForecastResponse } from './openMeteo.service';

interface CacheEntry {
  forecast: ForecastResponse;
  timestamp: number;
}

class WeatherCacheService {
  private cache = new Map<string, CacheEntry>();
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private pendingRequests = new Map<string, Promise<ForecastResponse>>();

  private getCacheKey(lat: number, lon: number): string {
    // Round to 2 decimal places to group nearby locations
    const roundedLat = Math.round(lat * 100) / 100;
    const roundedLon = Math.round(lon * 100) / 100;
    return `${roundedLat},${roundedLon}`;
  }

  async getForecast(lat: number, lon: number): Promise<ForecastResponse> {
    const key = this.getCacheKey(lat, lon);
    const now = Date.now();

    // Check cache
    const cached = this.cache.get(key);
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      console.log('📦 Cache hit for', key);
      return cached.forecast;
    }

    // Check if there's already a pending request for this location
    const pending = this.pendingRequests.get(key);
    if (pending) {
      console.log('⏳ Reusing pending request for', key);
      return pending;
    }

    // Make new request
    console.log('🌐 Cache miss, fetching', key);
    const request = getForecast(lat, lon)
      .then(forecast => {
        this.cache.set(key, { forecast, timestamp: now });
        this.pendingRequests.delete(key);
        return forecast;
      })
      .catch(error => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, request);
    return request;
  }

  clearCache() {
    this.cache.clear();
    console.log('🗑️ Weather cache cleared');
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      pending: this.pendingRequests.size,
    };
  }
}

export const weatherCache = new WeatherCacheService();
