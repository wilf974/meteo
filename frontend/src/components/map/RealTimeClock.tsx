import { memo, useState, useEffect } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const RealTimeClock = memo(function RealTimeClock() {
  const { effectiveTheme } = useThemeStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const isDark = effectiveTheme === 'dark';

  // Mise à jour de l'horloge chaque seconde
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        backgroundColor: isDark ? 'rgba(30, 30, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderRadius: '12px',
        padding: '12px 16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Clock style={{ width: '18px', height: '18px', color: '#10b981' }} />
      </div>
      <div>
        <div
          style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: isDark ? '#f1f5f9' : '#111827',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '0.5px',
          }}
        >
          {format(currentTime, 'HH:mm:ss', { locale: fr })}
        </div>
        <div
          style={{
            fontSize: '10px',
            color: isDark ? '#94a3b8' : '#6b7280',
            marginTop: '2px',
          }}
        >
          {format(currentTime, 'EEEE dd MMM', { locale: fr })}
        </div>
      </div>
    </div>
  );
});

export default RealTimeClock;
