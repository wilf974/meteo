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

export default function RealPressureLayer() {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const gridDataRef = useRef<GridPoint[]>([]);
  const { activeLayers, timelinePosition } = useMapStore();

  const pressureLayer = activeLayers.find(l => l.id === 'pressure');
  const isEnabled = pressureLayer?.enabled || false;
  const opacity = pressureLayer?.opacity || 1;

  useEffect(() => {
    if (!isEnabled) return;

    let debounceTimer: NodeJS.Timeout;

    const fetchGridData = async () => {
      try {
        const bounds = map.getBounds();
        const zoom = map.getZoom();
        // Optimized grid size for performance
        const gridSize = zoom > 10 ? 6 : zoom > 7 ? 5 : 4;

        const latStep = (bounds.getNorth() - bounds.getSouth()) / gridSize;
        const lonStep = (bounds.getEast() - bounds.getWest()) / gridSize;

        console.log('📊 Fetching pressure grid:', gridSize, 'x', gridSize);

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
        console.log('📊 Pressure grid data loaded:', newGridData.length, 'points');
      } catch (error) {
        console.error('📊 Error fetching pressure grid data:', error);
      }
    };

    // Debounced fetch handler
    const debouncedFetch = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(fetchGridData, 300);
    };

    fetchGridData();

    map.on('moveend', debouncedFetch);
    map.on('zoomend', debouncedFetch);

    return () => {
      clearTimeout(debounceTimer);
      map.off('moveend', debouncedFetch);
      map.off('zoomend', debouncedFetch);
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

      // Use 'lighten' blend mode for better overlay
      ctx.globalCompositeOperation = 'lighten';

      // Draw pressure zones
      gridDataRef.current.forEach((point) => {
        if (!point.forecast) return;

        const weatherData = getWeatherAtTime(point.forecast, selectedTime);
        if (!weatherData) return;

        const latLng = { lat: point.lat, lng: point.lon };
        const screenPoint = map.latLngToContainerPoint(latLng);

        const pressure = weatherData.pressure;
        const color = getPressureColor(pressure);

        // Large zones for smooth blending
        const zoneSize = 350;

        // Subtle opacity
        const baseAlpha = 0.25;
        const alpha = baseAlpha * opacity;

        const gradient = ctx.createRadialGradient(
          screenPoint.x, screenPoint.y, 0,
          screenPoint.x, screenPoint.y, zoneSize
        );

        // Smooth gradient with exponential falloff
        gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`);
        gradient.addColorStop(0.3, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.7})`);
        gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.4})`);
        gradient.addColorStop(0.7, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.15})`);
        gradient.addColorStop(0.85, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.05})`);
        gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(
          screenPoint.x - zoneSize,
          screenPoint.y - zoneSize,
          zoneSize * 2,
          zoneSize * 2
        );
      });

      // Reset composite operation
      ctx.globalCompositeOperation = 'source-over';
    };

    // Throttled animation: 15fps for better performance
    let lastFrameTime = 0;
    const targetFPS = 15;
    const frameInterval = 1000 / targetFPS;

    const animate = (currentTime: number) => {
      animationRef.current = requestAnimationFrame(animate);

      const elapsed = currentTime - lastFrameTime;
      if (elapsed > frameInterval) {
        lastFrameTime = currentTime - (elapsed % frameInterval);
        draw();
      }
    };

    animationRef.current = requestAnimationFrame(animate);

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
        zIndex: 405,
      }}
    />
  );
}

/**
 * Get color for pressure value
 * Pressure ranges: 950-1050 hPa
 * - Low pressure (< 1000 hPa): Blue/Purple (storms, rain)
 * - Normal pressure (1000-1020 hPa): Green/Yellow
 * - High pressure (> 1020 hPa): Orange/Red (stable, clear weather)
 */
function getPressureColor(pressure: number): { r: number; g: number; b: number } {
  // Normalize pressure: 950-1050 hPa range
  const normalized = Math.max(0, Math.min(1, (pressure - 950) / 100));

  let r, g, b;

  if (normalized < 0.25) {
    // Very low pressure: Deep blue to purple (950-975 hPa)
    const t = normalized / 0.25;
    r = Math.floor(100 + t * 55);   // 100 -> 155
    g = Math.floor(50 + t * 100);   // 50 -> 150
    b = Math.floor(200 + t * 55);   // 200 -> 255
  } else if (normalized < 0.5) {
    // Low pressure: Purple to cyan (975-1000 hPa)
    const t = (normalized - 0.25) / 0.25;
    r = Math.floor(155 - t * 55);   // 155 -> 100
    g = Math.floor(150 + t * 105);  // 150 -> 255
    b = Math.floor(255);            // 255
  } else if (normalized < 0.75) {
    // Normal to high pressure: Cyan to yellow (1000-1025 hPa)
    const t = (normalized - 0.5) / 0.25;
    r = Math.floor(100 + t * 155);  // 100 -> 255
    g = Math.floor(255);            // 255
    b = Math.floor(255 - t * 155);  // 255 -> 100
  } else {
    // Very high pressure: Yellow to red (1025-1050 hPa)
    const t = (normalized - 0.75) / 0.25;
    r = Math.floor(255);            // 255
    g = Math.floor(255 - t * 105);  // 255 -> 150
    b = Math.floor(100 - t * 100);  // 100 -> 0
  }

  return { r, g, b };
}
