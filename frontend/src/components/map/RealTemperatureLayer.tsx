import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { useMapStore } from '../../store/mapStore';
import { getWeatherAtTime } from '../../services/openMeteo.service';

export default function RealTemperatureLayer() {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const { activeLayers, timelinePosition, weatherGrid } = useMapStore();

  const tempLayer = activeLayers.find(l => l.id === 'temperature');
  const isEnabled = tempLayer?.enabled || false;
  const opacity = tempLayer?.opacity || 1;

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

      // Use 'source-over' for direct rendering with better visibility
      ctx.globalCompositeOperation = 'source-over';

      // Draw temperature zones
      weatherGrid.forEach((point) => {
        if (!point.forecast) return;

        const weatherData = getWeatherAtTime(point.forecast, selectedTime);
        if (!weatherData) return;

        const latLng = { lat: point.lat, lng: point.lon };
        const screenPoint = map.latLngToContainerPoint(latLng);

        const temp = weatherData.temperature;
        const color = getTemperatureColor(temp);

        // Large zones for smooth gradients (Windy-style)
        const zoneSize = 600;

        // Higher opacity for visibility (like Windy) - 0.35 base
        const baseAlpha = 0.35;
        const alpha = baseAlpha * opacity;

        const gradient = ctx.createRadialGradient(
          screenPoint.x, screenPoint.y, 0,
          screenPoint.x, screenPoint.y, zoneSize
        );

        // Smooth gradient like Windy
        gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`);
        gradient.addColorStop(0.3, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.8})`);
        gradient.addColorStop(0.6, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.5})`);
        gradient.addColorStop(0.85, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.2})`);
        gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(
          screenPoint.x - zoneSize,
          screenPoint.y - zoneSize,
          zoneSize * 2,
          zoneSize * 2
        );
      });
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
