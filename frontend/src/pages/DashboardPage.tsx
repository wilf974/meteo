import { useEffect, useState } from 'react';
import { LayoutDashboard, MapPin, Thermometer, Droplets, Wind, Star, TrendingUp, TrendingDown, Bell, BellOff, Mail, Monitor, ChevronDown, ChevronUp } from 'lucide-react';
import { useFavoritesStore, FavoriteLocation } from '../store/favoritesStore';
import { useThemeStore } from '../store/themeStore';
import { weatherCache } from '../services/weatherCache.service';
import { getWeatherAtTime, type ForecastResponse, type WeatherData } from '../services/openMeteo.service';

interface FavoriteWeather {
  id: string;
  name: string;
  lat: number;
  lon: number;
  country: string;
  weather: WeatherData | null;
  loading: boolean;
  favorite: FavoriteLocation;
}

export default function DashboardPage() {
  const { favorites, updateAlerts } = useFavoritesStore();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const [favoritesWeather, setFavoritesWeather] = useState<FavoriteWeather[]>([]);
  const [expandedAlerts, setExpandedAlerts] = useState<Record<string, boolean>>({});
  const [emailInputs, setEmailInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadWeatherData = async () => {
      if (favorites.length === 0) {
        setFavoritesWeather([]);
        return;
      }

      // Initialize with loading state
      setFavoritesWeather(
        favorites.map(fav => ({
          id: fav.id,
          name: fav.name,
          lat: fav.lat,
          lon: fav.lon,
          country: fav.country,
          weather: null,
          loading: true,
          favorite: fav,
        }))
      );

      // Fetch weather for each favorite
      const weatherPromises = favorites.map(async (fav) => {
        try {
          const forecast = await weatherCache.getForecast(fav.lat, fav.lon);
          const currentWeather = getWeatherAtTime(forecast, new Date());
          return {
            id: fav.id,
            name: fav.name,
            lat: fav.lat,
            lon: fav.lon,
            country: fav.country,
            weather: currentWeather,
            loading: false,
            favorite: fav,
          };
        } catch (error) {
          console.error(`Error fetching weather for ${fav.name}:`, error);
          return {
            id: fav.id,
            name: fav.name,
            lat: fav.lat,
            lon: fav.lon,
            country: fav.country,
            weather: null,
            loading: false,
            favorite: fav,
          };
        }
      });

      const results = await Promise.all(weatherPromises);
      setFavoritesWeather(results);
    };

    loadWeatherData();
  }, [favorites]);

  // Calculate statistics
  const stats = {
    totalFavorites: favorites.length,
    avgTemp: favoritesWeather.reduce((sum, fw) => {
      if (fw.weather) {
        return sum + fw.weather.temperature;
      }
      return sum;
    }, 0) / Math.max(favoritesWeather.filter(fw => fw.weather).length, 1),
    maxTemp: Math.max(
      ...favoritesWeather
        .filter(fw => fw.weather)
        .map(fw => fw.weather!.temperature),
      -Infinity
    ),
    minTemp: Math.min(
      ...favoritesWeather
        .filter(fw => fw.weather)
        .map(fw => fw.weather!.temperature),
      Infinity
    ),
  };

  return (
    <div className="h-full overflow-auto p-4 sm:p-6 md:p-8" style={{
      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
      transition: 'background-color 0.3s ease'
    }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3 mb-6 md:mb-8">
          <LayoutDashboard className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: '#667eea' }} />
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{
            color: isDark ? '#f1f5f9' : '#1e293b'
          }}>
            Tableau de bord météo
          </h1>
        </div>

        {/* Stats Cards */}
        {favorites.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
              <div className="rounded-lg p-4 sm:p-6 border" style={{
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                borderColor: isDark ? '#334155' : '#e2e8f0',
                transition: 'all 0.3s ease'
              }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm mb-1" style={{
                      color: isDark ? '#94a3b8' : '#64748b'
                    }}>Lieux favoris</p>
                    <p className="text-3xl font-bold" style={{
                      color: isDark ? '#f1f5f9' : '#1e293b'
                    }}>{stats.totalFavorites}</p>
                  </div>
                  <Star className="w-12 h-12" style={{ color: '#f59e0b' }} />
                </div>
              </div>

              <div className="rounded-lg p-4 sm:p-6 border" style={{
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                borderColor: isDark ? '#334155' : '#e2e8f0',
                transition: 'all 0.3s ease'
              }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm mb-1" style={{
                      color: isDark ? '#94a3b8' : '#64748b'
                    }}>Température moy.</p>
                    <p className="text-3xl font-bold" style={{
                      color: isDark ? '#f1f5f9' : '#1e293b'
                    }}>
                      {isFinite(stats.avgTemp) ? stats.avgTemp.toFixed(1) : '--'}°C
                    </p>
                  </div>
                  <Thermometer className="w-12 h-12" style={{ color: '#ff9800' }} />
                </div>
              </div>

              <div className="rounded-lg p-4 sm:p-6 border" style={{
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                borderColor: isDark ? '#334155' : '#e2e8f0',
                transition: 'all 0.3s ease'
              }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm mb-1" style={{
                      color: isDark ? '#94a3b8' : '#64748b'
                    }}>Plus chaud</p>
                    <p className="text-3xl font-bold" style={{
                      color: isDark ? '#f1f5f9' : '#1e293b'
                    }}>
                      {isFinite(stats.maxTemp) ? stats.maxTemp.toFixed(1) : '--'}°C
                    </p>
                  </div>
                  <TrendingUp className="w-12 h-12" style={{ color: '#ef4444' }} />
                </div>
              </div>

              <div className="rounded-lg p-4 sm:p-6 border" style={{
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                borderColor: isDark ? '#334155' : '#e2e8f0',
                transition: 'all 0.3s ease'
              }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm mb-1" style={{
                      color: isDark ? '#94a3b8' : '#64748b'
                    }}>Plus froid</p>
                    <p className="text-3xl font-bold" style={{
                      color: isDark ? '#f1f5f9' : '#1e293b'
                    }}>
                      {isFinite(stats.minTemp) ? stats.minTemp.toFixed(1) : '--'}°C
                    </p>
                  </div>
                  <TrendingDown className="w-12 h-12" style={{ color: '#3b82f6' }} />
                </div>
              </div>
            </div>

            {/* Weather Cards for Favorites */}
            <div className="rounded-lg p-4 sm:p-6 border" style={{
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              borderColor: isDark ? '#334155' : '#e2e8f0',
              transition: 'all 0.3s ease'
            }}>
              <h2 className="text-lg sm:text-xl font-semibold mb-4" style={{
                color: isDark ? '#f1f5f9' : '#1e293b'
              }}>
                Météo de vos lieux favoris
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {favoritesWeather.map((fw) => (
                  <div
                    key={fw.id}
                    className="rounded-lg p-3 sm:p-4 border"
                    style={{
                      backgroundColor: isDark ? '#334155' : '#f8fafc',
                      borderColor: isDark ? '#475569' : '#e2e8f0',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {/* Location Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <MapPin className="w-5 h-5 flex-shrink-0 mt-1" style={{ color: '#667eea' }} />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate" style={{
                          color: isDark ? '#f1f5f9' : '#1e293b'
                        }}>
                          {fw.name}
                        </h3>
                        <p className="text-sm truncate" style={{
                          color: isDark ? '#94a3b8' : '#64748b'
                        }}>
                          {fw.country}
                        </p>
                      </div>
                    </div>

                    {/* Weather Data */}
                    {fw.loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{
                          borderColor: '#667eea'
                        }}></div>
                      </div>
                    ) : fw.weather ? (
                      <div className="space-y-3">
                        {/* Temperature */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Thermometer className="w-4 h-4" style={{ color: '#ff9800' }} />
                            <span className="text-sm" style={{
                              color: isDark ? '#cbd5e1' : '#475569'
                            }}>Température</span>
                          </div>
                          <span className="font-bold text-lg" style={{
                            color: isDark ? '#f1f5f9' : '#1e293b'
                          }}>
                            {fw.weather.temperature.toFixed(1)}°C
                          </span>
                        </div>

                        {/* Precipitation */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Droplets className="w-4 h-4" style={{ color: '#3b82f6' }} />
                            <span className="text-sm" style={{
                              color: isDark ? '#cbd5e1' : '#475569'
                            }}>Précipitations</span>
                          </div>
                          <span className="font-semibold" style={{
                            color: isDark ? '#f1f5f9' : '#1e293b'
                          }}>
                            {fw.weather.precipitation.toFixed(1)} mm
                          </span>
                        </div>

                        {/* Wind */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Wind className="w-4 h-4" style={{ color: '#6366f1' }} />
                            <span className="text-sm" style={{
                              color: isDark ? '#cbd5e1' : '#475569'
                            }}>Vent</span>
                          </div>
                          <span className="font-semibold" style={{
                            color: isDark ? '#f1f5f9' : '#1e293b'
                          }}>
                            {fw.weather.windSpeed.toFixed(1)} km/h
                          </span>
                        </div>

                        {/* Divider */}
                        <div style={{
                          borderTop: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`,
                          margin: '12px 0'
                        }}></div>

                        {/* Alerts Section */}
                        <div>
                          <div
                            onClick={() => setExpandedAlerts(prev => ({ ...prev, [fw.id]: !prev[fw.id] }))}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px',
                              background: (fw.favorite.alerts.email.enabled || fw.favorite.alerts.browser.enabled)
                                ? (isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)')
                                : (isDark ? 'rgba(107, 114, 128, 0.15)' : 'rgba(107, 114, 128, 0.1)'),
                              borderRadius: '8px',
                              cursor: 'pointer',
                              border: `1px solid ${(fw.favorite.alerts.email.enabled || fw.favorite.alerts.browser.enabled) ? '#22c55e' : (isDark ? '#6b7280' : '#9ca3af')}`,
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {(fw.favorite.alerts.email.enabled || fw.favorite.alerts.browser.enabled) ? (
                              <Bell size={14} style={{ color: '#22c55e' }} />
                            ) : (
                              <BellOff size={14} style={{ color: isDark ? '#6b7280' : '#9ca3af' }} />
                            )}
                            <span style={{
                              fontSize: '12px',
                              fontWeight: '600',
                              flex: 1,
                              color: (fw.favorite.alerts.email.enabled || fw.favorite.alerts.browser.enabled) ? '#22c55e' : (isDark ? '#94a3b8' : '#6b7280'),
                            }}>
                              {(fw.favorite.alerts.email.enabled || fw.favorite.alerts.browser.enabled) ? 'Alertes actives' : 'Configurer alertes'}
                            </span>
                            {expandedAlerts[fw.id] ? (
                              <ChevronUp size={14} style={{ color: isDark ? '#94a3b8' : '#6b7280' }} />
                            ) : (
                              <ChevronDown size={14} style={{ color: isDark ? '#94a3b8' : '#6b7280' }} />
                            )}
                          </div>

                          {/* Alerts Options */}
                          {expandedAlerts[fw.id] && (
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
                                    const currentEmail = emailInputs[fw.id] || fw.favorite.alerts.email.address;
                                    if (!fw.favorite.alerts.email.enabled && !currentEmail) {
                                      return;
                                    }
                                    updateAlerts(fw.id, {
                                      email: { enabled: !fw.favorite.alerts.email.enabled, address: currentEmail }
                                    });
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px',
                                    background: fw.favorite.alerts.email.enabled
                                      ? (isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)')
                                      : (isDark ? 'rgba(107, 114, 128, 0.1)' : 'rgba(107, 114, 128, 0.05)'),
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    border: `1px solid ${fw.favorite.alerts.email.enabled ? '#3b82f6' : (isDark ? '#4b5563' : '#d1d5db')}`,
                                  }}
                                >
                                  <Mail size={14} style={{ color: fw.favorite.alerts.email.enabled ? '#3b82f6' : (isDark ? '#9ca3af' : '#6b7280') }} />
                                  <span style={{
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    flex: 1,
                                    color: fw.favorite.alerts.email.enabled ? '#3b82f6' : (isDark ? '#9ca3af' : '#6b7280'),
                                  }}>
                                    Email
                                  </span>
                                  <div style={{
                                    width: '36px',
                                    height: '18px',
                                    borderRadius: '9px',
                                    background: fw.favorite.alerts.email.enabled ? '#3b82f6' : (isDark ? '#4b5563' : '#d1d5db'),
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
                                      left: fw.favorite.alerts.email.enabled ? '20px' : '2px',
                                      transition: 'all 0.2s ease',
                                    }} />
                                  </div>
                                </div>
                                <input
                                  type="email"
                                  placeholder="votre@email.com"
                                  value={emailInputs[fw.id] !== undefined ? emailInputs[fw.id] : fw.favorite.alerts.email.address}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    setEmailInputs(prev => ({ ...prev, [fw.id]: e.target.value }));
                                  }}
                                  onBlur={(e) => {
                                    e.stopPropagation();
                                    const email = e.target.value;
                                    if (email && fw.favorite.alerts.email.enabled) {
                                      updateAlerts(fw.id, { email: { enabled: true, address: email } });
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateAlerts(fw.id, {
                                      browser: { enabled: !fw.favorite.alerts.browser.enabled }
                                    });
                                    if (!fw.favorite.alerts.browser.enabled && 'Notification' in window && Notification.permission === 'default') {
                                      Notification.requestPermission();
                                    }
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px',
                                    background: fw.favorite.alerts.browser.enabled
                                      ? (isDark ? 'rgba(168, 85, 247, 0.15)' : 'rgba(168, 85, 247, 0.1)')
                                      : (isDark ? 'rgba(107, 114, 128, 0.1)' : 'rgba(107, 114, 128, 0.05)'),
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    border: `1px solid ${fw.favorite.alerts.browser.enabled ? '#a855f7' : (isDark ? '#4b5563' : '#d1d5db')}`,
                                  }}
                                >
                                  <Monitor size={14} style={{ color: fw.favorite.alerts.browser.enabled ? '#a855f7' : (isDark ? '#9ca3af' : '#6b7280') }} />
                                  <span style={{
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    flex: 1,
                                    color: fw.favorite.alerts.browser.enabled ? '#a855f7' : (isDark ? '#9ca3af' : '#6b7280'),
                                  }}>
                                    Navigateur
                                  </span>
                                  <div style={{
                                    width: '36px',
                                    height: '18px',
                                    borderRadius: '9px',
                                    background: fw.favorite.alerts.browser.enabled ? '#a855f7' : (isDark ? '#4b5563' : '#d1d5db'),
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
                                      left: fw.favorite.alerts.browser.enabled ? '20px' : '2px',
                                      transition: 'all 0.2s ease',
                                    }} />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-center py-4 text-sm" style={{
                        color: isDark ? '#64748b' : '#94a3b8'
                      }}>
                        Données non disponibles
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="rounded-lg p-8 sm:p-12 text-center border" style={{
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            borderColor: isDark ? '#334155' : '#e2e8f0',
            transition: 'all 0.3s ease'
          }}>
            <Star className="w-16 h-16 mx-auto mb-4" style={{
              color: isDark ? '#475569' : '#cbd5e1'
            }} />
            <p className="text-lg mb-2" style={{
              color: isDark ? '#94a3b8' : '#64748b'
            }}>
              Aucun lieu favori
            </p>
            <p className="text-sm" style={{
              color: isDark ? '#64748b' : '#94a3b8'
            }}>
              Ajoutez des lieux favoris depuis la carte pour voir leurs données météo ici
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
