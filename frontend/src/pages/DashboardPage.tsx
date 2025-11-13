import { useEffect, useState } from 'react';
import { LayoutDashboard, MapPin, Thermometer, Droplets, Wind, Star, TrendingUp, TrendingDown } from 'lucide-react';
import { useFavoritesStore } from '../store/favoritesStore';
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
}

export default function DashboardPage() {
  const { favorites } = useFavoritesStore();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const [favoritesWeather, setFavoritesWeather] = useState<FavoriteWeather[]>([]);

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
    <div className="h-full overflow-auto p-8" style={{
      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
      transition: 'background-color 0.3s ease'
    }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <LayoutDashboard className="w-8 h-8" style={{ color: '#667eea' }} />
          <h1 className="text-3xl font-bold" style={{
            color: isDark ? '#f1f5f9' : '#1e293b'
          }}>
            Tableau de bord météo
          </h1>
        </div>

        {/* Stats Cards */}
        {favorites.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="rounded-lg p-6 border" style={{
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

              <div className="rounded-lg p-6 border" style={{
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

              <div className="rounded-lg p-6 border" style={{
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

              <div className="rounded-lg p-6 border" style={{
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
            <div className="rounded-lg p-6 border" style={{
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              borderColor: isDark ? '#334155' : '#e2e8f0',
              transition: 'all 0.3s ease'
            }}>
              <h2 className="text-xl font-semibold mb-4" style={{
                color: isDark ? '#f1f5f9' : '#1e293b'
              }}>
                Météo de vos lieux favoris
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favoritesWeather.map((fw) => (
                  <div
                    key={fw.id}
                    className="rounded-lg p-4 border"
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
          <div className="rounded-lg p-12 text-center border" style={{
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
