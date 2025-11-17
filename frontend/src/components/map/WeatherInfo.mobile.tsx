import { useEffect, useState, memo, useCallback, useMemo } from 'react';
import { useWeatherInfoState } from '../../store/mapSelectors';
import { weatherCache } from '../../services/weatherCache.service';
import { getWeatherAtTime, getAirQualityAtTime, type WeatherData, type ForecastResponse } from '../../services/openMeteo.service';
import { useFavoritesStore } from '../../store/favoritesStore';
import { useThemeStore } from '../../store/themeStore';
import { X, Thermometer, Wind, Droplets, Gauge, Cloud, Star, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * WeatherInfo COMPACT pour mobile
 * Style iOS/Android natif avec sections collapsibles
 */
const WeatherInfoMobile = memo(function WeatherInfoMobile() {
  const { selectedPoint, setSelectedPoint, timelinePosition } = useWeatherInfoState();
  const { addFavorite, isFavorite, getFavoriteByCoords } = useFavoritesStore();
  const { effectiveTheme } = useThemeStore();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const isDark = effectiveTheme === 'dark';

  const selectedTime = useMemo(() => new Date(timelinePosition), [timelinePosition]);
  const isLocationFavorite = useMemo(() => {
    if (!selectedPoint) return false;
    return isFavorite(selectedPoint.lat, selectedPoint.lon);
  }, [selectedPoint, isFavorite]);

  const locationName = useMemo(() => {
    if (!selectedPoint) return null;
    const fav = getFavoriteByCoords(selectedPoint.lat, selectedPoint.lon);
    return fav ? fav.name : `${selectedPoint.lat.toFixed(2)}°, ${selectedPoint.lon.toFixed(2)}°`;
  }, [selectedPoint, getFavoriteByCoords]);

  const fetchWeather = useCallback(async () => {
    if (!selectedPoint) return;
    setIsLoading(true);
    try {
      const [forecastData, airQualityData] = await Promise.all([
        weatherCache.getForecast(selectedPoint.lat, selectedPoint.lon),
        weatherCache.getAirQuality(selectedPoint.lat, selectedPoint.lon).catch(() => null),
      ]);

      const data = getWeatherAtTime(forecastData, selectedTime);
      if (airQualityData) {
        const airData = getAirQualityAtTime(airQualityData, selectedTime);
        if (airData) {
          data.pm10 = airData.pm10;
          data.pm25 = airData.pm25;
          data.aqi = airData.aqi;
        }
      }
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

  const handleAddToFavorites = useCallback(() => {
    if (!selectedPoint || isLocationFavorite) return;
    addFavorite({
      name: locationName || `Point (${selectedPoint.lat.toFixed(2)}°, ${selectedPoint.lon.toFixed(2)}°)`,
      lat: selectedPoint.lat,
      lon: selectedPoint.lon,
      country: 'Inconnu',
      admin1: undefined,
    });
    toast.success('Ajouté aux favoris!', { icon: '⭐' });
  }, [selectedPoint, isLocationFavorite, addFavorite, locationName]);

  const getWeatherEmoji = (code: number) => {
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 48) return '🌫️';
    if (code <= 67) return '🌧️';
    if (code <= 77) return '🌨️';
    if (code <= 82) return '🌦️';
    if (code >= 95) return '⛈️';
    return '🌤️';
  };

  const getWeatherDescription = (code: number) => {
    const codes: { [key: number]: string } = {
      0: 'Ciel dégagé', 1: 'Dégagé', 2: 'Nuageux', 3: 'Couvert',
      45: 'Brouillard', 51: 'Bruine', 61: 'Pluie légère', 63: 'Pluie',
      65: 'Pluie forte', 71: 'Neige légère', 95: 'Orage',
    };
    return codes[code] || 'Indéterminé';
  };

  if (!selectedPoint) return null;

  return (
    <div
      className="fixed left-2 right-2 z-[900]"
      style={{
        bottom: '72px', // Au-dessus de la timeline
        backgroundColor: isDark ? 'rgba(20, 20, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
        borderRadius: '20px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        maxHeight: 'calc(100vh - 160px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header compact */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' }}>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold truncate" style={{ color: isDark ? '#f1f5f9' : '#111827' }}>
            {locationName}
          </h3>
        </div>
        <div className="flex items-center gap-2 ml-2">
          <button
            onClick={handleAddToFavorites}
            disabled={isLocationFavorite}
            className="p-2 rounded-full active:scale-95 transition-transform"
          >
            <Star size={16} fill={isLocationFavorite ? '#f59e0b' : 'none'} color={isLocationFavorite ? '#f59e0b' : (isDark ? '#cbd5e1' : '#9ca3af')} />
          </button>
          <button onClick={() => setSelectedPoint(null)} className="p-2 rounded-full active:scale-95 transition-transform">
            <X size={16} style={{ color: isDark ? '#cbd5e1' : '#6b7280' }} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
        {isLoading ? (
          <div className="p-6 text-center" style={{ color: isDark ? '#94a3b8' : '#6b7280' }}>
            <div className="text-2xl mb-2">⏳</div>
            <div className="text-xs">Chargement...</div>
          </div>
        ) : weatherData ? (
          <div className="p-4">
            {/* Main weather compact */}
            <div className="flex items-center gap-4 mb-4">
              <div className="text-5xl">{getWeatherEmoji(weatherData.weatherCode)}</div>
              <div className="flex-1">
                <div className="text-3xl font-bold" style={{ color: isDark ? '#f1f5f9' : '#111827' }}>
                  {weatherData.temperature.toFixed(1)}°
                </div>
                <div className="text-sm" style={{ color: isDark ? '#94a3b8' : '#6b7280' }}>
                  {getWeatherDescription(weatherData.weatherCode)}
                </div>
              </div>
            </div>

            {/* Quick stats grid */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-2.5 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Wind size={14} color="#3b82f6" />
                  <span className="text-xs" style={{ color: isDark ? '#94a3b8' : '#6b7280' }}>Vent</span>
                </div>
                <div className="text-base font-bold" style={{ color: isDark ? '#f1f5f9' : '#111827' }}>
                  {weatherData.windSpeed.toFixed(0)} km/h
                </div>
              </div>

              <div className="p-2.5 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(6, 182, 212, 0.1)' : 'rgba(6, 182, 212, 0.08)' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Droplets size={14} color="#06b6d4" />
                  <span className="text-xs" style={{ color: isDark ? '#94a3b8' : '#6b7280' }}>Humidité</span>
                </div>
                <div className="text-base font-bold" style={{ color: isDark ? '#f1f5f9' : '#111827' }}>
                  {weatherData.humidity}%
                </div>
              </div>

              <div className="p-2.5 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(168, 85, 247, 0.1)' : 'rgba(168, 85, 247, 0.08)' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Gauge size={14} color="#a855f7" />
                  <span className="text-xs" style={{ color: isDark ? '#94a3b8' : '#6b7280' }}>Pression</span>
                </div>
                <div className="text-base font-bold" style={{ color: isDark ? '#f1f5f9' : '#111827' }}>
                  {weatherData.pressure.toFixed(0)} hPa
                </div>
              </div>

              <div className="p-2.5 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(156, 163, 175, 0.1)' : 'rgba(156, 163, 175, 0.08)' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Cloud size={14} color="#9ca3af" />
                  <span className="text-xs" style={{ color: isDark ? '#94a3b8' : '#6b7280' }}>Nuages</span>
                </div>
                <div className="text-base font-bold" style={{ color: isDark ? '#f1f5f9' : '#111827' }}>
                  {weatherData.cloudCover}%
                </div>
              </div>
            </div>

            {/* Expandable details */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between p-2.5 rounded-lg active:scale-[0.98] transition-transform"
              style={{
                backgroundColor: isDark ? 'rgba(102, 126, 234, 0.1)' : 'rgba(102, 126, 234, 0.08)',
                border: `1px solid ${isDark ? 'rgba(102, 126, 234, 0.2)' : 'rgba(102, 126, 234, 0.15)'}`,
              }}
            >
              <span className="text-xs font-medium" style={{ color: '#667eea' }}>
                {showDetails ? 'Masquer les détails' : 'Voir plus de détails'}
              </span>
              {showDetails ? <ChevronUp size={16} color="#667eea" /> : <ChevronDown size={16} color="#667eea" />}
            </button>

            {showDetails && (
              <div className="mt-3 space-y-2">
                <div className="p-2.5 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)' }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Thermometer size={14} color="#ef4444" />
                    <span className="text-xs" style={{ color: isDark ? '#94a3b8' : '#6b7280' }}>Ressenti</span>
                  </div>
                  <div className="text-base font-bold" style={{ color: isDark ? '#f1f5f9' : '#111827' }}>
                    {weatherData.apparentTemperature.toFixed(1)}°C
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center" style={{ color: isDark ? '#94a3b8' : '#6b7280' }}>
            <div className="text-2xl mb-2">❌</div>
            <div className="text-xs">Aucune donnée</div>
          </div>
        )}
      </div>
    </div>
  );
});

export default WeatherInfoMobile;
