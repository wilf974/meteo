import axios from 'axios';

const BASE_URL = 'https://api.open-meteo.com/v1';
const AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1';

export interface AirQualityData {
  time: string;
  pm10: number;
  pm25: number;
  no2: number;
  o3: number;
  so2: number;
  co: number;
  aqi: number;
}

export interface AirQualityResponse {
  latitude: number;
  longitude: number;
  hourly: {
    time: string[];
    pm10: number[];
    pm2_5: number[];
    carbon_monoxide: number[];
    nitrogen_dioxide: number[];
    sulphur_dioxide: number[];
    ozone: number[];
    european_aqi: number[];
  };
}

export interface WeatherData {
  time: string;
  temperature: number;
  precipitation: number;
  rain: number;
  showers: number;
  snowfall: number;
  weatherCode: number;
  windSpeed: number;
  windDirection: number;
  cloudCover: number;
  pressure: number;
  humidity: number;
  // Premium features
  uvIndex: number;
  apparentTemperature: number;
  dewPoint: number;
  visibility: number;
  // Air Quality (Premium)
  pm10: number;
  pm25: number;
  no2: number;
  o3: number;
  so2: number;
  co: number;
  aqi: number; // European Air Quality Index
}

export interface NowcastData {
  time: string;
  precipitation: number; // mm/10min
  rainIntensity: 'none' | 'light' | 'moderate' | 'heavy';
  rainChance: number; // 0-100%
}

export interface NowcastResponse {
  latitude: number;
  longitude: number;
  minutely_10: {
    time: string[];
    precipitation: number[]; // mm/10min
  };
  timezone: string;
}

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
    // Premium features
    uv_index: number[];
    apparent_temperature: number[];
    dew_point_2m: number[];
    visibility: number[];
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
    const end = endDate || new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000); // 16 jours après (extended)

    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
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
        // Premium features
        'uv_index',
        'apparent_temperature',
        'dew_point_2m',
        'visibility',
      ].join(','),
      timezone: 'auto',
      forecast_days: '16', // Extended from 7 to 16 days
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
    rain: forecast.hourly.rain[closestIndex],
    showers: forecast.hourly.showers[closestIndex],
    snowfall: forecast.hourly.snowfall[closestIndex],
    weatherCode: forecast.hourly.weather_code[closestIndex],
    windSpeed: forecast.hourly.wind_speed_10m[closestIndex],
    windDirection: forecast.hourly.wind_direction_10m[closestIndex],
    cloudCover: forecast.hourly.cloud_cover[closestIndex],
    pressure: forecast.hourly.surface_pressure[closestIndex],
    humidity: forecast.hourly.relative_humidity_2m[closestIndex],
    // Premium features
    uvIndex: forecast.hourly.uv_index[closestIndex] || 0,
    apparentTemperature: forecast.hourly.apparent_temperature[closestIndex] || forecast.hourly.temperature_2m[closestIndex],
    dewPoint: forecast.hourly.dew_point_2m[closestIndex] || 0,
    visibility: forecast.hourly.visibility[closestIndex] || 10000,
    // Air Quality - default values, will be populated by getAirQualityAtTime
    pm10: 0,
    pm25: 0,
    no2: 0,
    o3: 0,
    so2: 0,
    co: 0,
    aqi: 0,
  };
}

/**
 * Récupère les données de qualité de l'air pour une position donnée
 * API Open-Meteo Air Quality (gratuite)
 */
export async function getAirQuality(
  latitude: number,
  longitude: number
): Promise<AirQualityResponse> {
  try {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      hourly: [
        'pm10',
        'pm2_5',
        'carbon_monoxide',
        'nitrogen_dioxide',
        'sulphur_dioxide',
        'ozone',
        'european_aqi',
      ].join(','),
      timezone: 'auto',
      forecast_days: '7', // Air quality typically available for 7 days
      past_days: '1',
    });

    console.log('🌫️ Fetching Air Quality:', `${AIR_QUALITY_URL}/air-quality?${params}`);
    const response = await axios.get<AirQualityResponse>(`${AIR_QUALITY_URL}/air-quality?${params}`);
    console.log('✅ Air Quality data received:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Air Quality fetch error:', error);
    throw error;
  }
}

