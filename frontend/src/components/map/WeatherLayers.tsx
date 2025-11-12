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
  const { activeLayers } = useMapStore();

  // Note: Les tuiles gratuites OpenWeatherMap affichent TOUJOURS les données actuelles
  // Elles ne supportent PAS les timestamps historiques ou futurs
  // C'est pourquoi elles ne changent pas avec la timeline

  return (
    <>
      {activeLayers
        .filter((layer) => layer.enabled && LAYER_MAP[layer.id])
        .sort((a, b) => a.order - b.order)
        .map((layer) => (
          <TileLayer
            key={layer.id}
            url={`https://tile.openweathermap.org/map/${LAYER_MAP[layer.id]}/{z}/{x}/{y}.png?appid=${API_KEY}`}
            opacity={layer.opacity}
            attribution='&copy; <a href="https://openweathermap.org">OpenWeatherMap</a>'
          />
        ))}
    </>
  );
}
