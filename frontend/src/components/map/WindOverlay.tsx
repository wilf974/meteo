import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import { useMapStore } from '../../store/mapStore';
import { getForecast, getWeatherAtTime, type ForecastResponse } from '../../services/openMeteo.service';

export default function WindOverlay() {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const forecastRef = useRef<ForecastResponse | null>(null);
  const particlesRef = useRef<Array<{ x: number; y: number; age: number; trail: Array<{x: number, y: number}> }>>([]);
  const { activeLayers, timelinePosition } = useMapStore();

  const windLayer = activeLayers.find(l => l.id === 'wind');
  const isEnabled = windLayer?.enabled || false;
  const opacity = windLayer?.opacity || 1;

  useEffect(() => {
    if (!isEnabled) return;

    const fetchData = async () => {
      try {
        const center = map.getCenter();
        console.log('🌬️ WindOverlay: Fetching data for', center.lat, center.lng);
        const forecast = await getForecast(center.lat, center.lng);
        forecastRef.current = forecast;
        console.log('🌬️ WindOverlay: Data loaded successfully');
      } catch (error) {
        console.error('🌬️ WindOverlay: Erreur Open-Meteo:', error);
      }
    };

    fetchData();
    map.on('moveend', fetchData);

    return () => {
      map.off('moveend', fetchData);
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

      // Réinitialiser les particules
      particlesRef.current = [];
      for (let i = 0; i < 50; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          age: 0,
          trail: [],
        });
      }
    };

    resizeCanvas();
    map.on('resize', resizeCanvas);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!forecastRef.current) return;

      const weatherData = getWeatherAtTime(forecastRef.current, new Date(timelinePosition));
      if (!weatherData) return;

      const windSpeed = weatherData.windSpeed; // km/h
      const windDir = weatherData.windDirection; // degrés

      if (windSpeed > 0) {
        // Convertir direction en radians (météo: 0° = Nord)
        const angleRad = ((windDir - 90) * Math.PI) / 180;

        // Mettre à jour et dessiner les particules
        particlesRef.current.forEach(particle => {
          // Ajouter position actuelle au trail
          particle.trail.push({ x: particle.x, y: particle.y });
          if (particle.trail.length > 20) {
            particle.trail.shift();
          }

          // Déplacer particule selon le vent
          const speed = windSpeed / 10;
          particle.x += Math.cos(angleRad) * speed;
          particle.y += Math.sin(angleRad) * speed;
          particle.age++;

          // Reset si hors écran
          if (
            particle.x < 0 || particle.x > canvas.width ||
            particle.y < 0 || particle.y > canvas.height ||
            particle.age > 300
          ) {
            particle.x = Math.random() * canvas.width;
            particle.y = Math.random() * canvas.height;
            particle.age = 0;
            particle.trail = [];
          }

          // Dessiner le trail
          if (particle.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(particle.trail[0].x, particle.trail[0].y);

            for (let i = 1; i < particle.trail.length; i++) {
              const alpha = (i / particle.trail.length) * 0.5 * opacity;
              ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
              ctx.lineWidth = 2;
              ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
            }

            ctx.stroke();
          }

          // Dessiner la particule
          ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * opacity})`;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
          ctx.fill();
        });

        // Dessiner quelques flèches fixes pour montrer la direction
        const gridSize = 8;
        const cellWidth = canvas.width / gridSize;
        const cellHeight = canvas.height / gridSize;

        for (let i = 1; i < gridSize; i++) {
          for (let j = 1; j < gridSize; j++) {
            const x = i * cellWidth;
            const y = j * cellHeight;

            drawWindArrow(ctx, x, y, angleRad, windSpeed, opacity);
          }
        }

        // Afficher vitesse du vent
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(canvas.width - 160, 120, 150, 60);

        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(`🌬️ ${windSpeed.toFixed(1)} km/h`, canvas.width - 150, 145);

        ctx.font = '12px sans-serif';
        const beaufort = getBeaufortScale(windSpeed);
        ctx.fillText(`Beaufort: ${beaufort}`, canvas.width - 150, 165);
      }
    };

    const animate = () => {
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

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
        zIndex: 600,
      }}
    />
  );
}

function drawWindArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angleRad: number,
  speed: number,
  opacity: number
) {
  const length = Math.min(30, 10 + speed / 2);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angleRad);

  ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 * opacity})`;
  ctx.fillStyle = `rgba(255, 255, 255, ${0.6 * opacity})`;
  ctx.lineWidth = 2;

  // Ligne principale
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(length, 0);
  ctx.stroke();

  // Pointe
  ctx.beginPath();
  ctx.moveTo(length, 0);
  ctx.lineTo(length - 8, -5);
  ctx.lineTo(length - 8, 5);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function getBeaufortScale(speedKmh: number): number {
  if (speedKmh < 1) return 0;
  if (speedKmh < 6) return 1;
  if (speedKmh < 12) return 2;
  if (speedKmh < 20) return 3;
  if (speedKmh < 29) return 4;
  if (speedKmh < 39) return 5;
  if (speedKmh < 50) return 6;
  if (speedKmh < 62) return 7;
  if (speedKmh < 75) return 8;
  if (speedKmh < 89) return 9;
  if (speedKmh < 103) return 10;
  if (speedKmh < 118) return 11;
  return 12;
}
