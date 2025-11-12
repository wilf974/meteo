import axios from 'axios';

const GEOCODING_BASE_URL = 'https://geocoding-api.open-meteo.com/v1';

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  feature_code?: string;
  country_code?: string;
  country?: string;
  country_id?: number;
  admin1?: string;
  admin1_id?: number;
  admin2?: string;
  admin2_id?: number;
  admin3?: string;
  admin3_id?: number;
  admin4?: string;
  admin4_id?: number;
  population?: number;
  timezone?: string;
  postcodes?: string[];
}

export interface GeocodingResponse {
  results?: GeocodingResult[];
  generationtime_ms?: number;
}

/**
 * Search for locations by name using Open-Meteo Geocoding API
 * @param query - Search query (city name, address, etc.)
 * @param count - Maximum number of results (1-100, default 10)
 * @param language - Language code (default 'fr')
 * @returns Array of matching locations
 */
export async function searchLocations(
  query: string,
  count: number = 10,
  language: string = 'fr'
): Promise<GeocodingResult[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      name: query,
      count: Math.min(Math.max(count, 1), 100).toString(),
      language: language,
      format: 'json',
    });

    console.log('🔍 Geocoding search:', query);
    const response = await axios.get<GeocodingResponse>(
      `${GEOCODING_BASE_URL}/search?${params}`
    );

    console.log('✅ Geocoding results:', response.data.results?.length || 0);
    return response.data.results || [];
  } catch (error) {
    console.error('❌ Geocoding search error:', error);
    return [];
  }
}

/**
 * Get location by ID
 * @param id - Location ID
 * @param language - Language code (default 'fr')
 * @returns Location details
 */
export async function getLocationById(
  id: number,
  language: string = 'fr'
): Promise<GeocodingResult | null> {
  try {
    const params = new URLSearchParams({
      id: id.toString(),
      language: language,
      format: 'json',
    });

    const response = await axios.get<GeocodingResult>(
      `${GEOCODING_BASE_URL}/get?${params}`
    );

    return response.data;
  } catch (error) {
    console.error('❌ Geocoding get error:', error);
    return null;
  }
}

/**
 * Format location result as display string
 */
export function formatLocationName(result: GeocodingResult): string {
  const parts: string[] = [result.name];

  if (result.admin1) {
    parts.push(result.admin1);
  }
  if (result.country) {
    parts.push(result.country);
  }

  return parts.join(', ');
}
