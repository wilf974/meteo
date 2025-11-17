import { useState, useEffect } from 'react';

interface NetworkStatus {
  online: boolean;
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
  downlink: number; // Mbps
  rtt: number; // ms (Round Trip Time)
  saveData: boolean;
}

/**
 * Hook pour détecter le statut réseau et adapter le contenu
 * Best practice 2025 - Network-aware components
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    online: navigator.onLine,
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false,
  });

  useEffect(() => {
    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

      setStatus({
        online: navigator.onLine,
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0,
        saveData: connection?.saveData || false,
      });
    };

    // Initial check
    updateNetworkStatus();

    // Event listeners
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
    }

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);

      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, []);

  return status;
}

/**
 * Hook pour adapter le comportement selon la qualité réseau
 */
export function useAdaptiveLoading() {
  const network = useNetworkStatus();

  const shouldLoadHighQuality = () => {
    if (!network.online) return false;
    if (network.saveData) return false;
    if (network.effectiveType === 'slow-2g' || network.effectiveType === '2g') return false;
    return true;
  };

  const shouldPreload = () => {
    if (!network.online) return false;
    if (network.saveData) return false;
    if (network.effectiveType === '4g' && network.downlink > 5) return true;
    return false;
  };

  const getImageQuality = (): 'low' | 'medium' | 'high' => {
    if (!network.online || network.saveData) return 'low';
    if (network.effectiveType === 'slow-2g' || network.effectiveType === '2g') return 'low';
    if (network.effectiveType === '3g') return 'medium';
    return 'high';
  };

  return {
    network,
    shouldLoadHighQuality: shouldLoadHighQuality(),
    shouldPreload: shouldPreload(),
    imageQuality: getImageQuality(),
    isSlow: network.effectiveType === 'slow-2g' || network.effectiveType === '2g',
  };
}
