import { memo } from 'react';
import { Cloud, Droplets, Wind, Sun, Moon } from 'lucide-react';
import { type ForecastResponse } from '../../services/openMeteo.service';

export interface DailyForecast {
  date: string; // YYYY-MM-DD
  minTemp: number;
  maxTemp: number;
  avgTemp: number;
  weatherCode: number;
  precipitationSum: number;
  rainChance: number;
  avgWindSpeed: number;
  sunrise?: string; // HH:MM
  sunset?: string; // HH:MM
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

function getWeatherDesc(weatherCode: number): string {
  const codes: { [key: number]: string } = {
    0: 'Dégagé',
    1: 'Princ. dégagé',
    2: 'Nuageux',
    3: 'Couvert',
    45: 'Brouillard',
    51: 'Bruine',
    61: 'Pluie',
    71: 'Neige',
    80: 'Averses',
    95: 'Orage',
  };
  return codes[weatherCode] || 'Indéterminé';
}

interface DailyForecastPanelProps {
  forecast: ForecastResponse | null;
  isDark: boolean;
}

export const DailyForecastPanel = memo(function DailyForecastPanel({
  forecast,
  isDark,
}: DailyForecastPanelProps) {
  if (!forecast || !forecast.hourly || !forecast.hourly.time) return null;

  // Extract daily forecasts from hourly data
  const dailyForecasts: Map<string, DailyForecast> = new Map();

  forecast.hourly.time.forEach((time, index) => {
    const date = time.split('T')[0]; // YYYY-MM-DD
    if (!dailyForecasts.has(date)) {
      dailyForecasts.set(date, {
        date,
        minTemp: forecast.hourly.temperature_2m[index],
        maxTemp: forecast.hourly.temperature_2m[index],
        avgTemp: 0,
        weatherCode: forecast.hourly.weather_code[index],
        precipitationSum: 0,
        rainChance: 0,
        avgWindSpeed: 0,
      });
    }

    const daily = dailyForecasts.get(date)!;
    daily.minTemp = Math.min(daily.minTemp, forecast.hourly.temperature_2m[index]);
    daily.maxTemp = Math.max(daily.maxTemp, forecast.hourly.temperature_2m[index]);
    daily.avgTemp += forecast.hourly.temperature_2m[index];
    daily.precipitationSum += forecast.hourly.precipitation[index];
    daily.avgWindSpeed += forecast.hourly.wind_speed_10m[index];
    daily.rainChance = Math.max(
      daily.rainChance,
      forecast.hourly.precipitation[index] > 0 ? 100 : 0
    );
  });

  // Average temps and wind
  dailyForecasts.forEach((daily, date) => {
    const hoursInDay = forecast.hourly.time.filter(t => t.startsWith(date)).length;
    if (hoursInDay > 0) {
      daily.avgTemp = daily.avgTemp / hoursInDay;
      daily.avgWindSpeed = daily.avgWindSpeed / hoursInDay;
      daily.rainChance = Math.min(100, Math.round((daily.precipitationSum / 2) * 100));
    }
  });

  const dailyArray = Array.from(dailyForecasts.values()).slice(0, 7); // Next 7 days
  if (dailyArray.length === 0) return null;

  return (
    <div
      style={{
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
      }}
    >
      <div
        style={{
          fontSize: '13px',
          fontWeight: '700',
          color: isDark ? '#94a3b8' : '#6b7280',
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        📅 Prévisions 7 jours
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: dailyArray.length > 5 ? 'repeat(auto-fit, minmax(90px, 1fr))' : 'repeat(auto-fit, minmax(100px, 1fr))',
          gap: '8px',
          maxHeight: dailyArray.length > 3 ? '200px' : 'auto',
          overflowY: dailyArray.length > 3 ? 'auto' : 'visible',
        }}
      >
        {dailyArray.map(daily => {
          const dateObj = new Date(daily.date);
          const dayName = dateObj.toLocaleDateString('fr-FR', { weekday: 'short' });
          const dayNum = dateObj.toLocaleDateString('fr-FR', { day: 'numeric' });

          return (
            <div
              key={daily.date}
              style={{
                padding: '10px',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                borderRadius: '8px',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = isDark ? 'rgba(102, 126, 234, 0.2)' : 'rgba(102, 126, 234, 0.1)';
                e.currentTarget.style.borderColor = '#667eea';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
                e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
              }}
            >
              {/* Date */}
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#667eea', marginBottom: '4px' }}>
                {dayName.toUpperCase()}
              </div>
              <div style={{ fontSize: '10px', color: isDark ? '#94a3b8' : '#9ca3af', marginBottom: '6px' }}>
                {dayNum}
              </div>

              {/* Weather emoji */}
              <div style={{ fontSize: '28px', marginBottom: '4px' }}>
                {getWeatherEmoji(daily.weatherCode)}
              </div>

              {/* Min/Max temps */}
              <div style={{ fontSize: '12px', fontWeight: '600', color: isDark ? '#f1f5f9' : '#111827', marginBottom: '2px' }}>
                {daily.maxTemp.toFixed(0)}° / {daily.minTemp.toFixed(0)}°
              </div>

              {/* Precipitation */}
              {daily.precipitationSum > 0 && (
                <div style={{ fontSize: '10px', color: '#3b82f6', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                  <Droplets style={{ width: '12px', height: '12px' }} />
                  <span>{daily.precipitationSum.toFixed(1)}mm</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default DailyForecastPanel;
