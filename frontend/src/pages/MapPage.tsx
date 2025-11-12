import { useEffect } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import { useMapStore } from '../store/mapStore';
import { useAuthStore } from '../store/authStore';
import { socketService } from '../lib/socket';
import LayerControl from '../components/map/LayerControl';
import WeatherInfo from '../components/map/WeatherInfo';
import Timeline from '../components/map/Timeline';
import RealTemperatureLayer from '../components/map/RealTemperatureLayer';
import RealPrecipitationLayer from '../components/map/RealPrecipitationLayer';
import RealWindLayer from '../components/map/RealWindLayer';
import RealCloudLayer from '../components/map/RealCloudLayer';
import 'leaflet/dist/leaflet.css';

function MapEvents() {
  const { setCenter, setZoom, setSelectedPoint } = useMapStore();

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
}

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
        <MapEvents />
      </MapContainer>

      <LayerControl />
      <WeatherInfo />
      <Timeline />
    </div>
  );
}
