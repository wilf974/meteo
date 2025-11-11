import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { useMapStore } from '../../store/mapStore';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  maxAge: number;
}

export default function WindParticles() {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const { activeLayers } = useMapStore();

  const windLayer = activeLayers.find(l => l.id === 'wind');
  const isWindEnabled = windLayer?.enabled || false;

  useEffect(() => {
    if (!isWindEnabled || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to match map
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
      const numParticles = 3000;

      for (let i = 0; i < numParticles; i++) {
        particles.push(createParticle());
      }

      particlesRef.current = particles;
    };

    const createParticle = (): Particle => {
      const canvas = canvasRef.current!;
      // Simulate wind direction (can be fetched from API later)
      const windAngle = Math.random() * Math.PI * 2;
      const windSpeed = 0.5 + Math.random() * 2;

      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: Math.cos(windAngle) * windSpeed,
        vy: Math.sin(windAngle) * windSpeed,
        age: 0,
        maxAge: 100 + Math.random() * 100,
      };
    };

    const updateParticles = () => {
      particlesRef.current.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.age++;

        // Reset particle if out of bounds or too old
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
          particle.vx = newParticle.vx;
          particle.vy = newParticle.vy;
          particle.age = 0;
          particle.maxAge = newParticle.maxAge;
        }
      });
    };

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle) => {
        const opacity = 1 - particle.age / particle.maxAge;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.6})`;
        ctx.fillRect(particle.x, particle.y, 2, 2);

        // Draw trail
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.3})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(particle.x - particle.vx * 3, particle.y - particle.vy * 3);
        ctx.stroke();
      });
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
