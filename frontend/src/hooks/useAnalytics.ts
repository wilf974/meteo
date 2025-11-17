import { useEffect, useRef } from 'react';

// Use relative URL to work with nginx proxy
// In production, nginx routes /api to backend:5001
const API_URL = '/api/v1';

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
        console.log('📊 Attempting to track connection...');
        const response = await fetch(`${API_URL}/analytics/track`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          console.log('✅ Connection tracked successfully');
          tracked.current = true;
        } else {
          console.warn('⚠️ Failed to track connection:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('❌ Error tracking connection:', error);
      }
    };

    trackConnection();
  }, []);
}
