import { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { useTimelineControls } from '../../store/mapSelectors';
import { useThemeStore } from '../../store/themeStore';
import { Play, Pause, SkipBack, SkipForward, Clock, Moon, Sun, Zap } from 'lucide-react';
import { format, addHours, subHours, differenceInHours } from 'date-fns';
import { fr } from 'date-fns/locale';

const Timeline = memo(function Timeline() {
  const { timelinePosition, setTimelinePosition, isPlaying, setIsPlaying } = useTimelineControls();
  const { effectiveTheme } = useThemeStore();
  const [showSlider, setShowSlider] = useState(false);
  const [playSpeed, setPlaySpeed] = useState<number>(1); // 0.5x, 1x, 2x, 4x
  const [currentTime, setCurrentTime] = useState(new Date()); // Horloge en temps réel
  const isDark = effectiveTheme === 'dark';

  // Mise à jour de l'horloge en temps réel chaque seconde
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Synchronisation automatique avec le temps réel quand on est en mode "EN DIRECT"
  useEffect(() => {
    // Ne pas synchroniser si on est en mode lecture (isPlaying)
    if (isPlaying) return;

    // Vérifier si on est proche du temps actuel (moins de 5 minutes d'écart)
    const timeDiff = Math.abs(currentTime.getTime() - timelinePosition.getTime());
    const fiveMinutes = 5 * 60 * 1000;

    if (timeDiff < fiveMinutes) {
      // Mise à jour toutes les minutes pour rester synchronisé
      const syncInterval = setInterval(() => {
        setTimelinePosition(new Date());
      }, 60 * 1000); // Toutes les 60 secondes

      return () => clearInterval(syncInterval);
    }
  }, [currentTime, timelinePosition, isPlaying, setTimelinePosition]);

  // Memoize date calculations - now se met à jour avec currentTime
  const now = currentTime;
  const minDate = useMemo(() => subHours(now, 24), [now]); // 24h dans le passé
  const maxDate = useMemo(() => addHours(now, 168), [now]); // 7 jours dans le futur
  const totalHours = useMemo(() => differenceInHours(maxDate, minDate), [maxDate, minDate]);
  const currentHours = useMemo(() => differenceInHours(timelinePosition, minDate), [timelinePosition, minDate]);
  const sliderValue = useMemo(() => (currentHours / totalHours) * 100, [currentHours, totalHours]);

  // Animation automatique with speed control
  useEffect(() => {
    if (!isPlaying) return;

    const baseInterval = 1000; // 1 second
    const intervalDuration = baseInterval / playSpeed;

    const interval = setInterval(() => {
      const newTime = addHours(timelinePosition, 1);
      if (newTime <= maxDate) {
        setTimelinePosition(newTime);
      } else {
        setIsPlaying(false); // Stop at the end
      }
    }, intervalDuration);

    return () => clearInterval(interval);
  }, [isPlaying, timelinePosition, maxDate, playSpeed, setTimelinePosition, setIsPlaying]);

  // Memoize handlers
  const handlePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying, setIsPlaying]);

  const handlePrevious = useCallback(() => {
    const newTime = subHours(timelinePosition, 3);
    setTimelinePosition(newTime >= minDate ? newTime : minDate);
  }, [timelinePosition, minDate, setTimelinePosition]);

  const handleNext = useCallback(() => {
    const newTime = addHours(timelinePosition, 3);
    setTimelinePosition(newTime <= maxDate ? newTime : maxDate);
  }, [timelinePosition, maxDate, setTimelinePosition]);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const hours = Math.round((value / 100) * totalHours);
    const newTime = addHours(minDate, hours);
    setTimelinePosition(newTime);
  }, [totalHours, minDate, setTimelinePosition]);

  const handleNow = useCallback(() => {
    setTimelinePosition(now);
    setIsPlaying(false);
  }, [now, setTimelinePosition, setIsPlaying]);

  const cycleSpeed = useCallback(() => {
    const speeds = [0.5, 1, 2, 4];
    const currentIndex = speeds.indexOf(playSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setPlaySpeed(speeds[nextIndex]);
  }, [playSpeed]);

  // Memoize derived values
  const hour = useMemo(() => timelinePosition.getHours(), [timelinePosition]);
  const isDaytime = useMemo(() => hour >= 6 && hour < 20, [hour]);
  const isNow = useMemo(() => Math.abs(differenceInHours(timelinePosition, now)) < 1, [timelinePosition, now]);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        backgroundColor: isDark ? 'rgba(30, 30, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
        padding: '16px 24px',
        maxWidth: 'calc(100vw - 40px)',
        minWidth: '320px',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={() => setShowSlider(true)}
      onMouseLeave={() => setShowSlider(false)}
    >
      {/* Main Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'center' }}>
        {/* Previous */}
        <button
          onClick={handlePrevious}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.2s',
            color: isDark ? '#94a3b8' : '#6b7280',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
            e.currentTarget.style.color = isDark ? '#f1f5f9' : '#111827';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = isDark ? '#94a3b8' : '#6b7280';
          }}
        >
          <SkipBack style={{ width: '20px', height: '20px' }} />
        </button>

        {/* Play/Pause */}
        <button
          onClick={handlePlayPause}
          style={{
            background: isPlaying
              ? 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            cursor: 'pointer',
            padding: '12px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.3s',
            boxShadow: isPlaying
              ? '0 4px 12px rgba(245, 158, 11, 0.4)'
              : '0 4px 12px rgba(102, 126, 234, 0.4)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {isPlaying ? (
            <Pause style={{ width: '20px', height: '20px', color: 'white' }} />
          ) : (
            <Play style={{ width: '20px', height: '20px', color: 'white' }} />
          )}
        </button>

        {/* Next */}
        <button
          onClick={handleNext}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.2s',
            color: isDark ? '#94a3b8' : '#6b7280',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
            e.currentTarget.style.color = isDark ? '#f1f5f9' : '#111827';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = isDark ? '#94a3b8' : '#6b7280';
          }}
        >
          <SkipForward style={{ width: '20px', height: '20px' }} />
        </button>

        {/* Speed Control */}
        <button
          onClick={cycleSpeed}
          title="Vitesse de lecture"
          style={{
            background: 'none',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'}`,
            cursor: 'pointer',
            padding: '6px 10px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s',
            color: '#667eea',
            fontSize: '12px',
            fontWeight: '600',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
            e.currentTarget.style.borderColor = '#667eea';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)';
          }}
        >
          <Zap style={{ width: '14px', height: '14px' }} />
          <span>{playSpeed}x</span>
        </button>

        {/* Divider */}
        <div style={{ width: '1px', height: '32px', backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />

        {/* Date/Time Display */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Day/Night Indicator */}
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: isDaytime ? 'rgba(251, 191, 36, 0.1)' : 'rgba(99, 102, 241, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isDaytime ? (
              <Sun style={{ width: '20px', height: '20px', color: '#fbbf24' }} />
            ) : (
              <Moon style={{ width: '20px', height: '20px', color: '#6366f1' }} />
            )}
          </div>

          <div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: isDark ? '#f1f5f9' : '#111827' }}>
              {format(timelinePosition, 'HH:mm', { locale: fr })}
              {isNow && (
                <span style={{
                  marginLeft: '8px',
                  fontSize: '10px',
                  color: '#10b981',
                  fontWeight: '600',
                  padding: '2px 6px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '4px'
                }}>
                  EN DIRECT
                </span>
              )}
            </div>
            <div style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#6b7280' }}>
              {format(timelinePosition, 'dd MMM yyyy', { locale: fr })}
            </div>
          </div>
        </div>

        {/* Now Button */}
        {!isNow && (
          <>
            <div style={{ width: '1px', height: '32px', backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />
            <button
              onClick={handleNow}
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
                fontSize: '12px',
                fontWeight: '600',
                color: '#3b82f6',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
              }}
            >
              <Clock style={{ width: '14px', height: '14px' }} />
              <span>Maintenant</span>
            </button>
          </>
        )}
      </div>

      {/* Slider (shown on hover) */}
      {showSlider && (
        <div
          style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '11px', color: isDark ? '#64748b' : '#9ca3af', minWidth: '60px' }}>
              {format(minDate, 'dd/MM HH:mm')}
            </span>
            <input
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={sliderValue}
              onChange={handleSliderChange}
              style={{
                flex: 1,
                height: '6px',
                borderRadius: '3px',
                outline: 'none',
                cursor: 'pointer',
                accentColor: '#667eea',
              }}
            />
            <span style={{ fontSize: '11px', color: isDark ? '#64748b' : '#9ca3af', minWidth: '60px', textAlign: 'right' }}>
              {format(maxDate, 'dd/MM HH:mm')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

export default Timeline;
