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

interface RainDrop {
  x: number;
  y: number;
  vy: number;
  length: number;
  opacity: number;
  isSnow: boolean;
}

export default function RealPrecipitationLayer() {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const gridDataRef = useRef<GridPoint[]>([]);
  const rainDropsRef = useRef<RainDrop[]>([]);
  const { activeLayers, timelinePosition } = useMapStore();

  const precipLayer = activeLayers.find(l => l.id === 'precipitation');
  const isEnabled = precipLayer?.enabled || false;
  const opacity = precipLayer?.opacity || 1;

  // Fetch grid data for the visible map area
  useEffect(() => {
    if (!isEnabled) return;

    let debounceTimer: NodeJS.Timeout;

    const fetchGridData = async () => {
      try {
        const bounds = map.getBounds();
        const zoom = map.getZoom();

        // OPTIMIZED: Reduced grid size for better performance (max 6x6 = 36 points instead of 15x15 = 256)
        const gridSize = zoom > 10 ? 6 : zoom > 7 ? 5 : 4;

        const latStep = (bounds.getNorth() - bounds.getSouth()) / gridSize;
        const lonStep = (bounds.getEast() - bounds.getWest()) / gridSize;

        console.log('💧 Fetching precipitation grid:', gridSize, 'x', gridSize);

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
                console.error('Error fetching grid point:', lat, lon, error);
                newGridData.push({ lat, lon, forecast: null });
              });

            promises.push(promise);
          }
        }

        await Promise.all(promises);
        gridDataRef.current = newGridData;
        console.log('💧 Grid data loaded:', newGridData.length, 'points');
      } catch (error) {
        console.error('💧 Error fetching grid data:', error);
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

      if (gridDataRef.current.length === 0) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(canvas.width / 2 - 100, canvas.height / 2 - 25, 200, 50);
        ctx.fillStyle = 'white';
        ctx.font = '14px sans-serif';
        ctx.fillText('Chargement zones météo...', canvas.width / 2 - 90, canvas.height / 2 + 5);
        return;
      }

      const selectedTime = new Date(timelinePosition);

      // Count precipitation zones
      let precipCount = 0;

      // Use 'lighter' blend mode for smooth overlapping zones
      ctx.globalCompositeOperation = 'screen';

      // Draw precipitation zones using grid data
      gridDataRef.current.forEach((point) => {
        if (!point.forecast) return;

        const weatherData = getWeatherAtTime(point.forecast, selectedTime);
        if (!weatherData) return;

        // Calculate TOTAL precipitation from all sources
        const totalPrecip = weatherData.precipitation + weatherData.rain + weatherData.showers;
        const hasSnow = weatherData.snowfall > 0;

        if (totalPrecip > 0 || hasSnow) {
          precipCount++;
        }

        if (totalPrecip === 0 && !hasSnow) return;

        // Convert lat/lon to screen coordinates
        const latLng = { lat: point.lat, lng: point.lon };
        const screenPoint = map.latLngToContainerPoint(latLng);

        // Calculate precipitation intensity with exponential curve for better visualization
        const precip = totalPrecip;
        const intensity = Math.min(Math.pow(precip / 10, 0.7), 1); // Exponential curve for smoother gradation

        // Much larger zones for smoother blending
        const zoneSize = 350;

        // More subtle opacity curve based on intensity
        const baseAlpha = 0.15 + (intensity * 0.4); // Range 0.15-0.55 instead of 0.6-0.95
        const alpha = baseAlpha * opacity;

        // Create very smooth gradient with wider falloff
        const gradient = ctx.createRadialGradient(
          screenPoint.x, screenPoint.y, 0,
          screenPoint.x, screenPoint.y, zoneSize
        );

        // Determine color based on intensity
        let r, g, b;
        if (precip < 1) {
          // Light rain - Soft blue
          r = 120; g = 180; b = 255;
        } else if (precip < 5) {
          // Moderate rain - Medium blue
          r = 60; g = 130; b = 240;
        } else {
          // Heavy rain - Dark blue
          r = 30; g = 80; b = 200;
        }

        // Much smoother gradient with exponential falloff
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
        gradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${alpha * 0.7})`);
        gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alpha * 0.4})`);
        gradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${alpha * 0.15})`);
        gradient.addColorStop(0.85, `rgba(${r}, ${g}, ${b}, ${alpha * 0.05})`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(
          screenPoint.x - zoneSize,
          screenPoint.y - zoneSize,
          zoneSize * 2,
          zoneSize * 2
        );

        // Spawn rain/snow drops based on intensity
        const dropSpawnChance = Math.min(intensity * 0.4, 0.3);
        if (Math.random() < dropSpawnChance) {
          const dropX = screenPoint.x + (Math.random() - 0.5) * zoneSize * 1.5;
          const dropY = screenPoint.y + (Math.random() - 0.5) * zoneSize * 1.5;

          // Only spawn drops within canvas
          if (dropX >= 0 && dropX <= canvas.width && dropY >= -50 && dropY <= canvas.height / 2) {
            rainDropsRef.current.push({
              x: dropX,
              y: dropY,
              vy: hasSnow ? 1 + Math.random() * 1.5 : 4 + Math.random() * 3,
              length: hasSnow ? 3 : 8 + Math.random() * 6,
              opacity: 0.4 + Math.random() * 0.4,
              isSnow: hasSnow,
            });
          }
        }
      });

      // Reset composite operation for UI elements
      ctx.globalCompositeOperation = 'source-over';

      // Draw and update rain/snow drops
      ctx.save();
      rainDropsRef.current = rainDropsRef.current.filter((drop) => {
        // Update position
        drop.y += drop.vy;
        drop.opacity -= 0.008;

        // Remove if out of bounds
        if (drop.y > canvas.height + 10 || drop.opacity <= 0) {
          return false;
        }

        // Draw rain drop or snowflake
        if (drop.isSnow) {
          // Draw snowflake
          ctx.globalAlpha = drop.opacity * opacity;
          ctx.fillStyle = 'rgba(255, 255, 255, 1)';
          ctx.beginPath();
          ctx.arc(drop.x, drop.y, drop.length / 2, 0, Math.PI * 2);
          ctx.fill();

          // Add sparkle effect
          ctx.strokeStyle = 'rgba(200, 230, 255, 0.6)';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(drop.x - drop.length, drop.y);
          ctx.lineTo(drop.x + drop.length, drop.y);
          ctx.moveTo(drop.x, drop.y - drop.length);
          ctx.lineTo(drop.x, drop.y + drop.length);
          ctx.stroke();
        } else {
          // Draw rain drop with streak
          ctx.globalAlpha = drop.opacity * opacity;
          ctx.strokeStyle = 'rgba(150, 200, 255, 0.8)';
          ctx.lineWidth = 1.2;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x, drop.y + drop.length);
          ctx.stroke();
        }

        return true;
      });
      ctx.restore();

      // Limit total drops for performance
      if (rainDropsRef.current.length > 400) {
        rainDropsRef.current = rainDropsRef.current.slice(-400);
      }
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
        zIndex: 500,
      }}
    />
  );
}
