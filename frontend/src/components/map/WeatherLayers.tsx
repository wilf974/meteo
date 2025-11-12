import { TileLayer } from 'react-leaflet';
import { useMapStore } from '../../store/mapStore';
import { useEffect, useState } from 'react';

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || '2ec0e6de17b1cde328190d75deb1c7df';

// Mapping des IDs de couches vers les noms de tuiles OpenWeatherMap
const LAYER_MAP: Record<string, string> = {
  temperature: 'temp_new',
  precipitation: 'precipitation_new',
  wind: 'wind_new',
  clouds: 'clouds_new',
  pressure: 'pressure_new',
};

export default function WeatherLayers() {
  const { activeLayers, timelinePosition } = useMapStore();
  const [timestamp, setTimestamp] = useState<number>(Date.now());

  // Mettre à jour le timestamp quand la timeline change
  useEffect(() => {
    const selectedTime = new Date(timelinePosition);
    setTimestamp(Math.floor(selectedTime.getTime() / 1000));
  }, [timelinePosition]);

  return (
    <>
      {activeLayers
        .filter((layer) => layer.enabled && LAYER_MAP[layer.id])
        .sort((a, b) => a.order - b.order)
        .map((layer) => {
          // Ajouter le timestamp pour animer les couches selon l'horaire
          // Note: Les tuiles gratuites OpenWeatherMap ne supportent que les données actuelles
          // Pour les données temporelles, il faudrait un abonnement payant
          const url = `https://tile.openweathermap.org/map/${LAYER_MAP[layer.id]}/{z}/{x}/{y}.png?appid=${API_KEY}`;

          return (
            <TileLayer
              key={`${layer.id}-${timestamp}`}
              url={url}
              opacity={layer.opacity}
              attribution='&copy; <a href="https://openweathermap.org">OpenWeatherMap</a>'
            />
          );
        })}
    </>
  );
}
