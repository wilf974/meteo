import axios from 'axios';

/**
 * Service pour récupérer les données d'éclairs en temps réel
 * Source: Blitzortung API (Free Lightning Detection)
 * Docs: https://blitzortung.org/en/live_lightning_data.php
 */

export interface LightningStrike {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: number; // Unix timestamp in milliseconds
  strength: number; // 0-1 scale, higher = stronger
  distance?: number; // Distance from target point in km
  age?: number; // Seconds since strike occurred
}

export interface LightningResponse {
  data: Array<{
    id: number;
    lat: number;
    lon: number;
    time: number;
    stroke_count: number;
  }>;
}

// Blitzortung API endpoint - returns recent strikes (last 10 seconds)
const BLITZORTUNG_API = 'https://api.blitzortung.org/v2/strike_data';

/**
 * Récupère les éclairs récents dans une région
 * Retourne les éclairs des 10 dernières secondes dans la boîte bbox
 */
export async function getLightningStrikes(
  minLat: number,
  maxLat: number,
  minLon: number,
  maxLon: number
): Promise<LightningStrike[]> {
  try {
    // Format: lat_min=X&lat_max=Y&lon_min=Z&lon_max=W
    const params = new URLSearchParams({
      lat_min: Math.max(-85, minLat).toString(),
      lat_max: Math.min(85, maxLat).toString(),
      lon_min: Math.max(-180, minLon).toString(),
      lon_max: Math.min(180, maxLon).toString(),
    });

    const url = `${BLITZORTUNG_API}?${params}`;
    console.log('⚡ Fetching lightning strikes:', url);

    const response = await axios.get<LightningResponse>(url, {
      timeout: 5000,
    });

    if (!response.data.data || !Array.isArray(response.data.data)) {
      console.warn('Invalid lightning response structure');
      return [];
    }

    // Convert Blitzortung format to our format
    const strikes: LightningStrike[] = response.data.data.map((strike) => {
      const timestamp = strike.time * 1000; // Convert seconds to milliseconds
      const now = Date.now();
      const age = Math.max(0, now - timestamp) / 1000; // Age in seconds

      return {
        id: `${strike.id}-${strike.time}`,
        latitude: strike.lat,
        longitude: strike.lon,
        timestamp,
        strength: Math.min(1, strike.stroke_count / 5), // Normalize: 5+ strokes = max
        age,
      };
    });

    console.log(`✅ Got ${strikes.length} lightning strikes`);
    return strikes;
  } catch (error) {
    console.error('❌ Lightning fetch error:', error instanceof Error ? error.message : error);
    // Return empty array instead of throwing - lightning is optional
    return [];
  }
}

/**
 * Filtrer les éclairs actifs (moins d'1 minute)
 */
export function filterRecentStrikes(strikes: LightningStrike[], maxAgeSeconds: number = 60): LightningStrike[] {
  return strikes.filter(strike => {
    const age = (Date.now() - strike.timestamp) / 1000;
    return age < maxAgeSeconds;
  });
}

/**
 * Calculer la densité d'éclairs dans une région (strikes/km²)
 */
export function calculateLightningDensity(
  strikes: LightningStrike[],
  gridSize: number = 10 // 10km grid cells
): Map<string, number> {
  const density = new Map<string, number>();

  strikes.forEach(strike => {
    // Round to nearest grid cell
    const cellLat = Math.round(strike.latitude / (gridSize / 111)); // 1 degree ≈ 111km
    const cellLon = Math.round(strike.longitude / (gridSize / 111));
    const key = `${cellLat},${cellLon}`;

    density.set(key, (density.get(key) || 0) + 1);
  });

  return density;
}

/**
 * Trouver les éclairs les plus proches d'une position
 */
export function findNearestStrikes(
  strikes: LightningStrike[],
  lat: number,
  lon: number,
  maxDistance: number = 50 // km
): LightningStrike[] {
  return strikes
    .map(strike => ({
      ...strike,
      distance: calculateDistance(lat, lon, strike.latitude, strike.longitude),
    }))
    .filter(strike => strike.distance! <= maxDistance)
    .sort((a, b) => a.distance! - b.distance!);
}

/**
 * Calculer la distance entre deux points (formule Haversine)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon terrestre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export { BLITZORTUNG_API };
