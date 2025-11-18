import { useEffect, useRef } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { useMapStore, type GridPoint } from '../store/mapStore';
import { websocketService } from '../services/websocket.service';

/**
 * Hook centralisé pour gérer la grille météo partagée entre tous les layers
 * - Utilise WebSocket pour une récupération ultra-rapide
 * - Une seule requête batch pour toute la grille (au lieu de 36+ requêtes HTTP)
 * - Cache Redis côté backend pour performance maximale
 * - Pas de rate limiting grâce au traitement batch côté serveur
 * - Stocke les données dans le store pour partage entre layers
 */
export function useWeatherGrid(map: LeafletMap, enabled: boolean) {
  const { setWeatherGrid, setIsLoadingGrid } = useMapStore();
  const fetchTimeoutRef = useRef<number>();
  const isLoadingRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      setWeatherGrid([]);
      return;
    }

    let debounceTimer: number;
    let isFirstFetch = true;

    const fetchGridData = async () => {
      // Prevent concurrent fetches
      if (isLoadingRef.current) {
        console.log('⏸️ Grid fetch already in progress, skipping...');
        return;
      }

      // Check WebSocket connection
      if (!websocketService.isConnected()) {
        console.warn('⚠️ WebSocket not connected, will retry when connected...');
        // On first mount, attempt reconnection
        if (isFirstFetch) {
          websocketService.reconnect();
          isFirstFetch = false;
        }
        return;
      }

      try {
        isLoadingRef.current = true;
        setIsLoadingGrid(true);

        const bounds = map.getBounds();
        const zoom = map.getZoom();

        console.log('🗺️ Map bounds:', {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
          center: map.getCenter(),
          zoom
        });

        // OPTIMIZED grid size: Can use larger grids now with WebSocket!
        // 8x8 = 64 points, but sent as ONE WebSocket request
        const gridSize = zoom > 10 ? 8 : zoom > 7 ? 6 : 4;

        const latStep = (bounds.getNorth() - bounds.getSouth()) / gridSize;
        const lonStep = (bounds.getEast() - bounds.getWest()) / gridSize;

        console.log(`🚀 WebSocket grid request: ${gridSize}x${gridSize} = ${(gridSize + 1) * (gridSize + 1)} points`);

        const allPoints: Array<{ lat: number; lon: number }> = [];
        for (let i = 0; i <= gridSize; i++) {
          for (let j = 0; j <= gridSize; j++) {
            const lat = bounds.getSouth() + i * latStep;
            const lon = bounds.getWest() + j * lonStep;
            allPoints.push({ lat, lon });
          }
        }

        const startTime = performance.now();

        // SINGLE WebSocket request for entire grid! 🚀
        const response = await websocketService.getWeatherGrid(allPoints);

        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);

        // Convert response to GridPoint format
        const newGridData: GridPoint[] = response.results.map(result => ({
          lat: result.lat,
          lon: result.lon,
          forecast: result.forecast,
        }));

        setWeatherGrid(newGridData);

        console.log(
          `✅ Grid loaded via WebSocket in ${duration}ms | ` +
          `${response.cached} cached, ${response.fresh} fresh | ` +
          `${newGridData.length} points total`
        );

        // DEBUG: Log first point to verify data structure
        if (newGridData.length > 0) {
          const firstPoint = newGridData[0];
          console.log('🔍 First grid point sample:', {
            lat: firstPoint.lat,
            lon: firstPoint.lon,
            hasForecast: !!firstPoint.forecast,
            forecastKeys: firstPoint.forecast ? Object.keys(firstPoint.forecast) : [],
            firstHourlyKeys: firstPoint.forecast?.hourly ? Object.keys(firstPoint.forecast.hourly) : []
          });
        }
      } catch (error: any) {
        console.error('❌ WebSocket grid error:', error.message);
        // Fallback: Clear grid on error
        setWeatherGrid([]);
      } finally {
        isLoadingRef.current = false;
        setIsLoadingGrid(false);
      }
    };

    // Debounced fetch handler
    const debouncedFetch = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(fetchGridData, 500); // Reduced to 500ms (was 800ms) - WebSocket is faster!
    };

    fetchGridData();

    map.on('moveend', debouncedFetch);
    map.on('zoomend', debouncedFetch);

    // CRITICAL FIX: Listen for WebSocket connection and fetch data when connected
    // This ensures data loads even if WebSocket connects AFTER component mounts
    const socket = websocketService.getSocket();
    if (socket) {
      const onConnect = () => {
        console.log('🔄 WebSocket connected, fetching grid data...');
        fetchGridData();
      };
      socket.on('connect', onConnect);

      // Cleanup
      return () => {
        clearTimeout(debounceTimer);
        map.off('moveend', debouncedFetch);
        map.off('zoomend', debouncedFetch);
        if (socket) {
          socket.off('connect', onConnect);
        }
        isLoadingRef.current = false;
      };
    }

    return () => {
      clearTimeout(debounceTimer);
      map.off('moveend', debouncedFetch);
      map.off('zoomend', debouncedFetch);
      isLoadingRef.current = false;
    };
  }, [map, enabled, setWeatherGrid, setIsLoadingGrid]);
}

// No more rate limiting issues with WebSocket! 🚀
// All helper functions removed - WebSocket handles everything
