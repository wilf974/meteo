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

interface WindParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

export default function RealWindLayer() {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const gridDataRef = useRef<GridPoint[]>([]);
  const particlesRef = useRef<WindParticle[]>([]);
  const { activeLayers, timelinePosition } = useMapStore();

  const windLayer = activeLayers.find(l => l.id === 'wind');
  const isEnabled = windLayer?.enabled || false;
  const opacity = windLayer?.opacity || 1;

  useEffect(() => {
    if (!isEnabled) return;

    let debounceTimer: NodeJS.Timeout;

    const fetchGridData = async () => {
      try {
        const bounds = map.getBounds();
        const zoom = map.getZoom();
        // Increased grid density for better visibility (8-10 points for professional look)
        const gridSize = zoom > 10 ? 10 : zoom > 7 ? 8 : 7;

        const latStep = (bounds.getNorth() - bounds.getSouth()) / gridSize;
        const lonStep = (bounds.getEast() - bounds.getWest()) / gridSize;

        console.log('🌬️ Fetching wind grid:', gridSize, 'x', gridSize);

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
        console.log('🌬️ Grid data loaded:', newGridData.length, 'points');
      } catch (error) {
        console.error('🌬️ Error fetching grid data:', error);
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

      // Create new particles at grid points
      gridDataRef.current.forEach((point) => {
        if (!point.forecast) return;

        const weatherData = getWeatherAtTime(point.forecast, selectedTime);
        if (!weatherData || weatherData.windSpeed < 1) return;

        const latLng = { lat: point.lat, lng: point.lon };
        const screenPoint = map.latLngToContainerPoint(latLng);

        // Only create particles within canvas bounds
        if (screenPoint.x < 0 || screenPoint.x > canvas.width || screenPoint.y < 0 || screenPoint.y > canvas.height) return;

        const windSpeed = weatherData.windSpeed; // km/h
        const windDir = weatherData.windDirection; // degrees

        // Spawn probability based on wind speed (stronger wind = more particles)
        const spawnChance = Math.min(windSpeed / 100, 0.3);
        if (Math.random() < spawnChance) {
          const angleRad = ((windDir - 90) * Math.PI) / 180;
          const speedFactor = windSpeed / 10;

          particlesRef.current.push({
            x: screenPoint.x + (Math.random() - 0.5) * 60,
            y: screenPoint.y + (Math.random() - 0.5) * 60,
            vx: Math.cos(angleRad) * speedFactor,
            vy: Math.sin(angleRad) * speedFactor,
            life: 1,
            maxLife: 60 + Math.random() * 40,
            size: 1 + Math.random() * 1.5,
          });
        }

        // Draw wind direction zone (colored background based on speed) BEFORE arrow
        const zoneSize = 250;
        const speedNormalized = Math.min(windSpeed / 80, 1); // 0-1 based on 0-80 km/h
        const zoneAlpha = (0.25 + speedNormalized * 0.35) * opacity; // 0.25-0.6 range

        const zoneGradient = ctx.createRadialGradient(
          screenPoint.x, screenPoint.y, 0,
          screenPoint.x, screenPoint.y, zoneSize
        );

        // Color based on wind speed (green->yellow->orange->red)
        let zr, zg, zb;
        if (windSpeed < 20) {
          // Light wind - Light green
          zr = 150; zg = 255; zb = 150;
        } else if (windSpeed < 40) {
          // Moderate wind - Yellow
          zr = 255; zg = 255; zb = 100;
        } else if (windSpeed < 60) {
          // Strong wind - Orange
          zr = 255; zg = 180; zb = 50;
        } else {
          // Very strong wind - Red
          zr = 255; zg = 100; zb = 100;
        }

        zoneGradient.addColorStop(0, `rgba(${zr}, ${zg}, ${zb}, ${zoneAlpha})`);
        zoneGradient.addColorStop(0.4, `rgba(${zr}, ${zg}, ${zb}, ${zoneAlpha * 0.6})`);
        zoneGradient.addColorStop(0.7, `rgba(${zr}, ${zg}, ${zb}, ${zoneAlpha * 0.3})`);
        zoneGradient.addColorStop(1, `rgba(${zr}, ${zg}, ${zb}, 0)`);

        ctx.fillStyle = zoneGradient;
        ctx.fillRect(
          screenPoint.x - zoneSize,
          screenPoint.y - zoneSize,
          zoneSize * 2,
          zoneSize * 2
        );

        // Draw static arrow for reference (MORE VISIBLE)
        drawWindArrow(
          ctx,
          screenPoint.x,
          screenPoint.y,
          windDir,
          windSpeed,
          opacity * 1.0 // Full opacity for arrows
        );
      });

      // Update and draw particles
      ctx.save();
      particlesRef.current = particlesRef.current.filter((particle) => {
        // Update particle
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life += 1;

        // Remove if out of bounds or lifetime exceeded
        if (
          particle.x < -50 ||
          particle.x > canvas.width + 50 ||
          particle.y < -50 ||
          particle.y > canvas.height + 50 ||
          particle.life > particle.maxLife
        ) {
          return false;
        }

        // Draw particle with trail effect
        const lifeFactor = 1 - particle.life / particle.maxLife;
        const alpha = lifeFactor * opacity;

        // Speed-based color
        const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        const speedNormalized = Math.min(speed / 5, 1);
        const r = Math.floor(200 + 55 * speedNormalized);
        const g = Math.floor(220 - 60 * speedNormalized);
        const b = Math.floor(255 - 100 * speedNormalized);

        // Draw elongated particle (streak effect)
        ctx.globalAlpha = alpha;
        const gradient = ctx.createLinearGradient(
          particle.x - particle.vx * 2,
          particle.y - particle.vy * 2,
          particle.x,
          particle.y
        );
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 1)`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = particle.size;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(particle.x - particle.vx * 3, particle.y - particle.vy * 3);
        ctx.lineTo(particle.x, particle.y);
        ctx.stroke();

        return true;
      });
      ctx.restore();

      // Limit total particles for performance
      if (particlesRef.current.length > 500) {
        particlesRef.current = particlesRef.current.slice(-500);
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
        zIndex: 550,
      }}
    />
  );
}

function drawWindArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: number,
  speed: number,
  opacity: number
) {
  const angleRad = ((direction - 90) * Math.PI) / 180;
  const length = Math.min(50, 18 + speed / 2); // Longer arrows for better visibility

  // VIVID color based on wind speed (like professional maps)
  const speedNormalized = Math.min(speed / 60, 1); // 0-1 scale
  let r, g, b;

  if (speed < 20) {
    // Light wind - Green
    r = 80; g = 200; b = 80;
  } else if (speed < 40) {
    // Moderate wind - Yellow
    r = 255; g = 220; b = 0;
  } else if (speed < 60) {
    // Strong wind - Orange
    r = 255; g = 140; b = 0;
  } else {
    // Very strong wind - Red
    r = 255; g = 60; b = 60;
  }

  // FULL opacity for maximum visibility
  const arrowOpacity = opacity;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angleRad);

  // Draw STRONG shadow for better visibility on map
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 5;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  // White outline for better contrast
  ctx.strokeStyle = `rgba(255, 255, 255, ${arrowOpacity * 0.8})`;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(length, 0);
  ctx.stroke();

  // Arrow head outline
  ctx.beginPath();
  ctx.moveTo(length, 0);
  ctx.lineTo(length - 10, -6);
  ctx.lineTo(length - 10, 6);
  ctx.closePath();
  ctx.stroke();

  // Main arrow color
  ctx.shadowBlur = 0;
  ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${arrowOpacity})`;
  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${arrowOpacity})`;
  ctx.lineWidth = 3.5;

  // Main line
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(length, 0);
  ctx.stroke();

  // Arrow head (larger and more visible)
  ctx.beginPath();
  ctx.moveTo(length, 0);
  ctx.lineTo(length - 10, -6);
  ctx.lineTo(length - 10, 6);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}
