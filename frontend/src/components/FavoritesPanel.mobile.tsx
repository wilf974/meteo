import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { useFavoritesStore } from '../store/favoritesStore';
import { useThemeStore } from '../store/themeStore';
import { Star, Trash2, MapPin, ChevronDown, Bell, BellOff, Mail, Monitor } from 'lucide-react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * FavoritesPanel COMPACT pour mobile
 * Style iOS/Android natif avec BottomSheet
 */
const FavoritesPanelMobile = memo(function FavoritesPanelMobile() {
  const { favorites, removeFavorite, clearFavorites, updateAlerts } = useFavoritesStore();
  const { effectiveTheme } = useThemeStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedAlerts, setExpandedAlerts] = useState<Record<string, boolean>>({});
  const [emailInputs, setEmailInputs] = useState<Record<string, string>>({});
  const map = useMap();
  const panelRef = useRef<HTMLDivElement>(null);
  const isDark = effectiveTheme === 'dark';

  useEffect(() => {
    const panel = panelRef.current;
    if (panel) {
      L.DomEvent.disableClickPropagation(panel);
      L.DomEvent.disableScrollPropagation(panel);
    }
  }, []);

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

  const toggleAlertsExpanded = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedAlerts(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleToggleEmailAlert = useCallback((e: React.MouseEvent, id: string, enabled: boolean, email: string) => {
    e.stopPropagation();
    updateAlerts(id, { email: { enabled, address: email } });
  }, [updateAlerts]);

  const handleToggleBrowserAlert = useCallback((e: React.MouseEvent, id: string, enabled: boolean) => {
    e.stopPropagation();
    updateAlerts(id, { browser: { enabled } });
    if (enabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [updateAlerts]);

  const handleEmailInputChange = useCallback((id: string, value: string) => {
    setEmailInputs(prev => ({ ...prev, [id]: value }));
  }, []);

  if (favorites.length === 0) return null;

  return (
    <div
      ref={panelRef}
      className="fixed left-2 right-2 z-[850]"
      style={{
        bottom: isExpanded ? '72px' : '148px', // Above timeline, or collapsed above WeatherInfo
        backgroundColor: isDark ? 'rgba(20, 20, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
        borderRadius: '16px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        maxHeight: isExpanded ? 'calc(100vh - 160px)' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Header compact */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-3 py-2 cursor-pointer shrink-0 active:scale-[0.98] transition-transform"
        style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
          borderRadius: isExpanded ? '16px 16px 0 0' : '16px',
        }}
      >
        <div className="flex items-center gap-2">
          <Star size={16} fill="white" color="white" />
          <div>
            <div className="text-xs font-bold text-white">Favoris</div>
            <div className="text-[10px] text-white/90">
              {favorites.length} {favorites.length === 1 ? 'lieu' : 'lieux'}
            </div>
          </div>
        </div>
        <ChevronDown
          size={16}
          color="white"
          style={{
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
          }}
        />
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* Clear all button */}
          {favorites.length > 1 && (
            <div className="p-2 border-b" style={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }}>
              <button
                onClick={handleClearAll}
                className="w-full px-2.5 py-2 rounded-lg text-xs font-semibold active:scale-95 transition-all"
                style={{
                  background: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                }}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <Trash2 size={12} />
                  <span>Tout supprimer</span>
                </div>
              </button>
            </div>
          )}

          {/* Favorites list */}
          <div className="p-2 space-y-2">
            {favorites.map((fav) => (
              <div
                key={fav.id}
                onClick={() => handleGoToLocation(fav.lat, fav.lon)}
                className="p-2.5 rounded-lg active:scale-[0.98] transition-all"
                style={{
                  background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <MapPin size={12} color={isDark ? '#cbd5e1' : '#374151'} />
                      <div className="text-xs font-semibold truncate" style={{ color: isDark ? '#f1f5f9' : '#111827' }}>
                        {fav.name}
                      </div>
                    </div>
                    <div className="text-[10px] ml-4" style={{ color: isDark ? '#94a3b8' : '#6b7280' }}>
                      {fav.admin1 && `${fav.admin1}, `}{fav.country}
                    </div>

                    {/* Alerts compact */}
                    <div className="mt-2 ml-4">
                      <div
                        onClick={(e) => toggleAlertsExpanded(e, fav.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md active:scale-95 transition-all"
                        style={{
                          background: (fav.alerts.email.enabled || fav.alerts.browser.enabled)
                            ? (isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)')
                            : (isDark ? 'rgba(107, 114, 128, 0.15)' : 'rgba(107, 114, 128, 0.1)'),
                          border: `1px solid ${(fav.alerts.email.enabled || fav.alerts.browser.enabled) ? '#22c55e' : (isDark ? '#6b7280' : '#9ca3af')}`,
                        }}
                      >
                        {(fav.alerts.email.enabled || fav.alerts.browser.enabled) ? (
                          <Bell size={10} style={{ color: '#22c55e' }} />
                        ) : (
                          <BellOff size={10} style={{ color: isDark ? '#6b7280' : '#9ca3af' }} />
                        )}
                        <span className="text-[9px] font-semibold" style={{
                          color: (fav.alerts.email.enabled || fav.alerts.browser.enabled) ? '#22c55e' : (isDark ? '#94a3b8' : '#6b7280'),
                        }}>
                          Alertes
                        </span>
                      </div>

                      {expandedAlerts[fav.id] && (
                        <div className="mt-2 p-2 rounded-lg space-y-2" style={{
                          background: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.03)',
                          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
                        }}>
                          {/* Email toggle */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              const currentEmail = emailInputs[fav.id] || fav.alerts.email.address;
                              if (!fav.alerts.email.enabled && !currentEmail) return;
                              handleToggleEmailAlert(e, fav.id, !fav.alerts.email.enabled, currentEmail);
                            }}
                            className="flex items-center gap-2 p-1.5 rounded active:scale-95 transition-all"
                            style={{
                              background: fav.alerts.email.enabled
                                ? (isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)')
                                : (isDark ? 'rgba(107, 114, 128, 0.1)' : 'rgba(107, 114, 128, 0.05)'),
                              border: `1px solid ${fav.alerts.email.enabled ? '#3b82f6' : (isDark ? '#4b5563' : '#d1d5db')}`,
                            }}
                          >
                            <Mail size={10} style={{ color: fav.alerts.email.enabled ? '#3b82f6' : (isDark ? '#9ca3af' : '#6b7280') }} />
                            <span className="text-[10px] font-semibold" style={{
                              color: fav.alerts.email.enabled ? '#3b82f6' : (isDark ? '#9ca3af' : '#6b7280'),
                            }}>
                              Email
                            </span>
                          </div>
                          <input
                            type="email"
                            placeholder="email@example.com"
                            value={emailInputs[fav.id] !== undefined ? emailInputs[fav.id] : fav.alerts.email.address}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleEmailInputChange(fav.id, e.target.value);
                            }}
                            onBlur={(e) => {
                              e.stopPropagation();
                              const email = e.target.value;
                              if (email && fav.alerts.email.enabled) {
                                handleToggleEmailAlert(e as any, fav.id, true, email);
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full px-2 py-1 text-[10px] rounded"
                            style={{
                              background: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                              border: `1px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
                              color: isDark ? '#f1f5f9' : '#111827',
                              outline: 'none',
                            }}
                          />

                          {/* Browser toggle */}
                          <div
                            onClick={(e) => handleToggleBrowserAlert(e, fav.id, !fav.alerts.browser.enabled)}
                            className="flex items-center gap-2 p-1.5 rounded active:scale-95 transition-all"
                            style={{
                              background: fav.alerts.browser.enabled
                                ? (isDark ? 'rgba(168, 85, 247, 0.15)' : 'rgba(168, 85, 247, 0.1)')
                                : (isDark ? 'rgba(107, 114, 128, 0.1)' : 'rgba(107, 114, 128, 0.05)'),
                              border: `1px solid ${fav.alerts.browser.enabled ? '#a855f7' : (isDark ? '#4b5563' : '#d1d5db')}`,
                            }}
                          >
                            <Monitor size={10} style={{ color: fav.alerts.browser.enabled ? '#a855f7' : (isDark ? '#9ca3af' : '#6b7280') }} />
                            <span className="text-[10px] font-semibold" style={{
                              color: fav.alerts.browser.enabled ? '#a855f7' : (isDark ? '#9ca3af' : '#6b7280'),
                            }}>
                              Navigateur
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={(e) => handleRemove(e, fav.id)}
                    className="p-2 rounded-lg active:scale-95 transition-all shrink-0"
                    style={{ color: isDark ? '#94a3b8' : '#6b7280' }}
                  >
                    <Trash2 size={14} />
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

export default FavoritesPanelMobile;
