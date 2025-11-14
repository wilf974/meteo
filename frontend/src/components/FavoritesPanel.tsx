import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { useFavoritesStore } from '../store/favoritesStore';
import { useThemeStore } from '../store/themeStore';
import { Star, Trash2, X, MapPin, ChevronDown, ChevronUp, Bell, BellOff, Mail, Monitor } from 'lucide-react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const FavoritesPanel = memo(function FavoritesPanel() {
  const { favorites, removeFavorite, clearFavorites, updateAlerts } = useFavoritesStore();
  const { effectiveTheme } = useThemeStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedAlerts, setExpandedAlerts] = useState<Record<string, boolean>>({});
  const [emailInputs, setEmailInputs] = useState<Record<string, string>>({});
  const map = useMap();
  const panelRef = useRef<HTMLDivElement>(null);

  // Empêcher la propagation des clics vers la carte
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
    setExpandedAlerts(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const handleToggleEmailAlert = useCallback((e: React.MouseEvent, id: string, enabled: boolean, email: string) => {
    e.stopPropagation();
    updateAlerts(id, {
      email: { enabled, address: email },
    });
  }, [updateAlerts]);

  const handleToggleBrowserAlert = useCallback((e: React.MouseEvent, id: string, enabled: boolean) => {
    e.stopPropagation();
    updateAlerts(id, {
      browser: { enabled },
    });
    if (enabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [updateAlerts]);

  const handleEmailInputChange = useCallback((id: string, value: string) => {
    setEmailInputs(prev => ({
      ...prev,
      [id]: value,
    }));
  }, []);

  if (favorites.length === 0) {
    return null;
  }

  const isDark = effectiveTheme === 'dark';

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        bottom: window.innerWidth < 1024 ? '100px' : '120px',
        left: window.innerWidth < 1024 ? '50%' : '276px', // 256px (sidebar width) + 20px margin
        transform: window.innerWidth < 1024 ? 'translateX(-50%)' : 'none',
        zIndex: 900,
        minWidth: window.innerWidth < 640 ? 'calc(100vw - 32px)' : '280px',
        maxWidth: window.innerWidth < 640 ? 'calc(100vw - 32px)' : '320px',
        background: isDark ? 'rgba(30, 30, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderRadius: window.innerWidth < 640 ? '12px' : '16px',
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
                    {/* Alerts Section */}
                    <div style={{ marginTop: '10px', marginLeft: '24px' }}>
                      {/* Alerts Header */}
                      <div
                        onClick={(e) => toggleAlertsExpanded(e, fav.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 10px',
                          background: (fav.alerts.email.enabled || fav.alerts.browser.enabled)
                            ? (isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)')
                            : (isDark ? 'rgba(107, 114, 128, 0.15)' : 'rgba(107, 114, 128, 0.1)'),
                          borderRadius: '8px',
                          cursor: 'pointer',
                          border: `1px solid ${(fav.alerts.email.enabled || fav.alerts.browser.enabled) ? '#22c55e' : (isDark ? '#6b7280' : '#9ca3af')}`,
                          transition: 'all 0.2s ease',
                          width: 'fit-content',
                        }}
                      >
                        {(fav.alerts.email.enabled || fav.alerts.browser.enabled) ? (
                          <Bell size={14} style={{ color: '#22c55e' }} />
                        ) : (
                          <BellOff size={14} style={{ color: isDark ? '#6b7280' : '#9ca3af' }} />
                        )}
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          color: (fav.alerts.email.enabled || fav.alerts.browser.enabled) ? '#22c55e' : (isDark ? '#94a3b8' : '#6b7280'),
                        }}>
                          {(fav.alerts.email.enabled || fav.alerts.browser.enabled) ? 'Alertes actives' : 'Configurer alertes'}
                        </span>
                        {expandedAlerts[fav.id] ? (
                          <ChevronUp size={12} style={{ color: isDark ? '#94a3b8' : '#6b7280' }} />
                        ) : (
                          <ChevronDown size={12} style={{ color: isDark ? '#94a3b8' : '#6b7280' }} />
                        )}
                      </div>

                      {/* Alerts Options */}
                      {expandedAlerts[fav.id] && (
                        <div style={{
                          marginTop: '8px',
                          padding: '12px',
                          background: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.03)',
                          borderRadius: '8px',
                          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
                        }}>
                          {/* Email Alerts */}
                          <div style={{ marginBottom: '12px' }}>
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                const currentEmail = emailInputs[fav.id] || fav.alerts.email.address;
                                if (!fav.alerts.email.enabled && !currentEmail) {
                                  // Don't toggle on if no email
                                  return;
                                }
                                handleToggleEmailAlert(e, fav.id, !fav.alerts.email.enabled, currentEmail);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px',
                                background: fav.alerts.email.enabled
                                  ? (isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)')
                                  : (isDark ? 'rgba(107, 114, 128, 0.1)' : 'rgba(107, 114, 128, 0.05)'),
                                borderRadius: '6px',
                                cursor: 'pointer',
                                border: `1px solid ${fav.alerts.email.enabled ? '#3b82f6' : (isDark ? '#4b5563' : '#d1d5db')}`,
                              }}
                            >
                              <Mail size={14} style={{ color: fav.alerts.email.enabled ? '#3b82f6' : (isDark ? '#9ca3af' : '#6b7280') }} />
                              <span style={{
                                fontSize: '12px',
                                fontWeight: '600',
                                color: fav.alerts.email.enabled ? '#3b82f6' : (isDark ? '#9ca3af' : '#6b7280'),
                              }}>
                                Email
                              </span>
                              <div style={{
                                marginLeft: 'auto',
                                width: '36px',
                                height: '18px',
                                borderRadius: '9px',
                                background: fav.alerts.email.enabled ? '#3b82f6' : (isDark ? '#4b5563' : '#d1d5db'),
                                position: 'relative',
                                transition: 'all 0.2s ease',
                              }}>
                                <div style={{
                                  width: '14px',
                                  height: '14px',
                                  borderRadius: '50%',
                                  background: 'white',
                                  position: 'absolute',
                                  top: '2px',
                                  left: fav.alerts.email.enabled ? '20px' : '2px',
                                  transition: 'all 0.2s ease',
                                }} />
                              </div>
                            </div>
                            <input
                              type="email"
                              placeholder="votre@email.com"
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
                              style={{
                                width: '100%',
                                marginTop: '6px',
                                padding: '6px 8px',
                                fontSize: '11px',
                                background: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                                border: `1px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
                                borderRadius: '4px',
                                color: isDark ? '#f1f5f9' : '#111827',
                                outline: 'none',
                              }}
                            />
                          </div>

                          {/* Browser Alerts */}
                          <div>
                            <div
                              onClick={(e) => handleToggleBrowserAlert(e, fav.id, !fav.alerts.browser.enabled)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px',
                                background: fav.alerts.browser.enabled
                                  ? (isDark ? 'rgba(168, 85, 247, 0.15)' : 'rgba(168, 85, 247, 0.1)')
                                  : (isDark ? 'rgba(107, 114, 128, 0.1)' : 'rgba(107, 114, 128, 0.05)'),
                                borderRadius: '6px',
                                cursor: 'pointer',
                                border: `1px solid ${fav.alerts.browser.enabled ? '#a855f7' : (isDark ? '#4b5563' : '#d1d5db')}`,
                              }}
                            >
                              <Monitor size={14} style={{ color: fav.alerts.browser.enabled ? '#a855f7' : (isDark ? '#9ca3af' : '#6b7280') }} />
                              <span style={{
                                fontSize: '12px',
                                fontWeight: '600',
                                color: fav.alerts.browser.enabled ? '#a855f7' : (isDark ? '#9ca3af' : '#6b7280'),
                              }}>
                                Navigateur
                              </span>
                              <div style={{
                                marginLeft: 'auto',
                                width: '36px',
                                height: '18px',
                                borderRadius: '9px',
                                background: fav.alerts.browser.enabled ? '#a855f7' : (isDark ? '#4b5563' : '#d1d5db'),
                                position: 'relative',
                                transition: 'all 0.2s ease',
                              }}>
                                <div style={{
                                  width: '14px',
                                  height: '14px',
                                  borderRadius: '50%',
                                  background: 'white',
                                  position: 'absolute',
                                  top: '2px',
                                  left: fav.alerts.browser.enabled ? '20px' : '2px',
                                  transition: 'all 0.2s ease',
                                }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleRemove(e, fav.id)}
                    style={{
                      padding: window.innerWidth < 768 ? '10px' : '6px',
                      minWidth: window.innerWidth < 768 ? '44px' : 'auto',
                      minHeight: window.innerWidth < 768 ? '44px' : 'auto',
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
