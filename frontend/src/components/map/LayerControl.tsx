import { useState, useEffect, memo } from 'react';
import { useMapStore, type WeatherMode } from '../../store/mapStore';
import { Layers, Thermometer, Cloud, Wind, Droplets, Gauge, CloudRain, ChevronUp, ChevronDown, X } from 'lucide-react';

const WEATHER_MODES: { [key in WeatherMode]: { name: string; icon: React.ElementType; color: string; bgColor: string; description: string } } = {
  radar: { name: 'Radar', icon: CloudRain, color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)', description: 'Précipitations' },
  wind: { name: 'Vent', icon: Wind, color: '#6366f1', bgColor: 'rgba(99, 102, 241, 0.1)', description: 'Particules animées' },
  temperature: { name: 'Température', icon: Thermometer, color: '#ff9800', bgColor: 'rgba(255, 152, 0, 0.1)', description: 'Zones thermiques' },
  clouds: { name: 'Nuages', icon: Cloud, color: '#9ca3af', bgColor: 'rgba(156, 163, 175, 0.1)', description: 'Couverture nuageuse' },
  pressure: { name: 'Pression', icon: Gauge, color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.1)', description: 'Zones barométriques' },
};

const LayerControl = memo(function LayerControl() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { activeMode, setActiveMode } = useMapStore();


  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile && !isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '50%',
          padding: '14px',
          boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <Layers style={{ width: '24px', height: '24px', color: 'white' }} />
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        width: isMobile ? 'calc(100vw - 40px)' : '320px',
        maxWidth: '400px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '10px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Layers style={{ width: '20px', height: '20px', color: 'white' }} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            Couches météo
          </h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!isMobile && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#9ca3af',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                e.currentTarget.style.color = '#111827';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#9ca3af';
              }}
            >
              {isOpen ? (
                <ChevronUp style={{ width: '20px', height: '20px' }} />
              ) : (
                <ChevronDown style={{ width: '20px', height: '20px' }} />
              )}
            </button>
          )}
          {isMobile && (
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#9ca3af',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                e.currentTarget.style.color = '#111827';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#9ca3af';
              }}
            >
              <X style={{ width: '20px', height: '20px' }} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {isOpen && (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(Object.keys(WEATHER_MODES) as WeatherMode[]).map((mode) => {
            const modeConfig = WEATHER_MODES[mode];
            const Icon = modeConfig.icon;
            const isActive = activeMode === mode;

            return (
              <button
                key={mode}
                onClick={() => setActiveMode(mode)}
                style={{
                  padding: '14px 16px',
                  backgroundColor: isActive ? modeConfig.bgColor : 'rgba(0, 0, 0, 0.02)',
                  borderRadius: '12px',
                  border: isActive ? `2px solid ${modeConfig.color}` : '2px solid transparent',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  outline: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.02)';
                  }
                }}
              >
                {/* Radio button */}
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: `2px solid ${isActive ? modeConfig.color : '#d1d5db'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {isActive && (
                    <div
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: modeConfig.color,
                      }}
                    />
                  )}
                </div>

                {/* Icon */}
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: isActive ? modeConfig.bgColor : 'rgba(0, 0, 0, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon style={{ width: '20px', height: '20px', color: isActive ? modeConfig.color : '#6b7280' }} />
                </div>

                {/* Text */}
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: isActive ? modeConfig.color : '#111827' }}>
                    {modeConfig.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                    {modeConfig.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default LayerControl;
