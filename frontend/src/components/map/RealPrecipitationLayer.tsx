import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { useMapStore } from '../../store/mapStore';
import { getWeatherAtTime, type ForecastResponse } from '../../services/openMeteo.service';
import { weatherCache } from '../../services/weatherCache.service';

interface GridPoint {
  lat: number;
  lon: number;
  forecast: ForecastResponse | null;
}

export default function RealPrecipitationLayer() {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const gridDataRef = useRef<GridPoint[]>([]);
  const { activeLayers, timelinePosition } = useMapStore();

  const precipLayer = activeLayers.find(l => l.id === 'precipitation');
  const isEnabled = precipLayer?.enabled || false;
  const opacity = precipLayer?.opacity || 1;

  // Fetch grid data for the visible map area
  useEffect(() => {
    if (!isEnabled) return;

    const fetchGridData = async () => {
      try {
        const bounds = map.getBounds();
        const zoom = map.getZoom();

        // Adjust grid density based on zoom level - increased density
        const gridSize = zoom > 8 ? 12 : zoom > 6 ? 8 : 6;

        const latStep = (bounds.getNorth() - bounds.getSouth()) / gridSize;
        const lonStep = (bounds.getEast() - bounds.getWest()) / gridSize;

        console.log('💧 Fetching precipitation grid:', gridSize, 'x', gridSize);

        const newGridData: GridPoint[] = [];
        const promises: Promise<void>[] = [];

        for (let i = 0; i <= gridSize; i++) {
          for (let j = 0; j <= gridSize; j++) {
            const lat = bounds.getSouth() + i * latStep;
            const lon = bounds.getWest() + j * lonStep;

            const promise = weatherCache.getForecast(lat, lon)
              .then(forecast => {
                newGridData.push({ lat, lon, forecast });
              })
              .catch(error => {
                console.error('Error fetching grid point:', lat, lon, error);
                newGridData.push({ lat, lon, forecast: null });
              });

            promises.push(promise);
          }
        }

        await Promise.all(promises);
        gridDataRef.current = newGridData;
        console.log('💧 Grid data loaded:', newGridData.length, 'points');
      } catch (error) {
        console.error('💧 Error fetching grid data:', error);
      }
    };

    fetchGridData();

    const handleMoveEnd = () => {
      fetchGridData();
    };

    map.on('moveend', handleMoveEnd);
    map.on('zoomend', handleMoveEnd);

    return () => {
      map.off('moveend', handleMoveEnd);
      map.off('zoomend', handleMoveEnd);
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
    };

    resizeCanvas();
    map.on('resize', resizeCanvas);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (gridDataRef.current.length === 0) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(canvas.width / 2 - 100, canvas.height / 2 - 25, 200, 50);
        ctx.fillStyle = 'white';
        ctx.font = '14px sans-serif';
        ctx.fillText('Chargement zones météo...', canvas.width / 2 - 90, canvas.height / 2 + 5);
        return;
      }

      const selectedTime = new Date(timelinePosition);

      // Count precipitation zones for debugging
      let precipCount = 0;

      // Draw precipitation zones using grid data
      gridDataRef.current.forEach((point, index) => {
        if (!point.forecast) return;

        const weatherData = getWeatherAtTime(point.forecast, selectedTime);
        if (!weatherData) return;

        // Debug: log precipitation data
        if (weatherData.precipitation > 0) {
          precipCount++;
          console.log(`💧 Point ${index}: ${weatherData.precipitation.toFixed(2)} mm/h at`, point.lat.toFixed(2), point.lon.toFixed(2));
        }

        if (weatherData.precipitation === 0) return;

        // Convert lat/lon to screen coordinates
        const latLng = { lat: point.lat, lng: point.lon };
        const screenPoint = map.latLngToContainerPoint(latLng);

        // Calculate precipitation intensity (0-20mm/h)
        const precip = weatherData.precipitation;
        const intensity = Math.min(precip / 10, 1); // Normalize to 0-1 (adjusted for better visibility)

        // Draw zone with gradient based on intensity - MUCH MORE VISIBLE
        const zoneSize = 200; // Larger zones
        const gradient = ctx.createRadialGradient(
          screenPoint.x, screenPoint.y, 0,
          screenPoint.x, screenPoint.y, zoneSize
        );

        // Stronger colors based on intensity
        const alpha = Math.max(0.3, intensity) * opacity * 0.9; // Minimum 0.3 alpha, max 0.9

        if (precip < 1) {
          // Light rain - light blue
          gradient.addColorStop(0, `rgba(150, 200, 255, ${alpha})`);
          gradient.addColorStop(0.5, `rgba(100, 170, 255, ${alpha * 0.6})`);
          gradient.addColorStop(1, `rgba(80, 150, 240, 0)`);
        } else if (precip < 5) {
          // Moderate rain - blue
          gradient.addColorStop(0, `rgba(80, 150, 255, ${alpha})`);
          gradient.addColorStop(0.5, `rgba(60, 120, 230, ${alpha * 0.6})`);
          gradient.addColorStop(1, `rgba(40, 100, 200, 0)`);
        } else {
          // Heavy rain - dark blue/purple
          gradient.addColorStop(0, `rgba(60, 100, 200, ${alpha})`);
          gradient.addColorStop(0.5, `rgba(40, 70, 170, ${alpha * 0.6})`);
          gradient.addColorStop(1, `rgba(20, 50, 140, 0)`);
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(
          screenPoint.x - zoneSize,
          screenPoint.y - zoneSize,
          zoneSize * 2,
          zoneSize * 2
        );
      });

      // Draw legend and debug info
      const maxPrecip = Math.max(
        ...gridDataRef.current
          .filter(p => p.forecast)
          .map(p => {
            const data = getWeatherAtTime(p.forecast!, selectedTime);
            return data ? data.precipitation : 0;
          })
      );

      // Always show the legend with debug info
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, canvas.height - 80, 250, 70);

      ctx.fillStyle = 'white';
      ctx.font = 'bold 14px sans-serif';

      if (maxPrecip > 0) {
        ctx.fillText(`💧 Précipitations max: ${maxPrecip.toFixed(1)} mm/h`, 20, canvas.height - 55);
        ctx.fillText(`Zones avec pluie: ${precipCount}/${gridDataRef.current.length}`, 20, canvas.height - 35);
      } else {
        ctx.fillText(`💧 Aucune précipitation détectée`, 20, canvas.height - 55);
        ctx.fillText(`Points vérifiés: ${gridDataRef.current.length}`, 20, canvas.height - 35);
      }
      ctx.font = '11px sans-serif';
      ctx.fillText(`Timeline: ${selectedTime.toLocaleTimeString('fr-FR')}`, 20, canvas.height - 15);

      // Draw grid points for debugging (small dots)
      ctx.globalAlpha = 0.6;
      gridDataRef.current.forEach((point) => {
        const latLng = { lat: point.lat, lng: point.lon };
        const screenPoint = map.latLngToContainerPoint(latLng);

        // Draw a small circle at each grid point
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(screenPoint.x, screenPoint.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
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
