import { Settings, Palette, Info, Github, Heart } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import ThemeToggle from '../components/ThemeToggle';

export default function ProfilePage() {
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';

  return (
    <div className="h-full overflow-auto p-8" style={{
      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
      transition: 'background-color 0.3s ease'
    }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Settings className="w-8 h-8" style={{ color: '#667eea' }} />
          <h1 className="text-3xl font-bold" style={{
            color: isDark ? '#f1f5f9' : '#1e293b'
          }}>
            Paramètres
          </h1>
        </div>

        <div className="space-y-6">
          {/* Theme Settings */}
          <div className="rounded-lg p-6 border" style={{
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            borderColor: isDark ? '#334155' : '#e2e8f0',
            transition: 'all 0.3s ease'
          }}>
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5" style={{ color: '#667eea' }} />
              <h2 className="text-xl font-semibold" style={{
                color: isDark ? '#f1f5f9' : '#1e293b'
              }}>
                Apparence
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-3" style={{
                  color: isDark ? '#94a3b8' : '#64748b'
                }}>
                  Thème de l'application
                </label>
                <ThemeToggle />
                <p className="text-sm mt-2" style={{
                  color: isDark ? '#64748b' : '#94a3b8'
                }}>
                  Choisissez entre le mode clair, sombre, ou laissez l'application s'adapter automatiquement
                </p>
              </div>
            </div>
          </div>

          {/* App Info */}
          <div className="rounded-lg p-6 border" style={{
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            borderColor: isDark ? '#334155' : '#e2e8f0',
            transition: 'all 0.3s ease'
          }}>
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5" style={{ color: '#667eea' }} />
              <h2 className="text-xl font-semibold" style={{
                color: isDark ? '#f1f5f9' : '#1e293b'
              }}>
                À propos
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm mb-1" style={{
                  color: isDark ? '#94a3b8' : '#64748b'
                }}>
                  Application
                </p>
                <p className="font-medium" style={{
                  color: isDark ? '#f1f5f9' : '#1e293b'
                }}>
                  Météo Pro
                </p>
              </div>
              <div>
                <p className="text-sm mb-1" style={{
                  color: isDark ? '#94a3b8' : '#64748b'
                }}>
                  Version
                </p>
                <p className="font-medium" style={{
                  color: isDark ? '#f1f5f9' : '#1e293b'
                }}>
                  1.0.0
                </p>
              </div>
              <div>
                <p className="text-sm mb-1" style={{
                  color: isDark ? '#94a3b8' : '#64748b'
                }}>
                  Description
                </p>
                <p style={{
                  color: isDark ? '#cbd5e1' : '#475569'
                }}>
                  Application météorologique professionnelle et gratuite avec cartes interactives,
                  prévisions détaillées et système de favoris. Fonctionne hors ligne grâce au PWA.
                </p>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="rounded-lg p-6 border" style={{
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            borderColor: isDark ? '#334155' : '#e2e8f0',
            transition: 'all 0.3s ease'
          }}>
            <h2 className="text-xl font-semibold mb-4" style={{
              color: isDark ? '#f1f5f9' : '#1e293b'
            }}>
              Fonctionnalités
            </h2>
            <ul className="space-y-3">
              {[
                'Carte interactive avec multiples couches météo',
                'Température, précipitations, vent, nuages, pression',
                'Système de favoris avec données météo',
                'Timeline pour navigation temporelle',
                'Mode sombre automatique',
                'Support PWA - fonctionne hors ligne',
                'Données en temps réel via Open-Meteo',
                'Interface responsive mobile/desktop',
                '100% gratuit et sans publicité'
              ].map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2" style={{
                    backgroundColor: '#667eea'
                  }}></div>
                  <span style={{
                    color: isDark ? '#cbd5e1' : '#475569'
                  }}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Credits */}
          <div className="rounded-lg p-6 border" style={{
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            borderColor: isDark ? '#334155' : '#e2e8f0',
            transition: 'all 0.3s ease'
          }}>
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5" style={{ color: '#ef4444' }} />
              <h2 className="text-xl font-semibold" style={{
                color: isDark ? '#f1f5f9' : '#1e293b'
              }}>
                Crédits
              </h2>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm mb-1" style={{
                  color: isDark ? '#94a3b8' : '#64748b'
                }}>
                  Données météo
                </p>
                <a
                  href="https://open-meteo.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:underline"
                  style={{
                    color: '#667eea'
                  }}
                >
                  Open-Meteo API
                </a>
              </div>
              <div>
                <p className="text-sm mb-1" style={{
                  color: isDark ? '#94a3b8' : '#64748b'
                }}>
                  Géocodage
                </p>
                <a
                  href="https://geocoding-api.open-meteo.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:underline"
                  style={{
                    color: '#667eea'
                  }}
                >
                  Open-Meteo Geocoding
                </a>
              </div>
              <div>
                <p className="text-sm mb-1" style={{
                  color: isDark ? '#94a3b8' : '#64748b'
                }}>
                  Cartes
                </p>
                <a
                  href="https://www.openstreetmap.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:underline"
                  style={{
                    color: '#667eea'
                  }}
                >
                  OpenStreetMap
                </a>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center py-6" style={{
            color: isDark ? '#64748b' : '#94a3b8'
          }}>
            <p className="text-sm">
              Fait avec <Heart className="w-4 h-4 inline" style={{ color: '#ef4444' }} /> pour la météo
            </p>
            <p className="text-xs mt-2">
              © 2025 Météo Pro - Tous droits réservés
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
