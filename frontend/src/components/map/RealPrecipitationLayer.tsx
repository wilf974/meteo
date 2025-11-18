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

      // Use source-over for direct rendering
      ctx.globalCompositeOperation = 'source-over';

      // Draw precipitation with SMOOTH gradient across entire canvas
      const gridSize = Math.sqrt(weatherGrid.length) - 1;
      const cellWidth = canvas.width / gridSize;
      const cellHeight = canvas.height / gridSize;

      // Draw each grid cell with bilinear interpolation
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const idx = i * (gridSize + 1) + j;
          const point = weatherGrid[idx];

          if (!point || !point.forecast) continue;

          const weatherData = getWeatherAtTime(point.forecast, selectedTime);
          if (!weatherData) continue;

          const totalPrecip = weatherData.precipitation + weatherData.rain + weatherData.showers;
          const hasSnow = weatherData.snowfall > 0;

          if (totalPrecip === 0 && !hasSnow) continue;

          // Get screen position
          const latLng = { lat: point.lat, lng: point.lon };
          const screenPoint = map.latLngToContainerPoint(latLng);

          // Draw smooth gradient in ALL directions
          const precip = totalPrecip;

          // Windy-style color scheme: Light blue → Cyan → Green → Yellow → Orange → Red
          let r, g, b;
          if (precip < 0.2) {
            // Very light rain - Light blue
            r = 150; g = 200; b = 250;
          } else if (precip < 0.5) {
            // Light rain - Cyan-blue
            r = 100; g = 180; b = 250;
          } else if (precip < 1) {
            // Light-moderate rain - Cyan
            r = 50; g = 200; b = 235;
          } else if (precip < 2) {
            // Moderate rain - Cyan-green
            r = 60; g = 220; b = 160;
          } else if (precip < 4) {
            // Moderate-heavy rain - Green
            r = 90; g = 230; b = 90;
          } else if (precip < 6) {
            // Heavy rain - Yellow-green
            r = 180; g = 240; b = 80;
          } else if (precip < 10) {
            // Very heavy rain - Yellow
            r = 250; g = 240; b = 70;
          } else if (precip < 15) {
            // Intense rain - Orange
            r = 255; g = 180; b = 60;
          } else if (precip < 25) {
            // Extreme rain - Red-orange
            r = 255; g = 120; b = 50;
          } else {
            // Torrential rain - Red
            r = 240; g = 50; b = 50;
          }

          // Higher opacity for visibility (like Windy) - 0.3-0.7 range
          const intensity = Math.min(precip / 15, 1);
          const alpha = (0.3 + intensity * 0.4) * opacity;

          // Large smooth gradient for natural look (larger than before)
          const gradientRadius = cellWidth * 3.5;
          const gradient = ctx.createRadialGradient(
            screenPoint.x, screenPoint.y, 0,
            screenPoint.x, screenPoint.y, gradientRadius
          );

          gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
          gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${alpha * 0.7})`);
          gradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${alpha * 0.4})`);
          gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(screenPoint.x, screenPoint.y, gradientRadius, 0, Math.PI * 2);
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
