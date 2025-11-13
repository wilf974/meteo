import { useEffect, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

/**
 * Hook to track user connections
 * Automatically sends a tracking request when the app loads
 */
export function useAnalytics() {
  const tracked = useRef(false);

  useEffect(() => {
    // Only track once per session
    if (tracked.current) return;

    const trackConnection = async () => {
      try {
        const response = await fetch(`${API_URL}/analytics/track`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          console.log('📊 Connection tracked');
          tracked.current = true;
        } else {
          console.warn('⚠️ Failed to track connection:', response.statusText);
        }
      } catch (error) {
        console.error('❌ Error tracking connection:', error);
      }
    };

    trackConnection();
  }, []);
}
