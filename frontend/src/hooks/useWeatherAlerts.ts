import { useEffect, useRef } from 'react';
import { useFavoritesStore } from '../store/favoritesStore';
import { startAlertMonitoring, stopAlertMonitoring, DEFAULT_THRESHOLDS } from '../services/weatherAlertService';

/**
 * Hook pour gérer le monitoring automatique des alertes météo
 *
 * @param enabled - Activer/désactiver le monitoring
 * @param intervalMinutes - Intervalle de vérification en minutes (défaut: 30)
 */
export function useWeatherAlerts(enabled: boolean = true, intervalMinutes: number = 30) {
  const favorites = useFavoritesStore(state => state.favorites);
  const intervalIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Ne rien faire si désactivé
    if (!enabled) {
      if (intervalIdRef.current) {
        stopAlertMonitoring(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      return;
    }

    // Vérifier s'il y a des favoris avec alertes activées
    const hasAlertsEnabled = favorites.some(
      fav => fav.alerts.email.enabled || fav.alerts.browser.enabled
    );

    if (!hasAlertsEnabled) {
      // Arrêter le monitoring si aucune alerte activée
      if (intervalIdRef.current) {
        stopAlertMonitoring(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      return;
    }

    // Demander la permission pour les notifications si nécessaire
    const needsBrowserPermission = favorites.some(fav => fav.alerts.browser.enabled);
    if (needsBrowserPermission && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Permission notifications:', permission);
      });
    }

    // Arrêter le monitoring précédent s'il existe
    if (intervalIdRef.current) {
      stopAlertMonitoring(intervalIdRef.current);
    }

    // Démarrer le nouveau monitoring
    intervalIdRef.current = startAlertMonitoring(favorites, intervalMinutes, DEFAULT_THRESHOLDS);

    // Cleanup lors du démontage
    return () => {
      if (intervalIdRef.current) {
        stopAlertMonitoring(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [favorites, enabled, intervalMinutes]);

  return {
    isMonitoring: intervalIdRef.current !== null,
  };
}
