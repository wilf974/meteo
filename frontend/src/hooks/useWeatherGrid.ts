import { useEffect, useRef } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { useMapStore, type GridPoint } from '../store/mapStore';
import { weatherCache } from '../services/weatherCache.service';

/**
 * Hook centralisé pour gérer la grille météo partagée entre tous les layers
 * - Réduit le nombre de requêtes en centralisant la récupération
 * - Implémente un rate limiter pour éviter les erreurs 429
 * - Ajoute un retry avec exponential backoff
 * - Stocke les données dans le store pour partage entre layers
 */
export function useWeatherGrid(map: LeafletMap, enabled: boolean) {
  const { setWeatherGrid, setIsLoadingGrid } = useMapStore();
  const fetchTimeoutRef = useRef<NodeJS.Timeout>();
  const isLoadingRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      setWeatherGrid([]);
      return;
    }

    let debounceTimer: NodeJS.Timeout;

    const fetchGridData = async () => {
      // Prevent concurrent fetches
      if (isLoadingRef.current) {
        console.log('⏸️ Grid fetch already in progress, skipping...');
        return;
      }

      try {
        isLoadingRef.current = true;
        setIsLoadingGrid(true);

        const bounds = map.getBounds();
        const zoom = map.getZoom();

        // OPTIMIZED grid size: max 6 points (was 8)
        // 6x6 = 36 points total (was 64) - 44% fewer requests!
        const gridSize = zoom > 10 ? 6 : zoom > 7 ? 5 : 4;

        const latStep = (bounds.getNorth() - bounds.getSouth()) / gridSize;
        const lonStep = (bounds.getEast() - bounds.getWest()) / gridSize;

        console.log('🌐 Fetching SHARED weather grid:', gridSize, 'x', gridSize, '=', (gridSize + 1) * (gridSize + 1), 'points');

        const newGridData: GridPoint[] = [];

        // Optimized rate limiting: Larger batches, less delay
        const BATCH_SIZE = 10; // Process 10 at a time (was 5)
        const BATCH_DELAY = 100; // Reduced delay: 100ms (was 200ms)

        const allPoints: Array<{ lat: number; lon: number }> = [];
        for (let i = 0; i <= gridSize; i++) {
          for (let j = 0; j <= gridSize; j++) {
            const lat = bounds.getSouth() + i * latStep;
            const lon = bounds.getWest() + j * lonStep;
            allPoints.push({ lat, lon });
          }
        }

        // Process in batches with delay
        for (let i = 0; i < allPoints.length; i += BATCH_SIZE) {
          const batch = allPoints.slice(i, i + BATCH_SIZE);

          const batchPromises = batch.map(({ lat, lon }) =>
            retryWithBackoff(() => weatherCache.getForecast(lat, lon), 3)
              .then(forecast => {
                newGridData.push({ lat, lon, forecast });
              })
              .catch(error => {
                console.warn(`Failed to fetch grid point (${lat}, ${lon}):`, error.message);
                newGridData.push({ lat, lon, forecast: null });
              })
          );

          await Promise.all(batchPromises);

          // Add delay between batches (except for last batch)
          if (i + BATCH_SIZE < allPoints.length) {
            await delay(BATCH_DELAY);
          }
        }

        setWeatherGrid(newGridData);
        console.log('✅ Shared weather grid loaded:', newGridData.length, 'points');
      } catch (error) {
        console.error('❌ Error fetching shared weather grid:', error);
        setWeatherGrid([]);
      } finally {
        isLoadingRef.current = false;
        setIsLoadingGrid(false);
      }
    };

    // Debounced fetch handler - OPTIMIZED
    const debouncedFetch = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(fetchGridData, 800); // Increased to 800ms for better performance
    };

    fetchGridData();

    map.on('moveend', debouncedFetch);
    map.on('zoomend', debouncedFetch);

    return () => {
      clearTimeout(debounceTimer);
      map.off('moveend', debouncedFetch);
      map.off('zoomend', debouncedFetch);
      isLoadingRef.current = false;
    };
  }, [map, enabled, setWeatherGrid, setIsLoadingGrid]);
}

/**
 * Retry a function with exponential backoff
 * Useful for handling 429 (Too Many Requests) errors
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Check if it's a 429 error
      if (error?.response?.status === 429 || error?.status === 429) {
        const retryDelay = baseDelay * Math.pow(2, i); // Exponential backoff: 1s, 2s, 4s
        console.warn(`⏳ Rate limited (429), retrying in ${retryDelay}ms... (attempt ${i + 1}/${maxRetries})`);
        await delay(retryDelay);
      } else {
        // For non-429 errors, throw immediately
        throw error;
      }
    }
  }

  // If we've exhausted all retries, throw the last error
  throw lastError;
}

/**
 * Promise-based delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
