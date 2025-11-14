import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import { Star } from 'lucide-react';
import { searchLocations, formatLocationName, type GeocodingResult } from '../../services/geocoding.service';
import { useFavoritesStore } from '../../store/favoritesStore';
import { useThemeStore } from '../../store/themeStore';
import toast from 'react-hot-toast';

const LocationSearch = memo(function LocationSearch() {
  const map = useMap();
  const { addFavorite, isFavorite } = useFavoritesStore();
  const { effectiveTheme } = useThemeStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<number>();

  const isDark = effectiveTheme === 'dark';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);

    // Clear previous timer
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = window.setTimeout(async () => {
      try {
        const locations = await searchLocations(query, 10);
        setResults(locations);
        setIsOpen(locations.length > 0);
        setSelectedIndex(-1);
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

  // Memoize select location handler
  const handleSelectLocation = useCallback((result: GeocodingResult) => {
    // Fly to location
    map.flyTo([result.latitude, result.longitude], 10, {
      duration: 1.5,
    });

    // Clear search
    setQuery(formatLocationName(result));
    setIsOpen(false);
    setSelectedIndex(-1);

    // Blur input
    inputRef.current?.blur();
  }, [map]);

  // Memoize keyboard handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelectLocation(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [isOpen, results.length, selectedIndex, handleSelectLocation]);

  // Memoize clear handler
  const handleClearQuery = useCallback(() => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  }, []);

  // Memoize add to favorites handler
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

    toast.success(`${result.name} ajouté aux favoris!`, {
      icon: '⭐',
      duration: 3000,
    });
  }, [addFavorite, isFavorite]);

  return (
    <div
      ref={searchRef}
      className="location-search"
      style={{
        position: 'absolute',
        top: window.innerWidth < 768 ? '12px' : '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        width: window.innerWidth < 768 ? 'calc(100% - 80px)' : '90%',
        maxWidth: '500px',
      }}
    >
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="Rechercher une ville..."
          style={{
            width: '100%',
            padding: window.innerWidth < 768 ? '14px 50px 14px 45px' : '12px 45px 12px 45px',
            fontSize: '16px',
            border: '2px solid rgba(0, 0, 0, 0.2)',
            borderRadius: window.innerWidth < 768 ? '10px' : '8px',
            outline: 'none',
            backgroundColor: 'white',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            transition: 'border-color 0.2s',
            minHeight: window.innerWidth < 768 ? '48px' : 'auto',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.2)';
          }}
          onFocusCapture={(e) => {
            e.currentTarget.style.borderColor = 'rgb(59, 130, 246)';
          }}
          onBlurCapture={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.2)';
          }}
        />

        {/* Search icon */}
        <div
          style={{
            position: 'absolute',
            left: '15px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#6b7280',
            pointerEvents: 'none',
          }}
        >
          🔍
        </div>

        {/* Loading spinner or clear button */}
        {query && (
          <button
            onClick={handleClearQuery}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              color: '#6b7280',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isLoading ? '⏳' : '✕'}
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '8px',
            backgroundColor: isDark ? 'rgba(30, 30, 40, 0.98)' : 'white',
            border: `2px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            borderRadius: '8px',
            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
            maxHeight: '400px',
            overflowY: 'auto',
            zIndex: 1001,
          }}
        >
          {results.map((result, index) => {
            const isResultFavorite = isFavorite(result.latitude, result.longitude);
            return (
              <div
                key={result.id}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  backgroundColor: index === selectedIndex
                    ? (isDark ? 'rgba(102, 126, 234, 0.2)' : '#eff6ff')
                    : (isDark ? 'rgba(30, 30, 40, 0.98)' : 'white'),
                  borderBottom: index < results.length - 1
                    ? `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`
                    : 'none',
                  transition: 'background-color 0.15s',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
                onMouseEnter={(e) => {
                  if (index !== selectedIndex) {
                    e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.05)' : '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (index !== selectedIndex) {
                    e.currentTarget.style.backgroundColor = isDark ? 'rgba(30, 30, 40, 0.98)' : 'white';
                  }
                }}
              >
                <div
                  onClick={() => handleSelectLocation(result)}
                  style={{ flex: 1 }}
                >
                  <div
                    style={{
                      fontWeight: 500,
                      color: isDark ? '#f1f5f9' : '#111827',
                      marginBottom: '4px',
                    }}
                  >
                    {result.name}
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      color: isDark ? '#cbd5e1' : '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>
                      {result.admin1 && `${result.admin1}, `}
                      {result.country}
                    </span>
                    {result.population && result.population > 0 && (
                      <span style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#9ca3af' }}>
                        • {result.population.toLocaleString('fr-FR')} hab.
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: isDark ? '#64748b' : '#9ca3af',
                      marginTop: '4px',
                    }}
                  >
                    📍 {result.latitude.toFixed(4)}°N, {result.longitude.toFixed(4)}°E
                  </div>
                </div>

                {/* Favorite button */}
                <button
                  onClick={(e) => handleAddToFavorites(e, result)}
                  disabled={isResultFavorite}
                  title={isResultFavorite ? 'Déjà dans les favoris' : 'Ajouter aux favoris'}
                  style={{
                    padding: window.innerWidth < 768 ? '10px' : '8px',
                    minWidth: window.innerWidth < 768 ? '44px' : 'auto',
                    minHeight: window.innerWidth < 768 ? '44px' : 'auto',
                    background: isResultFavorite
                      ? (isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)')
                      : 'transparent',
                    border: `1px solid ${isResultFavorite ? '#f59e0b' : (isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)')}`,
                    borderRadius: '8px',
                    cursor: isResultFavorite ? 'default' : 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => {
                    if (!isResultFavorite) {
                      e.currentTarget.style.background = isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)';
                      e.currentTarget.style.borderColor = '#f59e0b';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isResultFavorite) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';
                    }
                  }}
                >
                  <Star
                    size={18}
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

export default LocationSearch;
