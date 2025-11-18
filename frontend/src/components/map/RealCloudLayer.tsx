import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { useMapStore } from '../../store/mapStore';
import { getWeatherAtTime } from '../../services/openMeteo.service';

export default function RealCloudLayer() {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const { activeLayers, timelinePosition, weatherGrid } = useMapStore();

  const cloudLayer = activeLayers.find(l => l.id === 'clouds');
  const isEnabled = cloudLayer?.enabled || false;
  const opacity = cloudLayer?.opacity || 1;

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

      // Use source-over for better visibility of cloud zones
      ctx.globalCompositeOperation = 'source-over';

      // Draw cloud cover zones
      weatherGrid.forEach((point) => {
        if (!point.forecast) return;

        const weatherData = getWeatherAtTime(point.forecast, selectedTime);
        if (!weatherData || weatherData.cloudCover < 10) return;

        const latLng = { lat: point.lat, lng: point.lon };
        const screenPoint = map.latLngToContainerPoint(latLng);

        const cloudCover = weatherData.cloudCover / 100; // 0-1

        // Large zones for smooth cloud display (Windy-style)
        const zoneSize = 550;

        // Higher opacity for better visibility (Windy range: 0.15-0.45)
        const baseAlpha = 0.15 + (Math.pow(cloudCover, 0.85) * 0.30); // Range 0.15-0.45
        const alpha = baseAlpha * opacity;

        const gradient = ctx.createRadialGradient(
          screenPoint.x, screenPoint.y, 0,
          screenPoint.x, screenPoint.y, zoneSize
        );

        // VIVID cloud colors based on cloud cover (white to dark gray with blue tint)
        let r, g, b;
        if (cloudCover < 0.3) {
          // Few clouds - Bright white with blue tint
          r = 240; g = 245; b = 250;
        } else if (cloudCover < 0.6) {
          // Moderate clouds - Light gray with blue tint
          r = 200; g = 210; b = 220;
        } else if (cloudCover < 0.85) {
          // Heavy clouds - Medium gray with blue tint
          r = 160; g = 170; b = 185;
        } else {
          // Overcast - Dark gray with blue tint
          r = 120; g = 130; b = 145;
        }

        // Professional gradient with clear cloud boundaries
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
        gradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${alpha * 0.8})`);
        gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alpha * 0.55})`);
        gradient.addColorStop(0.75, `rgba(${r}, ${g}, ${b}, ${alpha * 0.25})`);
        gradient.addColorStop(0.9, `rgba(${r}, ${g}, ${b}, ${alpha * 0.08})`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(
          screenPoint.x - zoneSize,
          screenPoint.y - zoneSize,
          zoneSize * 2,
          zoneSize * 2
        );

        // Add subtle contour for cloud definition (for heavy clouds)
        if (cloudCover > 0.5) {
          ctx.strokeStyle = `rgba(${r - 30}, ${g - 30}, ${b - 20}, ${alpha * 0.3})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(screenPoint.x, screenPoint.y, zoneSize * 0.55, 0, Math.PI * 2);
          ctx.stroke();
        }
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
        zIndex: 450,
      }}
    />
  );
}
