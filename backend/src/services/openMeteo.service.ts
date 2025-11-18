import axios from 'axios';
import { cacheService } from '../config/redis';
import { logger } from '../utils/logger';

const BASE_URL = 'https://api.open-meteo.com/v1';

export interface ForecastResponse {
  latitude: number;
  longitude: number;
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation: number[];
    rain: number[];
    showers: number[];
    snowfall: number[];
    weather_code: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    cloud_cover: number[];
    surface_pressure: number[];
    relative_humidity_2m: number[];
    uv_index: number[];
    apparent_temperature: number[];
    dew_point_2m: number[];
    visibility: number[];
  };
}

/**
 * Service pour récupérer les données météo depuis Open-Meteo avec cache Redis
 */
export class OpenMeteoService {
  /**
   * Get weather forecast for a single location
   */
  async getForecast(
    latitude: number,
    longitude: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<ForecastResponse> {
    // Arrondir les coordonnées pour améliorer le taux de hit du cache
    const roundedLat = Math.round(latitude * 10) / 10;
    const roundedLon = Math.round(longitude * 10) / 10;

    const now = new Date();
    const start = startDate || new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const end = endDate || new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000);

    const cacheKey = `openmeteo:forecast:${roundedLat}:${roundedLon}:${start.toISOString()}:${end.toISOString()}`;

    // Try cache first (if Redis is available)
    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        logger.debug(`Cache HIT for ${roundedLat},${roundedLon}`);
        return cached as ForecastResponse;
      }
    } catch (cacheError) {
      logger.debug('Cache not available, fetching from API');
    }

    logger.debug(`Cache MISS for ${roundedLat},${roundedLon} - fetching from API`);

    // Format dates for API
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    try {
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        start_date: formatDate(start),
        end_date: formatDate(end),
        hourly: [
          'temperature_2m',
          'precipitation',
          'rain',
          'showers',
          'snowfall',
          'weather_code',
          'wind_speed_10m',
          'wind_direction_10m',
          'cloud_cover',
          'surface_pressure',
          'relative_humidity_2m',
          'uv_index',
          'apparent_temperature',
          'dew_point_2m',
          'visibility',
        ].join(','),
        timezone: 'auto',
      });

      const response = await axios.get(`${BASE_URL}/forecast`, {
        params,
        timeout: 10000,
      });

      const data: ForecastResponse = response.data;

      // Cache for 15 minutes (if Redis is available)
      try {
        await cacheService.set(cacheKey, data, 900);
      } catch (cacheError) {
        logger.debug('Cache not available, skipping cache set');
      }

      return data;
    } catch (error: any) {
      logger.error(`Error fetching forecast for ${latitude},${longitude}:`, error.message);
      throw error;
    }
  }

  /**
   * Get weather forecast for multiple locations (batch processing)
   */
  async getWeatherGrid(
    points: Array<{ lat: number; lon: number }>,
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<{ lat: number; lon: number; forecast: ForecastResponse | null; error?: string; cached: boolean }>> {
    const results = await Promise.allSettled(
      points.map(async (point) => {
        const roundedLat = Math.round(point.lat * 10) / 10;
        const roundedLon = Math.round(point.lon * 10) / 10;

        const now = new Date();
        const start = startDate || new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const end = endDate || new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000);

        const cacheKey = `openmeteo:forecast:${roundedLat}:${roundedLon}:${start.toISOString()}:${end.toISOString()}`;

        // Try cache first (if Redis is available)
        try {
          const cached = await cacheService.get(cacheKey);
          if (cached) {
            return { ...point, forecast: cached as ForecastResponse, cached: true };
          }
        } catch (cacheError) {
          // Cache not available, continue to API fetch
        }

        // Fetch from API
        try {
          const forecast = await this.getForecast(point.lat, point.lon, startDate, endDate);
          return { ...point, forecast, cached: false };
        } catch (error: any) {
          return { ...point, forecast: null, error: error.message, cached: false };
        }
      })
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          lat: points[index].lat,
          lon: points[index].lon,
          forecast: null,
          error: result.reason?.message || 'Unknown error',
          cached: false,
        };
      }
    });
  }
}

export const openMeteoService = new OpenMeteoService();
