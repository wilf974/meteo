import { create } from 'zustand';

export interface LayerConfig {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  opacity: number;
  order: number;
}

interface MapState {
  activeLayers: LayerConfig[];
  center: [number, number];
  zoom: number;
  timelinePosition: Date;
  isPlaying: boolean;
  selectedPoint: { lat: number; lon: number } | null;
  setActiveLayers: (layers: LayerConfig[]) => void;
  toggleLayer: (layerId: string) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setTimelinePosition: (time: Date) => void;
  setIsPlaying: (playing: boolean) => void;
  setSelectedPoint: (point: { lat: number; lon: number } | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  activeLayers: [
    { id: 'temperature', name: 'Température', type: 'heatmap', enabled: true, opacity: 0.7, order: 1 },
    { id: 'precipitation', name: 'Précipitations', type: 'overlay', enabled: true, opacity: 0.8, order: 2 },
    { id: 'wind', name: 'Vent', type: 'vector', enabled: true, opacity: 0.6, order: 3 },
    { id: 'clouds', name: 'Nuages', type: 'overlay', enabled: true, opacity: 0.5, order: 4 },
    { id: 'pressure', name: 'Pression', type: 'heatmap', enabled: false, opacity: 0.6, order: 5 },
    { id: 'airquality', name: 'Qualité de l\'air', type: 'heatmap', enabled: false, opacity: 0.6, order: 6 },
  ],
  center: [46.603354, 1.888334], // Centre de la France
  zoom: 6,
  timelinePosition: new Date(),
  isPlaying: false,
  selectedPoint: null,
  setActiveLayers: (layers) => set({ activeLayers: layers }),
  toggleLayer: (layerId) => set((state) => ({
    activeLayers: state.activeLayers.map((layer) =>
      layer.id === layerId ? { ...layer, enabled: !layer.enabled } : layer
    ),
  })),
  setLayerOpacity: (layerId, opacity) => set((state) => ({
    activeLayers: state.activeLayers.map((layer) =>
      layer.id === layerId ? { ...layer, opacity } : layer
    ),
  })),
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setTimelinePosition: (time) => set({ timelinePosition: time }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setSelectedPoint: (point) => set({ selectedPoint: point }),
}));
