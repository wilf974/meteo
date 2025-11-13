import { useEffect, lazy, Suspense, memo } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import { useMapStore } from '../store/mapStore';
import { useSetCenter, useSetZoom, useSetSelectedPoint } from '../store/mapSelectors';
import { useAuthStore } from '../store/authStore';
import { socketService } from '../lib/socket';
import LayerControl from '../components/map/LayerControl';
import WeatherInfo from '../components/map/WeatherInfo';
import Timeline from '../components/map/Timeline';
import ThemeToggle from '../components/ThemeToggle';
import RealTemperatureLayer from '../components/map/RealTemperatureLayer';
import RealPrecipitationLayer from '../components/map/RealPrecipitationLayer';
import RealWindLayer from '../components/map/RealWindLayer';
import RealCloudLayer from '../components/map/RealCloudLayer';
import 'leaflet/dist/leaflet.css';

// Lazy load non-critical components for better initial load performance
const LocationSearch = lazy(() => import('../components/map/LocationSearch'));
const MapLegend = lazy(() => import('../components/map/MapLegend'));
const FavoritesPanel = lazy(() => import('../components/FavoritesPanel'));

const MapEvents = memo(function MapEvents() {
  const setCenter = useSetCenter();
  const setZoom = useSetZoom();
  const setSelectedPoint = useSetSelectedPoint();

  useMapEvents({
    moveend: (e) => {
      const center = e.target.getCenter();
      setCenter([center.lat, center.lng]);
    },
    zoomend: (e) => {
      setZoom(e.target.getZoom());
    },
    click: (e) => {
      setSelectedPoint({ lat: e.latlng.lat, lon: e.latlng.lng });
    },
  });

  return null;
});

export default function MapPage() {
  const { center, zoom, activeLayers } = useMapStore();
  const { token } = useAuthStore();

  useEffect(() => {
    if (token) {
      const socket = socketService.connect(token);
      socketService.joinRoom('main-map');

      return () => {
        socketService.leaveRoom('main-map');
      };
    }
  }, [token]);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Open-Meteo grid-based layers - vraies zones météo qui se déplacent */}
        <RealTemperatureLayer />
        <RealCloudLayer />
        <RealPrecipitationLayer />
        <RealWindLayer />

        {/* Location search with autocomplete - Lazy loaded */}
        <Suspense fallback={<div />}>
          <LocationSearch />
        </Suspense>

        {/* Favorites panel - Lazy loaded */}
        <Suspense fallback={<div />}>
          <FavoritesPanel />
        </Suspense>

        <MapEvents />
      </MapContainer>

      <ThemeToggle />
      <LayerControl />
      <WeatherInfo />
      <Timeline />

      {/* Map legend - Lazy loaded */}
      <Suspense fallback={<div />}>
        <MapLegend />
      </Suspense>
    </div>
  );
}
