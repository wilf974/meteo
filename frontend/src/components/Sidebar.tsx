import { NavLink } from 'react-router-dom';
import { Map, LayoutDashboard, Bell, User, CloudRain, Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

const navItems = [
  { to: '/map', icon: Map, label: 'Carte' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/alerts', icon: Bell, label: 'Alertes' },
  { to: '/profile', icon: User, label: 'Profil' },
];

export default function Sidebar() {
  const { theme, effectiveTheme, setTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';

  const themes: Array<{ value: 'light' | 'dark' | 'auto'; icon: React.ComponentType<any>; label: string }> = [
    { value: 'light', icon: Sun, label: 'Clair' },
    { value: 'dark', icon: Moon, label: 'Sombre' },
    { value: 'auto', icon: Monitor, label: 'Auto' },
  ];

  return (
    <aside
      className="w-64 border-r flex flex-col"
      style={{
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        borderColor: isDark ? '#334155' : '#e5e7eb',
        transition: 'all 0.3s ease'
      }}
    >
      <div
        className="flex items-center gap-3 px-6 py-4 border-b"
        style={{
          borderColor: isDark ? '#334155' : '#e5e7eb'
        }}
      >
        <CloudRain className="w-8 h-8 text-blue-500" />
        <h1
          className="text-xl font-bold"
          style={{
            color: isDark ? '#f1f5f9' : '#1e293b'
          }}
        >
          MeteoProApp
        </h1>
      </div>

      <nav className="p-4 space-y-2 flex-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
            style={({ isActive }) => ({
              backgroundColor: isActive
                ? '#3b82f6'
                : 'transparent',
              color: isActive
                ? '#ffffff'
                : (isDark ? '#cbd5e1' : '#475569'),
            })}
            onMouseEnter={(e) => {
              const isActive = e.currentTarget.getAttribute('aria-current') === 'page';
              if (!isActive) {
                e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#f1f5f9';
                e.currentTarget.style.color = isDark ? '#ffffff' : '#1e293b';
              }
            }}
            onMouseLeave={(e) => {
              const isActive = e.currentTarget.getAttribute('aria-current') === 'page';
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = isDark ? '#cbd5e1' : '#475569';
              }
            }}
          >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Theme Selector */}
      <div
        className="p-4 border-t"
        style={{
          borderColor: isDark ? '#334155' : '#e5e7eb'
        }}
      >
        <div
          className="text-xs font-semibold mb-2 px-2"
          style={{
            color: isDark ? '#94a3b8' : '#64748b'
          }}
        >
          THÈME
        </div>
        <div className="space-y-1">
          {themes.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all"
              style={{
                backgroundColor: theme === value
                  ? (isDark ? 'rgba(102, 126, 234, 0.2)' : 'rgba(102, 126, 234, 0.1)')
                  : 'transparent',
                color: theme === value
                  ? '#667eea'
                  : (isDark ? '#cbd5e1' : '#475569'),
                border: theme === value
                  ? '1px solid #667eea'
                  : '1px solid transparent',
                fontWeight: theme === value ? '600' : '500',
              }}
              onMouseEnter={(e) => {
                if (theme !== value) {
                  e.currentTarget.style.backgroundColor = isDark
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (theme !== value) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
