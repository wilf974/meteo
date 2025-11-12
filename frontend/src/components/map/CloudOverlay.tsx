import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { useMapStore } from '../../store/mapStore';
import { getForecast, getWeatherAtTime, type ForecastResponse } from '../../services/openMeteo.service';

interface Cloud {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
}

export default function CloudOverlay() {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const forecastRef = useRef<ForecastResponse | null>(null);
  const cloudsRef = useRef<Cloud[]>([]);
  const { activeLayers, timelinePosition } = useMapStore();

  const cloudLayer = activeLayers.find(l => l.id === 'clouds');
  const isEnabled = cloudLayer?.enabled || false;
  const opacity = cloudLayer?.opacity || 1;

  // Fetch weather data from Open-Meteo
  useEffect(() => {
    if (!isEnabled) return;

    const fetchData = async () => {
      try {
        const center = map.getCenter();
        console.log('☁️ CloudOverlay: Fetching data for', center.lat, center.lng);
        const forecast = await getForecast(center.lat, center.lng);
        forecastRef.current = forecast;
        console.log('☁️ CloudOverlay: Data loaded successfully');
      } catch (error) {
        console.error('☁️ CloudOverlay: Erreur Open-Meteo:', error);
      }
    };

    fetchData();
    map.on('moveend', fetchData);

    return () => {
      map.off('moveend', fetchData);
    };
  }, [map, isEnabled]);

  useEffect(() => {
    if (!isEnabled || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const resizeCanvas = () => {
      const container = map.getContainer();
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;

      // Initialize clouds
      cloudsRef.current = [];
      for (let i = 0; i < 15; i++) {
        cloudsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: 60 + Math.random() * 100,
          opacity: 0.3 + Math.random() * 0.4,
          speed: 0.2 + Math.random() * 0.5,
        });
      }
    };

    resizeCanvas();
    map.on('resize', resizeCanvas);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!forecastRef.current) return;

      const weatherData = getWeatherAtTime(forecastRef.current, new Date(timelinePosition));
      if (!weatherData) return;

      const cloudCover = weatherData.cloudCover; // 0-100%

      if (cloudCover > 0) {
        // Base overlay based on cloud coverage
        const baseAlpha = (cloudCover / 100) * 0.3 * opacity;
        ctx.fillStyle = `rgba(255, 255, 255, ${baseAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw individual cloud shapes for visual effect
        const numClouds = Math.floor((cloudCover / 100) * cloudsRef.current.length);

        cloudsRef.current.slice(0, numClouds).forEach(cloud => {
          // Move cloud slowly across screen
          cloud.x += cloud.speed;
          if (cloud.x > canvas.width + cloud.size) {
            cloud.x = -cloud.size;
            cloud.y = Math.random() * canvas.height;
          }

          drawCloud(ctx, cloud.x, cloud.y, cloud.size, cloud.opacity * opacity);
        });

        // Display cloud coverage info
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(canvas.width - 160, 60, 150, 40);

        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(`☁️ ${cloudCover.toFixed(0)}% couverture`, canvas.width - 150, 85);
      }
    };

    const animate = () => {
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      map.off('resize', resizeCanvas);
    };
  }, [map, isEnabled, opacity, timelinePosition]);

  if (!isEnabled) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 500,
      }}
    />
  );
}

function drawCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  opacity: number
) {
  ctx.save();
  ctx.globalAlpha = opacity;

  const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;

  // Draw multiple circles to create cloud shape
  ctx.beginPath();
  ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
  ctx.arc(x + size * 0.4, y - size * 0.2, size * 0.5, 0, Math.PI * 2);
  ctx.arc(x - size * 0.4, y - size * 0.1, size * 0.45, 0, Math.PI * 2);
  ctx.arc(x + size * 0.2, y + size * 0.2, size * 0.4, 0, Math.PI * 2);
  ctx.arc(x - size * 0.2, y + size * 0.15, size * 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
