import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { useMapStore } from '../../store/mapStore';
import axios from 'axios';

interface CloudParticle {
  x: number;
  y: number;
  z: number; // profondeur
  baseRadius: number;
  puffs: CloudPuff[]; // Composés de plusieurs "puffs"
  speed: number;
  opacity: number;
  isDark: boolean; // Nuages sombres pour couverture élevée
}

interface CloudPuff {
  offsetX: number;
  offsetY: number;
  radius: number;
  opacity: number;
}

interface WeatherData {
  cloudCoverage: number; // 0-100%
  weatherType: string;
  windSpeed: number;
}

const API_KEY = '2ec0e6de17b1cde328190d75deb1c7df';

export default function EnhancedCloudAnimation() {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cloudsRef = useRef<CloudParticle[]>([]);
  const animationRef = useRef<number>();
  const weatherDataRef = useRef<WeatherData>({
    cloudCoverage: 0,
    weatherType: 'Clear',
    windSpeed: 0,
  });
  const { activeLayers } = useMapStore();

  const cloudLayer = activeLayers.find(l => l.id === 'clouds');
  const isEnabled = cloudLayer?.enabled || false;
  const opacity = cloudLayer?.opacity || 1;

  useEffect(() => {
    const fetchCloudData = async () => {
      try {
        const center = map.getCenter();
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${center.lat}&lon=${center.lng}&appid=${API_KEY}`
        );

        weatherDataRef.current = {
          cloudCoverage: response.data.clouds?.all || 0,
          weatherType: response.data.weather?.[0]?.main || 'Clear',
          windSpeed: response.data.wind?.speed || 0,
        };
      } catch (error) {
        console.error('Erreur récupération données nuages:', error);
        // Données de test
        weatherDataRef.current = {
          cloudCoverage: 60,
          weatherType: 'Clouds',
          windSpeed: 3,
        };
      }
    };

    fetchCloudData();
    const interval = setInterval(fetchCloudData, 300000);
    const handleMoveEnd = () => fetchCloudData();
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

    const createCloudPuffs = (numPuffs: number): CloudPuff[] => {
      const puffs: CloudPuff[] = [];
      for (let i = 0; i < numPuffs; i++) {
        puffs.push({
          offsetX: (Math.random() - 0.5) * 80,
          offsetY: (Math.random() - 0.5) * 40,
          radius: 20 + Math.random() * 40,
          opacity: 0.5 + Math.random() * 0.5,
        });
      }
      return puffs;
    };

    const createCloud = (): CloudParticle => {
      const z = Math.random();
      const isDark = weatherDataRef.current.cloudCoverage > 70 && Math.random() > 0.5;
      const numPuffs = 5 + Math.floor(Math.random() * 5);

      return {
        x: Math.random() * (canvas.width + 400) - 200,
        y: Math.random() * (canvas.height * 0.6),
        z: z,
        baseRadius: 40 + Math.random() * 60,
        puffs: createCloudPuffs(numPuffs),
        speed: (0.2 + Math.random() * 0.4) * (0.5 + z * 1.5) * (1 + weatherDataRef.current.windSpeed / 10),
        opacity: (0.3 + Math.random() * 0.4) * (0.5 + z * 0.5),
        isDark: isDark,
      };
    };

    const initClouds = () => {
      cloudsRef.current = [];
      const weather = weatherDataRef.current;

      // Nombre de nuages basé sur la couverture
      let numClouds = Math.floor((weather.cloudCoverage / 100) * 25);

      // Ajuster selon le type de météo
      if (weather.weatherType === 'Rain' || weather.weatherType === 'Drizzle') {
        numClouds = Math.max(numClouds, 15);
      } else if (weather.weatherType === 'Thunderstorm') {
        numClouds = Math.max(numClouds, 20);
      }

      for (let i = 0; i < numClouds; i++) {
        cloudsRef.current.push(createCloud());
      }
    };

    const updateClouds = () => {
      cloudsRef.current.forEach((cloud) => {
        cloud.x += cloud.speed;

        // Mouvement vertical léger (oscillation)
        cloud.y += Math.sin(cloud.x * 0.01) * 0.1;

        // Reset si hors écran
        if (cloud.x - cloud.baseRadius > canvas.width + 200) {
          cloud.x = -cloud.baseRadius - 200;
          cloud.y = Math.random() * (canvas.height * 0.6);
        }
      });
    };

    const drawClouds = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const weather = weatherDataRef.current;
      if (weather.cloudCoverage === 0) return;

      ctx.globalAlpha = opacity;

      // Trier par profondeur (z) pour effet 3D
      const sortedClouds = [...cloudsRef.current].sort((a, b) => a.z - b.z);

      sortedClouds.forEach((cloud) => {
        const scaleFactor = 0.5 + cloud.z * 1.5;

        // Couleur selon type de nuage
        let baseColor: [number, number, number];
        if (cloud.isDark) {
          baseColor = [100, 110, 130]; // Nuages sombres (orage)
        } else if (weather.cloudCoverage > 70) {
          baseColor = [180, 190, 210]; // Nuages gris
        } else {
          baseColor = [240, 245, 255]; // Nuages blancs
        }

        // Dessiner chaque puff du nuage
        cloud.puffs.forEach((puff) => {
          const x = cloud.x + puff.offsetX * scaleFactor;
          const y = cloud.y + puff.offsetY * scaleFactor;
          const radius = puff.radius * scaleFactor;
          const alpha = cloud.opacity * puff.opacity * opacity;

          // Gradient radial pour effet 3D
          const gradient = ctx.createRadialGradient(
            x - radius * 0.2,
            y - radius * 0.2,
            0,
            x,
            y,
            radius
          );

          gradient.addColorStop(0, `rgba(${baseColor[0] + 30}, ${baseColor[1] + 30}, ${baseColor[2] + 30}, ${alpha})`);
          gradient.addColorStop(0.5, `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${alpha * 0.9})`);
          gradient.addColorStop(1, `rgba(${baseColor[0] - 20}, ${baseColor[1] - 20}, ${baseColor[2] - 20}, ${alpha * 0.6})`);

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();

          // Ombre douce
          if (cloud.isDark) {
            ctx.fillStyle = `rgba(60, 70, 90, ${alpha * 0.2})`;
            ctx.beginPath();
            ctx.arc(x, y + radius * 0.5, radius * 1.1, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        // Lueur de contour pour nuages lumineux
        if (!cloud.isDark && weather.cloudCoverage < 50) {
          cloud.puffs.forEach((puff) => {
            const x = cloud.x + puff.offsetX * scaleFactor;
            const y = cloud.y + puff.offsetY * scaleFactor;
            const radius = puff.radius * scaleFactor;

            const glowGradient = ctx.createRadialGradient(x, y, radius * 0.8, x, y, radius * 1.3);
            glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
            glowGradient.addColorStop(1, `rgba(255, 255, 255, ${cloud.opacity * 0.15 * opacity})`);

            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(x, y, radius * 1.3, 0, Math.PI * 2);
            ctx.fill();
          });
        }
      });

      // Overlay atmosphérique selon couverture
      if (weather.cloudCoverage > 50) {
        const overlayAlpha = ((weather.cloudCoverage - 50) / 50) * 0.15;
        ctx.fillStyle = `rgba(200, 210, 220, ${overlayAlpha * opacity})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Afficher les infos
      drawCloudInfo(ctx, weather);
    };

    const drawCloudInfo = (ctx: CanvasRenderingContext2D, weather: WeatherData) => {
      ctx.globalAlpha = 1;

      // Fond
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(canvas.width - 210, canvas.height - 120, 200, 110);

      // Titre et icône
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.font = 'bold 16px sans-serif';

      let icon = '☁️';
      let description = 'Nuages';

      if (weather.cloudCoverage === 0) {
        icon = '☀️';
        description = 'Ciel dégagé';
      } else if (weather.cloudCoverage < 25) {
        icon = '🌤️';
        description = 'Peu nuageux';
      } else if (weather.cloudCoverage < 50) {
        icon = '⛅';
        description = 'Partiellement nuageux';
      } else if (weather.cloudCoverage < 75) {
        icon = '🌥️';
        description = 'Nuageux';
      } else {
        icon = '☁️';
        description = 'Très nuageux';
      }

      if (weather.weatherType === 'Thunderstorm') {
        icon = '⛈️';
        description = 'Orageux';
      } else if (weather.weatherType === 'Rain') {
        icon = '🌧️';
        description = 'Pluvieux';
      }

      ctx.fillText(`${icon} ${description}`, canvas.width - 200, canvas.height - 95);

      ctx.font = '14px sans-serif';
      ctx.fillText(`Couverture: ${weather.cloudCoverage}%`, canvas.width - 200, canvas.height - 70);

      // Barre de progression
      const barWidth = 180;
      const barHeight = 20;
      const barX = canvas.width - 200;
      const barY = canvas.height - 50;

      // Fond de la barre
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      // Remplissage selon couverture
      const fillWidth = (weather.cloudCoverage / 100) * barWidth;
      let barColor: string;

      if (weather.cloudCoverage < 25) barColor = 'rgba(100, 200, 255, 0.7)';
      else if (weather.cloudCoverage < 50) barColor = 'rgba(150, 180, 220, 0.7)';
      else if (weather.cloudCoverage < 75) barColor = 'rgba(180, 180, 200, 0.7)';
      else barColor = 'rgba(120, 120, 140, 0.7)';

      ctx.fillStyle = barColor;
      ctx.fillRect(barX, barY, fillWidth, barHeight);

      // Bordure
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barWidth, barHeight);
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
        zIndex: 998,
      }}
    />
  );
}
