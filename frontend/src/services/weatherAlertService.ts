import { FavoriteLocation } from '../store/favoritesStore';
import { NowcastData } from './openMeteo.service';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

interface WeatherData {
  temperature: number;
  precipitation: number;
  windSpeed: number;
  humidity: number;
  pressure: number;
}

interface NowcastAlertThresholds {
  minPrecipitation: number;  // mm/10min threshold for alert
}

interface AlertThresholds {
  minTemp: number;
  maxTemp: number;
  maxPrecipitation: number;
  maxWindSpeed: number;
}

// Seuils par défaut pour les alertes
const DEFAULT_THRESHOLDS: AlertThresholds = {
  minTemp: 0,      // Alerte si température < 0°C (gel)
  maxTemp: 35,     // Alerte si température > 35°C (canicule)
  maxPrecipitation: 50,  // Alerte si précipitations > 50mm
  maxWindSpeed: 70,      // Alerte si vent > 70 km/h
};

// Seuils par défaut pour les alertes Nowcast
const DEFAULT_NOWCAST_THRESHOLDS: NowcastAlertThresholds = {
  minPrecipitation: 0.1,  // Alerte si précipitations > 0.1mm dans les 15 prochaines minutes
};

/**
 * Récupère les données météo pour une localisation
 */
async function fetchWeatherData(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/weather/current`, {
      params: { lat, lon }
    });

    const data = response.data;
    return {
      temperature: data.temperature || 0,
      precipitation: data.precipitation || 0,
      windSpeed: data.windSpeed || 0,
      humidity: data.humidity || 0,
      pressure: data.pressure || 0,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des données météo:', error);
    return null;
  }
}

/**
 * Vérifie si les conditions météo dépassent les seuils
 */
function checkAlertConditions(
  weather: WeatherData,
  thresholds: AlertThresholds = DEFAULT_THRESHOLDS
): { shouldAlert: boolean; alertType: string; message: string } | null {
  // Vérifier température basse (gel)
  if (weather.temperature < thresholds.minTemp) {
    return {
      shouldAlert: true,
      alertType: 'Alerte Gel',
      message: `Température très basse détectée : ${weather.temperature.toFixed(1)}°C. Risque de gel.`
    };
  }

  // Vérifier température haute (canicule)
  if (weather.temperature > thresholds.maxTemp) {
    return {
      shouldAlert: true,
      alertType: 'Alerte Canicule',
      message: `Température très élevée détectée : ${weather.temperature.toFixed(1)}°C. Forte chaleur.`
    };
  }

  // Vérifier précipitations importantes
  if (weather.precipitation > thresholds.maxPrecipitation) {
    return {
      shouldAlert: true,
      alertType: 'Alerte Pluies Intenses',
      message: `Précipitations importantes détectées : ${weather.precipitation.toFixed(1)}mm. Risque d'inondations.`
    };
  }

  // Vérifier vents forts
  if (weather.windSpeed > thresholds.maxWindSpeed) {
    return {
      shouldAlert: true,
      alertType: 'Alerte Vents Violents',
      message: `Vents forts détectés : ${weather.windSpeed.toFixed(1)} km/h. Risque de dégâts.`
    };
  }

  return null;
}

/**
 * Vérifie si les conditions nowcast dépassent les seuils
 */
function checkNowcastAlertConditions(
  nowcast: NowcastData,
  thresholds: NowcastAlertThresholds = DEFAULT_NOWCAST_THRESHOLDS
): { shouldAlert: boolean; alertType: string; message: string } | null {
  // Alerte si pluie détectée dans les 15 prochaines minutes
  if (nowcast.precipitation > thresholds.minPrecipitation) {
    let intensity = '';
    if (nowcast.rainIntensity === 'heavy') {
      intensity = 'forte';
    } else if (nowcast.rainIntensity === 'moderate') {
      intensity = 'modérée';
    } else if (nowcast.rainIntensity === 'light') {
      intensity = 'légère';
    }

    return {
      shouldAlert: true,
      alertType: '⚡ Alerte Pluie Imminente',
      message: `Pluie ${intensity} attendue dans les 15 prochaines minutes (${nowcast.precipitation.toFixed(1)}mm/10min). Probabilité: ${nowcast.rainChance}%.`
    };
  }

  return null;
}

/**
 * Envoie une alerte email
 */
async function sendEmailAlert(
  email: string,
  location: string,
  alertType: string,
  message: string,
  weather: WeatherData
): Promise<boolean> {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/v1/email/alert`, {
      to: email,
      alertData: {
        location,
        alertType,
        message,
        temperature: weather.temperature,
        precipitation: weather.precipitation,
        windSpeed: weather.windSpeed,
      }
    });

    return response.data.success || false;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'alerte email:', error);
    return false;
  }
}

/**
 * Envoie une notification navigateur
 */
function sendBrowserNotification(
  location: string,
  alertType: string,
  message: string
): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(`🌤️ ${alertType} - ${location}`, {
      body: message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `weather-alert-${location}`,
      requireInteraction: false,
    });
  }
}

/**
 * Vérifie et envoie des alertes pour un favori
 */
async function checkAndAlertForFavorite(
  favorite: FavoriteLocation,
  thresholds?: AlertThresholds
): Promise<void> {
  // Vérifier si des alertes sont activées
  const hasAlerts = favorite.alerts.email.enabled || favorite.alerts.browser.enabled;
  if (!hasAlerts) {
    return;
  }

  // Récupérer les données météo
  const weather = await fetchWeatherData(favorite.lat, favorite.lon);
  if (!weather) {
    console.warn(`Impossible de récupérer les données météo pour ${favorite.name}`);
    return;
  }

  // Vérifier les conditions d'alerte
  const alertCondition = checkAlertConditions(weather, thresholds);
  if (!alertCondition) {
    return; // Pas d'alerte nécessaire
  }

  console.log(`🚨 Alerte détectée pour ${favorite.name}:`, alertCondition);

  // Envoyer alerte email si activée
  if (favorite.alerts.email.enabled && favorite.alerts.email.address) {
    const emailSent = await sendEmailAlert(
      favorite.alerts.email.address,
      favorite.name,
      alertCondition.alertType,
      alertCondition.message,
      weather
    );

    if (emailSent) {
      console.log(`✅ Email d'alerte envoyé à ${favorite.alerts.email.address}`);
    }
  }

  // Envoyer notification navigateur si activée
  if (favorite.alerts.browser.enabled) {
    sendBrowserNotification(
      favorite.name,
      alertCondition.alertType,
      alertCondition.message
    );
    console.log(`✅ Notification navigateur envoyée`);
  }
}

