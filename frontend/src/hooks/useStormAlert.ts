import { useEffect, useState, useRef } from 'react';
import { type LightningStrike } from '../services/lightning.service';
import { type NowcastData } from '../services/openMeteo.service';
import { detectStorms, type StormAlert } from '../services/stormAlert.service';

interface UseStormAlertProps {
  strikes: LightningStrike[];
  nowcast: NowcastData | null;
  selectedPoint: { lat: number; lon: number } | null;
}

/**
 * Hook pour détecter et gérer les alertes d'orages
 */
export function useStormAlert({ strikes, nowcast, selectedPoint }: UseStormAlertProps) {
  const [alert, setAlert] = useState<StormAlert | null>(null);
  const [alertHistory, setAlertHistory] = useState<StormAlert[]>([]);
  const lastAlertIdRef = useRef<string>('');

  useEffect(() => {
    if (!selectedPoint) {
      setAlert(null);
      return;
    }

    // Detect storm
    const stormAlert = detectStorms(
      selectedPoint.lat,
      selectedPoint.lon,
      strikes,
      nowcast
    );

    if (stormAlert) {
      // Only update if it's a new alert (different ID)
      if (stormAlert.id !== lastAlertIdRef.current) {
        console.log('🌩️ Storm alert detected:', stormAlert);
        setAlert(stormAlert);
        lastAlertIdRef.current = stormAlert.id;

        // Add to history
        setAlertHistory(prev => [stormAlert, ...prev].slice(0, 10)); // Keep last 10
      } else {
        // Update existing alert (strikes/rain may have changed)
        setAlert(stormAlert);
      }
    } else {
      // Clear alert if no storm
      if (alert) {
        console.log('✅ Storm alert cleared');
        setAlert(null);
      }
    }
  }, [strikes, nowcast, selectedPoint]);

  return {
    alert,
    alertHistory,
    clearAlert: () => setAlert(null),
  };
}
