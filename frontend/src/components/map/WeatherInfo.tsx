import { useEffect, useState, memo, useCallback, useMemo } from 'react';
import { useWeatherInfoState } from '../../store/mapSelectors';
import { weatherCache } from '../../services/weatherCache.service';
import { getWeatherAtTime, type WeatherData } from '../../services/openMeteo.service';
import { useFavoritesStore } from '../../store/favoritesStore';
import { useThemeStore } from '../../store/themeStore';
import { X, Thermometer, Wind, Droplets, Gauge, Cloud, Compass, Eye, Star } from 'lucide-react';
import toast from 'react-hot-toast';

function getWeatherDescription(weatherCode: number): string {
  // WMO Weather interpretation codes
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

function getWindDirection(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
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

const WeatherInfo = memo(function WeatherInfo() {
  const { selectedPoint, setSelectedPoint, timelinePosition } = useWeatherInfoState();
  const { addFavorite, isFavorite, getFavoriteByCoords } = useFavoritesStore();
  const { effectiveTheme } = useThemeStore();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isDark = effectiveTheme === 'dark';

  // Memoize selected time to avoid recreating Date object
  const selectedTime = useMemo(() => new Date(timelinePosition), [timelinePosition]);

  // Check if current location is favorite
  const isLocationFavorite = useMemo(() => {
    if (!selectedPoint) return false;
    return isFavorite(selectedPoint.lat, selectedPoint.lon);
  }, [selectedPoint, isFavorite]);

  // Get location name from favorites or use coordinates
  const locationName = useMemo(() => {
    if (!selectedPoint) return null;
    const fav = getFavoriteByCoords(selectedPoint.lat, selectedPoint.lon);
    return fav ? fav.name : `${selectedPoint.lat.toFixed(4)}°N, ${selectedPoint.lon.toFixed(4)}°E`;
  }, [selectedPoint, getFavoriteByCoords]);

  // Memoize fetch function
  const fetchWeather = useCallback(async () => {
    if (!selectedPoint) return;

    setIsLoading(true);
    try {
      const forecast = await weatherCache.getForecast(
        selectedPoint.lat,
        selectedPoint.lon
      );
      const data = getWeatherAtTime(forecast, selectedTime);
      setWeatherData(data);
    } catch (error) {
      console.error('Error fetching weather:', error);
      setWeatherData(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPoint, selectedTime]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  // Memoize add to favorites handler
  const handleAddToFavorites = useCallback(() => {
    if (!selectedPoint) return;

    if (isLocationFavorite) {
      toast.error('Déjà dans les favoris', { icon: '⭐', duration: 2000 });
      return;
    }

    addFavorite({
      name: locationName || `Point (${selectedPoint.lat.toFixed(2)}°, ${selectedPoint.lon.toFixed(2)}°)`,
      lat: selectedPoint.lat,
      lon: selectedPoint.lon,
      country: 'Inconnu', // We don't have this info from click
      admin1: undefined,
    });

    toast.success('Ajouté aux favoris!', {
      icon: '⭐',
      duration: 3000,
    });
  }, [selectedPoint, isLocationFavorite, addFavorite, locationName]);

  if (!selectedPoint) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '90px',
        left: '20px',
        zIndex: 1000,
        backgroundColor: isDark ? 'rgba(30, 30, 40, 0.98)' : 'rgba(255, 255, 255, 0.98)',
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
        width: '340px',
        maxWidth: 'calc(100vw - 40px)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
        }}
      >
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: isDark ? '#f1f5f9' : '#111827',
            marginBottom: '4px'
          }}>
            Météo locale
          </h3>
          <p style={{
            fontSize: '12px',
            color: isDark ? '#94a3b8' : '#6b7280'
          }}>
            {locationName}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Favorite button */}
          <button
            onClick={handleAddToFavorites}
            disabled={isLocationFavorite}
            title={isLocationFavorite ? 'Déjà dans les favoris' : 'Ajouter aux favoris'}
            style={{
              background: isLocationFavorite
                ? (isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)')
                : 'none',
              border: isLocationFavorite
                ? '1px solid #f59e0b'
                : `1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
              cursor: isLocationFavorite ? 'default' : 'pointer',
              color: isLocationFavorite ? '#f59e0b' : (isDark ? '#cbd5e1' : '#9ca3af'),
              padding: '8px',
              borderRadius: '8px',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              if (!isLocationFavorite) {
                e.currentTarget.style.backgroundColor = isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)';
                e.currentTarget.style.borderColor = '#f59e0b';
                e.currentTarget.style.color = '#f59e0b';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLocationFavorite) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.color = isDark ? '#cbd5e1' : '#9ca3af';
              }
            }}
          >
            <Star
              style={{ width: '18px', height: '18px' }}
              fill={isLocationFavorite ? '#f59e0b' : 'none'}
            />
          </button>

          {/* Close button */}
          <button
            onClick={() => setSelectedPoint(null)}
            style={{
              background: 'none',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
              cursor: 'pointer',
              color: isDark ? '#cbd5e1' : '#9ca3af',
              padding: '8px',
              borderRadius: '8px',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.borderColor = '#ef4444';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.color = isDark ? '#cbd5e1' : '#9ca3af';
            }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '20px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
            <div style={{ fontSize: '14px' }}>Chargement...</div>
          </div>
        ) : weatherData ? (
          <>
            {/* Main Weather */}
            <div
              style={{
                textAlign: 'center',
                padding: '20px 0',
                borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                marginBottom: '16px',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>
                {getWeatherEmoji(weatherData.weatherCode)}
              </div>
              <div style={{ fontSize: '42px', fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}>
                {weatherData.temperature.toFixed(1)}°C
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
                {getWeatherDescription(weatherData.weatherCode)}
              </div>
            </div>

            {/* Weather Details Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}
            >
              {/* Wind */}
              <div
                style={{
                  padding: '12px',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  borderRadius: '10px',
                  borderLeft: '3px solid #3b82f6',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Wind style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
                  <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Vent</span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>
                  {weatherData.windSpeed.toFixed(0)} km/h
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                  {getWindDirection(weatherData.windDirection)} ({weatherData.windDirection}°)
                </div>
              </div>

              {/* Humidity */}
              <div
                style={{
                  padding: '12px',
                  backgroundColor: 'rgba(6, 182, 212, 0.08)',
                  borderRadius: '10px',
                  borderLeft: '3px solid #06b6d4',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Droplets style={{ width: '16px', height: '16px', color: '#06b6d4' }} />
                  <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Humidité</span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>
                  {weatherData.humidity}%
                </div>
              </div>

              {/* Pressure */}
              <div
                style={{
                  padding: '12px',
                  backgroundColor: 'rgba(168, 85, 247, 0.08)',
                  borderRadius: '10px',
                  borderLeft: '3px solid #a855f7',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Gauge style={{ width: '16px', height: '16px', color: '#a855f7' }} />
                  <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Pression</span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>
                  {weatherData.pressure.toFixed(0)} hPa
                </div>
              </div>

              {/* Cloud Cover */}
              <div
                style={{
                  padding: '12px',
                  backgroundColor: 'rgba(156, 163, 175, 0.08)',
                  borderRadius: '10px',
                  borderLeft: '3px solid #9ca3af',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Cloud style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
                  <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Nuages</span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>
                  {weatherData.cloudCover}%
                </div>
              </div>
            </div>

            {/* Precipitation Info */}
            {(weatherData.precipitation > 0 || weatherData.rain > 0 || weatherData.showers > 0) && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '12px',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  borderRadius: '10px',
                  borderLeft: '3px solid #3b82f6',
                }}
              >
                <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', marginBottom: '6px' }}>
                  💧 Précipitations
                </div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>
                  {(weatherData.precipitation + weatherData.rain + weatherData.showers).toFixed(1)} mm/h
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>❌</div>
            <div style={{ fontSize: '14px' }}>Aucune donnée disponible</div>
          </div>
        )}
      </div>
    </div>
  );
});

export default WeatherInfo;
