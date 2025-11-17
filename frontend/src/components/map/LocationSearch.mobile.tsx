import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import { Star, Search, X } from 'lucide-react';
import { searchLocations, formatLocationName, type GeocodingResult } from '../../services/geocoding.service';
import { useFavoritesStore } from '../../store/favoritesStore';
import { useThemeStore } from '../../store/themeStore';
import toast from 'react-hot-toast';

/**
 * LocationSearch COMPACT pour mobile
 * Style iOS/Android natif avec recherche simplifiée
 */
const LocationSearchMobile = memo(function LocationSearchMobile() {
  const map = useMap();
  const { addFavorite, isFavorite } = useFavoritesStore();
  const { effectiveTheme } = useThemeStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<number>();
  const isDark = effectiveTheme === 'dark';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(async () => {
      try {
        const locations = await searchLocations(query, 8);
        setResults(locations);
        setIsOpen(locations.length > 0);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  const handleSelectLocation = useCallback((result: GeocodingResult) => {
    map.flyTo([result.latitude, result.longitude], 10, { duration: 1.5 });
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  }, [map]);

  const handleClearQuery = useCallback(() => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  }, []);

  const handleAddToFavorites = useCallback((e: React.MouseEvent, result: GeocodingResult) => {
    e.stopPropagation();

    if (isFavorite(result.latitude, result.longitude)) {
      toast.error('Déjà dans les favoris', { icon: '⭐', duration: 2000 });
      return;
    }

    addFavorite({
      name: result.name,
      lat: result.latitude,
      lon: result.longitude,
      country: result.country,
      admin1: result.admin1,
    });

    toast.success(`${result.name} ajouté!`, { icon: '⭐', duration: 2000 });
  }, [addFavorite, isFavorite]);

  return (
    <div
      ref={searchRef}
      className="absolute top-2 left-2 right-2 z-[1000]"
    >
      {/* Search input compact */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          placeholder="Rechercher..."
          className="w-full px-10 py-2.5 text-sm rounded-2xl outline-none"
          style={{
            backgroundColor: isDark ? 'rgba(20, 20, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            border: `2px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
            color: isDark ? '#f1f5f9' : '#111827',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        />

        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Search size={16} style={{ color: isDark ? '#94a3b8' : '#6b7280' }} />
        </div>

        {query && (
          <button
            onClick={handleClearQuery}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 active:scale-90 transition-transform"
          >
            {isLoading ? (
              <div className="text-xs">⏳</div>
            ) : (
              <X size={16} style={{ color: isDark ? '#94a3b8' : '#6b7280' }} />
            )}
          </button>
        )}
      </div>

      {/* Results dropdown compact */}
      {isOpen && results.length > 0 && (
        <div
          className="mt-2 rounded-2xl overflow-hidden"
          style={{
            backgroundColor: isDark ? 'rgba(20, 20, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            border: `2px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            maxHeight: '300px',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {results.map((result) => {
            const isResultFavorite = isFavorite(result.latitude, result.longitude);
            return (
              <div
                key={result.id}
                className="flex items-start justify-between gap-2 p-2.5 active:scale-[0.98] transition-all border-b"
                style={{
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                }}
              >
                <div
                  onClick={() => handleSelectLocation(result)}
                  className="flex-1 min-w-0"
                >
                  <div className="text-sm font-semibold truncate" style={{ color: isDark ? '#f1f5f9' : '#111827' }}>
                    {result.name}
                  </div>
                  <div className="text-xs truncate" style={{ color: isDark ? '#cbd5e1' : '#6b7280' }}>
                    {result.admin1 && `${result.admin1}, `}{result.country}
                  </div>
                  {result.population && result.population > 0 && (
                    <div className="text-[10px] mt-0.5" style={{ color: isDark ? '#94a3b8' : '#9ca3af' }}>
                      {result.population.toLocaleString('fr-FR')} hab.
                    </div>
                  )}
                </div>

                <button
                  onClick={(e) => handleAddToFavorites(e, result)}
                  disabled={isResultFavorite}
                  className="p-2 rounded-lg active:scale-90 transition-all shrink-0"
                  style={{
                    background: isResultFavorite
                      ? (isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)')
                      : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'),
                    border: `1px solid ${isResultFavorite ? '#f59e0b' : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)')}`,
                  }}
                >
                  <Star
                    size={14}
                    fill={isResultFavorite ? '#f59e0b' : 'none'}
                    color={isResultFavorite ? '#f59e0b' : (isDark ? '#cbd5e1' : '#6b7280')}
                  />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default LocationSearchMobile;
