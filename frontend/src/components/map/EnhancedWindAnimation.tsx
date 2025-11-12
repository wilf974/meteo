import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { useMapStore } from '../../store/mapStore';
import axios from 'axios';

interface WindParticle {
  x: number;
  y: number;
  age: number;
  maxAge: number;
  speedMultiplier: number;
  trail: { x: number; y: number }[];
}

interface WindData {
  speed: number; // m/s
  direction: number; // degrees
  gust?: number; // rafales
}

const API_KEY = '2ec0e6de17b1cde328190d75deb1c7df';

export default function EnhancedWindAnimation() {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<WindParticle[]>([]);
  const animationRef = useRef<number>();
  const windDataRef = useRef<WindData>({ speed: 0, direction: 0 });
  const { activeLayers } = useMapStore();

  const windLayer = activeLayers.find(l => l.id === 'wind');
  const isEnabled = windLayer?.enabled || false;
  const opacity = windLayer?.opacity || 1;

  useEffect(() => {
    const fetchWindData = async () => {
      try {
        const center = map.getCenter();
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${center.lat}&lon=${center.lng}&appid=${API_KEY}`
        );

        if (response.data.wind) {
          windDataRef.current = {
            speed: response.data.wind.speed || 0,
            direction: response.data.wind.deg || 0,
            gust: response.data.wind.gust,
          };
        }
      } catch (error) {
        console.error('Erreur récupération données vent:', error);
        // Données de test
        windDataRef.current = { speed: 5, direction: 90 };
      }
    };

    fetchWindData();
    const interval = setInterval(fetchWindData, 300000);
    const handleMoveEnd = () => fetchWindData();
    map.on('moveend', handleMoveEnd);

    return () => {
      clearInterval(interval);
      map.off('moveend', handleMoveEnd);
    };
  }, [map]);

  useEffect(() => {
    if (!canvasRef.current) return;

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

    const createParticle = (): WindParticle => {
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        age: 0,
        maxAge: 80 + Math.random() * 120,
        speedMultiplier: 0.7 + Math.random() * 0.6,
        trail: [],
      };
    };

    const initParticles = () => {
      particlesRef.current = [];
      const numParticles = 3000;

      for (let i = 0; i < numParticles; i++) {
        particlesRef.current.push(createParticle());
      }
    };

    const updateParticles = () => {
      const wind = windDataRef.current;
      if (wind.speed === 0) return;

      // Angle en radians (0° = Nord, convertir pour canvas)
      const angleRad = ((wind.direction - 90) * Math.PI) / 180;

      // Vitesse normalisée (0.5 à 4 pixels par frame)
      const baseSpeed = Math.min(Math.max(wind.speed / 3, 0.5), 4);

      particlesRef.current.forEach((particle) => {
        // Ajouter un peu de turbulence
        const turbulence = (Math.sin(particle.age * 0.1) * 0.3);
        const speed = baseSpeed * particle.speedMultiplier;

        const vx = Math.cos(angleRad) * speed + turbulence;
        const vy = Math.sin(angleRad) * speed;

        // Mettre à jour la position
        particle.x += vx;
        particle.y += vy;

        // Ajouter à la traînée
        particle.trail.push({ x: particle.x, y: particle.y });
        if (particle.trail.length > 15) {
          particle.trail.shift();
        }

        particle.age++;

        // Reset si hors écran ou trop vieux
        if (
          particle.x < -50 ||
          particle.x > canvas.width + 50 ||
          particle.y < -50 ||
          particle.y > canvas.height + 50 ||
          particle.age > particle.maxAge
        ) {
          const newParticle = createParticle();
          particle.x = newParticle.x;
          particle.y = newParticle.y;
          particle.age = 0;
          particle.maxAge = newParticle.maxAge;
          particle.trail = [];
        }
      });
    };

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const wind = windDataRef.current;
      if (wind.speed === 0) return;

      ctx.globalAlpha = opacity;

      // Dessiner les particules avec leurs traînées
      particlesRef.current.forEach((particle) => {
        const lifeProgress = particle.age / particle.maxAge;
        const alpha = (1 - lifeProgress) * 0.8;

        // Dessiner la traînée
        if (particle.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(particle.trail[0].x, particle.trail[0].y);

          for (let i = 1; i < particle.trail.length; i++) {
            const trailAlpha = alpha * (i / particle.trail.length);
            ctx.strokeStyle = `rgba(100, 200, 255, ${trailAlpha * opacity})`;
            ctx.lineWidth = 1.5;
            ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
          }

          ctx.stroke();
        }

        // Dessiner la particule principale
        const particleSize = 2.5;
        ctx.fillStyle = `rgba(120, 220, 255, ${alpha * opacity})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particleSize, 0, Math.PI * 2);
        ctx.fill();

        // Glow effect
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particleSize * 3
        );
        gradient.addColorStop(0, `rgba(150, 230, 255, ${alpha * 0.6 * opacity})`);
        gradient.addColorStop(1, 'rgba(150, 230, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particleSize * 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Dessiner la boussole et les infos
      drawWindCompass(ctx, wind);
    };

    const drawWindCompass = (ctx: CanvasRenderingContext2D, wind: WindData) => {
      ctx.globalAlpha = 1;

      const centerX = 100;
      const centerY = 100;
      const radius = 60;

      // Fond de la boussole
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 10, 0, Math.PI * 2);
      ctx.fill();

      // Cercle extérieur
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Marques cardinales
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('N', centerX, centerY - radius - 20);
      ctx.fillText('E', centerX + radius + 20, centerY);
      ctx.fillText('S', centerX, centerY + radius + 20);
      ctx.fillText('W', centerX - radius - 20, centerY);

      // Flèche de direction du vent
      const angleRad = ((wind.direction - 90) * Math.PI) / 180;
      const arrowLength = radius - 10;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angleRad);

      // Flèche principale
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.9)';
      ctx.fillStyle = 'rgba(100, 200, 255, 0.9)';
      ctx.lineWidth = 4;

      ctx.beginPath();
      ctx.moveTo(-arrowLength / 2, 0);
      ctx.lineTo(arrowLength / 2, 0);
      ctx.stroke();

      // Pointe de la flèche
      ctx.beginPath();
      ctx.moveTo(arrowLength / 2, 0);
      ctx.lineTo(arrowLength / 2 - 15, -10);
      ctx.lineTo(arrowLength / 2 - 15, 10);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // Afficher les données
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('🌬️ Vent', 20, centerY + radius + 50);

      ctx.font = '14px sans-serif';
      ctx.fillText(`Vitesse: ${Math.round(wind.speed * 3.6)} km/h`, 20, centerY + radius + 72);
      ctx.fillText(`Direction: ${wind.direction}°`, 20, centerY + radius + 92);

      if (wind.gust) {
        ctx.fillText(`Rafales: ${Math.round(wind.gust * 3.6)} km/h`, 20, centerY + radius + 112);
      }

      // Échelle de Beaufort
      const beaufort = getBeaufortScale(wind.speed);
      ctx.fillText(`Beaufort: ${beaufort.scale} (${beaufort.description})`, 20, centerY + radius + 132);
    };

    const getBeaufortScale = (speedMs: number) => {
      const speedKmh = speedMs * 3.6;

      if (speedKmh < 1) return { scale: 0, description: 'Calme' };
      if (speedKmh < 6) return { scale: 1, description: 'Très légère brise' };
      if (speedKmh < 12) return { scale: 2, description: 'Légère brise' };
      if (speedKmh < 20) return { scale: 3, description: 'Petite brise' };
      if (speedKmh < 29) return { scale: 4, description: 'Jolie brise' };
      if (speedKmh < 39) return { scale: 5, description: 'Bonne brise' };
      if (speedKmh < 50) return { scale: 6, description: 'Vent frais' };
      if (speedKmh < 62) return { scale: 7, description: 'Grand frais' };
      if (speedKmh < 75) return { scale: 8, description: 'Coup de vent' };
      if (speedKmh < 89) return { scale: 9, description: 'Fort coup de vent' };
      if (speedKmh < 103) return { scale: 10, description: 'Tempête' };
      if (speedKmh < 118) return { scale: 11, description: 'Violente tempête' };
      return { scale: 12, description: 'Ouragan' };
    };

    const animate = () => {
      updateParticles();
      drawParticles();
      animationRef.current = requestAnimationFrame(animate);
    };

    initParticles();
    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      map.off('resize', resizeCanvas);
    };
  }, [map, opacity]);

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
        zIndex: 1000,
      }}
    />
  );
}
