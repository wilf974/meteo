import { memo, useCallback } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import { useFavoritesStore } from '../../store/favoritesStore';
import { useMapStore } from '../../store/mapStore';
import { useThemeStore } from '../../store/themeStore';
import { Star, MapPin, Navigation } from 'lucide-react';
import L from 'leaflet';
import { renderToString } from 'react-dom/server';

// Create custom marker icon with theme support
const createCustomIcon = (isDark: boolean) => {
  const iconHtml = renderToString(
    <div style={{
      backgroundColor: isDark ? 'rgba(30, 30, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      borderRadius: '50%',
      width: '36px',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: `2px solid #f59e0b`,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
    }}>
      <Star
        size={18}
        fill="#f59e0b"
        color="#f59e0b"
      />
    </div>
  );

  return L.divIcon({
    html: iconHtml,
    className: 'custom-favorite-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

const FavoritesMarkers = memo(function FavoritesMarkers() {
  const { favorites, removeFavorite } = useFavoritesStore();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const map = useMap();

  const handleFlyTo = useCallback((lat: number, lon: number) => {
    map.flyTo([lat, lon], 12, { duration: 1.5 });
  }, [map]);

  const handleRemove = useCallback((id: string) => {
    removeFavorite(id);
  }, [removeFavorite]);

  if (favorites.length === 0) return null;

  return (
    <>
      {favorites.map((favorite) => (
        <Marker
          key={favorite.id}
          position={[favorite.lat, favorite.lon]}
          icon={createCustomIcon(isDark)}
          eventHandlers={{
            click: (e) => {
              // Empêcher la propagation du clic vers la carte
              L.DomEvent.stopPropagation(e.originalEvent);
            },
          }}
        >
          <Popup>
            <div style={{
              padding: '8px',
              minWidth: '200px',
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              color: isDark ? '#f1f5f9' : '#1e293b',
              borderRadius: '8px',
            }}>
              {/* Title */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
                paddingBottom: '8px',
                borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              }}>
                <Star size={16} fill="#f59e0b" color="#f59e0b" />
                <h3 style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: isDark ? '#f1f5f9' : '#1e293b',
                }}>
                  {favorite.name}
                </h3>
              </div>

              {/* Location Info */}
              <div style={{
                fontSize: '12px',
                color: isDark ? '#94a3b8' : '#64748b',
                marginBottom: '8px',
              }}>
                <div style={{ marginBottom: '4px' }}>
                  <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  {favorite.country}
                  {favorite.admin1 && ` - ${favorite.admin1}`}
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                  {favorite.lat.toFixed(4)}°N, {favorite.lon.toFixed(4)}°E
                </div>
              </div>

              {/* Actions */}
              <div style={{
                display: 'flex',
                gap: '8px',
                marginTop: '12px',
              }}>
                <button
                  onClick={() => handleFlyTo(favorite.lat, favorite.lon)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    backgroundColor: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#5568d3';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#667eea';
                  }}
                >
                  <Navigation size={14} />
                  Centrer
                </button>
                <button
                  onClick={() => handleRemove(favorite.id)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)';
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
});

export default FavoritesMarkers;
