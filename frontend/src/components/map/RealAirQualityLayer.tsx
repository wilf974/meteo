import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { useMapStore } from '../../store/mapStore';
import { getAirQualityAtTime, type AirQualityResponse } from '../../services/openMeteo.service';
import { weatherCache } from '../../services/weatherCache.service';

interface GridPoint {
  lat: number;
  lon: number;
  airQuality: AirQualityResponse | null;
}

export default function RealAirQualityLayer() {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const gridDataRef = useRef<GridPoint[]>([]);
  const { activeLayers, timelinePosition } = useMapStore();

  const aqLayer = activeLayers.find(l => l.id === 'airquality');
  const isEnabled = aqLayer?.enabled || false;
  const opacity = aqLayer?.opacity || 1;

  useEffect(() => {
    if (!isEnabled) return;

    let debounceTimer: NodeJS.Timeout;

    const fetchGridData = async () => {
      try {
        const bounds = map.getBounds();
        const zoom = map.getZoom();
        // Reduced grid size for better performance
        const gridSize = zoom > 10 ? 6 : zoom > 7 ? 5 : 4;

        const latStep = (bounds.getNorth() - bounds.getSouth()) / gridSize;
        const lonStep = (bounds.getEast() - bounds.getWest()) / gridSize;

        console.log('🌫️ Fetching air quality grid:', gridSize, 'x', gridSize);

        const newGridData: GridPoint[] = [];
        const promises: Promise<void>[] = [];

        for (let i = 0; i <= gridSize; i++) {
          for (let j = 0; j <= gridSize; j++) {
            const lat = bounds.getSouth() + i * latStep;
            const lon = bounds.getWest() + j * lonStep;

            const promise = weatherCache.getAirQuality(lat, lon)
              .then(airQuality => {
                newGridData.push({ lat, lon, airQuality });
              })
              .catch(error => {
                console.warn('🌫️ Error fetching air quality:', error);
                newGridData.push({ lat, lon, airQuality: null });
              });

            promises.push(promise);
          }
        }

        await Promise.all(promises);
        gridDataRef.current = newGridData;
        console.log('🌫️ Air quality grid data loaded:', newGridData.length, 'points');
      } catch (error) {
        console.error('🌫️ Error fetching air quality grid data:', error);
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

      // Use 'multiply' blend mode for air quality overlays
      ctx.globalCompositeOperation = 'multiply';

      // Draw air quality zones
      gridDataRef.current.forEach((point) => {
        if (!point.airQuality) return;

        const aqData = getAirQualityAtTime(point.airQuality, selectedTime);
        if (!aqData) return;

        const latLng = { lat: point.lat, lng: point.lon };
        const screenPoint = map.latLngToContainerPoint(latLng);

        const aqi = aqData.aqi;
        const color = getAQIColor(aqi);

        // Large zones for smooth blending
        const zoneSize = 350;

        // Opacity scaling based on AQI severity
        const baseAlpha = getAQIOpacity(aqi);
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

    // Throttled animation: 15fps instead of 60fps for better performance
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
        zIndex: 400,
      }}
    />
  );
}

/**
 * Get AQI color based on European AQI scale
 * 0-20: Green (Excellent)
 * 21-40: Yellow (Good)
 * 41-60: Orange (Moderate)
 * 61-80: Red (Poor)
 * 81-100: Dark Red (Very Poor)
 * >100: Purple (Extremely Poor)
 */
function getAQIColor(aqi: number): { r: number; g: number; b: number } {
  if (aqi <= 20) {
    // Green - Excellent
    return { r: 16, g: 185, b: 129 };
  } else if (aqi <= 40) {
    // Yellow-Green - Good
    return { r: 132, g: 204, b: 22 };
  } else if (aqi <= 60) {
    // Orange-Yellow - Moderate
    return { r: 245, g: 158, b: 11 };
  } else if (aqi <= 80) {
    // Orange-Red - Poor
    return { r: 249, g: 115, b: 22 };
  } else if (aqi <= 100) {
    // Red - Very Poor
    return { r: 239, g: 68, b: 68 };
  } else {
    // Dark Red / Purple - Extremely Poor
    return { r: 153, g: 27, b: 27 };
  }
}

/**
 * Get opacity multiplier based on AQI severity
 * Higher AQI = more visible
 */
function getAQIOpacity(aqi: number): number {
  if (aqi <= 20) return 0.1; // Very subtle for good air
  if (aqi <= 40) return 0.15;
  if (aqi <= 60) return 0.2;
  if (aqi <= 80) return 0.25;
  if (aqi <= 100) return 0.3;
  return 0.35; // More visible for very poor air
}
