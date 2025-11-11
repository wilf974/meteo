import { useQuery } from '@tanstack/react-query';
import { useMapStore } from '../../store/mapStore';
import { weatherApi } from '../../lib/api';
import { X, Thermometer, Wind, Droplets, Gauge } from 'lucide-react';

export default function WeatherInfo() {
  const { selectedPoint, setSelectedPoint } = useMapStore();

  const { data, isLoading } = useQuery({
    queryKey: ['weather', selectedPoint?.lat, selectedPoint?.lon],
    queryFn: () =>
      selectedPoint
        ? weatherApi.getCurrent(selectedPoint.lat, selectedPoint.lon)
        : null,
    enabled: !!selectedPoint,
  });

  if (!selectedPoint) return null;

  return (
    <div className="absolute bottom-24 left-4 z-[1000] bg-gray-800 rounded-lg shadow-xl border border-gray-700 w-80 animate-in slide-in-from-left duration-300">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="font-semibold text-white">Météo actuelle</h3>
        <button
          onClick={() => setSelectedPoint(null)}
          className="text-gray-400 hover:text-white hover:scale-110 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="text-gray-400 text-center py-8">Chargement...</div>
        ) : data?.data?.data ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Thermometer className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-xs text-gray-400">Température</p>
                <p className="text-white font-semibold">
                  {data.data.data.temperature}°C
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Wind className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-xs text-gray-400">Vent</p>
                <p className="text-white font-semibold">
                  {data.data.data.windSpeed} km/h
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Droplets className="w-5 h-5 text-cyan-500" />
              <div>
                <p className="text-xs text-gray-400">Humidité</p>
                <p className="text-white font-semibold">
                  {data.data.data.humidity}%
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Gauge className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-xs text-gray-400">Pression</p>
                <p className="text-white font-semibold">
                  {data.data.data.pressure} hPa
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-400 text-center py-8">
            Aucune donnée disponible
          </div>
        )}
      </div>
    </div>
  );
}
