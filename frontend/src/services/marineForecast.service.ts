import axios from 'axios';

/**
 * Marine Forecast Service
 * Fetches marine data from Open-Meteo Marine API (free tier)
 * Includes wave height, direction, period, and water temperature
 */

const BASE_URL = 'https://marine-api.open-meteo.com/v1/marine';

export interface MarineData {
  time: string;
  waveHeight: number; // meters
  waveDirection: number; // degrees (0-360)
  wavePeriod: number; // seconds
  windWaveHeight: number; // meters
  swellWaveHeight: number; // meters
  swellWavePeriod: number; // seconds
  swellWaveDirection: number; // degrees (0-360)
  waterTemperature: number; // °C
}

export interface MarineResponse {
  latitude: number;
  longitude: number;
  hourly: {
    time: string[];
    wave_height: number[];
    wave_direction: number[];
    wave_period: number[];
    wind_wave_height: number[];
    swell_wave_height: number[];
    swell_wave_period: number[];
    swell_wave_direction: number[];
    sea_surface_temperature: number[];
  };
  timezone: string;
}

/**
 * Fetch marine forecast from Open-Meteo Marine API
 * Provides 7-day hourly forecast of wave conditions and water temperature
 */
export async function getMarineForecast(
  latitude: number,
  longitude: number
): Promise<MarineResponse> {
  try {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      hourly: 'wave_height,wave_direction,wave_period,wind_wave_height,swell_wave_height,swell_wave_period,swell_wave_direction,sea_surface_temperature',
      timezone: 'auto',
      forecast_days: '7',
    });

    const response = await axios.get<MarineResponse>(
      `${BASE_URL}?${params}`,
      { timeout: 5000 }
    );

    return response.data;
  } catch (error) {
    console.error(
      '❌ Marine forecast fetch error:',
      error instanceof Error ? error.message : error
    );
    // Return empty response structure to prevent crashes
    return {
      latitude,
      longitude,
      hourly: {
        time: [],
        wave_height: [],
        wave_direction: [],
        wave_period: [],
        wind_wave_height: [],
        swell_wave_height: [],
        swell_wave_period: [],
        swell_wave_direction: [],
        sea_surface_temperature: [],
      },
      timezone: 'UTC',
    };
  }
}

/**
 * Extract marine data for a specific time from the forecast response
 * If target time is not in the data, returns null
 */
export function getMarineAtTime(
  marine: MarineResponse | null,
  targetTime: Date = new Date()
): MarineData | null {
  if (!marine || !marine.hourly.time || marine.hourly.time.length === 0) {
    return null;
  }

  // Find the closest hourly time to target
  const targetISOString = targetTime.toISOString();
  let closestIndex = 0;
  let closestDiff = Math.abs(
    new Date(marine.hourly.time[0]).getTime() - targetTime.getTime()
  );

  for (let i = 1; i < marine.hourly.time.length; i++) {
    const diff = Math.abs(
      new Date(marine.hourly.time[i]).getTime() - targetTime.getTime()
    );
    if (diff < closestDiff) {
      closestDiff = diff;
      closestIndex = i;
    }
  }

  const index = closestIndex;

  // Check if data exists at this index
  if (
    !marine.hourly.wave_height ||
    !marine.hourly.wave_height[index] === undefined
  ) {
    return null;
  }

  return {
    time: marine.hourly.time[index],
    waveHeight: marine.hourly.wave_height[index] ?? 0,
    waveDirection: marine.hourly.wave_direction[index] ?? 0,
    wavePeriod: marine.hourly.wave_period[index] ?? 0,
    windWaveHeight: marine.hourly.wind_wave_height[index] ?? 0,
    swellWaveHeight: marine.hourly.swell_wave_height[index] ?? 0,
    swellWavePeriod: marine.hourly.swell_wave_period[index] ?? 0,
    swellWaveDirection: marine.hourly.swell_wave_direction[index] ?? 0,
    waterTemperature: marine.hourly.sea_surface_temperature[index] ?? 0,
  };
}

/**
 * Get wave height category string for UI display
 */
export function getWaveCategory(heightMeters: number): string {
  if (heightMeters < 0.5) return 'Très calme';
  if (heightMeters < 1) return 'Calme';
  if (heightMeters < 2) return 'Peu agité';
  if (heightMeters < 3) return 'Agité';
  if (heightMeters < 4) return 'Très agité';
  if (heightMeters < 6) return 'Houleuse';
  return 'Très houleuse';
}

/**
 * Get wave category emoji for quick visual reference
 */
export function getWaveEmoji(heightMeters: number): string {
  if (heightMeters < 0.5) return '😊';
  if (heightMeters < 1) return '🌊';
  if (heightMeters < 2) return '🌊🌊';
  if (heightMeters < 3) return '🌊🌊🌊';
  if (heightMeters < 4) return '⚠️';
  if (heightMeters < 6) return '⚠️⚠️';
  return '🚨';
}

/**
 * Get wind direction as cardinal direction
 */
export function getCardinalDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round((degrees % 360) / 22.5) % 16;
  return directions[index];
}

/**
 * Convert degrees to readable direction format
 */
export function formatDirection(degrees: number): string {
  const cardinal = getCardinalDirection(degrees);
  return `${cardinal} (${Math.round(degrees)}°)`;
}
