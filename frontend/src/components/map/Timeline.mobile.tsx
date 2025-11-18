import { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { useTimelineControls } from '../../store/mapSelectors';
import { useThemeStore } from '../../store/themeStore';
import { Play, Pause, SkipBack, SkipForward, Clock } from 'lucide-react';
import { format, addHours, subHours, differenceInHours, addMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Timeline ULTRA-COMPACTE pour mobile
 * Style iOS/Android natif
 */
const TimelineMobile = memo(function TimelineMobile() {
  const { timelinePosition, setTimelinePosition, isPlaying, setIsPlaying } = useTimelineControls();
  const { effectiveTheme } = useThemeStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const isDark = effectiveTheme === 'dark';

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isPlaying) return;
    const timeDiff = Math.abs(currentTime.getTime() - timelinePosition.getTime());
    if (timeDiff < 5 * 60 * 1000) {
      const syncInterval = setInterval(() => setTimelinePosition(new Date()), 60 * 1000);
      return () => clearInterval(syncInterval);
    }
  }, [currentTime, timelinePosition, isPlaying, setTimelinePosition]);

  const now = currentTime;
  const minDate = useMemo(() => subHours(now, 24), [now]);
  const maxDate = useMemo(() => addHours(now, 384), [now]);
  const totalHours = useMemo(() => differenceInHours(maxDate, minDate), [maxDate, minDate]);
  const currentHours = useMemo(() => differenceInHours(timelinePosition, minDate), [timelinePosition, minDate]);
  const sliderValue = useMemo(() => (currentHours / totalHours) * 100, [currentHours, totalHours]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      const newTime = addMinutes(timelinePosition, 1); // Avance minute par minute
      if (newTime <= maxDate) {
        setTimelinePosition(newTime);
      } else {
        setIsPlaying(false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, timelinePosition, maxDate, setTimelinePosition, setIsPlaying]);

  const handlePlayPause = useCallback(() => setIsPlaying(!isPlaying), [isPlaying, setIsPlaying]);
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
    setTimelinePosition(addHours(minDate, hours));
  }, [totalHours, minDate, setTimelinePosition]);
  const handleNow = useCallback(() => {
    setTimelinePosition(now);
    setIsPlaying(false);
  }, [now, setTimelinePosition, setIsPlaying]);

  const isNow = useMemo(() => Math.abs(differenceInHours(timelinePosition, now)) < 1, [timelinePosition, now]);

  return (
    <div
      className="fixed bottom-2 left-2 right-2 z-[1000]"
      style={{
        backgroundColor: isDark ? 'rgba(20, 20, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
        borderRadius: '20px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Slider compact en haut */}
      <div className="px-3 pt-2">
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={sliderValue}
          onChange={handleSliderChange}
          className="w-full h-1.5"
          style={{
            accentColor: '#667eea',
            cursor: 'pointer',
          }}
        />
      </div>

      {/* Controls compacts */}
      <div className="flex items-center justify-between px-3 py-2">
        {/* Left: Time */}
        <div className="flex flex-col min-w-0">
          <div className="text-sm font-semibold" style={{ color: isDark ? '#f1f5f9' : '#111827' }}>
            {format(timelinePosition, 'HH:mm')}
          </div>
          <div className="text-xs truncate" style={{ color: isDark ? '#94a3b8' : '#6b7280' }}>
            {format(timelinePosition, 'dd MMM', { locale: fr })}
            {isNow && (
              <span className="ml-1.5 text-[10px] font-medium text-green-500">LIVE</span>
            )}
          </div>
        </div>

        {/* Center: Playback controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevious}
            className="p-2 rounded-full active:scale-95 transition-transform"
            style={{ color: isDark ? '#94a3b8' : '#6b7280' }}
          >
            <SkipBack size={18} />
          </button>

          <button
            onClick={handlePlayPause}
            className="p-2.5 rounded-full active:scale-95 transition-all"
            style={{
              background: isPlaying ? 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
            }}
          >
            {isPlaying ? <Pause size={16} color="white" /> : <Play size={16} color="white" />}
          </button>

          <button
            onClick={handleNext}
            className="p-2 rounded-full active:scale-95 transition-transform"
            style={{ color: isDark ? '#94a3b8' : '#6b7280' }}
          >
            <SkipForward size={18} />
          </button>
        </div>

        {/* Right: Now button */}
        {!isNow && (
          <button
            onClick={handleNow}
            className="px-2.5 py-1 rounded-full text-xs font-medium active:scale-95 transition-all"
            style={{
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#3b82f6',
            }}
          >
            <Clock size={14} className="inline mr-1" />
            Now
          </button>
        )}
      </div>
    </div>
  );
});

export default TimelineMobile;
