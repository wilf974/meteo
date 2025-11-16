import { memo, useEffect, useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useComparisonStore } from '../../store/comparisonStore';
import { useThemeStore } from '../../store/themeStore';
import { weatherCache } from '../../services/weatherCache.service';
import { getWeatherAtTime, type WeatherData, type ForecastResponse } from '../../services/openMeteo.service';
import toast from 'react-hot-toast';

interface ComparisonWeatherData {
  location: string;
  temperature: number;
  condition: string;
  windSpeed: number;
  humidity: number;
  precipitation: number;
  aqi?: number;
  emoji: string;
  lat: number;
  lon: number;
}

interface MultiLocationComparisonPanelProps {
  isDark: boolean;
  onAddLocation?: () => void;
}

export const MultiLocationComparisonPanel = memo(function MultiLocationComparisonPanel({
  isDark,
  onAddLocation,
}: MultiLocationComparisonPanelProps) {
  const { comparisonLocations, removeComparisonLocation, isComparisonMode } =
    useComparisonStore();
  const { effectiveTheme } = useThemeStore();
  const [weatherData, setWeatherData] = useState<Map<string, ComparisonWeatherData>>(
    new Map()
  );
  const [loading, setLoading] = useState(false);

  const isDarkMode = effectiveTheme === 'dark';
  const backgroundColor = isDarkMode ? 'rgba(30, 30, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)';
  const textColor = isDarkMode ? '#e0e7ff' : '#1e293b';
  const labelColor = isDarkMode ? '#94a3b8' : '#64748b';
  const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';

  // Fetch weather for all locations
  useEffect(() => {
    if (comparisonLocations.length === 0) {
      setWeatherData(new Map());
      return;
    }

    const fetchAllWeather = async () => {
      setLoading(true);
      const data = new Map<string, ComparisonWeatherData>();

      for (const location of comparisonLocations) {
        try {
          const forecast = await weatherCache.getForecast(location.lat, location.lon);
          const weather = getWeatherAtTime(forecast, new Date());

          data.set(location.id, {
            location: location.name,
            temperature: weather.temperature,
            condition: getWeatherDescription(weather.weatherCode),
            windSpeed: weather.windSpeed,
            humidity: weather.humidity,
            precipitation: weather.precipitation + weather.rain + weather.showers,
            aqi: weather.aqi || 0,
            emoji: getWeatherEmoji(weather.weatherCode),
            lat: location.lat,
            lon: location.lon,
          });
        } catch (error) {
          console.error(`Error fetching weather for ${location.name}:`, error);
          toast.error(`Erreur: ${location.name}`);
        }
      }

      setWeatherData(data);
      setLoading(false);
    };

    fetchAllWeather();
  }, [comparisonLocations]);

  if (!isComparisonMode || comparisonLocations.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: window.innerWidth < 768 ? '20px' : '20px',
        left: window.innerWidth < 768 ? '50%' : 'auto',
        right: window.innerWidth < 768 ? 'auto' : '20px',
        transform: window.innerWidth < 768 ? 'translateX(-50%)' : 'none',
        zIndex: 1000,
        maxWidth: window.innerWidth < 768 ? 'calc(100vw - 40px)' : '800px',
        maxHeight: '80vh',
        backgroundColor,
        borderRadius: '12px',
        border: `1px solid ${borderColor}`,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(10px)',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: `1px solid ${borderColor}`,
          position: 'sticky',
          top: 0,
          backgroundColor: isDarkMode ? 'rgba(20, 20, 30, 0.95)' : 'rgba(248, 250, 252, 0.95)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: textColor, margin: 0 }}>
            🗺️ Comparaison Météo
          </h3>
          <p style={{ fontSize: '12px', color: labelColor, margin: '4px 0 0 0' }}>
            {comparisonLocations.length} location{comparisonLocations.length > 1 ? 's' : ''}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {comparisonLocations.length < 6 && (
            <button
              onClick={onAddLocation}
              style={{
                background: 'none',
                border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
                cursor: 'pointer',
                color: isDarkMode ? '#cbd5e1' : '#9ca3af',
                padding: '8px',
                borderRadius: '8px',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode
                  ? 'rgba(34, 197, 94, 0.2)'
                  : 'rgba(34, 197, 94, 0.1)';
                e.currentTarget.style.borderColor = '#22c55e';
                e.currentTarget.style.color = '#22c55e';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = isDarkMode
                  ? 'rgba(255, 255, 255, 0.2)'
                  : 'rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.color = isDarkMode ? '#cbd5e1' : '#9ca3af';
              }}
              title="Ajouter une location"
            >
              <Plus style={{ width: '18px', height: '18px' }} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: labelColor }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>⏳</div>
            <div style={{ fontSize: '13px' }}>Chargement données...</div>
          </div>
        ) : comparisonLocations.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: window.innerWidth < 768 ? '1fr' : `repeat(auto-fit, minmax(200px, 1fr))`,
              gap: '12px',
            }}
          >
            {comparisonLocations.map((location) => {
              const data = weatherData.get(location.id);
              if (!data) return null;

              return (
                <div
                  key={location.id}
                  style={{
                    padding: '14px',
                    backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(241, 245, 249, 0.5)',
                    borderRadius: '8px',
                    border: `1px solid ${borderColor}`,
                    position: 'relative',
                  }}
                >
                  {/* Close button */}
                  <button
                    onClick={() => removeComparisonLocation(location.id)}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: labelColor,
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#ef4444';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = labelColor;
                    }}
                  >
                    <X style={{ width: '16px', height: '16px' }} />
                  </button>

                  {/* Location name */}
                  <div style={{ marginBottom: '10px', paddingRight: '20px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: textColor }}>
                      {location.name}
                    </div>
                    <div style={{ fontSize: '11px', color: labelColor, marginTop: '2px' }}>
                      {location.lat.toFixed(2)}°, {location.lon.toFixed(2)}°
                    </div>
                  </div>

                  {/* Temperature */}
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: textColor }}>
                      {data.emoji} {data.temperature.toFixed(1)}°C
                    </div>
                    <div style={{ fontSize: '11px', color: labelColor }}>
                      {data.condition}
                    </div>
                  </div>

                  {/* Details grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                    {/* Wind */}
                    <div style={{ fontSize: '11px' }}>
                      <div style={{ color: labelColor }}>💨 Vent</div>
                      <div style={{ color: textColor, fontWeight: '600' }}>
                        {data.windSpeed.toFixed(0)} km/h
                      </div>
                    </div>

                    {/* Humidity */}
                    <div style={{ fontSize: '11px' }}>
                      <div style={{ color: labelColor }}>💧 Hum.</div>
                      <div style={{ color: textColor, fontWeight: '600' }}>
                        {data.humidity}%
                      </div>
                    </div>

                    {/* Precipitation */}
                    <div style={{ fontSize: '11px' }}>
                      <div style={{ color: labelColor }}>🌧️ Pluie</div>
                      <div style={{ color: textColor, fontWeight: '600' }}>
                        {data.precipitation.toFixed(1)} mm/h
                      </div>
                    </div>

                    {/* AQI */}
                    {data.aqi > 0 && (
                      <div style={{ fontSize: '11px' }}>
                        <div style={{ color: labelColor }}>🌫️ AQI</div>
                        <div style={{ color: textColor, fontWeight: '600' }}>
                          {data.aqi}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: labelColor }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>📍</div>
            <div style={{ fontSize: '13px' }}>Aucune location en comparaison</div>
          </div>
        )}
      </div>
    </div>
  );
});

