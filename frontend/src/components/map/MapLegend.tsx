import { useMapLegendState } from '../../store/mapSelectors';
import { useEffect, useState, memo, useCallback, useMemo } from 'react';
import { getWeatherAtTime } from '../../services/openMeteo.service';
import { weatherCache } from '../../services/weatherCache.service';

interface LayerStats {
  temperature?: { min: number; max: number };
  precipitation?: { max: number };
  wind?: { max: number };
  clouds?: { coverage: number };
}

const MapLegend = memo(function MapLegend() {
  const { activeLayers, center, timelinePosition } = useMapLegendState();
  const [stats, setStats] = useState<LayerStats>({});
  const [isMinimized, setIsMinimized] = useState(false);

  // Memoize enabled layers to avoid recalculation
  const enabledLayers = useMemo(() => activeLayers.filter(l => l.enabled), [activeLayers]);

  // Memoize selected time
  const selectedTime = useMemo(() => new Date(timelinePosition), [timelinePosition]);

  // Memoize toggle function
  const toggleMinimized = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);

  // Memoize fetch stats function
  const fetchStats = useCallback(async () => {
    if (enabledLayers.length === 0) return;

    try {
      const forecast = await weatherCache.getForecast(center[0], center[1]);
      const weatherData = getWeatherAtTime(forecast, selectedTime);

      if (!weatherData) return;

      const newStats: LayerStats = {};

      // Temperature stats
      if (enabledLayers.find(l => l.id === 'temperature')) {
        newStats.temperature = {
          min: Math.round(weatherData.temperature - 2),
          max: Math.round(weatherData.temperature + 2),
        };
      }

      // Precipitation stats
      if (enabledLayers.find(l => l.id === 'precipitation')) {
        const totalPrecip = weatherData.precipitation + weatherData.rain + weatherData.showers;
        if (totalPrecip > 0) {
          newStats.precipitation = { max: Number(totalPrecip.toFixed(1)) };
        }
      }

      // Wind stats
      if (enabledLayers.find(l => l.id === 'wind')) {
        if (weatherData.windSpeed > 1) {
          newStats.wind = { max: Math.round(weatherData.windSpeed) };
        }
      }

      // Cloud stats
      if (enabledLayers.find(l => l.id === 'clouds')) {
        if (weatherData.cloudCover > 10) {
          newStats.clouds = { coverage: Math.round(weatherData.cloudCover) };
        }
      }

      setStats(newStats);
    } catch (error) {
      console.error('Error fetching legend stats:', error);
    }
  }, [center, selectedTime, enabledLayers]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (enabledLayers.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '12px',
        padding: isMinimized ? '12px' : '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        zIndex: 600,
        minWidth: isMinimized ? 'auto' : '220px',
        maxWidth: '280px',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: isMinimized ? 0 : '12px',
          cursor: 'pointer',
        }}
        onClick={toggleMinimized}
      >
        <div
          style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>📊</span>
          {!isMinimized && <span>Légende</span>}
        </div>
        <button
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            color: '#6b7280',
            padding: '4px',
            lineHeight: 1,
          }}
        >
          {isMinimized ? '▲' : '▼'}
        </button>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Temperature */}
          {stats.temperature && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px',
                backgroundColor: 'rgba(255, 200, 100, 0.1)',
                borderRadius: '8px',
                borderLeft: '3px solid #ff9800',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>🌡️</span>
                <span style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                  Température
                </span>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#ff9800' }}>
                {stats.temperature.min}° - {stats.temperature.max}°C
              </span>
            </div>
          )}

          {/* Precipitation */}
          {stats.precipitation && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px',
                backgroundColor: 'rgba(100, 180, 255, 0.1)',
                borderRadius: '8px',
                borderLeft: '3px solid #3b82f6',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>💧</span>
                <span style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                  Précipitations
                </span>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#3b82f6' }}>
                {stats.precipitation.max} mm/h
              </span>
            </div>
          )}

          {/* Wind */}
          {stats.wind && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px',
                backgroundColor: 'rgba(200, 220, 255, 0.1)',
                borderRadius: '8px',
                borderLeft: '3px solid #6366f1',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>🌬️</span>
                <span style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                  Vent
                </span>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#6366f1' }}>
                {stats.wind.max} km/h
              </span>
            </div>
          )}

          {/* Clouds */}
          {stats.clouds && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px',
                backgroundColor: 'rgba(160, 160, 180, 0.1)',
                borderRadius: '8px',
                borderLeft: '3px solid #9ca3af',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>☁️</span>
                <span style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                  Nuages
                </span>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#6b7280' }}>
                {stats.clouds.coverage}%
              </span>
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              marginTop: '4px',
              paddingTop: '8px',
              borderTop: '1px solid rgba(0, 0, 0, 0.1)',
              fontSize: '11px',
              color: '#9ca3af',
              textAlign: 'center',
            }}
          >
            Données en temps réel
          </div>
        </div>
      )}
    </div>
  );
});

export default MapLegend;
