import { memo, useCallback } from 'react';
import { MapPin, X } from 'lucide-react';
import { useGeolocation } from '../../hooks/useGeolocation';

const GeolocationPrompt = memo(function GeolocationPrompt() {
  const { coords, error, requestPermission } = useGeolocation();

  // Only show if geolocation was denied and user hasn't allowed yet
  const isDenied = error && error.includes('permission denied');

  if (!isDenied) return null;

  const handleRequestPermission = () => {
    // Clear the denial flag so we can request again
    localStorage.removeItem('meteo-geolocation-denied');
    requestPermission();
  };

  const handleDismiss = () => {
    // Don't show prompt again this session
    localStorage.setItem('meteo-geolocation-dismissed', 'true');
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '120px',
        right: '20px',
        zIndex: 900,
        backgroundColor: 'rgba(59, 130, 246, 0.95)',
        borderRadius: '12px',
        padding: '16px',
        maxWidth: '300px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <MapPin style={{ width: '20px', height: '20px', color: '#fff', marginTop: '2px', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
            Autoriser la géolocalisation
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '13px', marginBottom: '10px' }}>
            Activer votre localisation pour voir la météo locale automatiquement
          </div>
          <button
            onClick={handleRequestPermission}
            style={{
              backgroundColor: '#fff',
              color: '#3b82f6',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fff';
            }}
          >
            Autoriser
          </button>
        </div>
        <button
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.7)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
          }}
        >
          <X style={{ width: '18px', height: '18px' }} />
        </button>
      </div>
    </div>
  );
});

export default GeolocationPrompt;
