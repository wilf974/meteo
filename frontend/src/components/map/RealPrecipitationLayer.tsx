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

        // Dense grid for smooth interpolation (12-15 points for professional look)
        const gridSize = zoom > 10 ? 15 : zoom > 7 ? 12 : 10;

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

      // Use source-over for direct rendering
      ctx.globalCompositeOperation = 'source-over';

      // Draw precipitation with SMOOTH gradient across entire canvas
      const gridSize = Math.sqrt(gridDataRef.current.length) - 1;
      const cellWidth = canvas.width / gridSize;
      const cellHeight = canvas.height / gridSize;

      // Draw each grid cell with bilinear interpolation
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const idx = i * (gridSize + 1) + j;
          const point = gridDataRef.current[idx];

          if (!point || !point.forecast) continue;

          const weatherData = getWeatherAtTime(point.forecast, selectedTime);
          if (!weatherData) continue;

          const totalPrecip = weatherData.precipitation + weatherData.rain + weatherData.showers;
          const hasSnow = weatherData.snowfall > 0;

          if (totalPrecip === 0 && !hasSnow) continue;

          // Get screen position
          const latLng = { lat: point.lat, lng: point.lon };
          const screenPoint = map.latLngToContainerPoint(latLng);

          // Draw smooth gradient in ALL directions (not just radial)
          const precip = totalPrecip;

          // Determine color based on intensity - SUBTLE like pro maps
          let r, g, b;
          if (precip < 0.5) {
            // Very light rain - Very light blue
            r = 180; g = 220; b = 255;
          } else if (precip < 2) {
            // Light rain - Light blue
            r = 120; g = 180; b = 255;
          } else if (precip < 5) {
            // Moderate rain - Medium blue
            r = 60; g = 140; b = 240;
          } else if (precip < 10) {
            // Heavy rain - Strong blue
            r = 20; g = 100; b = 200;
          } else {
            // Very heavy rain - Deep blue
            r = 0; g = 60; b = 160;
          }

          // VERY SUBTLE opacity (0.1-0.35 range) to keep map visible
          const intensity = Math.min(precip / 15, 1);
          const alpha = (0.1 + intensity * 0.25) * opacity;

          // Large smooth gradient for natural look
          const gradient = ctx.createRadialGradient(
            screenPoint.x, screenPoint.y, 0,
            screenPoint.x, screenPoint.y, cellWidth * 2.5
          );

          gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
          gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alpha * 0.6})`);
          gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(screenPoint.x, screenPoint.y, cellWidth * 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Spawn rain/snow drops based on intensity
          if (precip > 0.5) {
            const dropSpawnChance = Math.min(precip / 30, 0.15);
            if (Math.random() < dropSpawnChance) {
              const dropX = screenPoint.x + (Math.random() - 0.5) * cellWidth * 4;
              const dropY = screenPoint.y + (Math.random() - 0.5) * cellHeight * 4;

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
          }
        }
      }

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
          // Draw rain drop with streak (darker for better visibility)
          ctx.globalAlpha = drop.opacity * opacity;
          ctx.strokeStyle = 'rgba(100, 150, 220, 0.9)';
          ctx.lineWidth = 1.5;
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
