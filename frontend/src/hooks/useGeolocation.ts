import { useEffect, useState, useCallback } from 'react';

export interface GeolocationCoordinates {
  lat: number;
  lon: number;
  accuracy: number;
}

export interface UseGeolocationReturn {
  coords: GeolocationCoordinates | null;
  error: string | null;
  loading: boolean;
  requestPermission: () => void;
}

export function useGeolocation(): UseGeolocationReturn {
  const [coords, setCoords] = useState<GeolocationCoordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const requestPermission = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setError(null);
        setLoading(false);
        // Store in localStorage that user granted permission
        localStorage.setItem('meteo-geolocation-allowed', 'true');
      },
      (err) => {
        let errorMessage = 'Unknown geolocation error';

        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Geolocation permission denied. Click to request again.';
            localStorage.setItem('meteo-geolocation-denied', 'true');
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Geolocation position unavailable';
            break;
          case err.TIMEOUT:
            errorMessage = 'Geolocation request timeout';
            break;
        }

        setError(errorMessage);
        setCoords(null);
        setLoading(false);
      },
      {
        enableHighAccuracy: false, // Don't drain battery with high precision
        timeout: 10000, // 10 second timeout
        maximumAge: 5 * 60 * 1000, // Cache position for 5 minutes
      }
    );
  }, []);

  // Auto-request geolocation on mount if user previously allowed it
  useEffect(() => {
    const denied = localStorage.getItem('meteo-geolocation-denied');
    const allowed = localStorage.getItem('meteo-geolocation-allowed');

    // Only auto-request if user hasn't explicitly denied permission
    if (!denied) {
      requestPermission();
    } else {
      setLoading(false);
    }
  }, [requestPermission]);

  return { coords, error, loading, requestPermission };
}
