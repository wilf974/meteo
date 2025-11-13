import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FavoriteLocation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  country: string;
  admin1?: string; // Region/State
  addedAt: number;
}

interface FavoritesState {
  favorites: FavoriteLocation[];
  addFavorite: (location: Omit<FavoriteLocation, 'id' | 'addedAt'>) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (lat: number, lon: number) => boolean;
  getFavoriteByCoords: (lat: number, lon: number) => FavoriteLocation | undefined;
  clearFavorites: () => void;
  reorderFavorites: (fromIndex: number, toIndex: number) => void;
}

// Helper to generate unique ID
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Helper to check if two coordinates are approximately equal (within 0.01 degrees)
const coordsEqual = (lat1: number, lon1: number, lat2: number, lon2: number): boolean => {
  return Math.abs(lat1 - lat2) < 0.01 && Math.abs(lon1 - lon2) < 0.01;
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (location) => {
        const { favorites } = get();

        // Check if already exists
        const exists = favorites.some(f =>
          coordsEqual(f.lat, f.lon, location.lat, location.lon)
        );

        if (exists) {
          console.log('Location already in favorites');
          return;
        }

        // Add new favorite
        const newFavorite: FavoriteLocation = {
          ...location,
          id: generateId(),
          addedAt: Date.now(),
        };

        set({ favorites: [newFavorite, ...favorites] });
        console.log('Added to favorites:', newFavorite.name);
      },

      removeFavorite: (id) => {
        set((state) => ({
          favorites: state.favorites.filter(f => f.id !== id),
        }));
        console.log('Removed from favorites:', id);
      },

      isFavorite: (lat, lon) => {
        const { favorites } = get();
        return favorites.some(f => coordsEqual(f.lat, f.lon, lat, lon));
      },

      getFavoriteByCoords: (lat, lon) => {
        const { favorites } = get();
        return favorites.find(f => coordsEqual(f.lat, f.lon, lat, lon));
      },

      clearFavorites: () => {
        set({ favorites: [] });
        console.log('All favorites cleared');
      },

      reorderFavorites: (fromIndex, toIndex) => {
        set((state) => {
          const favorites = [...state.favorites];
          const [movedItem] = favorites.splice(fromIndex, 1);
          favorites.splice(toIndex, 0, movedItem);
          return { favorites };
        });
      },
    }),
    {
      name: 'meteo-favorites-storage',
      version: 1,
    }
  )
);
