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

export default function RealCloudLayer() {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const gridDataRef = useRef<GridPoint[]>([]);
  const { activeLayers, timelinePosition } = useMapStore();

  const cloudLayer = activeLayers.find(l => l.id === 'clouds');
  const isEnabled = cloudLayer?.enabled || false;
  const opacity = cloudLayer?.opacity || 1;

  useEffect(() => {
    if (!isEnabled) return;

    const fetchGridData = async () => {
      try {
        const bounds = map.getBounds();
        const zoom = map.getZoom();
        const gridSize = zoom > 8 ? 15 : zoom > 6 ? 10 : 8;

        const latStep = (bounds.getNorth() - bounds.getSouth()) / gridSize;
        const lonStep = (bounds.getEast() - bounds.getWest()) / gridSize;

        console.log('☁️ Fetching cloud grid:', gridSize, 'x', gridSize);

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
        console.log('☁️ Grid data loaded:', newGridData.length, 'points');
      } catch (error) {
        console.error('☁️ Error fetching grid data:', error);
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

      // Draw cloud cover zones
      gridDataRef.current.forEach((point) => {
        if (!point.forecast) return;

        const weatherData = getWeatherAtTime(point.forecast, selectedTime);
        if (!weatherData || weatherData.cloudCover < 10) return;

        const latLng = { lat: point.lat, lng: point.lon };
        const screenPoint = map.latLngToContainerPoint(latLng);

        const cloudCover = weatherData.cloudCover / 100; // 0-1
        const zoneSize = 250; // MUCH larger zones

        // OPACITY MAXIMALE pour les nuages
        const alpha = Math.min(0.85, Math.max(0.45, cloudCover * 0.95)) * opacity; // Min 0.45, max 0.85!

        const gradient = ctx.createRadialGradient(
          screenPoint.x, screenPoint.y, 0,
          screenPoint.x, screenPoint.y, zoneSize * 0.8
        );

        if (cloudCover < 0.3) {
          // Few clouds - VERY white/bright
          gradient.addColorStop(0, `rgba(250, 250, 255, ${alpha})`);
          gradient.addColorStop(0.4, `rgba(235, 235, 245, ${alpha * 0.8})`);
          gradient.addColorStop(0.7, `rgba(220, 220, 235, ${alpha * 0.5})`);
          gradient.addColorStop(1, `rgba(200, 200, 220, 0)`);
        } else if (cloudCover < 0.7) {
          // Moderate clouds - STRONG gray
          gradient.addColorStop(0, `rgba(200, 200, 215, ${alpha})`);
          gradient.addColorStop(0.4, `rgba(180, 180, 200, ${alpha * 0.8})`);
          gradient.addColorStop(0.7, `rgba(160, 160, 185, ${alpha * 0.5})`);
          gradient.addColorStop(1, `rgba(140, 140, 170, 0)`);
        } else {
          // Heavy clouds - VERY DARK gray - TRES FONCE
          gradient.addColorStop(0, `rgba(140, 140, 160, ${alpha})`);
          gradient.addColorStop(0.4, `rgba(120, 120, 145, ${alpha * 0.8})`);
          gradient.addColorStop(0.7, `rgba(100, 100, 130, ${alpha * 0.5})`);
          gradient.addColorStop(1, `rgba(80, 80, 110, 0)`);
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(
          screenPoint.x - zoneSize,
          screenPoint.y - zoneSize,
          zoneSize * 2,
          zoneSize * 2
        );

        // Add visible border for clouds
        if (cloudCover > 0.5) {
          ctx.strokeStyle = `rgba(120, 120, 140, ${alpha * 0.6})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(screenPoint.x, screenPoint.y, zoneSize * 0.65, 0, Math.PI * 2);
          ctx.stroke();
        }
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
        zIndex: 450,
      }}
    />
  );
}
