import { memo, useState, useCallback } from 'react';
import { useFavoritesStore } from '../store/favoritesStore';
import { useThemeStore } from '../store/themeStore';
import { Star, Trash2, X, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { useMap } from 'react-leaflet';

const FavoritesPanel = memo(function FavoritesPanel() {
  const { favorites, removeFavorite, clearFavorites } = useFavoritesStore();
  const { effectiveTheme } = useThemeStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const map = useMap();

  const handleGoToLocation = useCallback((lat: number, lon: number) => {
    map.flyTo([lat, lon], 10, { duration: 1.5 });
    setIsExpanded(false);
  }, [map]);

  const handleRemove = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeFavorite(id);
  }, [removeFavorite]);

  const handleClearAll = useCallback(() => {
    if (window.confirm('Supprimer tous les favoris ?')) {
      clearFavorites();
    }
  }, [clearFavorites]);

  if (favorites.length === 0) {
    return null;
  }

  const isDark = effectiveTheme === 'dark';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: isExpanded ? '120px' : '120px',
        left: '276px', // 256px (sidebar width) + 20px margin
        zIndex: 900,
        minWidth: '280px',
        maxWidth: '320px',
        background: isDark ? 'rgba(30, 30, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '16px',
          background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Star size={20} fill="white" color="white" />
          <div>
            <div style={{ fontWeight: 'bold', color: 'white', fontSize: '15px' }}>
              Favoris
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.9)' }}>
              {favorites.length} {favorites.length === 1 ? 'lieu' : 'lieux'}
            </div>
          </div>
        </div>
        {isExpanded ? <ChevronDown size={20} color="white" /> : <ChevronUp size={20} color="white" />}
      </div>

      {/* Content */}
      {isExpanded && (
        <div
          style={{
            maxHeight: '400px',
            overflowY: 'auto',
          }}
        >
          {/* Clear all button */}
          {favorites.length > 1 && (
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}` }}>
              <button
                onClick={handleClearAll}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  color: '#ef4444',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ef4444';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.color = '#ef4444';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Trash2 size={14} />
                  <span>Tout supprimer</span>
                </div>
              </button>
            </div>
          )}

          {/* Favorites list */}
          <div style={{ padding: '8px' }}>
            {favorites.map((fav, index) => (
              <div
                key={fav.id}
                onClick={() => handleGoToLocation(fav.lat, fav.lon)}
                style={{
                  padding: '12px',
                  marginBottom: index < favorites.length - 1 ? '8px' : 0,
                  background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark ? 'rgba(102, 126, 234, 0.2)' : 'rgba(102, 126, 234, 0.1)';
                  e.currentTarget.style.borderColor = '#667eea';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)';
                  e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '6px',
                    }}>
                      <MapPin size={16} color={isDark ? '#cbd5e1' : '#374151'} />
                      <div style={{
                        fontWeight: '600',
                        fontSize: '14px',
                        color: isDark ? '#f1f5f9' : '#111827',
                      }}>
                        {fav.name}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: isDark ? '#94a3b8' : '#6b7280',
                      marginLeft: '24px',
                    }}>
                      {fav.admin1 && `${fav.admin1}, `}{fav.country}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: isDark ? '#64748b' : '#9ca3af',
                      marginLeft: '24px',
                      marginTop: '4px',
                    }}>
                      📍 {fav.lat.toFixed(4)}°N, {fav.lon.toFixed(4)}°E
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleRemove(e, fav.id)}
                    style={{
                      padding: '6px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: isDark ? '#94a3b8' : '#6b7280',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                      e.currentTarget.style.color = '#ef4444';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = isDark ? '#94a3b8' : '#6b7280';
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default FavoritesPanel;