/**
 * Récupère les données de qualité de l'air pour un moment spécifique
 */
export function getAirQualityAtTime(
  airQuality: AirQualityResponse,
  targetTime: Date
): AirQualityData | null {
  const targetTimestamp = targetTime.getTime();

  // Trouver l'index de l'heure la plus proche
  let closestIndex = 0;
  let minDiff = Infinity;

  airQuality.hourly.time.forEach((timeStr, index) => {
    const time = new Date(timeStr).getTime();
    const diff = Math.abs(time - targetTimestamp);
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = index;
    }
  });

  // Retourner les données pour cette heure
  return {
    time: airQuality.hourly.time[closestIndex],
    pm10: airQuality.hourly.pm10[closestIndex] || 0,
    pm25: airQuality.hourly.pm2_5[closestIndex] || 0,
    co: airQuality.hourly.carbon_monoxide[closestIndex] || 0,
    no2: airQuality.hourly.nitrogen_dioxide[closestIndex] || 0,
    so2: airQuality.hourly.sulphur_dioxide[closestIndex] || 0,
    o3: airQuality.hourly.ozone[closestIndex] || 0,
    aqi: airQuality.hourly.european_aqi[closestIndex] || 0,
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

/**
 * Récupère les prévisions minute par minute (Nowcasting) pour une position donnée
 * Données disponibles: 96 minutes (~1.6 heures)
 * Résolution: 10 minutes
 *
 * Note: Cette fonction utilise l'API Free Open-Meteo qui support minutely_10
 * Voir: https://open-meteo.com/en/docs#minutely
 */
export async function getNowcast(
  latitude: number,
  longitude: number
): Promise<NowcastResponse> {
  try {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      minutely_10: 'precipitation',
      timezone: 'auto',
      forecast_days: '1', // Just today
    });

    const url = `${BASE_URL}/forecast?${params}`;
    console.log('⚡ Fetching Nowcast from Open-Meteo:', url);

    const response = await axios.get<NowcastResponse>(url, {
      timeout: 5000 // 5 second timeout to not block weather
    });

    console.log('✅ Nowcast data received:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Nowcast fetch error:', error instanceof Error ? error.message : error);
    // Return a minimal response structure instead of throwing
    // This allows weather to still display even if nowcast fails
    return {
      latitude,
      longitude,
      minutely_10: {
        time: [],
        precipitation: []
      },
      timezone: 'UTC'
    };
  }
}

/**
 * Récupère les données de nowcast pour un moment spécifique
 */
export function getNowcastAtTime(
  nowcast: NowcastResponse,
  targetTime: Date
): NowcastData | null {
  // Return null if no nowcast data available
  if (!nowcast.minutely_10.time || nowcast.minutely_10.time.length === 0) {
    return null;
  }

  const targetTimestamp = targetTime.getTime();

  // Trouver l'index du créneau de 10 minutes le plus proche
  let closestIndex = 0;
  let minDiff = Infinity;

  nowcast.minutely_10.time.forEach((timeStr, index) => {
    const time = new Date(timeStr).getTime();
    const diff = Math.abs(time - targetTimestamp);
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = index;
    }
  });

  const precipitation = nowcast.minutely_10.precipitation[closestIndex] || 0;

  // Déterminer l'intensité de la pluie (0-2mm = light, 2-10mm = moderate, >10mm = heavy)
  let rainIntensity: 'none' | 'light' | 'moderate' | 'heavy' = 'none';
  if (precipitation > 0 && precipitation <= 2) rainIntensity = 'light';
  else if (precipitation > 2 && precipitation <= 10) rainIntensity = 'moderate';
  else if (precipitation > 10) rainIntensity = 'heavy';

  // Calculer la probabilité de pluie (simple heuristique: 0-1 = 0-100%)
  // Dans la vraie vie, il faudrait une API supplémentaire pour la probabilité
  const rainChance = Math.min(100, Math.round((precipitation / 5) * 100));

  return {
    time: nowcast.minutely_10.time[closestIndex],
    precipitation,
    rainIntensity,
    rainChance,
  };
}
