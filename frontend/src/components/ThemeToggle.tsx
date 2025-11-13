import { memo } from 'react';
import { useThemeStore } from '../store/themeStore';
import { Sun, Moon, Monitor } from 'lucide-react';

const ThemeToggle = memo(function ThemeToggle() {
  const { theme, effectiveTheme, setTheme } = useThemeStore();

  const themes: Array<{ value: 'light' | 'dark' | 'auto'; icon: React.ReactNode; label: string }> = [
    { value: 'light', icon: <Sun size={18} />, label: 'Clair' },
    { value: 'dark', icon: <Moon size={18} />, label: 'Sombre' },
    { value: 'auto', icon: <Monitor size={18} />, label: 'Auto' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: isMobile() ? '70px' : '20px',
        zIndex: 1100,
        display: 'flex',
        gap: '4px',
        background: effectiveTheme === 'dark' ? 'rgba(30, 30, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderRadius: '12px',
        padding: '6px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
      }}
    >
      {themes.map((t) => (
        <button
          key={t.value}
          onClick={() => setTheme(t.value)}
          title={t.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 12px',
            background: theme === t.value
              ? (effectiveTheme === 'dark' ? 'rgba(102, 126, 234, 0.3)' : 'rgba(102, 126, 234, 0.15)')
              : 'transparent',
            color: theme === t.value
              ? '#667eea'
              : (effectiveTheme === 'dark' ? '#e5e7eb' : '#374151'),
            border: theme === t.value
              ? '2px solid #667eea'
              : '2px solid transparent',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontSize: '13px',
            fontWeight: theme === t.value ? '600' : '500',
          }}
          onMouseEnter={(e) => {
            if (theme !== t.value) {
              e.currentTarget.style.background = effectiveTheme === 'dark'
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (theme !== t.value) {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          {t.icon}
          <span style={{ whiteSpace: 'nowrap' }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
});

function isMobile(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < 768;
}

export default ThemeToggle;
