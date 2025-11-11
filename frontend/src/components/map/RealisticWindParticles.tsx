import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import { useMapStore } from '../../store/mapStore';
import axios from 'axios';

interface Particle {
  x: number;
  y: number;
  age: number;
  maxAge: number;
}

interface WindData {
  speed: number;
  direction: number; // en degrés (0 = Nord, 90 = Est, etc.)
}

const API_KEY = '2ec0e6de17b1cde328190d75deb1c7df';

export default function RealisticWindParticles() {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const windDataRef = useRef<WindData | null>(null);
  const { activeLayers } = useMapStore();

  const windLayer = activeLayers.find(l => l.id === 'wind');
  const isWindEnabled = windLayer?.enabled || false;

  // Récupérer les données de vent pour le centre de la carte
  useEffect(() => {
    if (!isWindEnabled) return;

    const fetchWindData = async () => {
      try {
        const center = map.getCenter();
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${center.lat}&lon=${center.lng}&appid=${API_KEY}`
        );

        if (response.data.wind) {
          windDataRef.current = {
            speed: response.data.wind.speed,
            direction: response.data.wind.deg,
          };
        }
      } catch (error) {
        console.error('Erreur récupération données vent:', error);
        // Données par défaut
        windDataRef.current = {
          speed: 5,
          direction: 45,
        };
      }
    };

    fetchWindData();

    // Rafraîchir les données quand on bouge la carte
    const handleMoveEnd = () => {
      fetchWindData();
    };

    map.on('moveend', handleMoveEnd);

    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [map, isWindEnabled]);

  useEffect(() => {
    if (!isWindEnabled || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const container = map.getContainer();
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    resizeCanvas();
    map.on('resize', resizeCanvas);

    // Initialize particles
    const initParticles = () => {
      const particles: Particle[] = [];
      const numParticles = 2000;

      for (let i = 0; i < numParticles; i++) {
        particles.push(createParticle());
      }

      particlesRef.current = particles;
    };

    const createParticle = (): Particle => {
      const canvas = canvasRef.current!;
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        age: 0,
        maxAge: 100 + Math.random() * 100,
      };
    };

    const updateParticles = () => {
      if (!windDataRef.current) return;

      const windData = windDataRef.current;
      // Convertir la direction en radians (météo: 0°=Nord, on ajuste pour canvas)
      const angleRad = ((windData.direction - 90) * Math.PI) / 180;

      // Vitesse normalisée pour l'animation (0.5-3 pixels par frame)
      const speedFactor = Math.min(Math.max(windData.speed / 5, 0.5), 3);

      particlesRef.current.forEach((particle) => {
        // Déplacer la particule selon la direction du vent
        particle.x += Math.cos(angleRad) * speedFactor;
        particle.y += Math.sin(angleRad) * speedFactor;
        particle.age++;

        // Reset particle si hors écran ou trop vieille
        if (
          particle.x < 0 ||
          particle.x > canvas.width ||
          particle.y < 0 ||
          particle.y > canvas.height ||
          particle.age > particle.maxAge
        ) {
          const newParticle = createParticle();
          particle.x = newParticle.x;
          particle.y = newParticle.y;
          particle.age = 0;
          particle.maxAge = newParticle.maxAge;
        }
      });
    };

    const drawParticles = () => {
      if (!windDataRef.current) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const windData = windDataRef.current;
      const angleRad = ((windData.direction - 90) * Math.PI) / 180;
      const speedFactor = Math.min(Math.max(windData.speed / 5, 0.5), 3);

      particlesRef.current.forEach((particle) => {
        const opacity = 1 - particle.age / particle.maxAge;

        // Dessiner la particule
        ctx.fillStyle = `rgba(100, 200, 255, ${opacity * 0.7})`;
        ctx.fillRect(particle.x, particle.y, 2, 2);

        // Dessiner une traînée dans la direction du vent
        ctx.strokeStyle = `rgba(100, 200, 255, ${opacity * 0.4})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(
          particle.x - Math.cos(angleRad) * speedFactor * 5,
          particle.y - Math.sin(angleRad) * speedFactor * 5
        );
        ctx.stroke();
      });

      // Afficher une petite flèche indiquant la direction du vent
      drawWindArrow(ctx, windData);
    };

    const drawWindArrow = (ctx: CanvasRenderingContext2D, windData: WindData) => {
      const centerX = 80;
      const centerY = 80;
      const length = 40;
      const angleRad = ((windData.direction - 90) * Math.PI) / 180;

      // Flèche
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 3;

      // Ligne principale
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      const endX = centerX + Math.cos(angleRad) * length;
      const endY = centerY + Math.sin(angleRad) * length;
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Pointe de la flèche
      const arrowSize = 10;
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - arrowSize * Math.cos(angleRad - Math.PI / 6),
        endY - arrowSize * Math.sin(angleRad - Math.PI / 6)
      );
      ctx.lineTo(
        endX - arrowSize * Math.cos(angleRad + Math.PI / 6),
        endY - arrowSize * Math.sin(angleRad + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();

      // Texte vitesse du vent
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`${Math.round(windData.speed * 3.6)} km/h`, centerX - 25, centerY + 60);
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
  }, [map, isWindEnabled]);

  if (!isWindEnabled) return null;

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
