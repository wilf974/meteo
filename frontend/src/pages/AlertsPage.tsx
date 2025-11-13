import { Bell, Info } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

export default function AlertsPage() {
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';

  return (
    <div className="h-full overflow-auto p-8" style={{
      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
      transition: 'background-color 0.3s ease'
    }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8" style={{ color: '#667eea' }} />
            <h1 className="text-3xl font-bold" style={{
              color: isDark ? '#f1f5f9' : '#1e293b'
            }}>
              Alertes météo
            </h1>
          </div>
        </div>

        {/* Info Banner */}
        <div className="rounded-lg p-6 border mb-6" style={{
          backgroundColor: isDark ? '#1e3a5f' : '#dbeafe',
          borderColor: isDark ? '#1e40af' : '#3b82f6'
        }}>
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{
              color: '#3b82f6'
            }} />
            <div>
              <h3 className="font-semibold mb-1" style={{
                color: isDark ? '#93c5fd' : '#1e40af'
              }}>
                Système d'alertes automatiques
              </h3>
              <p className="text-sm" style={{
                color: isDark ? '#bfdbfe' : '#1e40af'
              }}>
                Les notifications PWA vous alertent automatiquement des conditions météo importantes
                dans vos lieux favoris. Activez les notifications dans votre navigateur pour en profiter.
              </p>
            </div>
          </div>
        </div>

        {/* Current Weather Conditions - Example Cards */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4" style={{
            color: isDark ? '#f1f5f9' : '#1e293b'
          }}>
            Types d'alertes disponibles
          </h2>

          {/* Severe Weather */}
          <div className="rounded-lg p-6 border" style={{
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            borderColor: isDark ? '#334155' : '#e2e8f0'
          }}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)'
              }}>
                <Bell className="w-6 h-6" style={{ color: '#ef4444' }} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2" style={{
                  color: isDark ? '#f1f5f9' : '#1e293b'
                }}>
                  Conditions météo sévères
                </h3>
                <p className="text-sm mb-3" style={{
                  color: isDark ? '#94a3b8' : '#64748b'
                }}>
                  Tempêtes, vents violents, fortes précipitations
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-medium" style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444'
                  }}>
                    Priorité haute
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium" style={{
                    backgroundColor: isDark ? '#334155' : '#f1f5f9',
                    color: isDark ? '#94a3b8' : '#64748b'
                  }}>
                    Notification instantanée
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Temperature Changes */}
          <div className="rounded-lg p-6 border" style={{
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            borderColor: isDark ? '#334155' : '#e2e8f0'
          }}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{
                backgroundColor: 'rgba(249, 115, 22, 0.1)'
              }}>
                <Bell className="w-6 h-6" style={{ color: '#f97316' }} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2" style={{
                  color: isDark ? '#f1f5f9' : '#1e293b'
                }}>
                  Changements de température
                </h3>
                <p className="text-sm mb-3" style={{
                  color: isDark ? '#94a3b8' : '#64748b'
                }}>
                  Vagues de chaleur, gel, changements brusques
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-medium" style={{
                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                    color: '#f97316'
                  }}>
                    Priorité moyenne
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium" style={{
                    backgroundColor: isDark ? '#334155' : '#f1f5f9',
                    color: isDark ? '#94a3b8' : '#64748b'
                  }}>
                    Notification quotidienne
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Precipitation */}
          <div className="rounded-lg p-6 border" style={{
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            borderColor: isDark ? '#334155' : '#e2e8f0'
          }}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{
                backgroundColor: 'rgba(59, 130, 246, 0.1)'
              }}>
                <Bell className="w-6 h-6" style={{ color: '#3b82f6' }} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2" style={{
                  color: isDark ? '#f1f5f9' : '#1e293b'
                }}>
                  Prévisions de pluie
                </h3>
                <p className="text-sm mb-3" style={{
                  color: isDark ? '#94a3b8' : '#64748b'
                }}>
                  Pluie prévue dans l'heure, orages à venir
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-medium" style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    color: '#3b82f6'
                  }}>
                    Priorité normale
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium" style={{
                    backgroundColor: isDark ? '#334155' : '#f1f5f9',
                    color: isDark ? '#94a3b8' : '#64748b'
                  }}>
                    30 min avant
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Air Quality */}
          <div className="rounded-lg p-6 border" style={{
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            borderColor: isDark ? '#334155' : '#e2e8f0'
          }}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{
                backgroundColor: 'rgba(16, 185, 129, 0.1)'
              }}>
                <Bell className="w-6 h-6" style={{ color: '#10b981' }} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2" style={{
                  color: isDark ? '#f1f5f9' : '#1e293b'
                }}>
                  Conditions favorables
                </h3>
                <p className="text-sm mb-3" style={{
                  color: isDark ? '#94a3b8' : '#64748b'
                }}>
                  Beau temps, conditions idéales pour activités extérieures
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-medium" style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981'
                  }}>
                    Priorité basse
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium" style={{
                    backgroundColor: isDark ? '#334155' : '#f1f5f9',
                    color: isDark ? '#94a3b8' : '#64748b'
                  }}>
                    Sur demande
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How to Enable */}
        <div className="rounded-lg p-6 border mt-8" style={{
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderColor: isDark ? '#334155' : '#e2e8f0'
        }}>
          <h3 className="text-lg font-semibold mb-4" style={{
            color: isDark ? '#f1f5f9' : '#1e293b'
          }}>
            Comment activer les notifications ?
          </h3>
          <ol className="space-y-3">
            {[
              'Ajoutez des lieux à vos favoris depuis la carte interactive',
              'Autorisez les notifications dans votre navigateur lorsque demandé',
              'Les alertes seront automatiquement envoyées selon les conditions météo',
              'Gérez vos préférences de notification dans les paramètres de votre navigateur'
            ].map((step, index) => (
              <li key={index} className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0" style={{
                  backgroundColor: '#667eea',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  {index + 1}
                </span>
                <span style={{
                  color: isDark ? '#cbd5e1' : '#475569',
                  paddingTop: '2px'
                }}>
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
