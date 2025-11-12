import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { useMapStore } from '../../store/mapStore';
import { getWeatherAtTime, type ForecastResponse } from '../../services/openMeteo.service';
import { weatherCache } from '../../services/weatherCache.service';

interface GridPoint {
  lat: number;
  lon: number;
  forecast: ForecastResponse | null;
}

export default function RealWindLayer() {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const gridDataRef = useRef<GridPoint[]>([]);
  const { activeLayers, timelinePosition } = useMapStore();

  const windLayer = activeLayers.find(l => l.id === 'wind');
  const isEnabled = windLayer?.enabled || false;
  const opacity = windLayer?.opacity || 1;

  useEffect(() => {
    if (!isEnabled) return;

    const fetchGridData = async () => {
      try {
        const bounds = map.getBounds();
        const zoom = map.getZoom();
        const gridSize = zoom > 8 ? 15 : zoom > 6 ? 10 : 8;

        const latStep = (bounds.getNorth() - bounds.getSouth()) / gridSize;
        const lonStep = (bounds.getEast() - bounds.getWest()) / gridSize;

        console.log('🌬️ Fetching wind grid:', gridSize, 'x', gridSize);

        const newGridData: GridPoint[] = [];
        const promises: Promise<void>[] = [];

        for (let i = 0; i <= gridSize; i++) {
          for (let j = 0; j <= gridSize; j++) {
            const lat = bounds.getSouth() + i * latStep;
            const lon = bounds.getWest() + j * lonStep;

            const promise = weatherCache.getForecast(lat, lon)
              .then(forecast => {
                newGridData.push({ lat, lon, forecast });
              })
              .catch(error => {
                newGridData.push({ lat, lon, forecast: null });
              });

            promises.push(promise);
          }
        }

        await Promise.all(promises);
        gridDataRef.current = newGridData;
        console.log('🌬️ Grid data loaded:', newGridData.length, 'points');
      } catch (error) {
        console.error('🌬️ Error fetching grid data:', error);
      }
    };

    fetchGridData();

    map.on('moveend', fetchGridData);
    map.on('zoomend', fetchGridData);

    return () => {
      map.off('moveend', fetchGridData);
      map.off('zoomend', fetchGridData);
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
    };

    resizeCanvas();
    map.on('resize', resizeCanvas);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (gridDataRef.current.length === 0) return;

      const selectedTime = new Date(timelinePosition);

      // Draw wind arrows at each grid point
      gridDataRef.current.forEach((point) => {
        if (!point.forecast) return;

        const weatherData = getWeatherAtTime(point.forecast, selectedTime);
        if (!weatherData || weatherData.windSpeed < 1) return;

        const latLng = { lat: point.lat, lng: point.lon };
        const screenPoint = map.latLngToContainerPoint(latLng);

        const windSpeed = weatherData.windSpeed; // km/h
        const windDir = weatherData.windDirection; // degrees

        // Draw arrow
        drawWindArrow(
          ctx,
          screenPoint.x,
          screenPoint.y,
          windDir,
          windSpeed,
          opacity
        );
      });
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
        zIndex: 550,
      }}
    />
  );
}

function drawWindArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: number,
  speed: number,
  opacity: number
) {
  const angleRad = ((direction - 90) * Math.PI) / 180;
  const length = Math.min(35, 12 + speed / 2.5);

  // Color based on wind speed intensity with more natural palette
  const speedNormalized = Math.min(speed / 50, 1); // 0-1 scale
  const r = Math.floor(200 + 55 * speedNormalized);
  const g = Math.floor(220 - 60 * speedNormalized);
  const b = Math.floor(255 - 100 * speedNormalized);

  // Adaptive opacity based on wind speed
  const arrowOpacity = Math.min(0.6 + speedNormalized * 0.3, 0.9) * opacity;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angleRad);

  // Draw subtle shadow for better visibility
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${arrowOpacity})`;
  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${arrowOpacity})`;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Main line
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(length, 0);
  ctx.stroke();

  // Arrow head (smaller and more elegant)
  ctx.beginPath();
  ctx.moveTo(length, 0);
  ctx.lineTo(length - 8, -5);
  ctx.lineTo(length - 8, 5);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}