function getWeatherDescription(weatherCode: number): string {
  const codes: { [key: number]: string } = {
    0: 'Ciel dégagé',
    1: 'Principalement dégagé',
    2: 'Partiellement nuageux',
    3: 'Couvert',
    45: 'Brouillard',
    48: 'Brouillard givrant',
    51: 'Bruine légère',
    53: 'Bruine modérée',
    55: 'Bruine dense',
    61: 'Pluie légère',
    63: 'Pluie modérée',
    65: 'Pluie forte',
    71: 'Neige légère',
    73: 'Neige modérée',
    75: 'Neige forte',
    80: 'Averses légères',
    81: 'Averses modérées',
    82: 'Averses violentes',
    95: 'Orage',
    96: 'Orage avec grêle légère',
    99: 'Orage avec grêle forte',
  };
  return codes[weatherCode] || 'Indéterminé';
}

function getWeatherEmoji(weatherCode: number): string {
  if (weatherCode === 0) return '☀️';
  if (weatherCode <= 3) return '⛅';
  if (weatherCode <= 48) return '🌫️';
  if (weatherCode <= 57) return '🌧️';
  if (weatherCode <= 67) return '🌧️';
  if (weatherCode <= 77) return '🌨️';
  if (weatherCode <= 82) return '🌦️';
  if (weatherCode >= 95) return '⛈️';
  return '🌤️';
}

export default MultiLocationComparisonPanel;