/**
 * Vérifie et envoie des alertes nowcast pour un favori
 */
async function checkAndNowcastAlert(
  favorite: FavoriteLocation,
  nowcast: NowcastData,
  thresholds?: NowcastAlertThresholds
): Promise<void> {
  // Vérifier si des alertes sont activées
  const hasAlerts = favorite.alerts.email.enabled || favorite.alerts.browser.enabled;
  if (!hasAlerts) {
    return;
  }

  // Vérifier les conditions d'alerte nowcast
  const alertCondition = checkNowcastAlertConditions(nowcast, thresholds);
  if (!alertCondition) {
    return; // Pas d'alerte nowcast nécessaire
  }

  console.log(`⚡ Alerte nowcast détectée pour ${favorite.name}:`, alertCondition);

  // Envoyer alerte email si activée
  if (favorite.alerts.email.enabled && favorite.alerts.email.address) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/email/alert`, {
        to: favorite.alerts.email.address,
        alertData: {
          location: favorite.name,
          alertType: alertCondition.alertType,
          message: alertCondition.message,
          nowcast: {
            precipitation: nowcast.precipitation,
            rainChance: nowcast.rainChance,
            rainIntensity: nowcast.rainIntensity,
          }
        }
      });

      if (response.data.success) {
        console.log(`✅ Alerte email nowcast envoyée à ${favorite.alerts.email.address}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'alerte email nowcast:', error);
    }
  }

  // Envoyer notification navigateur si activée
  if (favorite.alerts.browser.enabled) {
    sendBrowserNotification(
      favorite.name,
      alertCondition.alertType,
      alertCondition.message
    );
    console.log(`✅ Notification navigateur nowcast envoyée`);
  }
}

/**
 * Vérifie toutes les alertes pour une liste de favoris
 */
export async function checkAlertsForAllFavorites(
  favorites: FavoriteLocation[],
  thresholds?: AlertThresholds
): Promise<void> {
  const favoritesWithAlerts = favorites.filter(
    fav => fav.alerts.email.enabled || fav.alerts.browser.enabled
  );

  if (favoritesWithAlerts.length === 0) {
    return;
  }

  console.log(`🔍 Vérification des alertes pour ${favoritesWithAlerts.length} favoris...`);

  // Traiter tous les favoris en parallèle
  await Promise.all(
    favoritesWithAlerts.map(fav => checkAndAlertForFavorite(fav, thresholds))
  );
}

/**
 * Démarre le système de monitoring périodique
 */
export function startAlertMonitoring(
  favorites: FavoriteLocation[],
  intervalMinutes: number = 30,
  thresholds?: AlertThresholds
): NodeJS.Timeout {
  console.log(`🚀 Démarrage du monitoring d'alertes (intervalle: ${intervalMinutes} minutes)`);

  // Vérification immédiate
  checkAlertsForAllFavorites(favorites, thresholds);

  // Vérifications périodiques
  const intervalId = setInterval(() => {
    checkAlertsForAllFavorites(favorites, thresholds);
  }, intervalMinutes * 60 * 1000);

  return intervalId;
}

/**
 * Arrête le monitoring
 */
export function stopAlertMonitoring(intervalId: NodeJS.Timeout): void {
  clearInterval(intervalId);
  console.log('🛑 Monitoring d\'alertes arrêté');
}

/**
 * Vérifie les alertes nowcast pour plusieurs favoris
 */
export async function checkNowcastAlertsForFavorites(
  favorites: FavoriteLocation[],
  nowcasts: Map<string, NowcastData>,
  thresholds?: NowcastAlertThresholds
): Promise<void> {
  const favoritesWithAlerts = favorites.filter(
    fav => fav.alerts.email.enabled || fav.alerts.browser.enabled
  );

  if (favoritesWithAlerts.length === 0) {
    return;
  }

  // Traiter tous les favoris en parallèle
  await Promise.all(
    favoritesWithAlerts.map(fav => {
      const key = `${fav.lat},${fav.lon}`;
      const nowcast = nowcasts.get(key);
      if (nowcast) {
        return checkAndNowcastAlert(fav, nowcast, thresholds);
      }
      return Promise.resolve();
    })
  );
}

export { DEFAULT_THRESHOLDS, DEFAULT_NOWCAST_THRESHOLDS };
export type { AlertThresholds, NowcastAlertThresholds, WeatherData };
export { checkNowcastAlertConditions };
