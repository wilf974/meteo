import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { useMapStore } from '../../store/mapStore';
import axios from 'axios';

interface Cloud {
  x: number;
  y: number;
  radius: number;
  speed: number;
  opacity: number;
}

const API_KEY = '2ec0e6de17b1cde328190d75deb1c7df';

export default function CloudAnimation() {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cloudsRef = useRef<Cloud[]>([]);
  const animationRef = useRef<number>();
  const cloudCoverageRef = useRef<number>(0); // 0-100%
  const { activeLayers } = useMapStore();

  const cloudLayer = activeLayers.find(l => l.id === 'clouds');
  const isEnabled = cloudLayer?.enabled || false;

  // Récupérer les données de couverture nuageuse
  useEffect(() => {
    if (!isEnabled) return;

    const fetchCloudData = async () => {
      try {
        const center = map.getCenter();
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${center.lat}&lon=${center.lng}&appid=${API_KEY}`
        );

        // clouds.all = pourcentage de couverture nuageuse (0-100)
        cloudCoverageRef.current = response.data.clouds?.all || 0;
      } catch (error) {
        console.error('Erreur récupération données nuages:', error);
        cloudCoverageRef.current = 0;
      }
    };

    fetchCloudData();

    const interval = setInterval(fetchCloudData, 300000); // 5 minutes

    const handleMoveEnd = () => {
      fetchCloudData();
    };

    map.on('moveend', handleMoveEnd);

    return () => {
      clearInterval(interval);
      map.off('moveend', handleMoveEnd);
    };
  }, [map, isEnabled]);

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

    // Initialiser les nuages selon la couverture
    const initClouds = () => {
      const clouds: Cloud[] = [];
      const coverage = cloudCoverageRef.current;

      // Nombre de nuages basé sur la couverture (0-100%)
      const numClouds = Math.floor((coverage / 100) * 15);

      for (let i = 0; i < numClouds; i++) {
        clouds.push(createCloud());
      }

      cloudsRef.current = clouds;
    };

    const createCloud = (): Cloud => {
      const canvas = canvasRef.current!;
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * (canvas.height * 0.6), // Haut de l'écran
        radius: 30 + Math.random() * 50,
        speed: 0.2 + Math.random() * 0.5,
        opacity: 0.3 + Math.random() * 0.4,
      };
    };

    const updateClouds = () => {
      cloudsRef.current.forEach((cloud) => {
        cloud.x += cloud.speed;

        // Reset le nuage s'il sort de l'écran
        if (cloud.x - cloud.radius > canvas.width) {
          cloud.x = -cloud.radius;
          cloud.y = Math.random() * (canvas.height * 0.6);
        }
      });
    };

    const drawClouds = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Ne rien dessiner si pas de nuages
      if (cloudCoverageRef.current === 0) {
        return;
      }

      cloudsRef.current.forEach((cloud) => {
        // Dessiner plusieurs cercles pour faire un nuage
        ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity})`;

        // Nuage composé de 5 cercles
        const positions = [
          { x: 0, y: 0, r: 1 },
          { x: cloud.radius * 0.5, y: -cloud.radius * 0.2, r: 0.8 },
          { x: -cloud.radius * 0.5, y: -cloud.radius * 0.1, r: 0.7 },
          { x: cloud.radius * 0.8, y: cloud.radius * 0.1, r: 0.6 },
          { x: -cloud.radius * 0.7, y: cloud.radius * 0.15, r: 0.65 },
        ];

        positions.forEach((pos) => {
          ctx.beginPath();
          ctx.arc(
            cloud.x + pos.x,
            cloud.y + pos.y,
            cloud.radius * pos.r,
            0,
            Math.PI * 2
          );
          ctx.fill();
        });
      });

      // Afficher le pourcentage de couverture
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`☁️ Couverture: ${cloudCoverageRef.current}%`, canvas.width - 200, 30);
    };

    const animate = () => {
      updateClouds();
      drawClouds();
      animationRef.current = requestAnimationFrame(animate);
    };

    initClouds();
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
        zIndex: 998,
      }}
    />
  );
}
