import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { useMapStore } from '../../store/mapStore';
import { getWeatherAtTime } from '../../services/openMeteo.service';

interface WindParticle {
  x: number;
  y: number;
  age: number;
  maxAge: number;
  speed: number;
  direction: number;
}

/**
 * Professional Wind Layer with particle system (like Windy)
 * Uses thousands of animated particles that follow the wind field
 */
export default function RealWindLayer() {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<WindParticle[]>([]);
  const { activeLayers, timelinePosition, weatherGrid } = useMapStore();

  const windLayer = activeLayers.find(l => l.id === 'wind');
  const isEnabled = windLayer?.enabled || false;
  const opacity = windLayer?.opacity || 1;

  // Re-initialize particles when grid data changes
  useEffect(() => {
    if (weatherGrid.length > 0) {
      initializeParticles();
    }
  }, [weatherGrid]);

  // Initialize particle system (like Windy)
  const initializeParticles = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const numParticles = 3000; // Professional amount like Windy

    particlesRef.current = [];

    for (let i = 0; i < numParticles; i++) {
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        age: Math.random() * 100,
        maxAge: 50 + Math.random() * 50,
        speed: 0,
        direction: 0,
      });
    }
  };

  // Bilinear interpolation to get wind at any screen position
  const getWindAtPoint = (x: number, y: number, selectedTime: Date): { speed: number; direction: number } | null => {
    if (weatherGrid.length === 0) return null;

    // Convert screen coords to lat/lng
    const latLng = map.containerPointToLatLng([x, y]);

    // Find the 4 nearest grid points
    const bounds = map.getBounds();
    const gridSize = Math.sqrt(weatherGrid.length) - 1;

    const latRange = bounds.getNorth() - bounds.getSouth();
    const lonRange = bounds.getEast() - bounds.getWest();

    const normLat = (latLng.lat - bounds.getSouth()) / latRange;
    const normLon = (latLng.lng - bounds.getWest()) / lonRange;

    const gridX = normLon * gridSize;
    const gridY = normLat * gridSize;

    const x0 = Math.floor(gridX);
    const y0 = Math.floor(gridY);
    const x1 = Math.ceil(gridX);
    const y1 = Math.ceil(gridY);

    if (x0 < 0 || y0 < 0 || x1 > gridSize || y1 > gridSize) return null;

    // Get wind data from 4 corners
    const getGridWind = (gx: number, gy: number) => {
      const idx = gy * (gridSize + 1) + gx;
      if (idx < 0 || idx >= weatherGrid.length) return null;

      const point = weatherGrid[idx];
      if (!point || !point.forecast) return null;

      const weather = getWeatherAtTime(point.forecast, selectedTime);
      if (!weather) return null;

      return { speed: weather.windSpeed, direction: weather.windDirection };
    };

    const w00 = getGridWind(x0, y0);
    const w10 = getGridWind(x1, y0);
    const w01 = getGridWind(x0, y1);
    const w11 = getGridWind(x1, y1);

    if (!w00 && !w10 && !w01 && !w11) return null;

    // Bilinear interpolation
    const fx = gridX - x0;
    const fy = gridY - y0;

    const avgSpeed = (
      ((w00?.speed || 0) * (1 - fx) * (1 - fy)) +
      ((w10?.speed || 0) * fx * (1 - fy)) +
      ((w01?.speed || 0) * (1 - fx) * fy) +
      ((w11?.speed || 0) * fx * fy)
    );

    const avgDirection = (
      ((w00?.direction || 0) * (1 - fx) * (1 - fy)) +
      ((w10?.direction || 0) * fx * (1 - fy)) +
      ((w01?.direction || 0) * (1 - fx) * fy) +
      ((w11?.direction || 0) * fx * fy)
    );

    return { speed: avgSpeed, direction: avgDirection };
  };

  useEffect(() => {
    if (!isEnabled || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const resizeCanvas = () => {
      const container = map.getContainer();
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      initializeParticles();
    };

    resizeCanvas();
    map.on('resize', resizeCanvas);

    const draw = () => {
      const selectedTime = new Date(timelinePosition);

      // Clear canvas each frame (no fade effect to avoid darkening the map)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particlesRef.current.forEach((particle) => {
        // Get wind at particle position
        const wind = getWindAtPoint(particle.x, particle.y, selectedTime);

        if (wind && wind.speed > 0.5) {
          // Update particle based on wind
          const angleRad = ((wind.direction - 90) * Math.PI) / 180;
          const speed = wind.speed / 3; // Adjust speed for pixel movement

          particle.speed = wind.speed;
          particle.direction = wind.direction;

          // Move particle
          particle.x += Math.cos(angleRad) * speed;
          particle.y += Math.sin(angleRad) * speed;
          particle.age++;

          // Reset particle if too old or out of bounds
          if (particle.age > particle.maxAge ||
              particle.x < 0 || particle.x > canvas.width ||
              particle.y < 0 || particle.y > canvas.height) {
            particle.x = Math.random() * canvas.width;
            particle.y = Math.random() * canvas.height;
            particle.age = 0;
            particle.maxAge = 50 + Math.random() * 50;
          }

          // Draw particle with color based on speed
          const speedNormalized = Math.min(wind.speed / 60, 1);
          let r, g, b;

          if (wind.speed < 20) {
            r = 100; g = 200; b = 255; // Light blue
          } else if (wind.speed < 40) {
            r = 255; g = 255; b = 100; // Yellow
          } else if (wind.speed < 60) {
            r = 255; g = 150; b = 0; // Orange
          } else {
            r = 255; g = 50; b = 50; // Red
          }

          // Very subtle opacity for particles
          const alpha = (1 - particle.age / particle.maxAge) * opacity * 0.3;

          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.fillRect(particle.x, particle.y, 1.5, 1.5);
        } else {
          // No wind, reset particle
          particle.x = Math.random() * canvas.width;
          particle.y = Math.random() * canvas.height;
          particle.age = 0;
        }
      });
    };

    // Animate at 30fps for smooth particle motion
    let lastFrameTime = 0;
    const targetFPS = 30;
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
        zIndex: 550,
      }}
    />
  );
}
