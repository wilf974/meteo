import { useMap } from 'react-leaflet';
import { useWeatherGrid } from '../../hooks/useWeatherGrid';
import { useMapStore } from '../../store/mapStore';

/**
 * Composant invisible qui gère la récupération centralisée de la grille météo
 * pour tous les layers. Réduit drastiquement le nombre de requêtes API.
 */
export default function WeatherGridManager() {
  const map = useMap();
  const { activeLayers } = useMapStore();

  // Activer le fetch de la grille si au moins un layer est activé
  const hasActiveWeatherLayers = activeLayers.some(
    (layer) =>
      layer.enabled &&
      ['temperature', 'precipitation', 'wind', 'clouds', 'pressure'].includes(layer.id)
  );

  // Hook centralisé qui fetch et stocke les données dans le store
  useWeatherGrid(map, hasActiveWeatherLayers);

  // Composant invisible
  return null;
}
