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
  alertsEnabled: boolean; // Alertes activées pour ce lieu
}

interface FavoritesState {
  favorites: FavoriteLocation[];
  addFavorite: (location: Omit<FavoriteLocation, 'id' | 'addedAt' | 'alertsEnabled'>) => void;
  removeFavorite: (id: string) => void;
  toggleAlerts: (id: string) => void;
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
          alertsEnabled: false, // Désactivé par défaut
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

      toggleAlerts: (id) => {
        set((state) => ({
          favorites: state.favorites.map(f =>
            f.id === id ? { ...f, alertsEnabled: !f.alertsEnabled } : f
          ),
        }));
        const favorite = get().favorites.find(f => f.id === id);
        if (favorite) {
          console.log(`Alertes ${favorite.alertsEnabled ? 'activées' : 'désactivées'} pour:`, favorite.name);
        }
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
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version === 1) {
          // Migration: ajouter alertsEnabled à tous les favoris existants
          return {
            ...persistedState,
            favorites: persistedState.favorites?.map((f: any) => ({
              ...f,
              alertsEnabled: f.alertsEnabled ?? false,
            })) || [],
          };
        }
        return persistedState;
      },
    }
  )
);
