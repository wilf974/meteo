import { useState, useEffect, memo, useCallback } from 'react';
import { useLayerControlState } from '../../store/mapSelectors';
import { Layers, X, Thermometer, Cloud, Wind, Droplets, Gauge } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

const LAYER_ICONS: { [key: string]: { icon: React.ElementType; color: string; bgColor: string } } = {
  temperature: { icon: Thermometer, color: '#ff9800', bgColor: 'rgba(255, 152, 0, 0.1)' },
  precipitation: { icon: Droplets, color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)' },
  wind: { icon: Wind, color: '#6366f1', bgColor: 'rgba(99, 102, 241, 0.1)' },
  clouds: { icon: Cloud, color: '#9ca3af', bgColor: 'rgba(156, 163, 175, 0.1)' },
  pressure: { icon: Gauge, color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.1)' },
};

/**
 * LayerControl COMPACT pour mobile avec scroll fluide
 * Style iOS/Android natif
 */
const LayerControlMobile = memo(function LayerControlMobile() {
  const [isOpen, setIsOpen] = useState(false);
  const { activeLayers, toggleLayer, setLayerOpacity } = useLayerControlState();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-[1000] p-3 rounded-full active:scale-95 transition-transform"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
        }}
      >
        <Layers size={20} color="white" />
      </button>
    );
  }

  return (
    <div
      className="fixed top-4 right-4 z-[1000] w-[calc(100vw-32px)] max-w-[320px]"
      style={{
        backgroundColor: isDark ? 'rgba(20, 20, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        maxHeight: 'calc(100vh - 32px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header fixe */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b shrink-0"
        style={{
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="p-1.5 rounded-lg"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            <Layers size={16} color="white" />
          </div>
          <h3 className="text-sm font-semibold" style={{ color: isDark ? '#f1f5f9' : '#111827' }}>
            Couches météo
          </h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-2 rounded-full active:scale-95 transition-transform"
          style={{
            color: isDark ? '#94a3b8' : '#6b7280',
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Content avec scroll */}
      <div
        className="overflow-y-auto overscroll-contain"
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
          scrollbarColor: isDark ? '#374151 transparent' : '#d1d5db transparent',
        }}
      >
        <div className="p-3 space-y-2">
          {activeLayers.map((layer) => {
            const layerConfig = LAYER_ICONS[layer.id];
            const Icon = layerConfig?.icon;

            return (
              <div
                key={layer.id}
                className="rounded-xl p-3 transition-all"
                style={{
                  backgroundColor: layer.enabled ? layerConfig?.bgColor : isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                  border: layer.enabled ? `1.5px solid ${layerConfig?.color}` : '1.5px solid transparent',
                }}
              >
                {/* Layer header */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={layer.enabled}
                    onChange={() => toggleLayer(layer.id)}
                    className="w-5 h-5 rounded cursor-pointer"
                    style={{
                      accentColor: layerConfig?.color,
                    }}
                  />

                  {Icon && (
                    <div
                      className="p-2 rounded-lg shrink-0"
                      style={{
                        backgroundColor: layerConfig?.bgColor,
                      }}
                    >
                      <Icon size={18} style={{ color: layerConfig?.color }} />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold" style={{ color: isDark ? '#f1f5f9' : '#111827' }}>
                      {layer.name}
                    </div>
                    <div className="text-xs" style={{ color: isDark ? '#64748b' : '#9ca3af' }}>
                      {layer.type}
                    </div>
                  </div>
                </label>

                {/* Opacity slider */}
                {layer.enabled && (
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium" style={{ color: isDark ? '#94a3b8' : '#6b7280' }}>
                        Opacité
                      </span>
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                          color: layerConfig?.color,
                          backgroundColor: layerConfig?.bgColor,
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
                      className="w-full h-1.5 cursor-pointer"
                      style={{
                        accentColor: layerConfig?.color,
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default LayerControlMobile;
