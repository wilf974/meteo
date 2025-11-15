import { useEffect, useRef, memo } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useMapStore } from '../../store/mapStore';
import { weatherCache } from '../../services/weatherCache.service';
import { type LightningStrike } from '../../services/lightning.service';

const RealLightningLayer = memo(function RealLightningLayer() {
  const map = useMap();
  const { activeLayers } = useMapStore();
  const layerGroupRef = useRef<L.FeatureGroup | null>(null);
  const animationFrameRef = useRef<number>();
  const strikesRef = useRef<Map<string, { element: L.CircleMarker; birthTime: number }>>(new Map());
  const strikesCacheRef = useRef<LightningStrike[]>([]);
  const lastFetchRef = useRef<number>(0);

  const lightningLayer = activeLayers.find(l => l.id === 'lightning');
  const isEnabled = lightningLayer?.enabled || false;
  const opacity = lightningLayer?.opacity || 0.8;

  // Fetch lightning strikes when enabled or map bounds change
  useEffect(() => {
    if (!isEnabled) {
      if (layerGroupRef.current) {
        layerGroupRef.current.clearLayers();
      }
      return;
    }

    let debounceTimer: NodeJS.Timeout;

    const fetchLightningData = async () => {
      try {
        const bounds = map.getBounds();
        const now = Date.now();

        // Throttle requests - max every 5 seconds
        if (now - lastFetchRef.current < 5000) {
          return;
        }
        lastFetchRef.current = now;

        console.log('⚡ Fetching lightning strikes for bbox');

        const strikes = await weatherCache.getLightning(
          bounds.getSouth(),
          bounds.getNorth(),
          bounds.getWest(),
          bounds.getEast()
        );

        strikesCacheRef.current = strikes;
      } catch (error) {
        console.error('Error fetching lightning:', error);
      }
    };

    // Fetch immediately and on map events
    fetchLightningData();

    const onMoveEnd = () => {
      debounceTimer = setTimeout(() => {
        fetchLightningData();
      }, 300); // Debounce 300ms
    };

    map.on('moveend', onMoveEnd);

    return () => {
      map.off('moveend', onMoveEnd);
      clearTimeout(debounceTimer);
    };
  }, [isEnabled, map]);

  // Create or update lightning strikes layer visualization
  useEffect(() => {
    if (!isEnabled) return;

    if (!layerGroupRef.current) {
      layerGroupRef.current = L.featureGroup().addTo(map);
    }

    const layerGroup = layerGroupRef.current;
    const now = Date.now();
    const strikes = strikesCacheRef.current;
    const activeStrikes = new Map<string, LightningStrike>();
    const maxAge = 60 * 1000; // 60 seconds max age

    // Add new strikes and mark active ones
    strikes.forEach(strike => {
      const age = now - strike.timestamp;
      if (age < maxAge) {
        activeStrikes.set(strike.id, strike);
      }
    });

    // Remove old strikes
    for (const [id, data] of strikesRef.current.entries()) {
      if (!activeStrikes.has(id)) {
        layerGroup.removeLayer(data.element);
        strikesRef.current.delete(id);
      }
    }

    // Add new strikes
    activeStrikes.forEach((strike, id) => {
      if (!strikesRef.current.has(id)) {
        // Create animated circle for lightning strike
        const circle = L.circleMarker([strike.latitude, strike.longitude], {
          radius: 4,
          fillColor: '#fff700', // Bright yellow
          color: '#ffd700', // Gold outline
          weight: 2,
          opacity: opacity,
          fillOpacity: Math.min(0.8, opacity * 1.2),
          interactive: false,
        });

        circle.addTo(layerGroup);
        strikesRef.current.set(id, {
          element: circle,
          birthTime: now,
        });
      }
    });

    // Update opacity
    layerGroup.eachLayer(layer => {
      if (layer instanceof L.CircleMarker) {
        (layer as any).setStyle({
          opacity: opacity,
          fillOpacity: Math.min(0.8, opacity * 1.2),
        });
      }
    });

    // Animation loop for pulsing effect
    const animate = () => {
      const now = Date.now();

      strikesRef.current.forEach((data, id) => {
        const element = data.element;
        const age = now - data.birthTime; // Time since strike was created (not since it occurred)
        const maxDisplayAge = 5000; // 5 seconds display time

        if (age > maxDisplayAge) {
          // Remove old strike from display
          if (layerGroup.hasLayer(element)) {
            layerGroup.removeLayer(element);
          }
          strikesRef.current.delete(id);
          return;
        }

        // Pulsing animation: size grows then shrinks
        const pulseProgress = (age % 600) / 600; // Complete pulse every 600ms
        const pulseSize = 4 + Math.sin(pulseProgress * Math.PI * 2) * 3; // 1-7 radius

        // Fade out in last second
        const fadeOutStart = maxDisplayAge - 1000;
        let fadeOpacity = opacity;
        if (age > fadeOutStart) {
          fadeOpacity = opacity * ((maxDisplayAge - age) / 1000);
        }

        try {
          (element as any).setStyle({
            radius: pulseSize,
            opacity: fadeOpacity,
            fillOpacity: Math.min(0.8, fadeOpacity * 1.2),
          });
        } catch (e) {
          // Silently ignore errors
        }
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isEnabled, opacity, map]);

  return null;
});

export default RealLightningLayer;
