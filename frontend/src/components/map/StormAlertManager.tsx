import { useEffect, useState, memo } from 'react';
import { useMapStore } from '../../store/mapStore';
import { weatherCache } from '../../services/weatherCache.service';
import { useStormAlert } from '../../hooks/useStormAlert';
import StormAlertIndicator from './StormAlertIndicator';
import { useThemeStore } from '../../store/themeStore';
import { type LightningStrike } from '../../services/lightning.service';
import { type NowcastData } from '../../services/openMeteo.service';

const StormAlertManager = memo(function StormAlertManager() {
  const { selectedPoint } = useMapStore();
  const { effectiveTheme } = useThemeStore();
  const [strikes, setStrikes] = useState<LightningStrike[]>([]);
  const [nowcast, setNowcast] = useState<NowcastData | null>(null);

  const isDark = effectiveTheme === 'dark';
  const { alert } = useStormAlert({ strikes, nowcast, selectedPoint });

  // Fetch lightning and nowcast data for selected point
  useEffect(() => {
    if (!selectedPoint) {
      setStrikes([]);
      setNowcast(null);
      return;
    }

    let isMounted = true;

    const fetchData = async () => {
      try {
        // Fetch lightning in 100km radius
        const lightningStrikes = await weatherCache.getLightning(
          selectedPoint.lat - 1,
          selectedPoint.lat + 1,
          selectedPoint.lon - 1,
          selectedPoint.lon + 1
        );

        if (isMounted) {
          setStrikes(lightningStrikes);
        }

        // Fetch nowcast
        try {
          const nowcastData = await weatherCache.getNowcast(selectedPoint.lat, selectedPoint.lon);
          if (isMounted && nowcastData.minutely_10.time && nowcastData.minutely_10.time.length > 0) {
            // Extract current/next nowcast data
            const now = new Date();
            const index = Math.min(0, nowcastData.minutely_10.time.length - 1);
            const precipitation = nowcastData.minutely_10.precipitation[index] || 0;

            // Determine rain intensity
            let rainIntensity: 'none' | 'light' | 'moderate' | 'heavy' = 'none';
            if (precipitation > 0 && precipitation <= 2) rainIntensity = 'light';
            else if (precipitation > 2 && precipitation <= 10) rainIntensity = 'moderate';
            else if (precipitation > 10) rainIntensity = 'heavy';

            const rainChance = Math.min(100, Math.round((precipitation / 5) * 100));

            setNowcast({
              time: nowcastData.minutely_10.time[index] || now.toISOString(),
              precipitation,
              rainIntensity,
              rainChance,
            });
          }
        } catch (error) {
          console.warn('Nowcast fetch error (non-blocking):', error);
          setNowcast(null);
        }
      } catch (error) {
        console.error('Error fetching storm alert data:', error);
      }
    };

    // Fetch immediately
    fetchData();

    // Refetch every 10 seconds for real-time updates
    const interval = setInterval(fetchData, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedPoint]);

  // Return null if no alert
  if (!alert) return null;

  return <StormAlertIndicator alert={alert} isDark={isDark} />;
});

export default StormAlertManager;
