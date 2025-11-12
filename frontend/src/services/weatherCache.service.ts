import { getForecast, type ForecastResponse } from './openMeteo.service';

interface CacheEntry {
  forecast: ForecastResponse;
  timestamp: number;
  hits: number;
}

interface CacheStats {
  size: number;
  pending: number;
  hits: number;
  misses: number;
  hitRate: number;
}

class WeatherCacheService {
  private cache = new Map<string, CacheEntry>();
  private CACHE_DURATION = 10 * 60 * 1000; // 10 minutes (increased from 5)
  private MAX_CACHE_SIZE = 1000; // Maximum cache entries
  private pendingRequests = new Map<string, Promise<ForecastResponse>>();
  private stats = { hits: 0, misses: 0 };

  constructor() {
    // Auto-cleanup every 5 minutes
    setInterval(() => this.cleanupExpiredCache(), 5 * 60 * 1000);
  }

  private getCacheKey(lat: number, lon: number): string {
    // Round to 2 decimal places to group nearby locations
    const roundedLat = Math.round(lat * 100) / 100;
    const roundedLon = Math.round(lon * 100) / 100;
    return `${roundedLat},${roundedLon}`;
  }

  private cleanupExpiredCache() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
    }
  }

  private limitCacheSize() {
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      // Remove least recently used (oldest timestamp)
      const sorted = Array.from(this.cache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      );

      const toRemove = sorted.slice(0, this.cache.size - this.MAX_CACHE_SIZE);
      toRemove.forEach(([key]) => this.cache.delete(key));

      console.log(`🗑️ Removed ${toRemove.length} old cache entries (limit: ${this.MAX_CACHE_SIZE})`);
    }
  }

  async getForecast(lat: number, lon: number, prefetch: boolean = false): Promise<ForecastResponse> {
    const key = this.getCacheKey(lat, lon);
    const now = Date.now();

    // Check cache
    const cached = this.cache.get(key);
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      if (!prefetch) {
        this.stats.hits++;
        cached.hits++;
        console.log(`📦 Cache hit for ${key} (${cached.hits} hits)`);
      }
      return cached.forecast;
    }

    // Check if there's already a pending request for this location
    const pending = this.pendingRequests.get(key);
    if (pending) {
      if (!prefetch) {
        console.log(`⏳ Reusing pending request for ${key}`);
      }
      return pending;
    }

    // Make new request
    if (!prefetch) {
      this.stats.misses++;
      console.log(`🌐 Cache miss, fetching ${key}`);
    }

    const request = getForecast(lat, lon)
      .then(forecast => {
        this.cache.set(key, { forecast, timestamp: now, hits: 0 });
        this.pendingRequests.delete(key);
        this.limitCacheSize();

        // DISABLED: Prefetching was causing too many API calls and slowdowns
        // Prefetch adjacent cells (only for main requests, not for prefetch requests)
        // if (!prefetch) {
        //   this.prefetchAdjacentCells(lat, lon);
        // }

        return forecast;
      })
      .catch(error => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, request);
    return request;
  }

  private async prefetchAdjacentCells(lat: number, lon: number) {
    // Prefetch 8 adjacent cells (N, NE, E, SE, S, SW, W, NW)
    const offset = 0.5; // ~55km at equator
    const adjacentCells = [
      { lat: lat + offset, lon: lon },           // North
      { lat: lat + offset, lon: lon + offset },  // NE
      { lat: lat, lon: lon + offset },           // East
      { lat: lat - offset, lon: lon + offset },  // SE
      { lat: lat - offset, lon: lon },           // South
      { lat: lat - offset, lon: lon - offset },  // SW
      { lat: lat, lon: lon - offset },           // West
      { lat: lat + offset, lon: lon - offset },  // NW
    ];

    // Use requestIdleCallback for low-priority prefetching
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        adjacentCells.forEach(cell => {
          this.getForecast(cell.lat, cell.lon, true).catch(() => {
            // Silently ignore prefetch errors
          });
        });
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        adjacentCells.forEach(cell => {
          this.getForecast(cell.lat, cell.lon, true).catch(() => {});
        });
      }, 100);
    }
  }

  clearCache() {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
    console.log('🗑️ Weather cache cleared');
  }

  getCacheStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      size: this.cache.size,
      pending: this.pendingRequests.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
    };
  }
}

export const weatherCache = new WeatherCacheService();
