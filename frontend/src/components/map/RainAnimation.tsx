import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { useMapStore } from '../../store/mapStore';

interface Raindrop {
  x: number;
  y: number;
  speed: number;
  length: number;
  opacity: number;
}

export default function RainAnimation() {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raindropsRef = useRef<Raindrop[]>([]);
  const animationRef = useRef<number>();
  const { activeLayers } = useMapStore();

  const precipLayer = activeLayers.find(l => l.id === 'precipitation');
  const isEnabled = precipLayer?.enabled || false;

  useEffect(() => {
    if (!isEnabled || !canvasRef.current) return;

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

    // Initialize raindrops
    const initRain = () => {
      const raindrops: Raindrop[] = [];
      const numDrops = 500;

      for (let i = 0; i < numDrops; i++) {
        raindrops.push(createRaindrop());
      }

      raindropsRef.current = raindrops;
    };

    const createRaindrop = (): Raindrop => {
      const canvas = canvasRef.current!;
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        speed: 10 + Math.random() * 15,
        length: 10 + Math.random() * 20,
        opacity: 0.3 + Math.random() * 0.4,
      };
    };

    const updateRain = () => {
      raindropsRef.current.forEach((drop) => {
        drop.y += drop.speed;

        // Reset raindrop if out of bounds
        if (drop.y > canvas.height) {
          const newDrop = createRaindrop();
          drop.x = newDrop.x;
          drop.y = -50;
          drop.speed = newDrop.speed;
          drop.length = newDrop.length;
          drop.opacity = newDrop.opacity;
        }
      });
    };

    const drawRain = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      raindropsRef.current.forEach((drop) => {
        ctx.strokeStyle = `rgba(174, 194, 224, ${drop.opacity})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x, drop.y + drop.length);
        ctx.stroke();
      });
    };

    const animate = () => {
      updateRain();
      drawRain();
      animationRef.current = requestAnimationFrame(animate);
    };

    initRain();
    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      map.off('resize', resizeCanvas);
    };
  }, [map, isEnabled]);

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
        zIndex: 999,
      }}
    />
  );
}
