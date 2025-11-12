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

export default function RealTemperatureLayer() {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const gridDataRef = useRef<GridPoint[]>([]);
  const { activeLayers, timelinePosition } = useMapStore();

  const tempLayer = activeLayers.find(l => l.id === 'temperature');
  const isEnabled = tempLayer?.enabled || false;
  const opacity = tempLayer?.opacity || 1;

  useEffect(() => {
    if (!isEnabled) return;

    const fetchGridData = async () => {
      try {
        const bounds = map.getBounds();
        const zoom = map.getZoom();
        const gridSize = zoom > 8 ? 15 : zoom > 6 ? 10 : 8;

        const latStep = (bounds.getNorth() - bounds.getSouth()) / gridSize;
        const lonStep = (bounds.getEast() - bounds.getWest()) / gridSize;

        console.log('🌡️ Fetching temperature grid:', gridSize, 'x', gridSize);

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
        console.log('🌡️ Grid data loaded:', newGridData.length, 'points');
      } catch (error) {
        console.error('🌡️ Error fetching grid data:', error);
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

      // Draw temperature zones
      gridDataRef.current.forEach((point) => {
        if (!point.forecast) return;

        const weatherData = getWeatherAtTime(point.forecast, selectedTime);
        if (!weatherData) return;

        const latLng = { lat: point.lat, lng: point.lon };
        const screenPoint = map.latLngToContainerPoint(latLng);

        const temp = weatherData.temperature;
        const color = getTemperatureColor(temp);
        const zoneSize = 250; // MUCH larger zones

        // OPACITE MAXIMALE pour les températures
        const alpha = opacity * 0.85; // INCREASED to 0.85!

        const gradient = ctx.createRadialGradient(
          screenPoint.x, screenPoint.y, 0,
          screenPoint.x, screenPoint.y, zoneSize * 0.8
        );

        gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`);
        gradient.addColorStop(0.4, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.85})`);
        gradient.addColorStop(0.7, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.5})`);
        gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(
          screenPoint.x - zoneSize,
          screenPoint.y - zoneSize,
          zoneSize * 2,
          zoneSize * 2
        );
      });

      // Show temperature range
      const temps = gridDataRef.current
        .filter(p => p.forecast)
        .map(p => {
          const data = getWeatherAtTime(p.forecast!, selectedTime);
          return data ? data.temperature : null;
        })
        .filter(t => t !== null) as number[];

      if (temps.length > 0) {
        const minTemp = Math.min(...temps);
        const maxTemp = Math.max(...temps);

        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 180, 50);

        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(`🌡️ ${minTemp.toFixed(1)}°C - ${maxTemp.toFixed(1)}°C`, 20, 35);
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
        zIndex: 400,
      }}
    />
  );
}

function getTemperatureColor(temp: number): { r: number; g: number; b: number } {
  const normalized = Math.max(0, Math.min(1, (temp + 20) / 55));

  let r, g, b;

  if (normalized < 0.25) {
    const t = normalized / 0.25;
    r = Math.floor(50 + t * 50);
    g = Math.floor(100 + t * 100);
    b = Math.floor(200 + t * 55);
  } else if (normalized < 0.5) {
    const t = (normalized - 0.25) / 0.25;
    r = Math.floor(100 + t * 50);
    g = Math.floor(200 + t * 55);
    b = Math.floor(255 - t * 155);
  } else if (normalized < 0.75) {
    const t = (normalized - 0.5) / 0.25;
    r = Math.floor(150 + t * 105);
    g = Math.floor(255);
    b = Math.floor(100 - t * 100);
  } else {
    const t = (normalized - 0.75) / 0.25;
    r = Math.floor(255);
    g = Math.floor(255 - t * 105);
    b = Math.floor(0);
  }

  return { r, g, b };
}
