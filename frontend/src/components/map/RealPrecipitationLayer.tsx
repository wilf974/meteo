import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { useMapStore } from '../../store/mapStore';
import { getForecast, getWeatherAtTime, type ForecastResponse } from '../../services/openMeteo.service';

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

        // Adjust grid density based on zoom level
        const gridSize = zoom > 8 ? 8 : zoom > 6 ? 6 : 4;

        const latStep = (bounds.getNorth() - bounds.getSouth()) / gridSize;
        const lonStep = (bounds.getEast() - bounds.getWest()) / gridSize;

        console.log('💧 Fetching precipitation grid:', gridSize, 'x', gridSize);

        const newGridData: GridPoint[] = [];
        const promises: Promise<void>[] = [];

        for (let i = 0; i <= gridSize; i++) {
          for (let j = 0; j <= gridSize; j++) {
            const lat = bounds.getSouth() + i * latStep;
            const lon = bounds.getWest() + j * lonStep;

            const promise = getForecast(lat, lon)
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

      // Draw precipitation zones using grid data
      gridDataRef.current.forEach((point, index) => {
        if (!point.forecast) return;

        const weatherData = getWeatherAtTime(point.forecast, selectedTime);
        if (!weatherData || weatherData.precipitation === 0) return;

        // Convert lat/lon to screen coordinates
        const latLng = { lat: point.lat, lng: point.lon };
        const screenPoint = map.latLngToContainerPoint(latLng);

        // Calculate precipitation intensity (0-20mm/h)
        const precip = weatherData.precipitation;
        const intensity = Math.min(precip / 20, 1); // Normalize to 0-1

        // Draw zone with gradient based on intensity
        const zoneSize = 150; // Size of each precipitation zone
        const gradient = ctx.createRadialGradient(
          screenPoint.x, screenPoint.y, 0,
          screenPoint.x, screenPoint.y, zoneSize
        );

        // Color based on intensity: light blue to dark blue
        const alpha = intensity * opacity * 0.6;
        gradient.addColorStop(0, `rgba(100, 150, 255, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(80, 120, 220, ${alpha * 0.5})`);
        gradient.addColorStop(1, `rgba(60, 90, 180, 0)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(
          screenPoint.x - zoneSize,
          screenPoint.y - zoneSize,
          zoneSize * 2,
          zoneSize * 2
        );
      });

      // Draw legend
      const maxPrecip = Math.max(
        ...gridDataRef.current
          .filter(p => p.forecast)
          .map(p => {
            const data = getWeatherAtTime(p.forecast!, selectedTime);
            return data ? data.precipitation : 0;
          })
      );

      if (maxPrecip > 0) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, canvas.height - 60, 200, 50);

        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(`💧 Précipitations max:`, 20, canvas.height - 35);
        ctx.fillText(`${maxPrecip.toFixed(1)} mm/h`, 20, canvas.height - 18);
      }
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
