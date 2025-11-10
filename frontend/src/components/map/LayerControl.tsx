import { useState } from 'react';
import { useMapStore } from '../../store/mapStore';
import { Layers, ChevronDown, ChevronUp } from 'lucide-react';

export default function LayerControl() {
  const [isOpen, setIsOpen] = useState(true);
  const { activeLayers, toggleLayer, setLayerOpacity } = useMapStore();

  return (
    <div className="absolute top-4 right-4 z-[1000] bg-gray-800 rounded-lg shadow-xl border border-gray-700 w-80">
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-white">Couches météo</h3>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
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
