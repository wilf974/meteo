import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import { useMapStore } from '../../store/mapStore';
import { getForecast, getWeatherAtTime, type ForecastResponse } from '../../services/openMeteo.service';

export default function PrecipitationOverlay() {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const forecastRef = useRef<ForecastResponse | null>(null);
  const dropletsRef = useRef<Array<{ x: number; y: number; speed: number; opacity: number }>>([]);
  const { activeLayers, timelinePosition } = useMapStore();

  const precipLayer = activeLayers.find(l => l.id === 'precipitation');
  const isEnabled = precipLayer?.enabled || false;
  const opacity = precipLayer?.opacity || 1;

  useEffect(() => {
    if (!isEnabled) return;

    const fetchData = async () => {
      try {
        const center = map.getCenter();
        const forecast = await getForecast(center.lat, center.lng);
        forecastRef.current = forecast;
      } catch (error) {
        console.error('Erreur Open-Meteo precipitation:', error);
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

      // Réinitialiser les gouttes
      dropletsRef.current = [];
    };

    resizeCanvas();
    map.on('resize', resizeCanvas);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!forecastRef.current) return;

      const weatherData = getWeatherAtTime(forecastRef.current, new Date(timelinePosition));
      if (!weatherData) return;

      const precip = weatherData.precipitation; // mm/h

      if (precip > 0) {
        // Dessiner un overlay bleu selon l'intensité
        const alpha = Math.min(0.5, precip / 20) * opacity; // Max à 20mm/h
        ctx.fillStyle = `rgba(100, 150, 255, ${alpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Ajouter des gouttes animées selon l'intensité
        const targetDroplets = Math.floor(precip * 20); // 20 gouttes par mm/h

        while (dropletsRef.current.length < targetDroplets) {
          dropletsRef.current.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            speed: 5 + Math.random() * 10,
            opacity: 0.3 + Math.random() * 0.4,
          });
        }

        while (dropletsRef.current.length > targetDroplets) {
          dropletsRef.current.pop();
        }

        // Dessiner et mettre à jour les gouttes
        dropletsRef.current.forEach(droplet => {
          ctx.strokeStyle = `rgba(200, 220, 255, ${droplet.opacity * opacity})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(droplet.x, droplet.y);
          ctx.lineTo(droplet.x, droplet.y + 15);
          ctx.stroke();

          droplet.y += droplet.speed;

          if (droplet.y > canvas.height) {
            droplet.y = -20;
            droplet.x = Math.random() * canvas.width;
          }
        });

        // Afficher l'intensité
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(canvas.width - 160, 70, 150, 40);

        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px sans-serif';
        const icon = precip < 2.5 ? '🌦️' : precip < 10 ? '🌧️' : '⛈️';
        ctx.fillText(`${icon} ${precip.toFixed(1)} mm/h`, canvas.width - 150, 95);
      } else {
        dropletsRef.current = [];
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
        zIndex: 500,
      }}
    />
  );
}
