import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import { searchLocations, formatLocationName, type GeocodingResult } from '../../services/geocoding.service';

const LocationSearch = memo(function LocationSearch() {
  const map = useMap();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<number>();

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

  return (
    <div
      ref={searchRef}
      className="location-search"
      style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        width: '90%',
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
            padding: '12px 45px 12px 45px',
            fontSize: '16px',
            border: '2px solid rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            outline: 'none',
            backgroundColor: 'white',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            transition: 'border-color 0.2s',
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
            backgroundColor: 'white',
            border: '2px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
            maxHeight: '400px',
            overflowY: 'auto',
            zIndex: 1001,
          }}
        >
          {results.map((result, index) => (
            <div
              key={result.id}
              onClick={() => handleSelectLocation(result)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                backgroundColor: index === selectedIndex ? '#eff6ff' : 'white',
                borderBottom:
                  index < results.length - 1 ? '1px solid rgba(0, 0, 0, 0.05)' : 'none',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => {
                if (index !== selectedIndex) {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (index !== selectedIndex) {
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              <div
                style={{
                  fontWeight: 500,
                  color: '#111827',
                  marginBottom: '4px',
                }}
              >
                {result.name}
              </div>
              <div
                style={{
                  fontSize: '14px',
                  color: '#6b7280',
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
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                    • {result.population.toLocaleString('fr-FR')} hab.
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: '#9ca3af',
                  marginTop: '4px',
                }}
              >
                📍 {result.latitude.toFixed(4)}°N, {result.longitude.toFixed(4)}°E
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default LocationSearch;
