import { useMapStore } from './mapStore';
import { shallow } from 'zustand/shallow';

/**
 * Optimized selectors for map store to prevent unnecessary re-renders
 * Each selector only subscribes to the specific state it needs
 */

// Layer selectors
export const useActiveLayers = () => useMapStore((state) => state.activeLayers);
export const useEnabledLayers = () => useMapStore((state) => state.activeLayers.filter(l => l.enabled), shallow);
export const useLayerById = (layerId: string) => useMapStore((state) =>
  state.activeLayers.find(l => l.id === layerId)
);

// Position selectors
export const useCenter = () => useMapStore((state) => state.center, shallow);
export const useZoom = () => useMapStore((state) => state.zoom);

// Timeline selectors
export const useTimelinePosition = () => useMapStore((state) => state.timelinePosition);
export const useIsPlaying = () => useMapStore((state) => state.isPlaying);
export const useTimelineControls = () => useMapStore(
  (state) => ({
    timelinePosition: state.timelinePosition,
    isPlaying: state.isPlaying,
    setTimelinePosition: state.setTimelinePosition,
    setIsPlaying: state.setIsPlaying,
  }),
  shallow
);

// Selection selectors
export const useSelectedPoint = () => useMapStore((state) => state.selectedPoint, shallow);

// Action selectors (don't cause re-renders)
export const useToggleLayer = () => useMapStore((state) => state.toggleLayer);
export const useSetLayerOpacity = () => useMapStore((state) => state.setLayerOpacity);
export const useSetCenter = () => useMapStore((state) => state.setCenter);
export const useSetZoom = () => useMapStore((state) => state.setZoom);
export const useSetTimelinePosition = () => useMapStore((state) => state.setTimelinePosition);
export const useSetIsPlaying = () => useMapStore((state) => state.setIsPlaying);
export const useSetSelectedPoint = () => useMapStore((state) => state.setSelectedPoint);

// Compound selectors for common combinations
export const useWeatherInfoState = () => useMapStore(
  (state) => ({
    selectedPoint: state.selectedPoint,
    timelinePosition: state.timelinePosition,
    setSelectedPoint: state.setSelectedPoint,
  }),
  shallow
);

export const useMapLegendState = () => useMapStore(
  (state) => ({
    activeLayers: state.activeLayers,
    center: state.center,
    timelinePosition: state.timelinePosition,
  }),
  shallow
);

export const useLayerControlState = () => useMapStore(
  (state) => ({
    activeLayers: state.activeLayers,
    toggleLayer: state.toggleLayer,
    setLayerOpacity: state.setLayerOpacity,
  }),
  shallow
);
