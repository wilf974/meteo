import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { useMapStore } from '../../store/mapStore';
import { getWeatherAtTime } from '../../services/openMeteo.service';

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
  const rainDropsRef = useRef<RainDrop[]>([]);
  const { activeLayers, timelinePosition, weatherGrid } = useMapStore();

  const precipLayer = activeLayers.find(l => l.id === 'precipitation');
  const isEnabled = precipLayer?.enabled || false;
  const opacity = precipLayer?.opacity || 1;

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

      if (weatherGrid.length === 0) return;

      const selectedTime = new Date(timelinePosition);
      const gridSize = Math.sqrt(weatherGrid.length) - 1;

      // Create a CONTINUOUS precipitation heatmap like Windy
      // Instead of drawing circles, we'll draw a smooth continuous field

      // Helper function to get precipitation at grid point
      const getPrecipAtGridPoint = (gx: number, gy: number) => {
        if (gx < 0 || gy < 0 || gx > gridSize || gy > gridSize) return 0;
        const idx = gy * (gridSize + 1) + gx;
        if (idx < 0 || idx >= weatherGrid.length) return 0;

        const point = weatherGrid[idx];
        if (!point || !point.forecast) return 0;

        const weatherData = getWeatherAtTime(point.forecast, selectedTime);
        if (!weatherData) return 0;

        return weatherData.precipitation + weatherData.rain + weatherData.showers;
      };

      // Draw continuous precipitation field using interpolation
      // Divide canvas into a dense grid of pixels for smooth rendering
      const resolution = 8; // Size of each "pixel" in the heatmap (smaller = more detail)

      for (let y = 0; y < canvas.height; y += resolution) {
        for (let x = 0; x < canvas.width; x += resolution) {
          // Convert screen position to grid coordinates
          const latLng = map.containerPointToLatLng([x + resolution / 2, y + resolution / 2]);
          const bounds = map.getBounds();

          const normLat = (latLng.lat - bounds.getSouth()) / (bounds.getNorth() - bounds.getSouth());
          const normLon = (latLng.lng - bounds.getWest()) / (bounds.getEast() - bounds.getWest());

          const gridX = normLon * gridSize;
          const gridY = normLat * gridSize;

          // Get the 4 surrounding grid points
          const x0 = Math.floor(gridX);
          const y0 = Math.floor(gridY);
          const x1 = x0 + 1;
          const y1 = y0 + 1;

          // Get precipitation values at the 4 corners
          const p00 = getPrecipAtGridPoint(x0, y0);
          const p10 = getPrecipAtGridPoint(x1, y0);
          const p01 = getPrecipAtGridPoint(x0, y1);
          const p11 = getPrecipAtGridPoint(x1, y1);

          // Bilinear interpolation
          const fx = gridX - x0;
          const fy = gridY - y0;

          const precip = (
            p00 * (1 - fx) * (1 - fy) +
            p10 * fx * (1 - fy) +
            p01 * (1 - fx) * fy +
            p11 * fx * fy
          );

          if (precip < 0.1) continue; // Skip very light precipitation

          // Windy-style color scheme
          let r, g, b;
          if (precip < 0.2) {
            r = 150; g = 200; b = 250;
          } else if (precip < 0.5) {
            r = 100; g = 180; b = 250;
          } else if (precip < 1) {
            r = 50; g = 200; b = 235;
          } else if (precip < 2) {
            r = 60; g = 220; b = 160;
          } else if (precip < 4) {
            r = 90; g = 230; b = 90;
          } else if (precip < 6) {
            r = 180; g = 240; b = 80;
          } else if (precip < 10) {
            r = 250; g = 240; b = 70;
          } else if (precip < 15) {
            r = 255; g = 180; b = 60;
          } else if (precip < 25) {
            r = 255; g = 120; b = 50;
          } else {
            r = 240; g = 50; b = 50;
          }

          // Higher opacity for visibility (Windy-style)
          const intensity = Math.min(precip / 15, 1);
          const alpha = (0.4 + intensity * 0.4) * opacity; // 0.4-0.8 range

          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.fillRect(x, y, resolution, resolution);

          // Spawn rain drops for visual effect (only occasionally)
          if (precip > 1 && Math.random() < 0.002) {
            rainDropsRef.current.push({
              x: x + Math.random() * resolution,
              y: y - 50 + Math.random() * 50,
              vy: 4 + Math.random() * 3,
              length: 8 + Math.random() * 6,
              opacity: 0.5 + Math.random() * 0.3,
              isSnow: false,
            });
          }
        }
      }

      // Draw and update rain drops
      ctx.save();
      rainDropsRef.current = rainDropsRef.current.filter((drop) => {
        drop.y += drop.vy;
        drop.opacity -= 0.008;

        if (drop.y > canvas.height + 10 || drop.opacity <= 0) {
          return false;
        }

        ctx.globalAlpha = drop.opacity * opacity;
        ctx.strokeStyle = 'rgba(100, 150, 220, 0.9)';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x, drop.y + drop.length);
        ctx.stroke();

        return true;
      });
      ctx.restore();

      // Limit drops for performance
      if (rainDropsRef.current.length > 300) {
        rainDropsRef.current = rainDropsRef.current.slice(-300);
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
  }, [map, isEnabled, opacity, timelinePosition, weatherGrid]);

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
