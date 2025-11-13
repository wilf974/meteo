import { memo, useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useThemeStore } from '../../store/themeStore';
import type { ForecastResponse } from '../../services/openMeteo.service';

interface WeatherChartProps {
  forecast: ForecastResponse;
}

interface ChartDataPoint {
  time: string;
  hour: string;
  temperature: number;
  precipitation: number;
  windSpeed: number;
  humidity: number;
}

const WeatherChart = memo(function WeatherChart({ forecast }: WeatherChartProps) {
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';

  // Prepare chart data for next 24 hours
  const chartData = useMemo<ChartDataPoint[]>(() => {
    const now = new Date();
    const data: ChartDataPoint[] = [];

    // Find current hour index
    let startIndex = 0;
    for (let i = 0; i < forecast.hourly.time.length; i++) {
      const forecastTime = new Date(forecast.hourly.time[i]);
      if (forecastTime >= now) {
        startIndex = i;
        break;
      }
    }

    // Get next 24 hours
    for (let i = startIndex; i < Math.min(startIndex + 24, forecast.hourly.time.length); i++) {
      const time = new Date(forecast.hourly.time[i]);
      data.push({
        time: forecast.hourly.time[i],
        hour: time.getHours() + 'h',
        temperature: Math.round(forecast.hourly.temperature_2m[i] * 10) / 10,
        precipitation: Math.round(forecast.hourly.precipitation[i] * 10) / 10,
        windSpeed: Math.round(forecast.hourly.wind_speed_10m[i]),
        humidity: forecast.hourly.relative_humidity_2m[i],
      });
    }

    return data;
  }, [forecast]);

  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: tooltipBg,
          border: `1px solid ${tooltipBorder}`,
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}>
          <p style={{
            fontSize: '12px',
            fontWeight: 'bold',
            marginBottom: '8px',
            color: isDark ? '#f1f5f9' : '#1e293b'
          }}>
            {payload[0].payload.hour}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{
              fontSize: '11px',
              color: entry.color,
              margin: '4px 0'
            }}>
              {entry.name}: {entry.value}{entry.unit || ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ marginTop: '16px' }}>
      {/* Temperature and Precipitation Chart */}
      <div style={{
        padding: '16px',
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
        borderRadius: '12px',
        marginBottom: '12px'
      }}>
        <h4 style={{
          fontSize: '13px',
          fontWeight: '600',
          marginBottom: '12px',
          color: isDark ? '#f1f5f9' : '#1e293b'
        }}>
          📊 Prévisions 24h - Température & Précipitations
        </h4>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="hour"
              stroke={textColor}
              style={{ fontSize: '11px' }}
              interval={2}
            />
            <YAxis
              yAxisId="temp"
              stroke={textColor}
              style={{ fontSize: '11px' }}
              tickFormatter={(value) => `${value}°`}
            />
            <YAxis
              yAxisId="precip"
              orientation="right"
              stroke={textColor}
              style={{ fontSize: '11px' }}
              tickFormatter={(value) => `${value}mm`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px' }}
              iconSize={10}
            />
            <Line
              yAxisId="temp"
              type="monotone"
              dataKey="temperature"
              stroke="#ff9800"
              strokeWidth={2}
              name="Temp."
              unit="°C"
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              yAxisId="precip"
              type="monotone"
              dataKey="precipitation"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Pluie"
              unit="mm"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Wind and Humidity Chart */}
      <div style={{
        padding: '16px',
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
        borderRadius: '12px'
      }}>
        <h4 style={{
          fontSize: '13px',
          fontWeight: '600',
          marginBottom: '12px',
          color: isDark ? '#f1f5f9' : '#1e293b'
        }}>
          💨 Prévisions 24h - Vent & Humidité
        </h4>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="hour"
              stroke={textColor}
              style={{ fontSize: '11px' }}
              interval={2}
            />
            <YAxis
              yAxisId="wind"
              stroke={textColor}
              style={{ fontSize: '11px' }}
              tickFormatter={(value) => `${value}km/h`}
            />
            <YAxis
              yAxisId="humidity"
              orientation="right"
              stroke={textColor}
              style={{ fontSize: '11px' }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px' }}
              iconSize={10}
            />
            <Area
              yAxisId="wind"
              type="monotone"
              dataKey="windSpeed"
              stroke="#6366f1"
              fill="#6366f1"
              fillOpacity={0.3}
              strokeWidth={2}
              name="Vent"
              unit=" km/h"
            />
            <Area
              yAxisId="humidity"
              type="monotone"
              dataKey="humidity"
              stroke="#06b6d4"
              fill="#06b6d4"
              fillOpacity={0.2}
              strokeWidth={2}
              name="Humidité"
              unit="%"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default WeatherChart;
