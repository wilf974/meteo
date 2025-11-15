import { type LightningStrike } from './lightning.service';
import { type NowcastData } from './openMeteo.service';

/**
 * Storm Alert Service
 * Combines lightning detection + nowcast rain for comprehensive storm alerts
 */

export interface StormAlert {
  id: string;
  latitude: number;
  longitude: number;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  strikeCount: number;
  nearestStrikeDistance: number; // km
  rainIntensity: 'none' | 'light' | 'moderate' | 'heavy';
  rainChance: number;
  precipitation: number;
  timestamp: number;
  message: string;
}

interface StormDetectionParams {
  strikeCountThreshold: number; // Min strikes to trigger alert
  maxDistanceKm: number; // Max distance to consider
  rainPrecipitationThreshold: number; // Min mm/10min
}

const DEFAULT_PARAMS: StormDetectionParams = {
  strikeCountThreshold: 1, // Even 1 strike nearby is worth alerting
  maxDistanceKm: 50, // 50km around user
  rainPrecipitationThreshold: 0.1, // 0.1mm/10min
};

/**
 * Détecte les orages basés sur éclairs + pluie nowcast
 */
export function detectStorms(
  lat: number,
  lon: number,
  strikes: LightningStrike[],
  nowcast: NowcastData | null,
  params: StormDetectionParams = DEFAULT_PARAMS
): StormAlert | null {
  // Filter nearby strikes
  const nearbyStrikes = strikes.filter(strike => {
    const distance = calculateDistance(lat, lon, strike.latitude, strike.longitude);
    return distance <= params.maxDistanceKm;
  });

  // Check if storm condition is met
  const hasLightning = nearbyStrikes.length >= params.strikeCountThreshold;
  const hasRain = nowcast && nowcast.precipitation > params.rainPrecipitationThreshold;

  if (!hasLightning && !hasRain) {
    return null; // No storm detected
  }

  // Calculate severity
  const strikeCount = nearbyStrikes.length;
  const rainIntensity = nowcast?.rainIntensity || 'none';
  const precipitation = nowcast?.precipitation || 0;
  const rainChance = nowcast?.rainChance || 0;

  // Severity scoring: 0-100
  let severityScore = 0;

  // Lightning component: 0-50 points
  if (strikeCount >= 5) {
    severityScore += 50;
  } else if (strikeCount >= 3) {
    severityScore += 40;
  } else if (strikeCount >= 1) {
    severityScore += 30;
  }

  // Rain component: 0-50 points
  if (nowcast) {
    if (rainIntensity === 'heavy') {
      severityScore += 50;
    } else if (rainIntensity === 'moderate') {
      severityScore += 35;
    } else if (rainIntensity === 'light') {
      severityScore += 20;
    } else {
      severityScore += 10; // Some rain detected
    }
  }

  // Normalize to 0-100
  severityScore = Math.min(100, severityScore);

  // Map score to severity level
  let severity: 'low' | 'moderate' | 'high' | 'critical';
  if (severityScore >= 80) {
    severity = 'critical';
  } else if (severityScore >= 60) {
    severity = 'high';
  } else if (severityScore >= 40) {
    severity = 'moderate';
  } else {
    severity = 'low';
  }

  // Find nearest strike
  const nearestStrike = nearbyStrikes.length > 0
    ? nearbyStrikes.reduce((prev, curr) => {
        const prevDist = calculateDistance(lat, lon, prev.latitude, prev.longitude);
        const currDist = calculateDistance(lat, lon, curr.latitude, curr.longitude);
        return currDist < prevDist ? curr : prev;
      })
    : null;

  const nearestDistance = nearestStrike
    ? calculateDistance(lat, lon, nearestStrike.latitude, nearestStrike.longitude)
    : 999;

  // Generate alert message
  const message = generateStormMessage(severity, strikeCount, rainIntensity, nearestDistance);

  return {
    id: `storm-${Date.now()}`,
    latitude: lat,
    longitude: lon,
    severity,
    strikeCount,
    nearestStrikeDistance: nearestDistance,
    rainIntensity,
    rainChance,
    precipitation,
    timestamp: Date.now(),
    message,
  };
}

/**
 * Génère un message d'alerte personnalisé
 */
function generateStormMessage(
  severity: string,
  strikeCount: number,
  rainIntensity: string,
  nearestDistanceKm: number
): string {
  const severityEmoji = {
    critical: '🚨',
    high: '⚠️',
    moderate: '⚡',
    low: '⛈️',
  };

  const emoji = (severityEmoji as any)[severity] || '⛈️';

  let message = `${emoji} Orage détecté! `;

  if (strikeCount > 0) {
    message += `${strikeCount} éclair${strikeCount > 1 ? 's' : ''} `;
    if (nearestDistanceKm < 10) {
      message += `(très proche: ${nearestDistanceKm.toFixed(0)}km) `;
    } else if (nearestDistanceKm < 30) {
      message += `(${nearestDistanceKm.toFixed(0)}km) `;
    } else {
      message += `dans la région `;
    }
  }

  if (rainIntensity === 'heavy') {
    message += '+ pluie FORTE';
  } else if (rainIntensity === 'moderate') {
    message += '+ pluie modérée';
  } else if (rainIntensity === 'light') {
    message += '+ légère pluie';
  }

  return message.trim();
}

/**
 * Calculer distance entre deux points (Haversine)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
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

export { DEFAULT_PARAMS };
export type { StormDetectionParams };
