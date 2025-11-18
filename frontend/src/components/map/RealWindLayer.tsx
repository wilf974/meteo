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
  const { activeLayers, activeMode, timelinePosition, weatherGrid } = useMapStore();

  const windLayer = activeLayers.find(l => l.id === 'wind');
  const isEnabled = activeMode === 'wind'; // Only enabled when mode is 'wind'
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
    const numParticles = 5000; // More particles for better visibility like Windy

    particlesRef.current = [];

    for (let i = 0; i < numParticles; i++) {
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        age: Math.random() * 100,
        maxAge: 60 + Math.random() * 60, // Longer trails
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

      // Subtle fade effect for trails (like Windy) - very transparent to avoid darkening
      ctx.fillStyle = 'rgba(255, 255, 255, 0.015)'; // Almost transparent white fade
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';

      // Update and draw particles
      particlesRef.current.forEach((particle) => {
        // Get wind at particle position
        const wind = getWindAtPoint(particle.x, particle.y, selectedTime);

        if (wind && wind.speed > 0.5) {
          // Update particle based on wind
          const angleRad = ((wind.direction - 90) * Math.PI) / 180;
          const speed = wind.speed / 2.5; // Adjust speed for visible movement

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
            particle.maxAge = 60 + Math.random() * 60;
          }

          // Draw particle with color based on speed (Windy color scheme)
          let r, g, b;

          if (wind.speed < 5) {
            r = 98; g = 113; b = 183; // Very light wind - light purple
          } else if (wind.speed < 10) {
            r = 57; g = 148; b = 224; // Light wind - blue
          } else if (wind.speed < 15) {
            r = 57; g = 200; b = 195; // Moderate wind - cyan
          } else if (wind.speed < 20) {
            r = 74; g = 217; b = 109; // Fresh wind - green
          } else if (wind.speed < 30) {
            r = 251; g = 242; b = 54; // Strong wind - yellow
          } else if (wind.speed < 40) {
            r = 255; g = 173; b = 46; // Very strong - orange
          } else if (wind.speed < 50) {
            r = 255; g = 111; b = 75; // Gale - red-orange
          } else {
            r = 229; g = 52; b = 87; // Storm - red
          }

          // Higher opacity for visibility (like Windy)
          const alpha = (1 - particle.age / particle.maxAge) * opacity * 0.8;

          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;

          // Larger particles for better visibility
          ctx.fillRect(particle.x, particle.y, 2.5, 2.5);
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
