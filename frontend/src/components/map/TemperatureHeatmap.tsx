import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import { useMapStore } from '../../store/mapStore';
import { getForecast, getWeatherAtTime, type ForecastResponse } from '../../services/openMeteo.service';

export default function TemperatureHeatmap() {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const forecastRef = useRef<ForecastResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { activeLayers, timelinePosition } = useMapStore();

  const tempLayer = activeLayers.find(l => l.id === 'temperature');
  const isEnabled = tempLayer?.enabled || false;
  const opacity = tempLayer?.opacity || 1;

  // Récupérer les données Open-Meteo
  useEffect(() => {
    if (!isEnabled) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const center = map.getCenter();
        const forecast = await getForecast(center.lat, center.lng);
        forecastRef.current = forecast;
      } catch (error) {
        console.error('Erreur Open-Meteo:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    const handleMoveEnd = () => {
      fetchData();
    };

    map.on('moveend', handleMoveEnd);

    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [map, isEnabled]);

  // Dessiner la heatmap
  useEffect(() => {
    if (!isEnabled || !canvasRef.current || !forecastRef.current) return;

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

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!forecastRef.current) return;

      // Récupérer la température pour l'heure sélectionnée
      const weatherData = getWeatherAtTime(forecastRef.current, new Date(timelinePosition));

      if (!weatherData) return;

      const temp = weatherData.temperature;

      // Créer un gradient de température sur tout l'écran
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height) / 2
      );

      // Couleurs selon température: bleu (froid) -> vert -> jaune -> rouge (chaud)
      const tempColor = getTemperatureColor(temp);
      gradient.addColorStop(0, `rgba(${tempColor.r}, ${tempColor.g}, ${tempColor.b}, ${0.6 * opacity})`);
      gradient.addColorStop(1, `rgba(${tempColor.r}, ${tempColor.g}, ${tempColor.b}, ${0.2 * opacity})`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Afficher la température
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(canvas.width - 160, 10, 150, 50);

      ctx.fillStyle = 'white';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`🌡️ ${temp.toFixed(1)}°C`, canvas.width - 150, 35);

      ctx.font = '12px sans-serif';
      const timeStr = new Date(timelinePosition).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      ctx.fillText(timeStr, canvas.width - 150, 52);
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
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 400,
        }}
      />
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 20,
          right: 20,
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          zIndex: 1001,
          fontSize: '12px'
        }}>
          Chargement météo...
        </div>
      )}
    </>
  );
}

/**
 * Convertit une température en couleur RGB
 * -20°C = bleu foncé
 * 0°C = bleu clair
 * 15°C = vert
 * 25°C = jaune
 * 35°C+ = rouge
 */
function getTemperatureColor(temp: number): { r: number; g: number; b: number } {
  // Normaliser la température entre 0 et 1
  const normalized = Math.max(0, Math.min(1, (temp + 20) / 55)); // -20°C à 35°C

  let r, g, b;

  if (normalized < 0.25) {
    // Bleu foncé -> bleu clair
    const t = normalized / 0.25;
    r = Math.floor(50 + t * 50);
    g = Math.floor(100 + t * 100);
    b = Math.floor(200 + t * 55);
  } else if (normalized < 0.5) {
    // Bleu clair -> vert
    const t = (normalized - 0.25) / 0.25;
    r = Math.floor(100 + t * 50);
    g = Math.floor(200 + t * 55);
    b = Math.floor(255 - t * 155);
  } else if (normalized < 0.75) {
    // Vert -> jaune
    const t = (normalized - 0.5) / 0.25;
    r = Math.floor(150 + t * 105);
    g = Math.floor(255);
    b = Math.floor(100 - t * 100);
  } else {
    // Jaune -> rouge
    const t = (normalized - 0.75) / 0.25;
    r = Math.floor(255);
    g = Math.floor(255 - t * 105);
    b = Math.floor(0);
  }

  return { r, g, b };
}
