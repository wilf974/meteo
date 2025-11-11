import { useState, useEffect } from 'react';
import { useMapStore } from '../../store/mapStore';
import { Layers, ChevronDown, ChevronUp, X } from 'lucide-react';

export default function LayerControl() {
  // Détecter si on est sur mobile et fermer le panneau par défaut
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { activeLayers, toggleLayer, setLayerOpacity } = useMapStore();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsOpen(true); // Ouvrir par défaut sur desktop
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sur mobile, afficher un bouton flottant compact
  if (isMobile && !isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute top-4 right-4 z-[1000] bg-blue-600 hover:bg-blue-700 rounded-full p-3 shadow-xl transition-all hover:scale-110"
      >
        <Layers className="w-6 h-6 text-white" />
      </button>
    );
  }

  return (
    <div className="absolute top-4 right-4 z-[1000] bg-gray-800 rounded-lg shadow-xl border border-gray-700 w-80 md:w-80 sm:w-[calc(100vw-2rem)] max-w-sm animate-in slide-in-from-right duration-200">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-white">Couches météo</h3>
        </div>
        <div className="flex items-center gap-2">
          {!isMobile && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {isOpen ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          )}
          {isMobile && (
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors hover:scale-110"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="p-4 pt-0 space-y-3 max-h-96 overflow-y-auto">
          {activeLayers.map((layer) => (
            <div key={layer.id} className="bg-gray-700 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={layer.enabled}
                    onChange={() => toggleLayer(layer.id)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800"
                  />
                  <span className="text-white font-medium">{layer.name}</span>
                </label>
                <span className="text-xs text-gray-400">{layer.type}</span>
              </div>
              {layer.enabled && (
                <div className="mt-2">
                  <label className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Opacité:</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={layer.opacity}
                      onChange={(e) =>
                        setLayerOpacity(layer.id, parseFloat(e.target.value))
                      }
                      className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs text-gray-400 w-8">
                      {Math.round(layer.opacity * 100)}%
                    </span>
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
