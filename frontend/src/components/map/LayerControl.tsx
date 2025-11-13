import { useState, useEffect, memo, useCallback } from 'react';
import { useLayerControlState } from '../../store/mapSelectors';
import { Layers, ChevronDown, ChevronUp, X, Thermometer, Cloud, Wind, Droplets } from 'lucide-react';

const LAYER_ICONS: { [key: string]: { icon: React.ElementType; color: string; bgColor: string } } = {
  temperature: { icon: Thermometer, color: '#ff9800', bgColor: 'rgba(255, 152, 0, 0.1)' },
  precipitation: { icon: Droplets, color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)' },
  wind: { icon: Wind, color: '#6366f1', bgColor: 'rgba(99, 102, 241, 0.1)' },
  clouds: { icon: Cloud, color: '#9ca3af', bgColor: 'rgba(156, 163, 175, 0.1)' },
};

const LayerControl = memo(function LayerControl() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { activeLayers, toggleLayer, setLayerOpacity } = useLayerControlState();

  // Memoize handlers
  const handleToggleOpen = useCallback(() => setIsOpen(prev => !prev), []);
  const handleOpen = useCallback(() => setIsOpen(true), []);
  const handleClose = useCallback(() => setIsOpen(false), []);

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
        onClick={handleOpen}
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
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activeLayers.map((layer) => {
            const layerConfig = LAYER_ICONS[layer.id];
            const Icon = layerConfig?.icon;

            return (
              <div
                key={layer.id}
                style={{
                  padding: '16px',
                  backgroundColor: layer.enabled ? layerConfig?.bgColor : 'rgba(0, 0, 0, 0.02)',
                  borderRadius: '12px',
                  border: layer.enabled ? `2px solid ${layerConfig?.color}` : '2px solid transparent',
                  transition: 'all 0.3s ease',
                }}
              >
                {/* Layer Header */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    marginBottom: layer.enabled ? '12px' : 0,
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      width: '20px',
                      height: '20px',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={layer.enabled}
                      onChange={() => toggleLayer(layer.id)}
                      style={{
                        width: '20px',
                        height: '20px',
                        accentColor: layerConfig?.color,
                        cursor: 'pointer',
                      }}
                    />
                  </div>

                  {Icon && (
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        backgroundColor: layerConfig?.bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon style={{ width: '20px', height: '20px', color: layerConfig?.color }} />
                    </div>
                  )}

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                      {layer.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                      {layer.type}
                    </div>
                  </div>
                </label>

                {/* Opacity Slider */}
                {layer.enabled && (
                  <div style={{ marginTop: '8px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px',
                      }}
                    >
                      <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
                        Opacité
                      </span>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: layerConfig?.color,
                          padding: '2px 8px',
                          backgroundColor: layerConfig?.bgColor,
                          borderRadius: '6px',
                        }}
                      >
                        {Math.round(layer.opacity * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={layer.opacity}
                      onChange={(e) => setLayerOpacity(layer.id, parseFloat(e.target.value))}
                      style={{
                        width: '100%',
                        height: '6px',
                        borderRadius: '3px',
                        outline: 'none',
                        cursor: 'pointer',
                        accentColor: layerConfig?.color,
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default LayerControl;
