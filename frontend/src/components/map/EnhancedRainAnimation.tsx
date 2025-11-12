import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { useMapStore } from '../../store/mapStore';
import axios from 'axios';

interface Raindrop {
  x: number;
  y: number;
  z: number;
  speed: number;
  length: number;
  opacity: number;
  vx: number;
}

interface Splash {
  x: number;
  y: number;
  age: number;
  maxAge: number;
  size: number;
}

interface WeatherData {
  precipitation: number;
  rainIntensity: 'none' | 'light' | 'moderate' | 'heavy';
  windSpeed: number;
  windDirection: number;
}

const API_KEY = '2ec0e6de17b1cde328190d75deb1c7df';

export default function EnhancedRainAnimation() {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raindropsRef = useRef<Raindrop[]>([]);
  const splashesRef = useRef<Splash[]>([]);
  const animationRef = useRef<number>();
  const weatherDataRef = useRef<WeatherData>({
    precipitation: 0,
    rainIntensity: 'none',
    windSpeed: 0,
    windDirection: 0,
  });
  const { activeLayers, timelinePosition, isPlaying } = useMapStore();

  const precipLayer = activeLayers.find(l => l.id === 'precipitation');
  const isEnabled = precipLayer?.enabled || false;
  const opacity = precipLayer?.opacity || 1;

  // Récupérer les données météo selon la timeline
  useEffect(() => {
    if (!isEnabled) return;

    const fetchWeatherData = async () => {
      try {
        const center = map.getCenter();
        const now = new Date();
        const selectedTime = new Date(timelinePosition);
        const hoursDiff = Math.round((selectedTime.getTime() - now.getTime()) / (1000 * 60 * 60));

        let precipitation = 0;
        let rainIntensity: 'none' | 'light' | 'moderate' | 'heavy' = 'none';
        let windSpeed = 0;
        let windDirection = 0;

        // Si on est dans le présent ou passé récent, utiliser weather API
        if (hoursDiff <= 0) {
          const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${center.lat}&lon=${center.lng}&appid=${API_KEY}`
          );

          if (response.data.rain) {
            precipitation = response.data.rain['1h'] || 0;
          }
          windSpeed = response.data.wind?.speed || 0;
          windDirection = response.data.wind?.deg || 0;
        } else {
          // Utiliser forecast API pour le futur
          const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${center.lat}&lon=${center.lng}&appid=${API_KEY}`
          );

          // Trouver la prévision la plus proche de l'heure sélectionnée
          const forecasts = response.data.list;
          const targetTimestamp = selectedTime.getTime() / 1000;

          let closestForecast = forecasts[0];
          let minDiff = Math.abs(forecasts[0].dt - targetTimestamp);

          for (const forecast of forecasts) {
            const diff = Math.abs(forecast.dt - targetTimestamp);
            if (diff < minDiff) {
              minDiff = diff;
              closestForecast = forecast;
            }
          }

          if (closestForecast.rain) {
            precipitation = closestForecast.rain['3h'] ? closestForecast.rain['3h'] / 3 : 0;
          }
          windSpeed = closestForecast.wind?.speed || 0;
          windDirection = closestForecast.wind?.deg || 0;
        }

        // Déterminer l'intensité
        if (precipitation === 0) rainIntensity = 'none';
        else if (precipitation < 2.5) rainIntensity = 'light';
        else if (precipitation < 10) rainIntensity = 'moderate';
        else rainIntensity = 'heavy';

        weatherDataRef.current = {
          precipitation,
          rainIntensity,
          windSpeed,
          windDirection,
        };
      } catch (error) {
        console.error('Erreur récupération données météo:', error);
      }

      // DÉMO: Si pas de pluie, forcer un peu de pluie pour la démonstration
      if (weatherDataRef.current.precipitation === 0) {
        weatherDataRef.current = {
          precipitation: 3,
          rainIntensity: 'light',
          windSpeed: weatherDataRef.current.windSpeed,
          windDirection: weatherDataRef.current.windDirection,
        };
      }
    };

    fetchWeatherData();

    // Rafraîchir quand la timeline change
    const interval = setInterval(fetchWeatherData, 5000);
    const handleMoveEnd = () => fetchWeatherData();
    map.on('moveend', handleMoveEnd);

    return () => {
      clearInterval(interval);
      map.off('moveend', handleMoveEnd);
    };
  }, [map, isEnabled, timelinePosition]);

  useEffect(() => {
    if (!isEnabled || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const resizeCanvas = () => {
      const container = map.getContainer();
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      // Réinitialiser quand on resize
      initRain();
    };

    const createRaindrop = (): Raindrop => {
      const z = Math.random();
      const windAngle = ((weatherDataRef.current.windDirection - 90) * Math.PI) / 180;

      return {
        x: Math.random() * (canvas.width + 200) - 100,
        y: -50 - Math.random() * canvas.height,
        z: z,
        speed: (15 + Math.random() * 20) * (0.5 + z * 1.5),
        length: (15 + Math.random() * 25) * (0.5 + z * 1.5),
        opacity: (0.4 + Math.random() * 0.6) * (0.3 + z * 0.7),
        vx: Math.cos(windAngle) * weatherDataRef.current.windSpeed * 0.5,
      };
    };

    const createSplash = (x: number, y: number): Splash => {
      return {
        x,
        y,
        age: 0,
        maxAge: 10 + Math.random() * 10,
        size: 2 + Math.random() * 4,
      };
    };

    const initRain = () => {
      const weather = weatherDataRef.current;

      let numDrops = 0;
      switch (weather.rainIntensity) {
        case 'light': numDrops = 400; break;
        case 'moderate': numDrops = 800; break;
        case 'heavy': numDrops = 1500; break;
        default: numDrops = 0;
      }

      // Ajuster le nombre de gouttes au lieu de tout recréer
      const currentCount = raindropsRef.current.length;

      if (currentCount < numDrops) {
        // Ajouter des gouttes
        for (let i = currentCount; i < numDrops; i++) {
          raindropsRef.current.push(createRaindrop());
        }
      } else if (currentCount > numDrops) {
        // Retirer des gouttes
        raindropsRef.current.splice(numDrops, currentCount - numDrops);
      }
    };

    // Initialiser le canvas après avoir défini les fonctions
    resizeCanvas();
    map.on('resize', resizeCanvas);

    const updateRain = () => {
      const weather = weatherDataRef.current;

      // Réinitialiser si l'intensité a changé
      const expectedCount = {
        'light': 400,
        'moderate': 800,
        'heavy': 1500,
        'none': 0
      }[weather.rainIntensity] || 0;

      if (Math.abs(raindropsRef.current.length - expectedCount) > 50) {
        initRain();
      }

      raindropsRef.current.forEach((drop) => {
        drop.y += drop.speed;
        drop.x += drop.vx;

        if (drop.y > canvas.height && Math.random() > 0.7) {
          splashesRef.current.push(createSplash(drop.x, canvas.height));
        }

        if (drop.y > canvas.height + 50 || drop.x < -100 || drop.x > canvas.width + 100) {
          const newDrop = createRaindrop();
          Object.assign(drop, newDrop);
        }
      });

      splashesRef.current = splashesRef.current.filter(splash => {
        splash.age++;
        return splash.age < splash.maxAge;
      });
    };

    const drawRain = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const weather = weatherDataRef.current;
      if (weather.rainIntensity === 'none') return;

      ctx.globalAlpha = opacity;

      const sortedDrops = [...raindropsRef.current].sort((a, b) => a.z - b.z);

      sortedDrops.forEach((drop) => {
        const alpha = drop.opacity * opacity;

        const gradient = ctx.createLinearGradient(
          drop.x, drop.y,
          drop.x, drop.y + drop.length
        );
        gradient.addColorStop(0, `rgba(174, 194, 224, ${alpha * 0.5})`);
        gradient.addColorStop(0.5, `rgba(174, 194, 224, ${alpha})`);
        gradient.addColorStop(1, `rgba(174, 194, 224, ${alpha * 0.3})`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5 * (0.5 + drop.z * 1.5);
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + drop.vx * 2, drop.y + drop.length);
        ctx.stroke();
      });

      splashesRef.current.forEach((splash) => {
        const progress = splash.age / splash.maxAge;
        const currentSize = splash.size * (1 + progress * 2);
        const alpha = (1 - progress) * 0.6 * opacity;

        ctx.strokeStyle = `rgba(174, 194, 224, ${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(splash.x, splash.y, currentSize, 0, Math.PI * 2);
        ctx.stroke();
      });

      if (weather.rainIntensity !== 'light') {
        const fogAlpha = weather.rainIntensity === 'heavy' ? 0.1 : 0.05;
        ctx.fillStyle = `rgba(200, 210, 220, ${fogAlpha * opacity})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(canvas.width - 210, 10, 200, 70);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.font = 'bold 16px sans-serif';
      const icons = { light: '🌦️', moderate: '🌧️', heavy: '⛈️', none: '' };
      const labels = {
        light: 'Pluie légère',
        moderate: 'Pluie modérée',
        heavy: 'Pluie forte',
        none: ''
      };

      ctx.fillText(icons[weather.rainIntensity] + ' ' + labels[weather.rainIntensity], canvas.width - 200, 32);
      ctx.font = '13px sans-serif';
      ctx.fillText(`💧 ${weather.precipitation.toFixed(1)} mm/h`, canvas.width - 200, 52);
      ctx.fillText(`🌬️ ${Math.round(weather.windSpeed * 3.6)} km/h`, canvas.width - 200, 70);
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
  }, [map, opacity, isEnabled]);

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
