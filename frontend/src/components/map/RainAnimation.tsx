import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import { useMapStore } from '../../store/mapStore';
import axios from 'axios';

interface Raindrop {
  x: number;
  y: number;
  speed: number;
  length: number;
  opacity: number;
}

interface WeatherData {
  precipitation: number; // mm/h
  rainIntensity: 'none' | 'light' | 'moderate' | 'heavy';
}

const API_KEY = '2ec0e6de17b1cde328190d75deb1c7df';

export default function RainAnimation() {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raindropsRef = useRef<Raindrop[]>([]);
  const animationRef = useRef<number>();
  const weatherDataRef = useRef<WeatherData | null>(null);
  const { activeLayers } = useMapStore();

  const precipLayer = activeLayers.find(l => l.id === 'precipitation');
  const isEnabled = precipLayer?.enabled || false;

  // Récupérer les données de pluie depuis l'API
  useEffect(() => {
    if (!isEnabled) return;

    const fetchWeatherData = async () => {
      try {
        const center = map.getCenter();
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${center.lat}&lon=${center.lng}&appid=${API_KEY}`
        );

        let precipitation = 0;
        let rainIntensity: 'none' | 'light' | 'moderate' | 'heavy' = 'none';

        // Vérifier s'il pleut actuellement
        if (response.data.rain) {
          // rain.1h = mm de pluie dans la dernière heure
          precipitation = response.data.rain['1h'] || 0;

          // Déterminer l'intensité
          if (precipitation === 0) {
            rainIntensity = 'none';
          } else if (precipitation < 2.5) {
            rainIntensity = 'light';
          } else if (precipitation < 10) {
            rainIntensity = 'moderate';
          } else {
            rainIntensity = 'heavy';
          }
        }

        weatherDataRef.current = {
          precipitation,
          rainIntensity,
        };
      } catch (error) {
        console.error('Erreur récupération données météo:', error);
        weatherDataRef.current = {
          precipitation: 0,
          rainIntensity: 'none',
        };
      }
    };

    fetchWeatherData();

    // Rafraîchir toutes les 5 minutes
    const interval = setInterval(fetchWeatherData, 300000);

    const handleMoveEnd = () => {
      fetchWeatherData();
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

    // Initialize raindrops based on weather data
    const initRain = () => {
      if (!weatherDataRef.current) return;

      const raindrops: Raindrop[] = [];

      // Nombre de gouttes selon l'intensité
      let numDrops = 0;
      switch (weatherDataRef.current.rainIntensity) {
        case 'light':
          numDrops = 200;
          break;
        case 'moderate':
          numDrops = 500;
          break;
        case 'heavy':
          numDrops = 1000;
          break;
        default:
          numDrops = 0;
      }

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

      // Ne rien dessiner si pas de pluie
      if (!weatherDataRef.current || weatherDataRef.current.rainIntensity === 'none') {
        return;
      }

      raindropsRef.current.forEach((drop) => {
        ctx.strokeStyle = `rgba(174, 194, 224, ${drop.opacity})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x, drop.y + drop.length);
        ctx.stroke();
      });

      // Afficher l'intensité de la pluie
      if (weatherDataRef.current) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 14px sans-serif';
        const intensityText = {
          light: '🌦️ Pluie légère',
          moderate: '🌧️ Pluie modérée',
          heavy: '⛈️ Pluie forte',
          none: '',
        }[weatherDataRef.current.rainIntensity];

        if (intensityText) {
          ctx.fillText(intensityText, canvas.width - 180, 30);
          ctx.font = '12px sans-serif';
          ctx.fillText(
            `${weatherDataRef.current.precipitation.toFixed(1)} mm/h`,
            canvas.width - 180,
            50
          );
        }
      }
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
