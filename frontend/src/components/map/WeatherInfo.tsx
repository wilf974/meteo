import { useEffect, useState, memo, useCallback, useMemo, lazy, Suspense } from 'react';
import { useWeatherInfoState } from '../../store/mapSelectors';
import { weatherCache } from '../../services/weatherCache.service';
import { getWeatherAtTime, getAirQualityAtTime, getNowcastAtTime, type WeatherData, type ForecastResponse, type AirQualityResponse, type NowcastResponse, type NowcastData } from '../../services/openMeteo.service';
import { useFavoritesStore } from '../../store/favoritesStore';
import { useThemeStore } from '../../store/themeStore';
import { X, Thermometer, Wind, Droplets, Gauge, Cloud, Compass, Eye, Star, TrendingUp, Sun, CloudRain, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { NowcastPanel } from './NowcastPanel';
import { DailyForecastPanel } from './DailyForecastPanel';

// Lazy load the chart component to reduce initial bundle size
const WeatherChart = lazy(() => import('./WeatherChart'));

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

function getUVDescription(uvIndex: number): string {
  if (uvIndex <= 2) return 'Faible';
  if (uvIndex <= 5) return 'Modéré';
  if (uvIndex <= 7) return 'Élevé';
  if (uvIndex <= 10) return 'Très élevé';
  return 'Extrême';
}

function getUVColor(uvIndex: number): string {
  if (uvIndex <= 2) return '#10b981'; // Green
  if (uvIndex <= 5) return '#f59e0b'; // Yellow
  if (uvIndex <= 7) return '#f97316'; // Orange
  if (uvIndex <= 10) return '#ef4444'; // Red
  return '#991b1b'; // Dark red
}

function getAQIDescription(aqi: number): string {
  if (aqi <= 20) return 'Excellente';
  if (aqi <= 40) return 'Bonne';
  if (aqi <= 60) return 'Moyenne';
  if (aqi <= 80) return 'Mauvaise';
  if (aqi <= 100) return 'Très mauvaise';
  return 'Extrêmement mauvaise';
}

function getAQIColor(aqi: number): string {
  if (aqi <= 20) return '#10b981'; // Green
  if (aqi <= 40) return '#84cc16'; // Lime
  if (aqi <= 60) return '#f59e0b'; // Yellow
  if (aqi <= 80) return '#f97316'; // Orange
  if (aqi <= 100) return '#ef4444'; // Red
  return '#991b1b'; // Dark red
}

function getHealthRecommendation(aqi: number): { text: string; icon: string } {
  if (aqi <= 20) {
    return {
      text: '✅ Excellente qualité de l\'air. Idéal pour toutes les activités en plein air.',
      icon: '✅'
    };
  }
  if (aqi <= 40) {
    return {
      text: '👍 Bonne qualité de l\'air. Les activités en plein air sont recommandées.',
      icon: '👍'
    };
  }
  if (aqi <= 60) {
    return {
      text: '⚠️ Qualité de l\'air modérée. Les groupes sensibles (enfants, personnes âgées) devraient réduire l\'activité intense.',
      icon: '⚠️'
    };
  }
  if (aqi <= 80) {
    return {
      text: '⚠️ Qualité de l\'air mauvaise. Les activités en plein air sont déconseillées pour les groupes sensibles.',
      icon: '⚠️'
    };
  }
  if (aqi <= 100) {
    return {
      text: '🚫 Très mauvaise qualité de l\'air. Tout le monde devrait réduire les activités en plein air.',
      icon: '🚫'
    };
  }
  return {
    text: '🚨 Qualité de l\'air extrêmement mauvaise. Restez à l\'intérieur, si possible avec filtration de l\'air.',
    icon: '🚨'
  };
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
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [airQuality, setAirQuality] = useState<AirQualityResponse | null>(null);
  const [nowcast, setNowcast] = useState<NowcastData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showChart, setShowChart] = useState(false);

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
      // Fetch weather, air quality, and nowcast in parallel
      let forecastData: ForecastResponse | null = null;
      let airQualityData: AirQualityResponse | null = null;
      let nowcastData: NowcastResponse | null = null;
      let weatherError: Error | null = null;
      let aqError: Error | null = null;
      let nowcastError: Error | null = null;

      try {
        forecastData = await weatherCache.getForecast(selectedPoint.lat, selectedPoint.lon);
      } catch (error) {
        console.error('Error fetching weather forecast:', error);
        weatherError = error instanceof Error ? error : new Error('Failed to fetch weather');
      }

      try {
        airQualityData = await weatherCache.getAirQuality(selectedPoint.lat, selectedPoint.lon);
      } catch (error) {
        console.warn('Error fetching air quality:', error);
        aqError = error instanceof Error ? error : new Error('Failed to fetch air quality');
        // Air quality is optional, don't fail completely
      }

      try {
        nowcastData = await weatherCache.getNowcast(selectedPoint.lat, selectedPoint.lon);
      } catch (error) {
        console.warn('Error fetching nowcast:', error);
        nowcastError = error instanceof Error ? error : new Error('Failed to fetch nowcast');
        // Nowcast is optional, don't fail completely
      }

      // If we couldn't fetch weather at all, we can't show anything
      if (!forecastData) {
        console.error('Failed to fetch weather data:', weatherError?.message);
        setWeatherData(null);
        setForecast(null);
        setAirQuality(null);
        setNowcast(null);
        return;
      }

      const data = getWeatherAtTime(forecastData, selectedTime);

      // Merge air quality data if available
      if (airQualityData) {
        const airData = getAirQualityAtTime(airQualityData, selectedTime);
        if (airData) {
          data.pm10 = airData.pm10;
          data.pm25 = airData.pm25;
          data.no2 = airData.no2;
          data.o3 = airData.o3;
          data.so2 = airData.so2;
          data.co = airData.co;
          data.aqi = airData.aqi;
        }
      } else if (aqError) {
        // Log air quality fetch failure but continue with weather data
        console.warn('Air quality data unavailable, showing weather only:', aqError.message);
      }

      // Merge nowcast data if available
      let nowcastDataAtTime: NowcastData | null = null;
      if (nowcastData) {
        try {
          nowcastDataAtTime = getNowcastAtTime(nowcastData, selectedTime);
        } catch (error) {
          console.warn('Error processing nowcast data:', error);
        }
      } else if (nowcastError) {
        console.warn('Nowcast data unavailable:', nowcastError.message);
      }

      setWeatherData(data);
      setForecast(forecastData);
      setAirQuality(airQualityData);
      setNowcast(nowcastDataAtTime);
    } catch (error) {
      console.error('Unexpected error fetching weather:', error);
      setWeatherData(null);
      setForecast(null);
      setAirQuality(null);
      setNowcast(null);
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
        bottom: window.innerWidth < 768 ? '100px' : '90px',
        left: window.innerWidth < 768 ? '50%' : '20px',
        transform: window.innerWidth < 768 ? 'translateX(-50%)' : 'none',
        zIndex: 1000,
        backgroundColor: isDark ? 'rgba(30, 30, 40, 0.98)' : 'rgba(255, 255, 255, 0.98)',
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
        width: window.innerWidth < 768 ? 'calc(100vw - 24px)' : '340px',
        maxWidth: window.innerWidth < 768 ? '480px' : '340px',
        maxHeight: 'calc(100vh - 180px)',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: window.innerWidth < 768 ? '12px 16px' : '16px 20px',
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
              padding: window.innerWidth < 768 ? '10px' : '8px',
              minWidth: window.innerWidth < 768 ? '44px' : 'auto',
              minHeight: window.innerWidth < 768 ? '44px' : 'auto',
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
              padding: window.innerWidth < 768 ? '10px' : '8px',
              minWidth: window.innerWidth < 768 ? '44px' : 'auto',
              minHeight: window.innerWidth < 768 ? '44px' : 'auto',
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
      <div style={{ padding: window.innerWidth < 768 ? '16px' : '20px' }}>
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

            {/* Nowcast Panel - Next 15 minutes alert */}
            <NowcastPanel nowcast={nowcast} isDark={isDark} />

            {/* Daily Forecast Summary */}
            <DailyForecastPanel forecast={forecast} isDark={isDark} />

            {/* Premium Features Section */}
            <div
              style={{
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
              }}
            >
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: isDark ? '#94a3b8' : '#6b7280',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: '700'
                }}>PREMIUM</span>
                <span>Indices Avancés</span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                }}
              >
                {/* UV Index */}
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: `rgba(${getUVColor(weatherData.uvIndex)}, 0.08)`,
                    borderRadius: '10px',
                    borderLeft: `3px solid ${getUVColor(weatherData.uvIndex)}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Sun style={{ width: '16px', height: '16px', color: getUVColor(weatherData.uvIndex) }} />
                    <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>UV</span>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>
                    {weatherData.uvIndex.toFixed(1)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                    {getUVDescription(weatherData.uvIndex)}
                  </div>
                </div>

                {/* Apparent Temperature */}
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    borderRadius: '10px',
                    borderLeft: '3px solid #ef4444',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Thermometer style={{ width: '16px', height: '16px', color: '#ef4444' }} />
                    <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Ressenti</span>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>
                    {weatherData.apparentTemperature.toFixed(1)}°C
                  </div>
                </div>

                {/* Dew Point */}
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: 'rgba(14, 165, 233, 0.08)',
                    borderRadius: '10px',
                    borderLeft: '3px solid #0ea5e9',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <CloudRain style={{ width: '16px', height: '16px', color: '#0ea5e9' }} />
                    <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Rosée</span>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>
                    {weatherData.dewPoint.toFixed(1)}°C
                  </div>
                </div>

                {/* Visibility */}
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: 'rgba(34, 197, 94, 0.08)',
                    borderRadius: '10px',
                    borderLeft: '3px solid #22c55e',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Eye style={{ width: '16px', height: '16px', color: '#22c55e' }} />
                    <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Visibilité</span>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>
                    {(weatherData.visibility / 1000).toFixed(1)} km
                  </div>
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

            {/* Air Quality Section */}
            {weatherData.aqi > 0 && (
              <div
                style={{
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
                }}
              >
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: isDark ? '#94a3b8' : '#6b7280',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: '700'
                  }}>PREMIUM</span>
                  <span>Qualité de l'Air</span>
                </div>

                {/* AQI Score */}
                <div
                  style={{
                    padding: '16px',
                    backgroundColor: `${getAQIColor(weatherData.aqi)}15`,
                    borderRadius: '12px',
                    borderLeft: `4px solid ${getAQIColor(weatherData.aqi)}`,
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <AlertTriangle style={{ width: '18px', height: '18px', color: getAQIColor(weatherData.aqi) }} />
                    <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>Indice AQI Européen</span>
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: getAQIColor(weatherData.aqi), marginBottom: '4px' }}>
                    {weatherData.aqi}
                  </div>
                  <div style={{ fontSize: '13px', color: '#9ca3af', fontWeight: '500' }}>
                    {getAQIDescription(weatherData.aqi)}
                  </div>
                </div>

                {/* Pollutants Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '8px',
                  }}
                >
                  {/* PM2.5 */}
                  <div
                    style={{
                      padding: '10px',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>PM2.5</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: isDark ? '#f1f5f9' : '#111827' }}>
                      {weatherData.pm25.toFixed(1)}
                    </div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>µg/m³</div>
                  </div>

                  {/* PM10 */}
                  <div
                    style={{
                      padding: '10px',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>PM10</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: isDark ? '#f1f5f9' : '#111827' }}>
                      {weatherData.pm10.toFixed(1)}
                    </div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>µg/m³</div>
                  </div>

                  {/* NO2 */}
                  <div
                    style={{
                      padding: '10px',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>NO₂</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: isDark ? '#f1f5f9' : '#111827' }}>
                      {weatherData.no2.toFixed(1)}
                    </div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>µg/m³</div>
                  </div>

                  {/* O3 */}
                  <div
                    style={{
                      padding: '10px',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>O₃</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: isDark ? '#f1f5f9' : '#111827' }}>
                      {weatherData.o3.toFixed(1)}
                    </div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>µg/m³</div>
                  </div>

                  {/* SO2 */}
                  <div
                    style={{
                      padding: '10px',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>SO₂</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: isDark ? '#f1f5f9' : '#111827' }}>
                      {weatherData.so2.toFixed(1)}
                    </div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>µg/m³</div>
                  </div>

                  {/* CO */}
                  <div
                    style={{
                      padding: '10px',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>CO</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: isDark ? '#f1f5f9' : '#111827' }}>
                      {weatherData.co.toFixed(1)}
                    </div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>µg/m³</div>
                  </div>
                </div>

                {/* Health Recommendations */}
                <div
                  style={{
                    marginTop: '12px',
                    padding: '12px',
                    backgroundColor: `${getAQIColor(weatherData.aqi)}20`,
                    borderRadius: '10px',
                    borderLeft: `3px solid ${getAQIColor(weatherData.aqi)}`,
                  }}
                >
                  <div style={{ fontSize: '12px', color: isDark ? '#e0e7ff' : '#1e293b', fontWeight: '500', lineHeight: '1.5' }}>
                    {getHealthRecommendation(weatherData.aqi).text}
                  </div>
                </div>
              </div>
            )}

            {/* Toggle Chart Button */}
            <button
              onClick={() => setShowChart(!showChart)}
              style={{
                width: '100%',
                marginTop: '16px',
                padding: '12px',
                backgroundColor: isDark ? 'rgba(102, 126, 234, 0.15)' : 'rgba(102, 126, 234, 0.1)',
                border: `1px solid ${isDark ? 'rgba(102, 126, 234, 0.3)' : 'rgba(102, 126, 234, 0.2)'}`,
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                color: '#667eea',
                fontWeight: '600',
                fontSize: '14px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? 'rgba(102, 126, 234, 0.25)' : 'rgba(102, 126, 234, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? 'rgba(102, 126, 234, 0.15)' : 'rgba(102, 126, 234, 0.1)';
              }}
            >
              <TrendingUp style={{ width: '18px', height: '18px' }} />
              {showChart ? 'Masquer les graphiques' : 'Voir prévisions 24h'}
            </button>

            {/* Weather Chart */}
            {showChart && forecast && (
              <Suspense fallback={
                <div style={{
                  marginTop: '16px',
                  padding: '40px',
                  textAlign: 'center',
                  color: isDark ? '#94a3b8' : '#64748b'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    border: '3px solid',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderTopColor: '#667eea',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto'
                  }}></div>
                  <p style={{ marginTop: '12px', fontSize: '13px' }}>Chargement des graphiques...</p>
                </div>
              }>
                <WeatherChart forecast={forecast} />
              </Suspense>
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
