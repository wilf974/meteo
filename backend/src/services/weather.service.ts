import axios from 'axios';
import { cacheService } from '../config/redis';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

export class WeatherService {
  private openWeatherApiKey = process.env.OPENWEATHER_API_KEY;
  private openWeatherBaseUrl = 'https://api.openweathermap.org/data/2.5';

  async getCurrentWeather(lat: number, lon: number) {
    const cacheKey = `weather:current:${lat}:${lon}`;

    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await axios.get(`${this.openWeatherBaseUrl}/weather`, {
        params: {
          lat,
          lon,
          appid: this.openWeatherApiKey,
          units: 'metric',
          lang: 'fr'
        }
      });

      const data = {
        temperature: response.data.main.temp,
        feelsLike: response.data.main.feels_like,
        humidity: response.data.main.humidity,
        pressure: response.data.main.pressure,
        windSpeed: response.data.wind.speed,
        windDirection: response.data.wind.deg,
        description: response.data.weather[0].description,
        icon: response.data.weather[0].icon,
        timestamp: new Date().toISOString()
      };

      await cacheService.set(cacheKey, data, 600);

      return data;
    } catch (error) {
      logger.error('Erreur lors de la récupération de la météo actuelle:', error);
      throw new AppError('Impossible de récupérer les données météo', 503);
    }
  }

  async getForecast(lat: number, lon: number, days: number = 7) {
    const cacheKey = `weather:forecast:${lat}:${lon}:${days}`;

    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await axios.get(`${this.openWeatherBaseUrl}/forecast`, {
        params: {
          lat,
          lon,
          appid: this.openWeatherApiKey,
          units: 'metric',
          lang: 'fr',
          cnt: days * 8
        }
      });

      const data = {
        location: {
          lat,
          lon,
          name: response.data.city.name,
          country: response.data.city.country
        },
        forecast: response.data.list.map((item: any) => ({
          timestamp: item.dt_txt,
          temperature: item.main.temp,
          feelsLike: item.main.feels_like,
          humidity: item.main.humidity,
          pressure: item.main.pressure,
          windSpeed: item.wind.speed,
          windDirection: item.wind.deg,
          precipitation: item.rain?.['3h'] || 0,
          description: item.weather[0].description,
          icon: item.weather[0].icon
        }))
      };

      await cacheService.set(cacheKey, data, 1800);

      return data;
    } catch (error) {
      logger.error('Erreur lors de la récupération des prévisions:', error);
      throw new AppError('Impossible de récupérer les prévisions', 503);
    }
  }

  async getRadarLayer(layer: string, bbox: string) {
    const cacheKey = `radar:${layer}:${bbox}`;

    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const [minLon, minLat, maxLon, maxLat] = bbox.split(',').map(Number);

      const data = {
        layer,
        bbox: { minLon, minLat, maxLon, maxLat },
        tiles: [],
        timestamp: new Date().toISOString()
      };

      await cacheService.set(cacheKey, data, 600);

      return data;
    } catch (error) {
      logger.error('Erreur lors de la récupération de la couche radar:', error);
      throw new AppError('Impossible de récupérer la couche radar', 503);
    }
  }

  async getSatelliteImagery(bbox?: string, timestamp?: string) {
    return {
      bbox,
      timestamp: timestamp || new Date().toISOString(),
      imagery: []
    };
  }

  async processCustomModel(userId: string, modelData: any, metadata: any) {
    logger.info(`Traitement du modèle personnalisé pour l'utilisateur ${userId}`);

    return {
      modelId: `custom-${Date.now()}`,
      userId,
      metadata,
      status: 'processed',
      visualizationReady: true
    };
  }
}
