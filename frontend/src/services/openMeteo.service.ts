import axios from 'axios';

const BASE_URL = 'https://api.open-meteo.com/v1';

export interface WeatherData {
  time: string;
  temperature: number;
  precipitation: number;
  windSpeed: number;
  windDirection: number;
  cloudCover: number;
  pressure: number;
  humidity: number;
}

export interface ForecastResponse {
  latitude: number;
  longitude: number;
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    cloud_cover: number[];
    surface_pressure: number[];
    relative_humidity_2m: number[];
  };
}

/**
 * Récupère les prévisions météo horaires pour une position donnée
 * Données disponibles: 16 jours de prévisions
 */
export async function getForecast(
  latitude: number,
  longitude: number,
  startDate?: Date,
  endDate?: Date
): Promise<ForecastResponse> {
  try {
    const now = new Date();
    const start = startDate || new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 jour avant
    const end = endDate || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 jours après

    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      hourly: [
        'temperature_2m',
        'precipitation',
        'wind_speed_10m',
        'wind_direction_10m',
        'cloud_cover',
        'surface_pressure',
        'relative_humidity_2m',
      ].join(','),
      timezone: 'auto',
      forecast_days: '7',
      past_days: '1',
    });

    console.log('🌐 Fetching Open-Meteo:', `${BASE_URL}/forecast?${params}`);
    const response = await axios.get<ForecastResponse>(`${BASE_URL}/forecast?${params}`);
    console.log('✅ Open-Meteo data received:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Open-Meteo fetch error:', error);
    throw error;
  }
}

/**
 * Récupère les données météo pour un moment spécifique
 */
export function getWeatherAtTime(
  forecast: ForecastResponse,
  targetTime: Date
): WeatherData | null {
  const targetTimestamp = targetTime.getTime();

  // Trouver l'index de l'heure la plus proche
  let closestIndex = 0;
  let minDiff = Infinity;

  forecast.hourly.time.forEach((timeStr, index) => {
    const time = new Date(timeStr).getTime();
    const diff = Math.abs(time - targetTimestamp);
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = index;
    }
  });

  // Retourner les données pour cette heure
  return {
    time: forecast.hourly.time[closestIndex],
    temperature: forecast.hourly.temperature_2m[closestIndex],
    precipitation: forecast.hourly.precipitation[closestIndex],
    windSpeed: forecast.hourly.wind_speed_10m[closestIndex],
    windDirection: forecast.hourly.wind_direction_10m[closestIndex],
    cloudCover: forecast.hourly.cloud_cover[closestIndex],
    pressure: forecast.hourly.surface_pressure[closestIndex],
    humidity: forecast.hourly.relative_humidity_2m[closestIndex],
  };
}

/**
 * Récupère les données météo pour une grille de points (pour créer des heatmaps)
 */
export async function getGridForecast(
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  },
  gridSize: number = 10
): Promise<Array<{ lat: number; lon: number; forecast: ForecastResponse }>> {
  const latStep = (bounds.north - bounds.south) / gridSize;
  const lonStep = (bounds.east - bounds.west) / gridSize;

  const promises: Promise<{ lat: number; lon: number; forecast: ForecastResponse }>[] = [];

  for (let i = 0; i <= gridSize; i++) {
    for (let j = 0; j <= gridSize; j++) {
      const lat = bounds.south + i * latStep;
      const lon = bounds.west + j * lonStep;

      promises.push(
        getForecast(lat, lon).then((forecast) => ({ lat, lon, forecast }))
      );
    }
  }

  return Promise.all(promises);
}
